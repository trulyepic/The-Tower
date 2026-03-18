import { applyLevelLoss, applyProgressGain, createInitialProgress } from "../lib/progression";
import { ITEM_BY_ID } from "../data/items";
import { TITLES } from "../data/titles";
import {
  getCharacterCombatStats,
  getDerivedHealthCap,
  getDerivedSkillResourceCap,
  getWeaponProficiency,
} from "../lib/combat";
import { ABILITY_BY_ID } from "../data/abilities";
import { getPendingAbilityBonuses } from "../lib/abilities";
import {
  ActiveQuestState,
  AdventurerRank,
  AvatarId,
  BaseClassId,
  CharacterState,
  DailyTask,
  ItemId,
  QuestChanceBreakdown,
  QuestOutcome,
  QuestDefinition,
  QuestType,
  RankUpOutcome,
  RankUpTrialDefinition,
  TowerFloorDefinition,
  TowerOutcome,
  TowerWaveKey,
  TowerWaveOutcome,
} from "../types/game";

const STAMINA_RECOVERY_PER_CLAIM = 1;
const RANK_ORDER: AdventurerRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];
const KEY_PENALTY_BY_TYPE: Record<QuestType, number> = {
  gather: 0.75,
  adventure: 1,
  dungeon: 1.2,
};

export interface StartQuestResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  dailies?: DailyTask[];
  activeQuest?: ActiveQuestState;
}

export interface ClaimQuestResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  dailies?: DailyTask[];
  outcome?: QuestOutcome;
}

export interface ConquerTowerFloorResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  dailies?: DailyTask[];
  outcome?: TowerOutcome;
}

export interface AttemptRankUpResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  outcome?: RankUpOutcome;
}

export interface ResolveTowerWaveResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  outcome?: TowerWaveOutcome;
}

export interface FinalizeTowerFloorResult {
  ok: boolean;
  reason?: string;
  character?: CharacterState;
  dailies?: DailyTask[];
  outcome?: TowerOutcome;
}

