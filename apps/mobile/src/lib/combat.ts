import { CLASS_VISUALS } from "../data/classVisuals";
import { ITEM_BY_ID } from "../data/items";
import { TITLE_BY_ID } from "../data/titles";
import { getAbilityComboProfile, getPassiveAbilityBonuses } from "./abilities";
import { getEquippedBuffBonuses } from "./buffs";
import { AdventurerRank, CharacterState, ItemDefinition } from "../types/game";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const RANK_ATTRIBUTE_BONUS: Record<AdventurerRank, number> = {
  F: 0,
  E: 4,
  D: 8,
  C: 12,
  B: 17,
  A: 23,
  S: 30,
  SS: 38,
};

export interface CoreAttributes {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
}

export const getScaledCoreAttributes = (character: CharacterState): CoreAttributes => {
  const base = CLASS_VISUALS[character.classId].stats;
  const levelOffset = Math.max(0, character.progression.level - 1);
  const rankBonus = RANK_ATTRIBUTE_BONUS[character.adventurerRank] ?? 0;

  const primaryGrowth = Math.floor(levelOffset * 2.2);
  const secondaryGrowth = Math.floor(levelOffset * 1.6);
  const tertiaryGrowth = Math.floor(levelOffset * 1.2);
  const vitalityGrowth = Math.floor(levelOffset * 1.9);

  if (character.classId === "warrior") {
    return {
      strength: base.strength + primaryGrowth + rankBonus,
      agility: base.agility + secondaryGrowth + Math.floor(rankBonus * 0.7),
      intelligence: base.intelligence + tertiaryGrowth + Math.floor(rankBonus * 0.45),
      vitality: base.vitality + vitalityGrowth + Math.floor(rankBonus * 0.85),
    };
  }

  if (character.classId === "ranger") {
    return {
      strength: base.strength + secondaryGrowth + Math.floor(rankBonus * 0.7),
      agility: base.agility + primaryGrowth + rankBonus,
      intelligence: base.intelligence + tertiaryGrowth + Math.floor(rankBonus * 0.45),
      vitality: base.vitality + vitalityGrowth + Math.floor(rankBonus * 0.8),
    };
  }

  return {
    strength: base.strength + tertiaryGrowth + Math.floor(rankBonus * 0.45),
    agility: base.agility + secondaryGrowth + Math.floor(rankBonus * 0.7),
    intelligence: base.intelligence + primaryGrowth + rankBonus,
    vitality: base.vitality + vitalityGrowth + Math.floor(rankBonus * 0.8),
  };
};

export const getDerivedHealthCap = (character: CharacterState): number => {
  const attrs = getScaledCoreAttributes(character);
  const level = character.progression.level;
  if (character.classId === "warrior") {
    // Frontliner durability: visibly higher HP curve than other classes.
    return Math.max(60, Math.round(84 + level * 5 + attrs.vitality * 0.62));
  }
  if (character.classId === "ranger") {
    return Math.max(50, Math.round(70 + level * 4 + attrs.vitality * 0.48));
  }
  return Math.max(45, Math.round(64 + level * 3.8 + attrs.vitality * 0.45));
};

export const getDerivedSkillResourceCap = (character: CharacterState): number => {
  const attrs = getScaledCoreAttributes(character);
  // Resolve (stored in the intelligence slot) and level both scale Focus cap.
  // This keeps progression visible for every class, including low-resolve warriors.
  return Math.max(8, Math.round(8 + character.progression.level * 0.25 + attrs.intelligence / 12));
};

export const getWeaponProficiencyForItem = (
  character: CharacterState,
  weapon: ItemDefinition | undefined,
): number => {
  if (!weapon || weapon.category !== "weapon") {
    return 0;
  }

  if (weapon.classRestriction && weapon.classRestriction !== character.classId) {
    return 0;
  }

  const requiredLevel = Math.max(1, weapon.requiredLevel ?? 1);
  if (character.progression.level >= requiredLevel) {
    return 1;
  }
  if (requiredLevel <= 1) {
    return 1;
  }
  const progressToRequirement = Math.max(0, Math.min(1, (character.progression.level - 1) / (requiredLevel - 1)));
  return 0.25 + progressToRequirement * 0.75;
};

