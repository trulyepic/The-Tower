import { ABILITY_BY_ID, DEFAULT_ABILITY_BY_CLASS } from "../data/abilities";
import { BaseClassId, CharacterState, ClassAbilityDefinition, WarriorPathChoice } from "../types/game";

export const FOCUS_REGEN_INTERVAL_MS = 3 * 60 * 1000;

const getAllClassAbilities = (classId: BaseClassId): ClassAbilityDefinition[] =>
  Object.values(ABILITY_BY_ID).filter((ability) => ability.classId === classId);

const isAbilityUnlocked = (character: CharacterState, ability: ClassAbilityDefinition): boolean => {
  if (ability.classId !== character.classId) {
    return false;
  }
  const unlockLevel = ability.unlockLevel ?? 1;
  if (character.progression.level < unlockLevel) {
    return false;
  }
  if (ability.classId !== "warrior") {
    return true;
  }
  if (!ability.pathGroup || ability.pathGroup === "shared") {
    return true;
  }
  if (character.warriorPathChoice) {
    return character.warriorPathChoice === ability.pathGroup;
  }
  return false;
};

export const getUnlockedClassAbilities = (character: CharacterState): ClassAbilityDefinition[] =>
  getAllClassAbilities(character.classId).filter((ability) => isAbilityUnlocked(character, ability));

export const getAvailableWarriorPathChoices = (character: CharacterState): WarriorPathChoice[] => {
  if (character.classId !== "warrior" || character.progression.level < 15) {
    return [];
  }
  if (character.warriorPathChoice) {
    return [character.warriorPathChoice];
  }
  return ["knight", "berserker"];
};

export const getUnlockedActiveSkills = (character: CharacterState): ClassAbilityDefinition[] =>
  getUnlockedClassAbilities(character).filter((ability) => (ability.kind ?? "skill") === "skill");

export const getUnlockedPassiveAbilities = (character: CharacterState): ClassAbilityDefinition[] =>
  getUnlockedClassAbilities(character).filter((ability) => (ability.kind ?? "skill") === "passive");

export const getClassAbility = (character: CharacterState) => {
  const unlockedSkills = getUnlockedActiveSkills(character);
  const selectedId = character.activeClassSkillId;
  if (selectedId) {
    const selected = unlockedSkills.find((ability) => ability.id === selectedId);
    if (selected) {
      return selected;
    }
  }
  return unlockedSkills[0] ?? ABILITY_BY_ID[DEFAULT_ABILITY_BY_CLASS[character.classId]];
};

const getEquippedPassives = (character: CharacterState): ClassAbilityDefinition[] => {
  const equipped = new Set(character.equippedPassiveAbilityIds ?? []);
  return getUnlockedPassiveAbilities(character).filter((ability) => equipped.has(ability.id));
};

const getComboSynergyStacks = (active: ClassAbilityDefinition, passives: ClassAbilityDefinition[]): number => {
  const activeTags = new Set(active.comboTags ?? []);
  if (activeTags.size === 0 || passives.length === 0) {
    return 0;
  }
  let stacks = 0;
  for (const passive of passives) {
    const passiveTags = passive.comboTags ?? [];
    if (passiveTags.some((tag) => activeTags.has(tag))) {
      stacks += 1;
    }
  }
  return stacks;
};

export const getPassiveAbilityBonuses = (character: CharacterState) => {
  const passives = getEquippedPassives(character);
  return passives.reduce(
    (sum, passive) => ({
      damageFlat: sum.damageFlat + (passive.bonuses.damageFlat ?? 0),
      critFlat: sum.critFlat + (passive.bonuses.critFlat ?? 0),
      speedFlat: sum.speedFlat + (passive.bonuses.speedFlat ?? 0),
      questSuccessFlat: sum.questSuccessFlat + (passive.bonuses.questSuccessFlat ?? 0),
      towerSuccessFlat: sum.towerSuccessFlat + (passive.bonuses.towerSuccessFlat ?? 0),
    }),
    { damageFlat: 0, critFlat: 0, speedFlat: 0, questSuccessFlat: 0, towerSuccessFlat: 0 },
  );
};