export interface GameService {
  createCharacter: (name: string, classId: BaseClassId, avatarId: AvatarId, classSequence: number) => CharacterState;
  startQuest: (input: {
    character: CharacterState | null;
    activeQuest: ActiveQuestState | null;
    dailies: DailyTask[];
    quest: QuestDefinition | undefined;
    committedItems?: Record<ItemId, number>;
    nowMs: number;
  }) => StartQuestResult;
  claimQuest: (input: {
    character: CharacterState | null;
    activeQuest: ActiveQuestState | null;
    dailies: DailyTask[];
    quest: QuestDefinition | undefined;
    nowMs: number;
  }) => ClaimQuestResult;
  buyGuildItem: (input: {
    character: CharacterState | null;
    itemId: ItemId;
    unitPrice: number;
    amount: number;
    classRestriction?: BaseClassId;
  }) => { ok: boolean; reason?: string; character?: CharacterState };
  sellGuildItem: (input: {
    character: CharacterState | null;
    itemId: ItemId;
    unitPrice: number;
    amount: number;
  }) => { ok: boolean; reason?: string; character?: CharacterState };
  conquerTowerFloor: (input: {
    character: CharacterState | null;
    dailies: DailyTask[];
    floor: TowerFloorDefinition | undefined;
    committedItems?: Record<ItemId, number>;
    externalSuccessFlat?: number;
  }) => ConquerTowerFloorResult;
  attemptRankUp: (input: {
    character: CharacterState | null;
    completedQuestCount: number;
    trial: RankUpTrialDefinition | undefined;
    committedItems?: Record<ItemId, number>;
    nowMs: number;
  }) => AttemptRankUpResult;
  resolveTowerWave: (input: {
    character: CharacterState | null;
    floor: TowerFloorDefinition | undefined;
    wave: TowerWaveKey;
    committedItems?: Record<ItemId, number>;
  }) => ResolveTowerWaveResult;
  finalizeTowerFloor: (input: {
    character: CharacterState | null;
    dailies: DailyTask[];
    floor: TowerFloorDefinition | undefined;
  }) => FinalizeTowerFloorResult;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const getQuestHealthGateMin = (character: CharacterState): number => Math.ceil(character.healthCap * 0.5);
export const hasQuestAccess = (
  character: CharacterState,
  quest: QuestDefinition,
): { allowed: boolean; reason?: string } => {
  const playerRankIndex = RANK_ORDER.indexOf(character.adventurerRank);
  const questRankIndex = RANK_ORDER.indexOf(quest.rank);

  if (playerRankIndex < questRankIndex) {
    return {
      allowed: false,
      reason: `Requires ${quest.rank}-Rank Adventurer License.`,
    };
  }

  if (character.progression.level < quest.minLevel) {
    return {
      allowed: false,
      reason: `Requires Level ${quest.minLevel}.`,
    };
  }

  return { allowed: true };
};

export const calculateQuestSuccessChance = (
  character: CharacterState,
  quest: QuestDefinition,
  committedItems?: Record<ItemId, number>,
): number => {
  return calculateQuestChanceBreakdown(character, quest, committedItems).finalChance;
};

const getQuestKeyReadiness = (
  quest: QuestDefinition,
  committedItems: Record<ItemId, number>,
): number => {
  const requiredTotal = quest.requiredItems.reduce((sum, requirement) => sum + requirement.needed, 0);
  const requiredOwned = quest.requiredItems.reduce((sum, requirement) => {
    const owned = committedItems[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  return requiredTotal === 0 ? 1 : requiredOwned / requiredTotal;
};

const getQuestOptionalReadiness = (
  quest: QuestDefinition,
  committedItems: Record<ItemId, number>,
): number => {
  const recommendedTotal = (quest.recommendedItems ?? []).reduce(
    (sum, requirement) => sum + requirement.needed,
    0,
  );
  const recommendedOwned = (quest.recommendedItems ?? []).reduce((sum, requirement) => {
    const owned = committedItems[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  const recommendedReadiness =
    recommendedTotal === 0 ? 0 : recommendedOwned / recommendedTotal;
  return recommendedReadiness;
};

const getQuestWeaponModifier = (character: CharacterState, quest: QuestDefinition): number => {
  const equippedWeapon = character.equippedWeaponId
    ? ITEM_BY_ID[character.equippedWeaponId]
    : undefined;
  const weaponProficiency = getWeaponProficiency(character);
  if (
    equippedWeapon &&
    equippedWeapon.category === "weapon" &&
    equippedWeapon.classRestriction === character.classId
  ) {
    const typeBonus = quest.type === "dungeon" ? 8 : quest.type === "adventure" ? 6 : 3;
    const rarityBonus =
      equippedWeapon.rarity === "legendary"
        ? 6
        : equippedWeapon.rarity === "epic"
          ? 4
          : equippedWeapon.rarity === "rare"
            ? 2
            : 1;
    return Math.round((typeBonus + rarityBonus) * weaponProficiency);
  }
  return 0;
};

export const calculateQuestChanceBreakdown = (
  character: CharacterState,
  quest: QuestDefinition,
  committedItems?: Record<ItemId, number>,
): QuestChanceBreakdown => {
  const selectedItems = committedItems ?? {};
  const keyReadiness = getQuestKeyReadiness(quest, selectedItems);
  const optionalReadiness = getQuestOptionalReadiness(quest, selectedItems);
  const levelDelta = character.progression.level - quest.minLevel;
  const levelModifier = clamp(levelDelta * 3, -18, 20);
  const keyItemModifier = Math.round((keyReadiness - 1) * 44 * (KEY_PENALTY_BY_TYPE[quest.type] ?? 1));
  const optionalItemModifier = Math.round(optionalReadiness * 10);
  const weaponModifier = getQuestWeaponModifier(character, quest);
  const combatStats = getCharacterCombatStats(character);
  const buffModifier = combatStats.questSuccessBonus;
  const abilityModifier = getPendingAbilityBonuses(character).questSuccessFlat;
  const finalChance = clamp(
    Math.round(
      quest.baseSuccessChance +
      levelModifier +
      keyItemModifier +
      optionalItemModifier +
      weaponModifier +
      buffModifier +
      abilityModifier,
    ),
    8,
    96,
  );

  return {
    baseChance: quest.baseSuccessChance,
    levelModifier,
    keyItemModifier,
    optionalItemModifier,
    weaponModifier,
    buffModifier,
    abilityModifier,
    finalChance,
    keyReadiness,
    optionalReadiness,
  };
};

export const calculateQuestHealthDelta = (
  quest: QuestDefinition,
  breakdown: QuestChanceBreakdown,
  success: boolean,
): number => {
  const failureBaseByDifficulty: Record<QuestDefinition["difficulty"], number> = {
    1: 4,
    2: 7,
    3: 10,
    4: 14,
    5: 18,
  };
  const missingKeyRatio = 1 - breakdown.keyReadiness;
  if (!success) {
    let damage =
      failureBaseByDifficulty[quest.difficulty] +
      Math.round(missingKeyRatio * 8) +
      (breakdown.finalChance < 40 ? 4 : 0) +
      (breakdown.finalChance < 25 ? 4 : 0);
    return -damage;
  }
  if (breakdown.finalChance < 45 && Math.random() <= 0.35) {
    const minorDamage = Math.floor(Math.random() * 4) + 1;
    return -minorDamage;
  }
  return 0;
};

export const hasTowerAccess = (
  character: CharacterState,
  floor: TowerFloorDefinition,
): { allowed: boolean; reason?: string } => {
  const nextFloor = (character.towerProgress?.highestFloorCleared ?? 0) + 1;
  if (floor.floorNumber !== nextFloor) {
    return {
      allowed: false,
      reason: `Clear Floor ${nextFloor} first.`,
    };
  }

  if (character.progression.level < floor.minLevel) {
    return {
      allowed: false,
      reason: `Requires Level ${floor.minLevel}.`,
    };
  }

  if (floor.requiredRank) {
    const playerRankIndex = RANK_ORDER.indexOf(character.adventurerRank);
    const requiredRankIndex = RANK_ORDER.indexOf(floor.requiredRank);
    if (playerRankIndex < requiredRankIndex) {
      return {
        allowed: false,
        reason: `Requires Rank ${floor.requiredRank}.`,
      };
    }
  }

  if (character.stamina < floor.staminaCost) {
    return {
      allowed: false,
      reason: "Not enough stamina.",
    };
  }

  return { allowed: true };
};

export const calculateTowerSuccessChance = (
  character: CharacterState,
  floor: TowerFloorDefinition,
  committedItems?: Record<ItemId, number>,
  externalSuccessFlat = 0,
): number => {
  const selectedItems = committedItems ?? {};
  const recommendedTotal = floor.recommendedItems.reduce((sum, requirement) => sum + requirement.needed, 0);
  const committedTotal = floor.recommendedItems.reduce((sum, requirement) => {
    const owned = selectedItems[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  const readiness = recommendedTotal === 0 ? 0 : committedTotal / recommendedTotal;
  const levelDelta = character.progression.level - floor.minLevel;
  const hasOverlevelAdvantage = levelDelta >= 10;
  const levelModifier = clamp(levelDelta * 3, -15, 20);
  const weapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const proficiency = getWeaponProficiency(character);
  const combatStats = getCharacterCombatStats(character);
  const rarityBonus =
    weapon?.rarity === "legendary"
      ? 8
      : weapon?.rarity === "epic"
        ? 6
        : weapon?.rarity === "rare"
          ? 4
          : weapon?.rarity === "common"
            ? 2
            : 0;
  const weaponModifier = Math.round(rarityBonus * proficiency);
  const abilityModifier = getPendingAbilityBonuses(character).towerSuccessFlat;
  const mechanicPressure = calculateTowerMechanicPressure(character, floor, selectedItems);
  const preparationBonus = Math.round(readiness * 12);
  const preparationPenalty = hasOverlevelAdvantage
    ? Math.round((1 - readiness) * 12)
    : Math.round((1 - readiness) * 36);
  const overlevelBonus = hasOverlevelAdvantage ? 18 : 0;

  const chance =
    floor.baseSuccessChance +
    preparationBonus -
    preparationPenalty +
    levelModifier +
    weaponModifier +
    Math.min(12, Math.round(combatStats.effectiveWeaponAttack / 3)) +
    combatStats.towerSuccessBonus +
    abilityModifier +
    mechanicPressure.successModifier +
    overlevelBonus +
    externalSuccessFlat;
  return clamp(Math.round(chance), 6, 95);
};

export interface TowerPhaseChances {
  normal: number;
  subBoss: number;
  boss: number;
  overall: number;
}

const getCounterItemFromMechanic = (mechanic: string): ItemId | undefined => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("poison bite")) return "antitoxin-vial";
  if (keyword.includes("venom thorn") || keyword.includes("hook rend") || keyword.includes("thorn cage")) return "thorn-salve";
  if (keyword.includes("coil snare") || keyword.includes("lariat")) return "rope";
  if (keyword.includes("bulwark")) return "lockpick";
  if (keyword.includes("needle volley")) return "guard-tonic";
  if (keyword.includes("crushing sweep") || keyword.includes("hammer sweep")) return "guard-tonic";
  if (keyword.includes("arc overcharge") || keyword.includes("overcharge")) return "grounding-tonic";
  if (keyword.includes("heartseed pulse")) return "ward-charm";
  if (keyword.includes("spark field")) return "ward-charm";
  if (keyword.includes("burrow") || keyword.includes("flash skitter")) return "torch";
  return undefined;
};

const getMechanicEventMeta = (mechanic: string): { icon: string; severity: "low" | "medium" | "high" } => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("poison")) return { icon: "biohazard", severity: "high" };
  if (keyword.includes("thorn") || keyword.includes("hook rend")) return { icon: "needle", severity: "high" };
  if (keyword.includes("snare") || keyword.includes("lariat")) return { icon: "source-branch", severity: "medium" };
  if (keyword.includes("needle volley")) return { icon: "weather-windy", severity: "medium" };
  if (keyword.includes("heartseed")) return { icon: "heart-flash", severity: "high" };
  if (keyword.includes("overcharge") || keyword.includes("spark")) return { icon: "lightning-bolt", severity: "high" };
  if (keyword.includes("bulwark")) return { icon: "shield-sword-outline", severity: "medium" };
  if (keyword.includes("sweep") || keyword.includes("hammer")) return { icon: "hammer-wrench", severity: "medium" };
  if (keyword.includes("burrow")) return { icon: "tunnel", severity: "medium" };
  if (keyword.includes("rush")) return { icon: "run-fast", severity: "low" };
  return { icon: "alert-circle", severity: "low" };
};

const getMechanicStatusProfile = (
  mechanic: string,
): {
  badName: string;
  goodName: string;
  icon: string;
} => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("poison bite")) {
    return { badName: "Poisoned", goodName: "Poison Guard", icon: "biohazard" };
  }
  if (keyword.includes("venom thorn")) {
    return { badName: "Bleeding", goodName: "Thorn Sealed", icon: "needle" };
  }
  if (keyword.includes("coil snare") || keyword.includes("lariat")) {
    return { badName: "Snared", goodName: "Slipline Ready", icon: "source-branch" };
  }
  if (keyword.includes("needle volley")) {
    return { badName: "Peppered", goodName: "Volley Guarded", icon: "weather-windy" };
  }
  if (keyword.includes("flash skitter")) {
    return { badName: "Blinded", goodName: "Sight Held", icon: "torch" };
  }
  if (keyword.includes("hook rend")) {
    return { badName: "Rended", goodName: "Rend Bound", icon: "hook" };
  }
  if (keyword.includes("thorn cage")) {
    return { badName: "Pinned", goodName: "Cage Split", icon: "pine-tree-box" };
  }
  if (keyword.includes("heartseed pulse")) {
    return { badName: "Drained", goodName: "Pulse Warded", icon: "heart-flash" };
  }
  if (keyword.includes("pack rush")) {
    return { badName: "Overrun", goodName: "Formation Held", icon: "run-fast" };
  }
  if (keyword.includes("burrow")) {
    return { badName: "Ambushed", goodName: "Ambush Read", icon: "tunnel" };
  }
  if (keyword.includes("bulwark")) {
    return { badName: "Guard Broken", goodName: "Guard Breached", icon: "shield-sword-outline" };
  }
  if (keyword.includes("crushing sweep") || keyword.includes("hammer sweep")) {
    return { badName: "Staggered", goodName: "Sweep Guarded", icon: "hammer-wrench" };
  }
  if (keyword.includes("arc overcharge") || keyword.includes("overcharge")) {
    return { badName: "Overcharged", goodName: "Arc Grounded", icon: "lightning-bolt" };
  }
  if (keyword.includes("spark field")) {
    return { badName: "Shocked", goodName: "Field Warded", icon: "flash-outline" };
  }
  return { badName: mechanic.split(":")[0].trim(), goodName: "Countered", icon: "alert-circle" };
};

const buildTowerEncounterLog = (
  character: CharacterState,
  floor: TowerFloorDefinition,
  committedItems: Record<ItemId, number>,
  phaseAttempted: Record<"normal" | "subBoss" | "boss", boolean>,
): NonNullable<TowerOutcome["encounterLog"]> => {
  const roster = floor.enemyRoster;
  if (!roster) {
    return [];
  }
  const combat = getCharacterCombatStats(character);
  const events: NonNullable<TowerOutcome["encounterLog"]> = [];

  const byPhase: Array<{ phase: "normal" | "subBoss" | "boss"; units: typeof roster.normal }> = [
    { phase: "normal", units: roster.normal },
    { phase: "subBoss", units: roster.subBoss },
    { phase: "boss", units: roster.boss },
  ];

  for (const phaseEntry of byPhase) {
    for (const unit of phaseEntry.units) {
      if (!phaseAttempted[phaseEntry.phase]) {
        continue;
      }
      const enemyEvents: NonNullable<TowerOutcome["encounterLog"]>[number]["events"] = [];
      for (const mechanic of unit.mechanics ?? []) {
        const keyword = mechanic.toLowerCase();
        const counterItemId = getCounterItemFromMechanic(mechanic);
        const hasCounter = counterItemId ? (committedItems[counterItemId] ?? 0) > 0 : false;
        const meta = getMechanicEventMeta(mechanic);
        if (keyword.includes("pack rush")) {
          const outpaced = combat.speed >= 16;
          enemyEvents.push({
            mechanic,
            countered: outpaced,
            positive: outpaced,
            resultText: outpaced
              ? "You outpaced the rush and kept formation stable (+wave control)."
              : "Swarm rush broke formation and reduced combat stability.",
            icon: meta.icon,
          });
          continue;
        }

        if (hasCounter) {
          const counterName = counterItemId ? ITEM_BY_ID[counterItemId]?.name ?? counterItemId : "Counter Supply";
          enemyEvents.push({
            mechanic,
            counterItemId,
            countered: true,
            positive: true,
            resultText: `${counterName} countered this mechanic and prevented its penalty.`,
            icon: meta.icon,
          });
        } else {
          let resultText = "Mechanic triggered and increased risk.";
          if (keyword.includes("poison")) {
            resultText = "Poison applied: HP drain increased through later phases.";
          } else if (keyword.includes("overcharge") || keyword.includes("spark")) {
            resultText = "Shock damage landed: stability dropped and boss pressure rose.";
          } else if (keyword.includes("bulwark")) {
            resultText = "Enemy bulwark held: breakthrough chance reduced.";
          }
          enemyEvents.push({
            mechanic,
            counterItemId,
            countered: false,
            positive: false,
            resultText,
            icon: meta.icon,
          });
        }
      }
      if (enemyEvents.length === 0) {
        enemyEvents.push({
          mechanic: "Direct clash",
          countered: false,
          positive: true,
          resultText: "No special mechanic triggered. Standard combat exchange.",
          icon: "sword-cross",
        });
      }
      events.push({
        phase: phaseEntry.phase,
        enemyName: unit.name,
        enemyIcon: unit.icon,
        attempted: true,
        events: enemyEvents,
      });
    }
  }

  return events;
};

const getFloorEnemyLevelAverages = (floor: TowerFloorDefinition): { normal: number; subBoss: number; boss: number } => {
  const roster = floor.enemyRoster;
  if (!roster) {
    return {
      normal: floor.minLevel,
      subBoss: floor.minLevel + 2,
      boss: floor.minLevel + 4,
    };
  }
  const avg = (values: number[], fallback: number) =>
    values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : fallback;
  return {
    normal: avg(roster.normal.map((unit) => unit.level), floor.minLevel),
    subBoss: avg(roster.subBoss.map((unit) => unit.level), floor.minLevel + 2),
    boss: avg(roster.boss.map((unit) => unit.level), floor.minLevel + 4),
  };
};

export const calculateTowerPhaseChances = (
  character: CharacterState,
  floor: TowerFloorDefinition,
  committedItems?: Record<ItemId, number>,
  externalSuccessFlat = 0,
): TowerPhaseChances => {
  const base = calculateTowerSuccessChance(character, floor, committedItems, externalSuccessFlat);
  const mechanicPressure = calculateTowerMechanicPressure(character, floor, committedItems ?? {});
  const levels = getFloorEnemyLevelAverages(floor);
  const levelEdgeNormal = clamp((character.progression.level - levels.normal) * 1.5, -10, 10);
  const levelEdgeSub = clamp((character.progression.level - levels.subBoss) * 1.7, -12, 10);
  const levelEdgeBoss = clamp((character.progression.level - levels.boss) * 2.0, -14, 9);

  const normal = clamp(Math.round(base + 10 + levelEdgeNormal - mechanicPressure.normalPhasePenalty), 12, 98);
  const subBoss = clamp(
    Math.round(base + levelEdgeSub - mechanicPressure.subBossPhasePenalty),
    8,
    95,
  );
  const boss = clamp(Math.round(base - 10 + levelEdgeBoss - mechanicPressure.bossPhasePenalty), 5, 92);
  const overall = clamp(Math.round((normal / 100) * (subBoss / 100) * (boss / 100) * 100), 1, 96);
  return { normal, subBoss, boss, overall };
};

export const calculateTowerMechanicPressure = (
  character: CharacterState,
  floor: TowerFloorDefinition,
  committedItems: Record<ItemId, number> = {},
): {
  successModifier: number;
  failDamageBonus: number;
  riskySuccessChance: number;
  riskySuccessMaxDamage: number;
  normalPhasePenalty: number;
  subBossPhasePenalty: number;
  bossPhasePenalty: number;
  successHealthPenalty: number;
} => {
  let successModifier = 0;
  let failDamageBonus = 0;
  let riskySuccessChance = 0.15;
  let riskySuccessMaxDamage = 2;
  let normalPhasePenalty = 0;
  let subBossPhasePenalty = 0;
  let bossPhasePenalty = 0;
  let successHealthPenalty = 0;
  const roster = floor.enemyRoster;
  const combat = getCharacterCombatStats(character);

  if (!roster) {
    return {
      successModifier,
      failDamageBonus,
      riskySuccessChance,
      riskySuccessMaxDamage,
      normalPhasePenalty,
      subBossPhasePenalty,
      bossPhasePenalty,
      successHealthPenalty,
    };
  }

  successModifier -= roster.normal.length;
  failDamageBonus += roster.normal.length;
  successModifier -= roster.subBoss.length * 2;
  failDamageBonus += roster.subBoss.length * 2;
  successModifier -= roster.boss.length * 3;
  failDamageBonus += roster.boss.length * 3;

  const allUnits = [...roster.normal, ...roster.subBoss, ...roster.boss];
  for (const unit of allUnits) {
    for (const mechanic of unit.mechanics ?? []) {
      const keyword = mechanic.toLowerCase();
      if (keyword.includes("bulwark")) {
        const hasCounter = (committedItems.lockpick ?? 0) > 0;
        successModifier += hasCounter ? 2 : -6;
        subBossPhasePenalty += hasCounter ? 0 : 6;
        bossPhasePenalty += hasCounter ? 0 : 3;
        failDamageBonus += hasCounter ? 0 : 2;
      }
      if (keyword.includes("crushing sweep") || keyword.includes("hammer sweep")) {
        const hasCounter = (committedItems["guard-tonic"] ?? 0) > 0;
        if (combat.speed >= 18) {
          successModifier += hasCounter ? 2 : 1;
        } else {
          successModifier += hasCounter ? -1 : -5;
          subBossPhasePenalty += hasCounter ? 1 : 5;
          failDamageBonus += hasCounter ? 1 : 3;
        }
      }
      if (keyword.includes("arc overcharge") || keyword.includes("overcharge")) {
        const hasCounter = (committedItems["grounding-tonic"] ?? 0) > 0;
        if (combat.critChance >= 15) {
          successModifier += hasCounter ? 2 : 1;
        } else {
          successModifier += hasCounter ? -1 : -6;
          bossPhasePenalty += hasCounter ? 1 : 7;
          failDamageBonus += hasCounter ? 1 : 3;
        }
        successHealthPenalty += hasCounter ? 0 : 4;
      }
      if (keyword.includes("spark field")) {
        if ((committedItems["ward-charm"] ?? 0) > 0) {
          successModifier += 2;
        } else {
          successModifier -= 6;
          bossPhasePenalty += 5;
          failDamageBonus += 4;
          successHealthPenalty += 6;
        }
      }
      if (keyword.includes("poison bite")) {
        const hasCounter = (committedItems["antitoxin-vial"] ?? 0) > 0;
        successModifier += hasCounter ? 1 : -6;
        normalPhasePenalty += hasCounter ? 0 : 6;
        subBossPhasePenalty += hasCounter ? 0 : 5;
        bossPhasePenalty += hasCounter ? 0 : 4;
        failDamageBonus += hasCounter ? 0 : 4;
        successHealthPenalty += hasCounter ? 0 : 9;
      }
      if (keyword.includes("pack rush")) {
        successModifier += combat.speed >= 16 ? 2 : -2;
      }
      if (keyword.includes("burrow")) {
        const hasCounter = (committedItems.torch ?? 0) > 0;
        successModifier += hasCounter ? 1 : -4;
        normalPhasePenalty += hasCounter ? 0 : 3;
        failDamageBonus += hasCounter ? 0 : 2;
        successHealthPenalty += hasCounter ? 0 : 3;
      }
    }
  }

  riskySuccessChance = clamp(0.15 + failDamageBonus * 0.01, 0.15, 0.42);
  riskySuccessMaxDamage = Math.max(2, Math.min(7, Math.floor(2 + failDamageBonus / 3)));
  return {
    successModifier: clamp(successModifier, -24, 8),
    failDamageBonus: Math.max(0, failDamageBonus),
    riskySuccessChance,
    riskySuccessMaxDamage,
    normalPhasePenalty: clamp(normalPhasePenalty, 0, 16),
    subBossPhasePenalty: clamp(subBossPhasePenalty, 0, 18),
    bossPhasePenalty: clamp(bossPhasePenalty, 0, 20),
    successHealthPenalty: clamp(successHealthPenalty, 0, 18),
  };
};

export const hasRankUpAccess = (
  character: CharacterState,
  trial: RankUpTrialDefinition,
  completedQuestCount: number,
): { allowed: boolean; reason?: string } => {
  if (character.adventurerRank !== trial.fromRank) {
    return { allowed: false, reason: `This trial is for ${trial.fromRank}-Rank adventurers.` };
  }
  if (character.progression.level < trial.minLevel) {
    return { allowed: false, reason: `Requires Level ${trial.minLevel}.` };
  }
  if (completedQuestCount < trial.minQuestClears) {
    return {
      allowed: false,
      reason: `Requires ${trial.minQuestClears} quest clears (${completedQuestCount}/${trial.minQuestClears}).`,
    };
  }
  if (character.stamina < trial.staminaCost) {
    return { allowed: false, reason: `Requires ${trial.staminaCost} stamina.` };
  }
  return { allowed: true };
};

export const calculateRankUpSuccessChance = (
  character: CharacterState,
  trial: RankUpTrialDefinition,
  committedItems?: Record<ItemId, number>,
): number => {
  const selectedItems = committedItems ?? {};
  const requiredTotal = trial.requiredItems.reduce((sum, req) => sum + req.needed, 0);
  const requiredOwned = trial.requiredItems.reduce((sum, req) => {
    const owned = selectedItems[req.itemId] ?? 0;
    return sum + Math.min(owned, req.needed);
  }, 0);
  const keyReadiness = requiredTotal === 0 ? 1 : requiredOwned / requiredTotal;

  const optionalTotal = (trial.recommendedItems ?? []).reduce((sum, req) => sum + req.needed, 0);
  const optionalOwned = (trial.recommendedItems ?? []).reduce((sum, req) => {
    const owned = selectedItems[req.itemId] ?? 0;
    return sum + Math.min(owned, req.needed);
  }, 0);
  const optionalReadiness = optionalTotal === 0 ? 0 : optionalOwned / optionalTotal;

  const levelDelta = character.progression.level - trial.minLevel;
  const levelModifier = clamp(levelDelta * 2.5, -12, 14);
  const keyModifier = Math.round((keyReadiness - 1) * 46);
  const optionalModifier = Math.round(optionalReadiness * 12);
  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const weaponProficiency = getWeaponProficiency(character);
  const weaponModifier =
    equippedWeapon &&
    equippedWeapon.category === "weapon" &&
    equippedWeapon.classRestriction === character.classId
      ? Math.round(
          ((equippedWeapon.rarity === "legendary"
            ? 8
            : equippedWeapon.rarity === "epic"
              ? 6
              : equippedWeapon.rarity === "rare"
                ? 4
                : 2) +
            4) *
            weaponProficiency,
        )
      : 0;
  const combatStats = getCharacterCombatStats(character);
  const buffModifier = combatStats.questSuccessBonus;
  const abilityModifier = getPendingAbilityBonuses(character).questSuccessFlat;

  const finalChance = clamp(
    Math.round(
      trial.baseSuccessChance +
        levelModifier +
        keyModifier +
        optionalModifier +
        weaponModifier +
        buffModifier +
        abilityModifier,
    ),
    8,
    94,
  );

  return finalChance;
};

export const mockGameService: GameService = {
  createCharacter: (name, classId, avatarId, classSequence) => {
    const progression = createInitialProgress();
    const baseCharacter: CharacterState = {
      id: "char-local-1",
      name,
      classId,
      classSequence,
      avatarId,
      progression,
      stamina: 20,
      staminaCap: 20,
      staminaLastTickAtMs: Date.now(),
      gold: 100,
      health: 100,
      healthCap: 100,
      focus: 12,
      focusCap: 12,
      focusLastTickAtMs: Date.now(),
      noviceEmergencyReviveAvailableAtMs: 0,
      adventurerRank: "F",
      equippedWeaponId: null,
      ownedTitleIds: [],
      discoveredTitleIds: [],
      titleProgressById: {},
      equippedBuffIds: [],
      equippedTitleIds: [],
      activeBuffExpiresAtMs: {},
      pausedBuffRemainingMs: {},
      pendingAbilityId: null,
      pendingAbilityIds: [],
      abilityCooldownsUntilMs: {},
      warriorPathChoice: null,
      activeClassSkillId: null,
      equippedPassiveAbilityIds: [],
      affinity: 0,
      inventory: {
        rope: 1,
        torch: 1,
        "healing-herb": 1,
      },
      knownTowerEnemyIds: [],
      towerProgress: {
        highestFloorCleared: 0,
      },
    };
    const healthCap = getDerivedHealthCap(baseCharacter);
    const focusCap = getDerivedSkillResourceCap(baseCharacter);
    return {
      ...baseCharacter,
      healthCap,
      health: healthCap,
      focusCap,
      focus: focusCap,
    };
  },

  startQuest: ({ character, activeQuest, dailies, quest, committedItems, nowMs }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (activeQuest) {
      return { ok: false, reason: "You already have an active quest." };
    }

    if (!quest) {
      return { ok: false, reason: "Quest not found." };
    }

    const access = hasQuestAccess(character, quest);
    if (!access.allowed) {
      return { ok: false, reason: access.reason };
    }

    if (character.stamina < quest.staminaCost) {
      return { ok: false, reason: "Not enough stamina." };
    }
    if (character.health <= 1) {
      return { ok: false, reason: "Your being is fractured. Visit the Archmage in the guild." };
    }
    const questHealthGate = getQuestHealthGateMin(character);
    if (character.health < questHealthGate) {
      return { ok: false, reason: `Health too low for quests. Need at least ${questHealthGate}/${character.healthCap} HP.` };
    }

    const selectedItems = committedItems ?? {};
    const inventory = character.inventory ?? {};
    const requirementNeedByItem: Record<ItemId, number> = {};
    for (const requirement of quest.requiredItems) {
      requirementNeedByItem[requirement.itemId] = requirement.needed;
    }
    for (const requirement of quest.recommendedItems ?? []) {
      requirementNeedByItem[requirement.itemId] = Math.max(
        requirementNeedByItem[requirement.itemId] ?? 0,
        requirement.needed,
      );
    }
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      const needed = requirementNeedByItem[itemId];
      if (!needed) {
        return { ok: false, reason: "Selected item is not valid for this quest." };
      }
      if (count > needed) {
        return { ok: false, reason: `You can only commit up to ${needed} of ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
      if ((inventory[itemId] ?? 0) < count) {
        return { ok: false, reason: `Not enough ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
    }

    const chanceBreakdown = calculateQuestChanceBreakdown(character, quest, selectedItems);
    const successChance = chanceBreakdown.finalChance;
    const nextInventory = { ...inventory };
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      nextInventory[itemId] = Math.max(0, (nextInventory[itemId] ?? 0) - count);
    }

    const titleProgress = { ...(character.titleProgressById ?? {}) };
    const discoveredTitleIds = [...(character.discoveredTitleIds ?? [])];
    const ownedTitleIds = [...(character.ownedTitleIds ?? [])];
    const newlyDiscoveredTitles: string[] = [];
    const newlyUnlockedTitles: string[] = [];

    for (const title of TITLES) {
      const requirement = title.unlockRequirement;
      if (!requirement || requirement.type !== "quest_starts" || requirement.questId !== quest.id) {
        continue;
      }
      if (!discoveredTitleIds.includes(title.id)) {
        discoveredTitleIds.push(title.id);
        newlyDiscoveredTitles.push(title.name);
      }
      const prev = titleProgress[title.id] ?? 0;
      const next = Math.min(requirement.requiredCount, prev + 1);
      titleProgress[title.id] = next;
      if (next >= requirement.requiredCount && !ownedTitleIds.includes(title.id)) {
        ownedTitleIds.push(title.id);
        newlyUnlockedTitles.push(title.name);
      }
    }

    const pendingAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
    const pendingAbilities = pendingAbilityIds
      .map((abilityId) => ({ abilityId, ability: ABILITY_BY_ID[abilityId] }))
      .filter((entry): entry is { abilityId: string; ability: NonNullable<typeof entry.ability> } => Boolean(entry.ability));
    const abilityCooldownsUntilMs = { ...(character.abilityCooldownsUntilMs ?? {}) };
    for (const entry of pendingAbilities) {
      abilityCooldownsUntilMs[entry.abilityId] = nowMs + entry.ability.cooldownSeconds * 1000;
    }
    const startNoticeParts: string[] = [];
    if (pendingAbilities.length > 0) {
      startNoticeParts.push(
        `${pendingAbilities.map((entry) => entry.ability.name).join(", ")} consumed for this run.`,
      );
    }
    if (newlyDiscoveredTitles.length > 0) {
      startNoticeParts.push(`Title discovered: ${newlyDiscoveredTitles.join(", ")}.`);
    }
    if (newlyUnlockedTitles.length > 0) {
      startNoticeParts.push(`Title unlocked: ${newlyUnlockedTitles.join(", ")}.`);
    }

    return {
      ok: true,
      character: {
        ...character,
        stamina: character.stamina - quest.staminaCost,
        inventory: nextInventory,
        discoveredTitleIds,
        ownedTitleIds,
        titleProgressById: titleProgress,
        pendingAbilityId: null,
        pendingAbilityIds: [],
        abilityCooldownsUntilMs,
      },
      reason: startNoticeParts.join(" "),
      dailies: dailies.map((daily) =>
        daily.id === "d2"
          ? { ...daily, progress: Math.min(daily.target, daily.progress + quest.staminaCost) }
          : daily,
      ),
      activeQuest: {
        questId: quest.id,
        startedAtMs: nowMs,
        endsAtMs: nowMs + quest.durationSeconds * 1000,
        successChanceAtStart: successChance,
        chanceBreakdownSnapshot: chanceBreakdown,
      },
    };
  },

  claimQuest: ({ character, activeQuest, dailies, quest, nowMs }) => {
    if (!character || !activeQuest) {
      return { ok: false, reason: "No quest is ready to claim." };
    }

    if (nowMs < activeQuest.endsAtMs) {
      return { ok: false, reason: "Quest is still in progress." };
    }

    if (!quest) {
      return { ok: false, reason: "Quest metadata missing." };
    }

    const successChance = activeQuest.successChanceAtStart;
    const chanceBreakdown =
      activeQuest.chanceBreakdownSnapshot ?? calculateQuestChanceBreakdown(character, quest);
    const success = Math.random() * 100 <= successChance;

    const baseCharacter = {
      ...character,
      stamina: Math.min(character.staminaCap, character.stamina + STAMINA_RECOVERY_PER_CLAIM),
    };

    if (!success) {
      const consolationXp = Math.max(6, Math.round(quest.reward.xp * 0.35));
      const consolationMasteryXp = Math.max(3, Math.round(quest.reward.masteryXp * 0.35));
      const consolationGold = Math.max(4, Math.round(quest.reward.gold * 0.25));
      const healthDelta = calculateQuestHealthDelta(quest, chanceBreakdown, false);
      const nextProgression = applyProgressGain(
        baseCharacter.progression,
        consolationXp,
        consolationMasteryXp,
      );
      const nextHealthCap = getDerivedHealthCap({
        ...baseCharacter,
        progression: nextProgression,
      });
      const nextFocusCap = getDerivedSkillResourceCap({
        ...baseCharacter,
        progression: nextProgression,
      });
      const failCharacter = {
        ...baseCharacter,
        progression: nextProgression,
        gold: baseCharacter.gold + consolationGold,
        healthCap: nextHealthCap,
        health: clamp(baseCharacter.health + healthDelta, 0, nextHealthCap),
        focusCap: nextFocusCap,
        focus: Math.min(baseCharacter.focus, nextFocusCap),
      };
      return {
        ok: true,
        character: failCharacter,
        dailies,
        outcome: {
          success: false,
          successChance,
          healthDelta,
          chanceBreakdown,
          summary: `Quest failed (${successChance}%). You recovered ${consolationGold}g and gained minor experience.`,
          rewards: {
            gold: consolationGold,
            xp: consolationXp,
            masteryXp: consolationMasteryXp,
            itemDrops: [],
            consolation: true,
          },
        },
      };
    }

    const gainedItems = quest.itemRewards
      .filter((itemReward) => Math.random() <= itemReward.chance)
      .map((itemReward) => ({ itemId: itemReward.itemId, amount: itemReward.amount }));

    const nextInventory = { ...(baseCharacter.inventory ?? {}) };
    for (const gainedItem of gainedItems) {
      nextInventory[gainedItem.itemId] = (nextInventory[gainedItem.itemId] ?? 0) + gainedItem.amount;
    }

    const healthDelta = calculateQuestHealthDelta(quest, chanceBreakdown, true);
    const nextProgression = applyProgressGain(
      baseCharacter.progression,
      quest.reward.xp,
      quest.reward.masteryXp,
    );
    const nextHealthCap = getDerivedHealthCap({
      ...baseCharacter,
      progression: nextProgression,
    });
    const nextFocusCap = getDerivedSkillResourceCap({
      ...baseCharacter,
      progression: nextProgression,
    });
    const nextCharacter = {
      ...baseCharacter,
      progression: nextProgression,
      gold: baseCharacter.gold + quest.reward.gold,
      healthCap: nextHealthCap,
      health: clamp(baseCharacter.health + healthDelta, 0, nextHealthCap),
      focusCap: nextFocusCap,
      focus: Math.min(baseCharacter.focus, nextFocusCap),
      inventory: nextInventory,
    };
    const summaryParts = [`Quest cleared (${successChance}%).`];
    if (gainedItems.length > 0) {
      summaryParts.push(
        `Loot: ${gainedItems
          .map((entry) => `+${entry.amount} ${ITEM_BY_ID[entry.itemId]?.name ?? entry.itemId}`)
          .join(", ")}.`,
      );
    }
    return {
      ok: true,
      character: nextCharacter,
      dailies: dailies.map((daily) =>
        daily.id === "d1" ? { ...daily, progress: Math.min(daily.target, daily.progress + 1) } : daily,
      ),
      outcome: {
        success: true,
        successChance,
        healthDelta,
        chanceBreakdown,
        summary: summaryParts.join(" "),
        rewards: {
          gold: quest.reward.gold,
          xp: quest.reward.xp,
          masteryXp: quest.reward.masteryXp,
          itemDrops: gainedItems,
          consolation: false,
        },
      },
    };
  },

  buyGuildItem: ({ character, itemId, unitPrice, amount, classRestriction }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (classRestriction && character.classId !== classRestriction) {
      return { ok: false, reason: `Only ${classRestriction} can buy this weapon.` };
    }

    const totalCost = unitPrice * amount;
    if (character.gold < totalCost) {
      return { ok: false, reason: "Not enough gold." };
    }

    return {
      ok: true,
      character: {
        ...character,
        gold: character.gold - totalCost,
        inventory: {
          ...(character.inventory ?? {}),
          [itemId]: (character.inventory?.[itemId] ?? 0) + amount,
        },
      },
    };
  },
  sellGuildItem: ({ character, itemId, unitPrice, amount }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (unitPrice <= 0) {
      return { ok: false, reason: "This item cannot be sold." };
    }

    const sellAmount = Math.max(1, Math.floor(amount));
    const owned = character.inventory?.[itemId] ?? 0;
    if (owned < sellAmount) {
      return { ok: false, reason: `Not enough ${ITEM_BY_ID[itemId]?.name ?? itemId} to sell.` };
    }
    if (character.equippedWeaponId === itemId && owned - sellAmount < 1) {
      return { ok: false, reason: "Unequip weapon or keep at least 1 copy before selling." };
    }
    if ((character.equippedBuffIds ?? []).includes(itemId) && owned - sellAmount < 1) {
      return { ok: false, reason: "Unequip buff or keep at least 1 copy before selling." };
    }

    const sellUnitPrice = Math.max(1, Math.floor(unitPrice * 0.5));
    const goldGain = sellUnitPrice * sellAmount;
    return {
      ok: true,
      character: {
        ...character,
        gold: character.gold + goldGain,
        inventory: {
          ...(character.inventory ?? {}),
          [itemId]: Math.max(0, owned - sellAmount),
        },
      },
    };
  },
  attemptRankUp: ({ character, completedQuestCount, trial, committedItems, nowMs }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (!trial) {
      return { ok: false, reason: "No rank trial available." };
    }

    const access = hasRankUpAccess(character, trial, completedQuestCount);
    if (!access.allowed) {
      return { ok: false, reason: access.reason };
    }

    const selectedItems = committedItems ?? {};
    const inventory = character.inventory ?? {};
    const requirementNeedByItem: Record<ItemId, number> = {};
    for (const requirement of trial.requiredItems) {
      requirementNeedByItem[requirement.itemId] = requirement.needed;
    }
    for (const requirement of trial.recommendedItems ?? []) {
      requirementNeedByItem[requirement.itemId] = Math.max(
        requirementNeedByItem[requirement.itemId] ?? 0,
        requirement.needed,
      );
    }
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      const needed = requirementNeedByItem[itemId];
      if (!needed) {
        return { ok: false, reason: "Selected item is not valid for this trial." };
      }
      if (count > needed) {
        return { ok: false, reason: `You can only commit up to ${needed} of ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
      if ((inventory[itemId] ?? 0) < count) {
        return { ok: false, reason: `Not enough ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
    }

    const pendingAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
    const pendingAbilities = pendingAbilityIds
      .map((abilityId) => ({ abilityId, ability: ABILITY_BY_ID[abilityId] }))
      .filter((entry): entry is { abilityId: string; ability: NonNullable<typeof entry.ability> } => Boolean(entry.ability));
    const abilityCooldownsUntilMs = { ...(character.abilityCooldownsUntilMs ?? {}) };
    for (const entry of pendingAbilities) {
      abilityCooldownsUntilMs[entry.abilityId] = nowMs + entry.ability.cooldownSeconds * 1000;
    }

    const successChance = calculateRankUpSuccessChance(character, trial, selectedItems);
    const success = Math.random() * 100 <= successChance;

    const nextInventory = { ...inventory };
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      nextInventory[itemId] = Math.max(0, (nextInventory[itemId] ?? 0) - count);
    }

    const baseCharacter: CharacterState = {
      ...character,
      stamina: character.stamina - trial.staminaCost,
      inventory: nextInventory,
      pendingAbilityId: null,
      pendingAbilityIds: [],
      abilityCooldownsUntilMs,
    };
    const healthDelta = success
      ? -Math.max(0, trial.difficulty - 2)
      : -(5 + trial.difficulty * 2 + Math.floor(Math.random() * 4));
    const progressed = applyProgressGain(
      baseCharacter.progression,
      success ? trial.reward.xp : Math.max(8, Math.round(trial.reward.xp * 0.3)),
      success ? trial.reward.masteryXp : Math.max(4, Math.round(trial.reward.masteryXp * 0.3)),
    );
    const nextHealthCap = getDerivedHealthCap({ ...baseCharacter, progression: progressed });
    const nextFocusCap = getDerivedSkillResourceCap({ ...baseCharacter, progression: progressed });

    const nextCharacter: CharacterState = {
      ...baseCharacter,
      progression: progressed,
      adventurerRank: success ? trial.toRank : baseCharacter.adventurerRank,
      gold: baseCharacter.gold + (success ? trial.reward.gold : Math.max(10, Math.round(trial.reward.gold * 0.3))),
      healthCap: nextHealthCap,
      health: clamp(baseCharacter.health + healthDelta, 0, nextHealthCap),
      focusCap: nextFocusCap,
      focus: Math.min(baseCharacter.focus, nextFocusCap),
    };

    return {
      ok: true,
      character: nextCharacter,
      outcome: {
        success,
        fromRank: trial.fromRank,
        toRank: trial.toRank,
        successChance,
        healthDelta,
        summary: success
          ? `${
              pendingAbilities.length > 0
                ? `${pendingAbilities.map((entry) => entry.ability.name).join(", ")} consumed. `
                : ""
            }Rank trial cleared. Promoted ${trial.fromRank} -> ${trial.toRank}.`
          : `${
              pendingAbilities.length > 0
                ? `${pendingAbilities.map((entry) => entry.ability.name).join(", ")} consumed. `
                : ""
            }Rank trial failed at ${successChance}%. Recover and try again.`,
      },
    };
  },
  resolveTowerWave: ({ character, floor, wave, committedItems }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (!floor) {
      return { ok: false, reason: "Floor not found." };
    }
    if (character.health <= 1) {
      return { ok: false, reason: "Your being is fractured. Visit the Archmage in the guild." };
    }
    const access = hasTowerAccess(character, floor);
    if (!access.allowed) {
      return { ok: false, reason: access.reason };
    }
    const roster = floor.enemyRoster;
    const waveUnits = roster
      ? wave === "normal"
        ? roster.normal
        : wave === "subBoss"
          ? roster.subBoss
          : roster.boss
      : [];
    const selectedItems = committedItems ?? {};
    const nextInventory = { ...(character.inventory ?? {}) };
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      const owned = nextInventory[itemId] ?? 0;
      if (owned < count) {
        return { ok: false, reason: `Not enough ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
      nextInventory[itemId] = owned - count;
    }
    const hasOverlevelAdvantage = character.progression.level - floor.minLevel >= 10;
    const playerDamageMultiplier = hasOverlevelAdvantage ? 1.5 : 1;
    const enemyDamageMultiplier = hasOverlevelAdvantage ? 0.5 : 1;
    const combatStats = getCharacterCombatStats(character);
    const abilityBonuses = getPendingAbilityBonuses(character);
    const playerDamagePerTurn = Math.max(1, Math.round((combatStats.damage + abilityBonuses.damageFlat) * playerDamageMultiplier));
    let runningHealth = character.health;
    let countered = 0;
    let triggered = 0;
    const lines: string[] = [];
    const enemyBattles: NonNullable<TowerWaveOutcome["enemyBattles"]> = [];
    const statusEffectMap: Record<
      string,
      { name: string; icon: string; tone: "good" | "bad" | "neutral"; value: number }
    > = {};
    for (const unit of waveUnits) {
      if (runningHealth <= 0) {
        break;
      }
      const enemyHealth = Math.max(
        1,
        unit.health ??
          (unit.role === "boss"
            ? 170 + floor.minLevel * 12
            : unit.role === "subBoss"
              ? 110 + floor.minLevel * 10
              : 40 + floor.minLevel * 6),
      );
      const turnsToDefeat = Math.max(1, Math.ceil(enemyHealth / playerDamagePerTurn));
      const baseEnemyDamagePerTurn = Math.max(
        1,
        Math.round((unit.level * 1.8 + (unit.role === "boss" ? 14 : unit.role === "subBoss" ? 10 : 6)) * enemyDamageMultiplier),
      );
      let mechanicDamagePerTurn = 0;
      const triggeredMechanicsForUnit: Array<{ id: string; name: string; icon: string; valuePerTurn: number }> = [];
      for (const mechanic of unit.mechanics ?? []) {
        const counterItemId = getCounterItemFromMechanic(mechanic);
        const hasCounter = counterItemId ? (selectedItems[counterItemId] ?? 0) > 0 : false;
        const mechanicName = mechanic.split(":")[0].trim();
        const { icon, severity } = getMechanicEventMeta(mechanic);
        const statusProfile = getMechanicStatusProfile(mechanic);
        if (hasCounter) {
          countered += 1;
          lines.push(`${unit.name}: ${ITEM_BY_ID[counterItemId!]?.name ?? counterItemId} neutralized ${mechanic.split(":")[0]}.`);
          const key = `counter:${statusProfile.goodName}`;
          statusEffectMap[key] = {
            name: statusProfile.goodName,
            icon: statusProfile.icon,
            tone: "good",
            value: (statusEffectMap[key]?.value ?? 0) + 1,
          };
        } else {
          triggered += 1;
          const valuePerTurn = severity === "high" ? 3 : severity === "medium" ? 2 : 1;
          mechanicDamagePerTurn += valuePerTurn;
          lines.push(`${unit.name}: ${mechanicName} connected.`);
          triggeredMechanicsForUnit.push({
            id: statusProfile.badName.toLowerCase().replace(/\s+/g, "-"),
            name: statusProfile.badName,
            icon: statusProfile.icon || icon,
            valuePerTurn,
          });
        }
      }
      const damageTaken = turnsToDefeat * (baseEnemyDamagePerTurn + mechanicDamagePerTurn);
      runningHealth = Math.max(0, runningHealth - damageTaken);
      for (const entry of triggeredMechanicsForUnit) {
        const key = `trigger:${entry.id}`;
        statusEffectMap[key] = {
          name: entry.name,
          icon: entry.icon,
          tone: "bad",
          value: (statusEffectMap[key]?.value ?? 0) + entry.valuePerTurn * turnsToDefeat,
        };
      }
      lines.push(`${unit.name}: defeated in ${turnsToDefeat} turns. Damage taken ${damageTaken}.`);
      enemyBattles.push({
        enemyId: unit.id,
        enemyName: unit.name,
        enemyIcon: unit.icon,
        enemyRole: unit.role,
        enemyLevel: unit.level,
        enemyHealth,
        turnsToDefeat,
        playerDamagePerTurn,
        damageTaken,
        events: [
          {
            mechanic: "Direct Clash",
            countered: false,
            positive: true,
            resultText: `Enemy HP ${enemyHealth}. Defeated in ${turnsToDefeat} turns.`,
            icon: "sword-cross",
          },
          ...((unit.mechanics ?? []).length > 0
            ? ((): NonNullable<TowerWaveOutcome["enemyBattles"]>[number]["events"] => {
                const battleEvents: NonNullable<TowerWaveOutcome["enemyBattles"]>[number]["events"] = [];
                for (const mechanic of unit.mechanics ?? []) {
                  const counterItemId = getCounterItemFromMechanic(mechanic);
                  const hasCounter = counterItemId ? (selectedItems[counterItemId] ?? 0) > 0 : false;
                  const mechanicName = mechanic.split(":")[0].trim();
                  const { icon } = getMechanicEventMeta(mechanic);
                  if (hasCounter) {
                    battleEvents.push({
                      mechanic: mechanicName,
                      counterItemId,
                      countered: true,
                      positive: true,
                      resultText: `${ITEM_BY_ID[counterItemId!]?.name ?? counterItemId} countered this mechanic.`,
                      icon,
                    });
                  } else {
                    battleEvents.push({
                      mechanic: mechanicName,
                      counterItemId,
                      countered: false,
                      positive: false,
                      resultText: "Mechanic connected and raised incoming damage.",
                      icon,
                    });
                  }
                }
                return battleEvents;
              })()
            : [
                {
                  mechanic: "No Special Mechanic",
                  countered: false,
                  positive: true,
                  resultText: "Standard clash. No special mechanic interrupted the exchange.",
                  icon: "shield-sun-outline",
                },
              ]),
        ],
      });
    }
    const waveStaminaCost = Math.max(1, Math.round(floor.staminaCost / 3));
    const nextStamina = Math.max(0, character.stamina - waveStaminaCost);
    const success = runningHealth > 0;
    const healthDelta = runningHealth - character.health;
    const nextCharacter: CharacterState = {
      ...character,
      health: runningHealth,
      stamina: nextStamina,
      inventory: nextInventory,
      knownTowerEnemyIds: Array.from(
        new Set([...(character.knownTowerEnemyIds ?? []), ...waveUnits.map((unit) => unit.id)]),
      ),
    };
    return {
      ok: true,
      character: nextCharacter,
      outcome: {
        floorNumber: floor.floorNumber,
        wave,
        success,
        healthDelta,
        countered,
        triggered,
        summary: `${wave === "normal" ? "Normal Wave" : wave === "subBoss" ? "Sub-Boss" : "Main Boss"} ${
          success ? "cleared" : "failed"
        }.`,
        lines,
        enemyBattles,
        statusEffects: Object.entries(statusEffectMap).map(([id, value]) => ({
          id,
          name: value.name,
          icon: value.icon,
          tone: value.tone,
          detail:
            value.tone === "bad"
              ? `HP -${value.value} / enc`
              : value.tone === "good"
                ? `Negated x${value.value}`
                : `${value.value}`,
        })),
        conditionalEncounter:
          floor.floorNumber === 1 && success
            ? (() => {
                const poisonTriggered = Object.keys(statusEffectMap).some((key) => key.includes("trigger:poisoned"));
                const disciplinedPreparation =
                  (committedItems?.["antitoxin-vial"] ?? 0) >= 1 &&
                  (committedItems?.torch ?? 0) >= 1 &&
                  !poisonTriggered;
                if (!poisonTriggered && !disciplinedPreparation) {
                  return undefined;
                }
                return {
                  id: "tower-floor1-lyra-intercept",
                  npcName: "Lyra Ashstep",
                  npcTitle: "Ember Scout",
                  classId: "ranger" as const,
                  avatarId: "ranger-3" as const,
                  contactStyle: poisonTriggered ? ("rescued" as const) : ("disciplined" as const),
                  triggerPhase: "normal" as const,
                  message: poisonTriggered
                    ? "Lyra steps from the ash veil: \"Poison already found your blood. Follow my ember marks and the deeper lanes won't take you as easily.\""
                    : "Lyra steps from the ash with a measured nod: \"You prepared before the Tower forced the lesson on you. Keep that habit, and you may live long enough to matter.\"",
                  acceptLabel: "Take Lyra's Advice",
                  declineLabel: "Push On Alone",
                  acceptOutcome: poisonTriggered
                    ? "Lyra traces a safer route through the ash vents and leaves a silent mark only you can read."
                    : "Lyra leaves a cleaner ember line, a small reward for the discipline she just witnessed.",
                  declineOutcome: poisonTriggered
                    ? "You refuse the scout line and continue deeper under the same pressure."
                    : "You refuse the offered route even after earning Lyra's respect.",
                };
              })()
            : undefined,
      },
    };
  },
  finalizeTowerFloor: ({ character, dailies, floor }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (!floor) {
      return { ok: false, reason: "Floor not found." };
    }
    if (character.health <= 1) {
      return { ok: false, reason: "Cannot finalize while your being is fractured." };
    }
    const nextInventory = { ...(character.inventory ?? {}) };
    for (const guaranteedItem of floor.guaranteedItemRewards ?? []) {
      nextInventory[guaranteedItem.itemId] = (nextInventory[guaranteedItem.itemId] ?? 0) + guaranteedItem.amount;
    }
    const gainedItems =
      floor.bonusItemRewards
        ?.filter((reward) => Math.random() <= reward.chance)
        .map((reward) => ({ itemId: reward.itemId, amount: reward.amount })) ?? [];
    for (const gainedItem of gainedItems) {
      nextInventory[gainedItem.itemId] = (nextInventory[gainedItem.itemId] ?? 0) + gainedItem.amount;
    }
    const nextProgression = applyProgressGain(character.progression, floor.reward.xp, floor.reward.masteryXp);
    const nextHealthCap = getDerivedHealthCap({
      ...character,
      progression: nextProgression,
    });
    const nextFocusCap = getDerivedSkillResourceCap({
      ...character,
      progression: nextProgression,
    });
    const nextCharacter: CharacterState = {
      ...character,
      progression: nextProgression,
      gold: character.gold + floor.reward.gold,
      healthCap: nextHealthCap,
      health: clamp(character.health, 0, nextHealthCap),
      focusCap: nextFocusCap,
      focus: Math.min(character.focus, nextFocusCap),
      inventory: nextInventory,
      towerProgress: {
        highestFloorCleared: Math.max(character.towerProgress?.highestFloorCleared ?? 0, floor.floorNumber),
      },
    };
    return {
      ok: true,
      character: nextCharacter,
      dailies: dailies.map((daily) =>
        daily.id === "d1" ? { ...daily, progress: Math.min(daily.target, daily.progress + 1) } : daily,
      ),
      outcome: {
        success: true,
        floorNumber: floor.floorNumber,
        successChance: 100,
        summary: `Floor ${floor.floorNumber} finalized. Rewards and drops transferred to inventory.`,
      },
    };
  },
  conquerTowerFloor: ({ character, dailies, floor, committedItems, externalSuccessFlat = 0 }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (!floor) {
      return { ok: false, reason: "Floor not found." };
    }
    if (character.health <= 1) {
      return { ok: false, reason: "Your being is fractured. Visit the Archmage in the guild." };
    }

    const access = hasTowerAccess(character, floor);
    if (!access.allowed) {
      return { ok: false, reason: access.reason };
    }

    const selectedItems = committedItems ?? {};
    const inventory = character.inventory ?? {};
    const requirementNeedByItem: Record<ItemId, number> = {};
    for (const requirement of floor.recommendedItems) {
      requirementNeedByItem[requirement.itemId] = requirement.needed;
    }
    for (const [itemId, amount] of Object.entries(selectedItems)) {
      const count = Math.max(0, Math.floor(amount));
      if (count <= 0) {
        continue;
      }
      const needed = requirementNeedByItem[itemId];
      if (!needed) {
        return { ok: false, reason: "Selected supply is not valid for this floor." };
      }
      if (count > needed) {
        return { ok: false, reason: `You can only commit up to ${needed} of ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
      if ((inventory[itemId] ?? 0) < count) {
        return { ok: false, reason: `Not enough ${ITEM_BY_ID[itemId]?.name ?? itemId}.` };
      }
    }

    const phaseChances = calculateTowerPhaseChances(character, floor, selectedItems, externalSuccessFlat);
    const successChance = phaseChances.overall;
    const mechanicPressure = calculateTowerMechanicPressure(character, floor, selectedItems);
    const supplyUsage = floor.recommendedItems.map((requirement) => ({
      itemId: requirement.itemId,
      committed: selectedItems[requirement.itemId] ?? 0,
      needed: requirement.needed,
    }));
    const roster = floor.enemyRoster;
    const hasOverlevelAdvantage = character.progression.level - floor.minLevel >= 10;
    const playerDamageMultiplier = hasOverlevelAdvantage ? 1.5 : 1;
    const enemyDamageMultiplier = hasOverlevelAdvantage ? 0.5 : 1;
    const combatStats = getCharacterCombatStats(character);
    const abilityBonuses = getPendingAbilityBonuses(character);
    const playerDamagePerTurn = Math.max(
      1,
      Math.round((combatStats.damage + abilityBonuses.damageFlat) * playerDamageMultiplier),
    );
    let runningHealth = character.health;
    const encounterLog: NonNullable<TowerOutcome["encounterLog"]> = [];
    const phaseResults: NonNullable<TowerOutcome["phaseResults"]> = [];
    const phaseSequence: Array<{
      key: "normal" | "subBoss" | "boss";
      chance: number;
      units: NonNullable<TowerFloorDefinition["enemyRoster"]>["normal"];
    }> = roster
      ? [
          { key: "normal", chance: phaseChances.normal, units: roster.normal },
          { key: "subBoss", chance: phaseChances.subBoss, units: roster.subBoss },
          { key: "boss", chance: phaseChances.boss, units: roster.boss },
        ]
      : [];

    for (const phase of phaseSequence) {
      const attempted = runningHealth > 0;
      if (!attempted) {
        phaseResults.push({ phase: phase.key, attempted: false, success: false, chance: phase.chance });
        continue;
      }
      let phaseCleared = true;
      for (const unit of phase.units) {
        if (runningHealth <= 0) {
          phaseCleared = false;
          break;
        }
        const enemyHealth = Math.max(
          1,
          unit.health ??
            (unit.role === "boss"
              ? 170 + floor.minLevel * 12
              : unit.role === "subBoss"
                ? 110 + floor.minLevel * 10
                : 40 + floor.minLevel * 6),
        );
        const turnsToDefeat = Math.max(1, Math.ceil(enemyHealth / playerDamagePerTurn));
        const baseEnemyDamagePerTurn = Math.max(
          1,
          Math.round(
            (unit.level * 1.8 + (unit.role === "boss" ? 14 : unit.role === "subBoss" ? 10 : 6)) *
              enemyDamageMultiplier,
          ),
        );
        let mechanicDamagePerTurn = 0;
        const enemyEvents: NonNullable<TowerOutcome["encounterLog"]>[number]["events"] = [];
        for (const mechanic of unit.mechanics ?? []) {
          const counterItemId = getCounterItemFromMechanic(mechanic);
          const hasCounter = counterItemId ? (selectedItems[counterItemId] ?? 0) > 0 : false;
          const { icon, severity } = getMechanicEventMeta(mechanic);
          if (hasCounter) {
            const counterName = counterItemId ? ITEM_BY_ID[counterItemId]?.name ?? counterItemId : "Counter supply";
            enemyEvents.push({
              mechanic,
              counterItemId,
              countered: true,
              positive: true,
              resultText: `${counterName} neutralized this mechanic.`,
              icon,
            });
            continue;
          }
          const severityDamage = severity === "high" ? 3 : severity === "medium" ? 2 : 1;
          mechanicDamagePerTurn += severityDamage;
          enemyEvents.push({
            mechanic,
            counterItemId,
            countered: false,
            positive: false,
            resultText: "Mechanic connected and amplified incoming damage.",
            icon,
          });
        }
        if (turnsToDefeat === 1 && mechanicDamagePerTurn > 0) {
          mechanicDamagePerTurn = Math.max(0, mechanicDamagePerTurn - 1);
          enemyEvents.push({
            mechanic: "Burst Defeat",
            countered: false,
            positive: true,
            resultText: "You eliminated the target before its mechanics fully escalated.",
            icon: "sword-cross",
          });
        }
        const damageTaken = turnsToDefeat * (baseEnemyDamagePerTurn + mechanicDamagePerTurn);
        runningHealth = Math.max(0, runningHealth - damageTaken);
        enemyEvents.unshift({
          mechanic: "Direct Clash",
          countered: false,
          positive: true,
          resultText: `Enemy HP ${enemyHealth} defeated in ${turnsToDefeat} turns. You dealt ${playerDamagePerTurn}/turn and took ${damageTaken} total damage.`,
          icon: "sword-cross",
        });
        encounterLog.push({
          phase: phase.key,
          enemyId: unit.id,
          enemyName: unit.name,
          enemyIcon: unit.icon,
          enemyRole: unit.role,
          enemyLevel: unit.level,
          enemyHealth,
          turnsToDefeat,
          playerDamagePerTurn,
          damageTaken,
          attempted: true,
          events: enemyEvents,
        });
      }
      phaseCleared = phaseCleared && runningHealth > 0;
      phaseResults.push({ phase: phase.key, attempted: true, success: phaseCleared, chance: phase.chance });
      if (runningHealth <= 0) {
        break;
      }
    }
    const mechanicEvents: NonNullable<TowerOutcome["mechanicEvents"]> = encounterLog
      .flatMap((entry) =>
        entry.events.map((event) => ({
          phase: entry.phase,
          enemyName: entry.enemyName,
          mechanic: event.mechanic,
          counterItemId: event.counterItemId,
          countered: event.countered,
          resultText: event.resultText,
          severity: (event.positive ? "low" : "high") as "low" | "high" | "medium",
          icon: event.icon,
        })),
      )
      .filter((event) => event.mechanic !== "Encounter not reached");
    const clearNormal = phaseResults.find((phase) => phase.phase === "normal")?.success ?? true;
    const clearSubBoss = phaseResults.find((phase) => phase.phase === "subBoss")?.success ?? true;
    const clearBoss = phaseResults.find((phase) => phase.phase === "boss")?.success ?? true;
    const poisonPressureTriggered = encounterLog.some(
      (entry) =>
        entry.phase === "normal" &&
        entry.events.some(
          (event) =>
            !event.countered &&
            event.mechanic.toLowerCase().includes("poison bite"),
        ),
    );
    const disciplinedPreparation =
      floor.floorNumber === 1 &&
      (committedItems?.["antitoxin-vial"] ?? 0) >= 1 &&
      (committedItems?.torch ?? 0) >= 1 &&
      !poisonPressureTriggered;
    const conditionalEncounter =
      floor.floorNumber === 1 && clearNormal && (poisonPressureTriggered || disciplinedPreparation)
        ? {
                id: "tower-floor1-lyra-intercept",
                npcName: "Lyra Ashstep",
                npcTitle: "Ember Scout",
                classId: "ranger" as const,
                avatarId: "ranger-3" as const,
                contactStyle: poisonPressureTriggered ? ("rescued" as const) : ("disciplined" as const),
                triggerPhase: "normal" as const,
                message:
                  poisonPressureTriggered
                    ? "Lyra intercepts your climb: \"You are carrying poison stress from the first wave. I can keep the ash from finishing what your prep started if you listen now.\""
                    : "Lyra steps out of the ash with a thin, approving smile: \"You brought the right counters before the Tower forced them into your blood. Few novices do that. Want the cleaner route?\"",
                acceptLabel: "Take Lyra's Advice",
                declineLabel: "Push On Alone",
                acceptOutcome:
                  poisonPressureTriggered
                    ? "Lyra marks a safer line through the ruins and steadies the climb before your early mistakes cost more."
                    : "Lyra marks a cleaner ember line through the ruins, rewarding the discipline you already showed.",
                declineOutcome:
                  poisonPressureTriggered
                    ? "You ignore the warning and continue with the ash still remembering your mistake."
                    : "You turn down the scout line and continue on your own, even after earning Lyra's respect.",
              }
            : undefined;
    const success = runningHealth > 0;
    const pendingAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
    const pendingAbilities = pendingAbilityIds
      .map((abilityId) => ({ abilityId, ability: ABILITY_BY_ID[abilityId] }))
      .filter((entry): entry is { abilityId: string; ability: NonNullable<typeof entry.ability> } => Boolean(entry.ability));
    const abilityCooldownsUntilMs = { ...(character.abilityCooldownsUntilMs ?? {}) };
    const cooldownNowMs = Date.now();
    for (const entry of pendingAbilities) {
      abilityCooldownsUntilMs[entry.abilityId] = cooldownNowMs + entry.ability.cooldownSeconds * 1000;
    }
    const baseCharacter = {
      ...character,
      stamina: character.stamina - floor.staminaCost,
      pendingAbilityId: null,
      pendingAbilityIds: [],
      abilityCooldownsUntilMs,
    };
    const nextInventory = { ...(baseCharacter.inventory ?? {}) };
    for (const requirement of floor.recommendedItems) {
      const committedCount = selectedItems[requirement.itemId] ?? 0;
      const consumeCount = Math.min(requirement.needed, committedCount);
      if (consumeCount <= 0) {
        continue;
      }
      const owned = nextInventory[requirement.itemId] ?? 0;
      nextInventory[requirement.itemId] = Math.max(0, owned - consumeCount);
    }

    if (!success) {
      const failedPhase = !clearNormal ? "normal wave" : !clearSubBoss ? "sub-boss" : "main boss";
      const healthDelta = runningHealth - baseCharacter.health;
      let failCharacter: CharacterState = {
        ...baseCharacter,
        inventory: nextInventory,
        knownTowerEnemyIds: Array.from(
          new Set([
            ...(baseCharacter.knownTowerEnemyIds ?? []),
            ...encounterLog.map((entry) => entry.enemyId).filter((enemyId): enemyId is string => Boolean(enemyId)),
          ]),
        ),
        health: runningHealth,
      };
      const consumedLabel =
        pendingAbilities.length > 0
          ? `${pendingAbilities.map((entry) => entry.ability.name).join(", ")} consumed. `
          : "";
      let failSummary = `${consumedLabel}Floor ${floor.floorNumber} failed at ${failedPhase}. Improve prep supplies and counter mechanics.`;
      if (failCharacter.health <= 0) {
        failSummary += " The tower cast you out at the brink of death. Restore your being with the Archmage before returning.";
      }
      return {
        ok: true,
        character: failCharacter,
        dailies,
        outcome: {
          success: false,
          floorNumber: floor.floorNumber,
          successChance,
          healthDelta,
          levelPenaltyApplied: 0,
          emergencyReviveTriggered: false,
          encounterLog,
          mechanicEvents,
          supplyUsage,
          phaseResults,
          conditionalEncounter,
          summary: failSummary,
        },
      };
    }

    for (const guaranteedItem of floor.guaranteedItemRewards ?? []) {
      nextInventory[guaranteedItem.itemId] = (nextInventory[guaranteedItem.itemId] ?? 0) + guaranteedItem.amount;
    }
    const gainedItems =
      floor.bonusItemRewards
        ?.filter((reward) => Math.random() <= reward.chance)
        .map((reward) => ({ itemId: reward.itemId, amount: reward.amount })) ?? [];
    for (const gainedItem of gainedItems) {
      nextInventory[gainedItem.itemId] = (nextInventory[gainedItem.itemId] ?? 0) + gainedItem.amount;
    }

    const nextProgression = applyProgressGain(
      baseCharacter.progression,
      floor.reward.xp,
      floor.reward.masteryXp,
    );
    const nextHealthCap = getDerivedHealthCap({
      ...baseCharacter,
      progression: nextProgression,
    });
    const nextFocusCap = getDerivedSkillResourceCap({
      ...baseCharacter,
      progression: nextProgression,
    });
    const healthDelta = runningHealth - baseCharacter.health;
    let nextCharacter: CharacterState = {
      ...baseCharacter,
      progression: nextProgression,
      gold: baseCharacter.gold + floor.reward.gold,
      healthCap: nextHealthCap,
      health: clamp(runningHealth, 0, nextHealthCap),
      focusCap: nextFocusCap,
      focus: Math.min(baseCharacter.focus, nextFocusCap),
      inventory: nextInventory,
      knownTowerEnemyIds: Array.from(
        new Set([
          ...(baseCharacter.knownTowerEnemyIds ?? []),
          ...encounterLog.map((entry) => entry.enemyId).filter((enemyId): enemyId is string => Boolean(enemyId)),
        ]),
      ),
      towerProgress: {
        highestFloorCleared: Math.max(
          baseCharacter.towerProgress?.highestFloorCleared ?? 0,
          floor.floorNumber,
        ),
      },
    };
    const consumedLabel =
      pendingAbilities.length > 0
        ? `${pendingAbilities.map((entry) => entry.ability.name).join(", ")} consumed. `
        : "";
    let successSummary = `${consumedLabel}Floor ${floor.floorNumber} conquered through all encounter phases.`;
    if (nextCharacter.health <= 0) {
      successSummary += " You cleared the floor but the tower cast you out before your final breath. Restore your being with the Archmage.";
    }

    return {
      ok: true,
      character: nextCharacter,
      dailies: dailies.map((daily) =>
        daily.id === "d1" ? { ...daily, progress: Math.min(daily.target, daily.progress + 1) } : daily,
      ),
      outcome: {
        success: true,
        floorNumber: floor.floorNumber,
        successChance,
        healthDelta,
        levelPenaltyApplied: 0,
        emergencyReviveTriggered: false,
        encounterLog,
        mechanicEvents,
        supplyUsage,
        phaseResults,
        conditionalEncounter,
        summary: successSummary,
      },
    };
  },
};