export const getWeaponProficiency = (character: CharacterState): number => {
  const weaponId = character.equippedWeaponId;
  if (!weaponId) {
    return 0;
  }

  const weapon = ITEM_BY_ID[weaponId];
  return getWeaponProficiencyForItem(character, weapon);
};

export const getCharacterCombatStats = (character: CharacterState) => {
  const classStats = getScaledCoreAttributes(character);
  const { strength, agility, intelligence } = classStats;
  const weapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const weaponProficiency = getWeaponProficiency(character);
  const baseAttack = weapon?.weaponStats?.attack ?? 0;
  const baseWeaponCrit = weapon?.weaponStats?.crit ?? 0;
  const baseWeaponSpeed = weapon?.weaponStats?.speed ?? 0;
  const effectiveWeaponAttack = Math.round(baseAttack * weaponProficiency);
  const effectiveWeaponCrit = Math.round(baseWeaponCrit * weaponProficiency);
  const effectiveWeaponSpeed = Math.round(baseWeaponSpeed * weaponProficiency);
  const buffBonuses = getEquippedBuffBonuses(character);
  const passiveAbilityBonuses = getPassiveAbilityBonuses(character);
  const comboBonuses = getAbilityComboProfile(character);
  const titleBonuses = (character.equippedTitleIds ?? []).reduce(
    (sum, titleId) => {
      const title = TITLE_BY_ID[titleId];
      if (!title) {
        return sum;
      }
      return {
        damageFlat: sum.damageFlat + (title.bonuses.damageFlat ?? 0),
        critFlat: sum.critFlat + (title.bonuses.critFlat ?? 0),
        speedFlat: sum.speedFlat + (title.bonuses.speedFlat ?? 0),
        questSuccessFlat: sum.questSuccessFlat + (title.bonuses.questSuccessFlat ?? 0),
      };
    },
    { damageFlat: 0, critFlat: 0, speedFlat: 0, questSuccessFlat: 0 },
  );
  const classCore =
    character.classId === "warrior"
      ? strength
      : character.classId === "ranger"
        ? agility
        : intelligence;

  // Keep unarmed damage modest; weapons should be the main power spike.
  const unarmedBaseDamage = Math.round(4 + character.progression.level * 1.2 + classCore * 0.08);
  const damage = Math.max(
    1,
    Math.round(
      unarmedBaseDamage +
        effectiveWeaponAttack * 1.35 +
        buffBonuses.damageFlat +
        passiveAbilityBonuses.damageFlat +
        comboBonuses.damageFlat +
        titleBonuses.damageFlat,
    ),
  );
  // Critical starts low and is mostly scaled by agility, with a smaller
  // intelligence contribution to keep mage profiles viable.
  const critChance = clamp(
    Math.round(
      2 +
        agility * 0.035 +
        intelligence * 0.015 +
        effectiveWeaponCrit +
        buffBonuses.critFlat +
        passiveAbilityBonuses.critFlat +
        comboBonuses.critFlat +
        titleBonuses.critFlat,
    ),
    1,
    65,
  );
  // Speed baseline is lower so no-gear adventurers feel grounded.
  const speed = Math.max(
    1,
    Math.round(
      4 +
        agility * 0.055 +
        strength * 0.01 +
        intelligence * 0.01 +
        effectiveWeaponSpeed +
        buffBonuses.speedFlat +
        passiveAbilityBonuses.speedFlat +
        comboBonuses.speedFlat +
        titleBonuses.speedFlat,
    ),
  );
  const armor = Math.max(0, buffBonuses.armorFlat);

  return {
    damage,
    critChance,
    speed,
    armor,
    weaponProficiencyPercent: Math.round(weaponProficiency * 100),
    effectiveWeaponAttack,
    effectiveWeaponCrit,
    effectiveWeaponSpeed,
    buffBonuses,
    passiveAbilityBonuses,
    comboBonuses,
    titleBonuses,
    questSuccessBonus:
      buffBonuses.questSuccessFlat +
      passiveAbilityBonuses.questSuccessFlat +
      comboBonuses.questSuccessFlat +
      titleBonuses.questSuccessFlat,
    towerSuccessBonus: passiveAbilityBonuses.towerSuccessFlat + comboBonuses.towerSuccessFlat,
  };
};