export const getAbilityComboProfile = (character: CharacterState) => {
  const active = getClassAbility(character);
  const passives = getEquippedPassives(character);
  const stacks = getComboSynergyStacks(active, passives);
  // Meaningful but bounded gains to reward planning over brute stacking.
  return {
    stacks,
    damageFlat: stacks * 2,
    critFlat: stacks,
    speedFlat: stacks,
    questSuccessFlat: stacks * 2,
    towerSuccessFlat: stacks * 2,
  };
};

export const getSkillResourceLabel = (classId: BaseClassId): string =>
  "Focus";

export type LiveBattleSkillProfile = {
  target: "self";
  effectId: string;
  effectLabel: string;
  effectDetail: string;
  effectIcon: string;
  effectTone: "good" | "neutral";
  cooldownSeconds: number;
  focusCost: number;
  initiativeBonus: number;
  attackBonus: number;
  critBonus: number;
  mitigationFlat: number;
  speedBonus: number;
  durationSeconds: number;
  guardBonusFlat: number;
  statusSeverityReductionFlat: number;
  counterBonusDamageFlat: number;
  woundedTargetDamageFlat: number;
  defensePenaltyFlat: number;
};

export type PassiveBattleProfile = {
  id: string;
  label: string;
  detail: string;
  guardBonusFlat: number;
  attackConsistencyFlat: number;
  pressureResistFlat: number;
  statusSeverityReductionFlat: number;
  counterBonusDamageFlat: number;
  woundedTargetDamageFlat: number;
  postCritTempoFlat: number;
  postKillTempoFlat: number;
  frenzyAttackBonusFlat: number;
  frenzyCritBonusFlat: number;
  frenzyDurationSeconds: number;
};

export const getPassiveBattleProfile = (abilityId?: string | null): PassiveBattleProfile | null => {
  if (!abilityId) {
    return null;
  }
  if (abilityId === "ability-warrior-combat-discipline") {
    return {
      id: abilityId,
      label: "Combat Discipline",
      detail: "Guard holds firmer, attack consistency improves, and pressure effects land softer.",
      guardBonusFlat: 1,
      attackConsistencyFlat: 2,
      pressureResistFlat: 1,
      statusSeverityReductionFlat: 1,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 0,
      postCritTempoFlat: 0,
      postKillTempoFlat: 0,
      frenzyAttackBonusFlat: 0,
      frenzyCritBonusFlat: 0,
      frenzyDurationSeconds: 0,
    };
  }
  if (abilityId === "ability-warrior-shield-doctrine") {
    return {
      id: abilityId,
      label: "Shield Doctrine",
      detail: "Guard mitigates more damage, counter strikes hit harder, and heavy mechanics lose bite.",
      guardBonusFlat: 2,
      attackConsistencyFlat: 0,
      pressureResistFlat: 0,
      statusSeverityReductionFlat: 1,
      counterBonusDamageFlat: 6,
      woundedTargetDamageFlat: 0,
      postCritTempoFlat: 0,
      postKillTempoFlat: 0,
      frenzyAttackBonusFlat: 0,
      frenzyCritBonusFlat: 0,
      frenzyDurationSeconds: 0,
    };
  }
  if (abilityId === "ability-warrior-frenzy-instinct") {
    return {
      id: abilityId,
      label: "Frenzy Instinct",
      detail: "Wounded targets take extra punishment, crits and kills feed tempo, and taking damage can trigger a short frenzy.",
      guardBonusFlat: 0,
      attackConsistencyFlat: 0,
      pressureResistFlat: 0,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 5,
      postCritTempoFlat: 1,
      postKillTempoFlat: 2,
      frenzyAttackBonusFlat: 4,
      frenzyCritBonusFlat: 3,
      frenzyDurationSeconds: 18,
    };
  }
  return null;
};

