import { applyProgressGain, createInitialProgress } from "../lib/progression";
import { ITEM_BY_ID } from "../data/items";
import { getCharacterCombatStats, getWeaponProficiency } from "../lib/combat";
import {
  ActiveQuestState,
  AdventurerRank,
  AvatarId,
  BaseClassId,
  CharacterState,
  DailyTask,
  ItemId,
  QuestOutcome,
  QuestDefinition,
  TowerFloorDefinition,
  TowerOutcome,
} from "../types/game";

const STAMINA_RECOVERY_PER_CLAIM = 1;
const RANK_ORDER: AdventurerRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];

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

export interface GameService {
  createCharacter: (name: string, classId: BaseClassId, avatarId: AvatarId) => CharacterState;
  startQuest: (input: {
    character: CharacterState | null;
    activeQuest: ActiveQuestState | null;
    dailies: DailyTask[];
    quest: QuestDefinition | undefined;
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
  conquerTowerFloor: (input: {
    character: CharacterState | null;
    dailies: DailyTask[];
    floor: TowerFloorDefinition | undefined;
  }) => ConquerTowerFloorResult;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
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
): number => {
  const inventory = character.inventory ?? {};

  const requiredTotal = quest.requiredItems.reduce((sum, requirement) => sum + requirement.needed, 0);
  const requiredOwned = quest.requiredItems.reduce((sum, requirement) => {
    const owned = inventory[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  const requiredReadiness = requiredTotal === 0 ? 1 : requiredOwned / requiredTotal;

  const recommendedTotal = (quest.recommendedItems ?? []).reduce(
    (sum, requirement) => sum + requirement.needed,
    0,
  );
  const recommendedOwned = (quest.recommendedItems ?? []).reduce((sum, requirement) => {
    const owned = inventory[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  const recommendedReadiness =
    recommendedTotal === 0 ? 0 : recommendedOwned / recommendedTotal;

  const levelDelta = character.progression.level - quest.minLevel;
  const levelModifier = clamp(levelDelta * 3, -18, 22);
  const equippedWeapon = character.equippedWeaponId
    ? ITEM_BY_ID[character.equippedWeaponId]
    : undefined;
  const weaponProficiency = getWeaponProficiency(character);
  const combatStats = getCharacterCombatStats(character);
  let weaponModifier = 0;
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
    weaponModifier = Math.round((typeBonus + rarityBonus) * weaponProficiency);
  }

  const chance =
    quest.baseSuccessChance +
    requiredReadiness * 26 +
    recommendedReadiness * 14 +
    levelModifier +
    weaponModifier +
    combatStats.buffBonuses.questSuccessFlat +
    Math.min(10, Math.round(combatStats.effectiveWeaponAttack / 4));
  return clamp(Math.round(chance), 8, 98);
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
): number => {
  const inventory = character.inventory ?? {};
  const requiredTotal = floor.requiredItems.reduce((sum, requirement) => sum + requirement.needed, 0);
  const ownedTotal = floor.requiredItems.reduce((sum, requirement) => {
    const owned = inventory[requirement.itemId] ?? 0;
    return sum + Math.min(owned, requirement.needed);
  }, 0);
  const readiness = requiredTotal === 0 ? 1 : ownedTotal / requiredTotal;
  const levelDelta = character.progression.level - floor.minLevel;
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

  const chance =
    floor.baseSuccessChance +
    readiness * 34 +
    levelModifier +
    weaponModifier +
    Math.min(12, Math.round(combatStats.effectiveWeaponAttack / 3));
  return clamp(Math.round(chance), 10, 96);
};

export const mockGameService: GameService = {
  createCharacter: (name, classId, avatarId) => ({
    id: "char-local-1",
    name,
    classId,
    avatarId,
    progression: createInitialProgress(),
    stamina: 20,
    staminaCap: 20,
    staminaLastTickAtMs: Date.now(),
    gold: 100,
    adventurerRank: "F",
    equippedWeaponId: null,
    equippedBuffIds: [],
    activeBuffExpiresAtMs: {},
    pausedBuffRemainingMs: {},
    inventory: {
      rope: 1,
      torch: 1,
      "healing-herb": 1,
    },
    towerProgress: {
      highestFloorCleared: 0,
    },
  }),

  startQuest: ({ character, activeQuest, dailies, quest, nowMs }) => {
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

    const successChance = calculateQuestSuccessChance(character, quest);

    return {
      ok: true,
      character: {
        ...character,
        stamina: character.stamina - quest.staminaCost,
      },
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
    const success = Math.random() * 100 <= successChance;

    const baseCharacter = {
      ...character,
      stamina: Math.min(character.staminaCap, character.stamina + STAMINA_RECOVERY_PER_CLAIM),
    };

    if (!success) {
      const consolationXp = Math.max(6, Math.round(quest.reward.xp * 0.35));
      const consolationMasteryXp = Math.max(3, Math.round(quest.reward.masteryXp * 0.35));
      const consolationGold = Math.max(4, Math.round(quest.reward.gold * 0.25));
      const failCharacter = {
        ...baseCharacter,
        progression: applyProgressGain(
          baseCharacter.progression,
          consolationXp,
          consolationMasteryXp,
        ),
        gold: baseCharacter.gold + consolationGold,
      };
      return {
        ok: true,
        character: failCharacter,
        dailies,
        outcome: {
          success: false,
          successChance,
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

    const nextCharacter = {
      ...baseCharacter,
      progression: applyProgressGain(
        baseCharacter.progression,
        quest.reward.xp,
        quest.reward.masteryXp,
      ),
      gold: baseCharacter.gold + quest.reward.gold,
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
  conquerTowerFloor: ({ character, dailies, floor }) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (!floor) {
      return { ok: false, reason: "Floor not found." };
    }

    const access = hasTowerAccess(character, floor);
    if (!access.allowed) {
      return { ok: false, reason: access.reason };
    }

    const successChance = calculateTowerSuccessChance(character, floor);
    const success = Math.random() * 100 <= successChance;
    const baseCharacter = {
      ...character,
      stamina: character.stamina - floor.staminaCost,
    };

    if (!success) {
      return {
        ok: true,
        character: baseCharacter,
        dailies,
        outcome: {
          success: false,
          floorNumber: floor.floorNumber,
          successChance,
          summary: `Floor ${floor.floorNumber} failed (${successChance}%). The boss line held the floor.`,
        },
      };
    }

    const nextInventory = { ...(baseCharacter.inventory ?? {}) };
    const gainedItems =
      floor.bonusItemRewards
        ?.filter((reward) => Math.random() <= reward.chance)
        .map((reward) => ({ itemId: reward.itemId, amount: reward.amount })) ?? [];
    for (const gainedItem of gainedItems) {
      nextInventory[gainedItem.itemId] = (nextInventory[gainedItem.itemId] ?? 0) + gainedItem.amount;
    }

    const nextCharacter: CharacterState = {
      ...baseCharacter,
      progression: applyProgressGain(
        baseCharacter.progression,
        floor.reward.xp,
        floor.reward.masteryXp,
      ),
      gold: baseCharacter.gold + floor.reward.gold,
      inventory: nextInventory,
      towerProgress: {
        highestFloorCleared: Math.max(
          baseCharacter.towerProgress?.highestFloorCleared ?? 0,
          floor.floorNumber,
        ),
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
        successChance,
        summary: `Floor ${floor.floorNumber} conquered. Defeated ${floor.subBosses.length} sub-boss lane(s) and main boss: ${floor.mainBosses.join(", ")}.`,
      },
    };
  },
};
