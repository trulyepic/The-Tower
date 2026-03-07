import { CLASS_VISUALS } from "../data/classVisuals";
import { ITEM_BY_ID } from "../data/items";
import { getEquippedBuffBonuses } from "./buffs";
import { CharacterState } from "../types/game";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const getWeaponProficiency = (character: CharacterState): number => {
  const weaponId = character.equippedWeaponId;
  if (!weaponId) {
    return 0;
  }

  const weapon = ITEM_BY_ID[weaponId];
  if (!weapon || weapon.category !== "weapon") {
    return 0;
  }

  if (weapon.classRestriction && weapon.classRestriction !== character.classId) {
    return 0;
  }

  return character.progression.level >= (weapon.requiredLevel ?? 1) ? 1 : 0.25;
};

export const getCharacterCombatStats = (character: CharacterState) => {
  const classStats = CLASS_VISUALS[character.classId].stats;
  const weapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const weaponProficiency = getWeaponProficiency(character);
  const baseAttack = weapon?.weaponStats?.attack ?? 0;
  const baseWeaponCrit = weapon?.weaponStats?.crit ?? 0;
  const baseWeaponSpeed = weapon?.weaponStats?.speed ?? 0;
  const effectiveWeaponAttack = Math.round(baseAttack * weaponProficiency);
  const effectiveWeaponCrit = Math.round(baseWeaponCrit * weaponProficiency);
  const effectiveWeaponSpeed = Math.round(baseWeaponSpeed * weaponProficiency);
  const buffBonuses = getEquippedBuffBonuses(character);
  const classCore =
    character.classId === "warrior"
      ? classStats.strength
      : character.classId === "ranger"
        ? classStats.agility
        : classStats.intelligence;

  const damage = Math.max(
    1,
    Math.round(character.progression.level * 2 + classCore * 0.4 + effectiveWeaponAttack + buffBonuses.damageFlat),
  );
  const critChance = clamp(
    Math.round(5 + classStats.agility * 0.06 + effectiveWeaponCrit + buffBonuses.critFlat),
    1,
    80,
  );
  const speed = Math.max(
    1,
    Math.round(8 + classStats.agility * 0.08 + effectiveWeaponSpeed + buffBonuses.speedFlat),
  );

  return {
    damage,
    critChance,
    speed,
    weaponProficiencyPercent: Math.round(weaponProficiency * 100),
    effectiveWeaponAttack,
    effectiveWeaponCrit,
    effectiveWeaponSpeed,
    buffBonuses,
  };
};