export const getEquippedPassiveBattleBonuses = (character: CharacterState) =>
  getEquippedPassives(character)
    .map((passive) => getPassiveBattleProfile(passive.id))
    .filter((profile): profile is PassiveBattleProfile => Boolean(profile))
    .reduce(
      (sum, profile) => ({
        guardBonusFlat: sum.guardBonusFlat + profile.guardBonusFlat,
        attackConsistencyFlat: sum.attackConsistencyFlat + profile.attackConsistencyFlat,
        pressureResistFlat: sum.pressureResistFlat + profile.pressureResistFlat,
        statusSeverityReductionFlat: sum.statusSeverityReductionFlat + profile.statusSeverityReductionFlat,
        counterBonusDamageFlat: sum.counterBonusDamageFlat + profile.counterBonusDamageFlat,
        woundedTargetDamageFlat: sum.woundedTargetDamageFlat + profile.woundedTargetDamageFlat,
        postCritTempoFlat: sum.postCritTempoFlat + profile.postCritTempoFlat,
        postKillTempoFlat: sum.postKillTempoFlat + profile.postKillTempoFlat,
        frenzyAttackBonusFlat: sum.frenzyAttackBonusFlat + profile.frenzyAttackBonusFlat,
        frenzyCritBonusFlat: sum.frenzyCritBonusFlat + profile.frenzyCritBonusFlat,
        frenzyDurationSeconds: Math.max(sum.frenzyDurationSeconds, profile.frenzyDurationSeconds),
        labels: [...sum.labels, profile.label],
      }),
      {
        guardBonusFlat: 0,
        attackConsistencyFlat: 0,
        pressureResistFlat: 0,
        statusSeverityReductionFlat: 0,
        counterBonusDamageFlat: 0,
        woundedTargetDamageFlat: 0,
        postCritTempoFlat: 0,
        postKillTempoFlat: 0,
        frenzyAttackBonusFlat: 0,
        frenzyCritBonusFlat: 0,
        frenzyDurationSeconds: 0,
        labels: [] as string[],
      },
    );

export const getLiveBattleSkillProfile = (abilityId?: string | null): LiveBattleSkillProfile | null => {
  if (!abilityId) {
    return null;
  }
  const ability = ABILITY_BY_ID[abilityId];
  if (!ability || (ability.kind ?? "skill") !== "skill") {
    return null;
  }
  if (abilityId === "ability-warrior-iron-will") {
    return {
      target: "self",
      effectId: "iron-will",
      effectLabel: "Iron Will",
      effectDetail: "Take 6 less damage and make it harder to lose the next exchange while it lasts.",
      effectIcon: "shield-check-outline",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 1,
      attackBonus: 0,
      critBonus: 0,
      mitigationFlat: 6,
      speedBonus: 1,
      durationSeconds: 42,
      guardBonusFlat: 1,
      statusSeverityReductionFlat: 1,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
    };
  }
  if (abilityId === "ability-warrior-steel-rhythm") {
    return {
      target: "self",
      effectId: "steel-rhythm",
      effectLabel: "Steel Rhythm",
      effectDetail: "ATK +3, CRIT +2%, SPD +3, take 1 less damage, and make counterattacks deal +4 damage while it lasts.",
      effectIcon: "sword-cross",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 3,
      attackBonus: 3,
      critBonus: 2,
      mitigationFlat: 1,
      speedBonus: 3,
      durationSeconds: 28,
      guardBonusFlat: 1,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 4,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
    };
  }
  if (abilityId === "ability-warrior-bulwark-oath") {
    return {
      target: "self",
      effectId: "bulwark-oath",
      effectLabel: "Bulwark Oath",
      effectDetail: "You anchor the lane. Heavy mechanics hit softer, guard turns harden, and enemies that crash into you leave a counter window.",
      effectIcon: "shield-sword-outline",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 1,
      attackBonus: 0,
      critBonus: 0,
      mitigationFlat: 10,
      speedBonus: 0,
      durationSeconds: 32,
      guardBonusFlat: 2,
      statusSeverityReductionFlat: 2,
      counterBonusDamageFlat: 8,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
    };
  }
  if (abilityId === "ability-warrior-bloodrush") {
    return {
      target: "self",
      effectId: "bloodrush",
      effectLabel: "Bloodrush",
      effectDetail: "You push the pace recklessly. Damage, crit pressure, and turn gain rise, but you become easier to punish while it lasts.",
      effectIcon: "axe-battle",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 3,
      attackBonus: 10,
      critBonus: 8,
      mitigationFlat: 0,
      speedBonus: 3,
      durationSeconds: 24,
      guardBonusFlat: 0,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 4,
      defensePenaltyFlat: 3,
    };
  }
  if (abilityId === "ability-ranger-scout-path") {
    return {
      target: "self",
      effectId: "scout-path",
      effectLabel: "Scout Path",
      effectDetail: "Footwork sharpened. You slip pressure more easily and gain extra turn priority.",
      effectIcon: "map-search-outline",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 4,
      attackBonus: 2,
      critBonus: 2,
      mitigationFlat: 2,
      speedBonus: 4,
      durationSeconds: 45,
      guardBonusFlat: 0,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
    };
  }
  if (abilityId === "ability-mage-arcane-surge") {
    return {
      target: "self",
      effectId: "arcane-surge",
      effectLabel: "Arcane Surge",
      effectDetail: "Arcane current overcharged. Your next attacks strike harder and crit more often.",
      effectIcon: "magic-staff",
      effectTone: "good",
      cooldownSeconds: ability.cooldownSeconds,
      focusCost: ability.focusCost,
      initiativeBonus: 1,
      attackBonus: 9,
      critBonus: 6,
      mitigationFlat: 0,
      speedBonus: 1,
      durationSeconds: 55,
      guardBonusFlat: 0,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
    };
  }
  return {
    target: "self",
    effectId: ability.id,
    effectLabel: ability.name,
    effectDetail: "Skill active.",
    effectIcon: ability.icon,
    effectTone: "good",
    cooldownSeconds: ability.cooldownSeconds,
    focusCost: ability.focusCost,
    initiativeBonus: 1,
    attackBonus: 2,
    critBonus: 0,
    mitigationFlat: 0,
    speedBonus: 1,
    durationSeconds: ability.cooldownSeconds,
    guardBonusFlat: 0,
    statusSeverityReductionFlat: 0,
    counterBonusDamageFlat: 0,
    woundedTargetDamageFlat: 0,
    defensePenaltyFlat: 0,
  };
};

