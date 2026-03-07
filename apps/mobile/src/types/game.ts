export type BaseClassId = "warrior" | "ranger" | "mage";
export type AvatarId =
  | "warrior-1"
  | "warrior-2"
  | "warrior-3"
  | "warrior-4"
  | "ranger-1"
  | "ranger-2"
  | "ranger-3"
  | "ranger-4"
  | "mage-1"
  | "mage-2"
  | "mage-3"
  | "mage-4";
export type ItemId = string;
export type AdventurerRank = "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";
export type ItemCategory = "material" | "weapon" | "buff";

export interface BaseClassDefinition {
  id: BaseClassId;
  name: string;
  fantasy: string;
  passiveTrait: string;
  statFocus: string;
  advancedJobOptions: string[];
}

export interface QuestDefinition {
  id: string;
  title: string;
  type: "gather" | "adventure" | "dungeon";
  rank: AdventurerRank;
  minLevel: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  durationSeconds: number;
  staminaCost: number;
  baseSuccessChance: number;
  requiredItems: {
    itemId: ItemId;
    needed: number;
  }[];
  recommendedItems?: {
    itemId: ItemId;
    needed: number;
  }[];
  itemRewards: {
    itemId: ItemId;
    amount: number;
    chance: number;
  }[];
  reward: {
    xp: number;
    gold: number;
    masteryXp: number;
  };
}

export interface CharacterProgress {
  level: number;
  xpInLevel: number;
  xpToNextLevel: number;
  masteryLevel: number;
  masteryXpInLevel: number;
  masteryXpToNextLevel: number;
}

export interface CharacterState {
  id: string;
  name: string;
  classId: BaseClassId;
  avatarId: AvatarId;
  progression: CharacterProgress;
  stamina: number;
  staminaCap: number;
  staminaLastTickAtMs: number;
  gold: number;
  adventurerRank: AdventurerRank;
  equippedWeaponId: ItemId | null;
  equippedBuffIds: ItemId[];
  activeBuffExpiresAtMs: Record<ItemId, number>;
  pausedBuffRemainingMs: Record<ItemId, number>;
  inventory: Record<ItemId, number>;
  towerProgress: {
    highestFloorCleared: number;
  };
}

export interface ActiveQuestState {
  questId: string;
  startedAtMs: number;
  endsAtMs: number;
  successChanceAtStart: number;
}

export interface DailyTask {
  id: string;
  title: string;
  target: number;
  progress: number;
  rewardLabel: string;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  icon: string;
  rarity: ItemRarity;
  category: ItemCategory;
  classRestriction?: BaseClassId;
  requiredLevel?: number;
  weaponStats?: {
    attack: number;
    crit: number;
    speed: number;
  };
  buffStats?: {
    damageFlat?: number;
    critFlat?: number;
    speedFlat?: number;
    questSuccessFlat?: number;
  };
  buffDurationSeconds?: number;
  image?: number;
}

export interface QuestOutcome {
  success: boolean;
  successChance: number;
  summary: string;
  rewards?: {
    gold: number;
    xp: number;
    masteryXp: number;
    itemDrops: {
      itemId: ItemId;
      amount: number;
    }[];
    consolation: boolean;
  };
}

export interface TowerFloorDefinition {
  id: string;
  floorNumber: number;
  title: string;
  minLevel: number;
  staminaCost: number;
  baseSuccessChance: number;
  requiredItems: {
    itemId: ItemId;
    needed: number;
  }[];
  normalEnemies: string[];
  subBosses: string[];
  mainBosses: string[];
  reward: {
    xp: number;
    gold: number;
    masteryXp: number;
  };
  bonusItemRewards?: {
    itemId: ItemId;
    amount: number;
    chance: number;
  }[];
}

export interface TowerOutcome {
  success: boolean;
  floorNumber: number;
  successChance: number;
  summary: string;
}