export const isAbilityReady = (character: CharacterState, abilityId: string, nowMs = Date.now()): boolean =>
  (character.abilityCooldownsUntilMs?.[abilityId] ?? 0) <= nowMs;

export const getAbilityCooldownRemainingSeconds = (
  character: CharacterState,
  abilityId: string,
  nowMs = Date.now(),
): number => Math.max(0, Math.ceil(((character.abilityCooldownsUntilMs?.[abilityId] ?? 0) - nowMs) / 1000));

export type SkillPairCombo = {
  label: string;
  questTowerScale: number;
  combatScale: number;
  flatQuest: number;
  flatTower: number;
  flatDamage: number;
  flatCrit: number;
  flatSpeed: number;
};

const makePairKey = (a: string, b: string): string => [a, b].sort().join("::");

const SKILL_PAIR_COMBOS: Record<string, SkillPairCombo> = {
  [makePairKey("ability-warrior-iron-will", "ability-warrior-bulwark-oath")]: {
    label: "Guardian Tempo",
    questTowerScale: 0.32,
    combatScale: 0.22,
    flatQuest: 3,
    flatTower: 4,
    flatDamage: 2,
    flatCrit: 1,
    flatSpeed: 1,
  },
  [makePairKey("ability-warrior-iron-will", "ability-warrior-bloodrush")]: {
    label: "Ruin Cadence",
    questTowerScale: 0.28,
    combatScale: 0.24,
    flatQuest: 2,
    flatTower: 2,
    flatDamage: 3,
    flatCrit: 1,
    flatSpeed: 1,
  },
  [makePairKey("ability-warrior-steel-rhythm", "ability-warrior-bulwark-oath")]: {
    label: "Aegis Rhythm",
    questTowerScale: 0.3,
    combatScale: 0.2,
    flatQuest: 3,
    flatTower: 4,
    flatDamage: 2,
    flatCrit: 1,
    flatSpeed: 2,
  },
  [makePairKey("ability-warrior-steel-rhythm", "ability-warrior-bloodrush")]: {
    label: "Rending Rhythm",
    questTowerScale: 0.26,
    combatScale: 0.24,
    flatQuest: 2,
    flatTower: 2,
    flatDamage: 4,
    flatCrit: 1,
    flatSpeed: 1,
  },
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const getPendingMatchedSkillCombos = (character: CharacterState): SkillPairCombo[] => {
  const pendingIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  const uniquePending = Array.from(new Set(pendingIds));
  // Combo cards trigger only for a deliberate 2-skill pairing.
  if (uniquePending.length !== 2) {
    return [];
  }
  const matchedCombos: SkillPairCombo[] = [];
  for (let index = 0; index < uniquePending.length; index += 1) {
    for (let inner = index + 1; inner < uniquePending.length; inner += 1) {
      const combo = SKILL_PAIR_COMBOS[makePairKey(uniquePending[index], uniquePending[inner])];
      if (combo) {
        matchedCombos.push(combo);
      }
    }
  }
  return matchedCombos;
};

export const getPendingAbilityComboSummary = (character: CharacterState) => {
  const pendingIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  const uniquePending = Array.from(new Set(pendingIds));
  const matchedCombos = getPendingMatchedSkillCombos(character);
  // No hard cap, but extra stacking past 2 has diminishing value by design.
  const stackPenalty = Math.max(0, uniquePending.length - 2) * 0.28;
  const baseScale = clamp(1 - stackPenalty, 0.35, 1);
  const comboQuestTowerScale = matchedCombos.reduce((sum, combo) => sum + combo.questTowerScale, 0);
  const comboCombatScale = matchedCombos.reduce((sum, combo) => sum + combo.combatScale, 0);
  return {
    pendingCount: uniquePending.length,
    comboLabels: matchedCombos.map((combo) => combo.label),
    questTowerScale: clamp(baseScale + comboQuestTowerScale, 0.35, 1.7),
    combatScale: clamp(baseScale + comboCombatScale, 0.35, 1.6),
    flatQuest: matchedCombos.reduce((sum, combo) => sum + combo.flatQuest, 0),
    flatTower: matchedCombos.reduce((sum, combo) => sum + combo.flatTower, 0),
    flatDamage: matchedCombos.reduce((sum, combo) => sum + combo.flatDamage, 0),
    flatCrit: matchedCombos.reduce((sum, combo) => sum + combo.flatCrit, 0),
    flatSpeed: matchedCombos.reduce((sum, combo) => sum + combo.flatSpeed, 0),
  };
};

export const getPendingAbilityBonuses = (character: CharacterState) => {
  const pendingIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  if (pendingIds.length === 0) {
    return {
      questSuccessFlat: 0,
      towerSuccessFlat: 0,
      damageFlat: 0,
      critFlat: 0,
      speedFlat: 0,
    };
  }
  const pendingAbilities = pendingIds
    .map((abilityId) => ABILITY_BY_ID[abilityId])
    .filter((ability): ability is ClassAbilityDefinition => Boolean(ability));
  if (pendingAbilities.length === 0) {
    return { questSuccessFlat: 0, towerSuccessFlat: 0, damageFlat: 0, critFlat: 0, speedFlat: 0 };
  }

  const combo = getAbilityComboProfile(character);
  const pendingCombo = getPendingAbilityComboSummary(character);
  const summed = pendingAbilities.reduce(
    (sum, ability) => ({
      questSuccessFlat: sum.questSuccessFlat + (ability.bonuses.questSuccessFlat ?? 0),
      towerSuccessFlat: sum.towerSuccessFlat + (ability.bonuses.towerSuccessFlat ?? 0),
      damageFlat: sum.damageFlat + (ability.bonuses.damageFlat ?? 0),
      critFlat: sum.critFlat + (ability.bonuses.critFlat ?? 0),
      speedFlat: sum.speedFlat + (ability.bonuses.speedFlat ?? 0),
    }),
    { questSuccessFlat: 0, towerSuccessFlat: 0, damageFlat: 0, critFlat: 0, speedFlat: 0 },
  );

  const scaledQuest = Math.round(summed.questSuccessFlat * pendingCombo.questTowerScale);
  const scaledTower = Math.round(summed.towerSuccessFlat * pendingCombo.questTowerScale);
  const scaledDamage = Math.round(summed.damageFlat * pendingCombo.combatScale);
  const scaledCrit = Math.round(summed.critFlat * pendingCombo.combatScale);
  const scaledSpeed = Math.round(summed.speedFlat * pendingCombo.combatScale);

  return {
    questSuccessFlat: scaledQuest + pendingCombo.flatQuest + combo.questSuccessFlat,
    towerSuccessFlat: scaledTower + pendingCombo.flatTower + combo.towerSuccessFlat,
    damageFlat: scaledDamage + pendingCombo.flatDamage + combo.damageFlat,
    critFlat: scaledCrit + pendingCombo.flatCrit + combo.critFlat,
    speedFlat: scaledSpeed + pendingCombo.flatSpeed + combo.speedFlat,
  };
};
