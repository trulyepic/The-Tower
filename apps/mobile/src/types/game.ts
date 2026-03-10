import { ImageSourcePropType } from "react-native";

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
export type TitleId = string;
export type AbilityId = string;
export type AdventurerRank = "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";
export type ItemCategory = "material" | "weapon" | "buff";
export type QuestType = "gather" | "adventure" | "dungeon";
export type RescueNpcStatus = "locked" | "available" | "refused_once" | "accepted" | "gone";
export type WarriorPathChoice = "knight" | "berserker";

export interface StoryState {
  rescueNpcStatus: RescueNpcStatus;
  rescueNpcUnreadCount: number;
  warriorPathGuideNoticeShown?: boolean;
}

export interface HelpfulNpcAlly {
  id: string;
  name: string;
  title: string;
  level: number;
  classId: BaseClassId;
  avatarId: AvatarId;
  avatarOverride?: ImageSourcePropType;
  skillName: string;
  skillSummary: string;
}

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
  type: QuestType;
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
  classSequence: number;
  avatarId: AvatarId;
  progression: CharacterProgress;
  stamina: number;
  staminaCap: number;
  staminaLastTickAtMs: number;
  gold: number;
  health: number;
  healthCap: number;
  focus: number;
  focusCap: number;
  focusLastTickAtMs: number;
  adventurerRank: AdventurerRank;
  equippedWeaponId: ItemId | null;
  ownedTitleIds: TitleId[];
  discoveredTitleIds: TitleId[];
  titleProgressById: Record<TitleId, number>;
  equippedBuffIds: ItemId[];
  equippedTitleIds: TitleId[];
  activeBuffExpiresAtMs: Record<ItemId, number>;
  pausedBuffRemainingMs: Record<ItemId, number>;
  pendingAbilityId: AbilityId | null;
  pendingAbilityIds?: AbilityId[];
  abilityCooldownsUntilMs: Record<AbilityId, number>;
  warriorPathChoice?: WarriorPathChoice | null;
  activeClassSkillId?: AbilityId | null;
  equippedPassiveAbilityIds?: AbilityId[];
  affinity: number;
  inventory: Record<ItemId, number>;
  alliedNpcIds?: string[];
  towerProgress: {
    highestFloorCleared: number;
  };
}

export interface ClassAbilityDefinition {
  id: AbilityId;
  classId: BaseClassId;
  name: string;
  description: string;
  icon: string;
  kind?: "skill" | "passive";
  unlockLevel?: number;
  pathGroup?: "shared" | WarriorPathChoice;
  comboTags?: string[];
  focusCost: number;
  cooldownSeconds: number;
  bonuses: {
    questSuccessFlat?: number;
    towerSuccessFlat?: number;
    damageFlat?: number;
    critFlat?: number;
    speedFlat?: number;
  };
}

export interface TitleDefinition {
  id: TitleId;
  name: string;
  icon: string;
  rarity: ItemRarity;
  minLevel: number;
  classRestriction?: BaseClassId;
  flavor: string;
  abilityLabel: string;
  unlockRequirement?: {
    type: "quest_starts";
    questId: string;
    requiredCount: number;
  };
  bonuses: {
    damageFlat?: number;
    critFlat?: number;
    speedFlat?: number;
    questSuccessFlat?: number;
  };
}

export interface QuestChanceBreakdown {
  baseChance: number;
  levelModifier: number;
  keyItemModifier: number;
  optionalItemModifier: number;
  weaponModifier: number;
  buffModifier: number;
  abilityModifier: number;
  finalChance: number;
  keyReadiness: number;
  optionalReadiness: number;
}

export interface ActiveQuestState {
  questId: string;
  startedAtMs: number;
  endsAtMs: number;
  successChanceAtStart: number;
  chanceBreakdownSnapshot?: QuestChanceBreakdown;
}

export interface StoryNotification {
  id: string;
  title: string;
  message: string;
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
  description?: string;
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
  image?: ImageSourcePropType;
}

export interface QuestOutcome {
  success: boolean;
  successChance: number;
  summary: string;
  healthDelta?: number;
  chanceBreakdown?: QuestChanceBreakdown;
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
  recommendedItems: {
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
  guaranteedItemRewards?: {
    itemId: ItemId;
    amount: number;
  }[];
  bonusItemRewards?: {
    itemId: ItemId;
    amount: number;
    chance: number;
  }[];
  enemyRoster?: {
    normal: TowerEnemyUnit[];
    subBoss: TowerEnemyUnit[];
    boss: TowerEnemyUnit[];
  };
}

export interface TowerEnemyUnit {
  id: string;
  name: string;
  role: "normal" | "subBoss" | "boss";
  level: number;
  health: number;
  icon: string;
  portrait?: number;
  description: string;
  mechanics?: string[];
}

export interface TowerOutcome {
  success: boolean;
  floorNumber: number;
  successChance: number;
  summary: string;
  healthDelta?: number;
  levelPenaltyApplied?: number;
  emergencyReviveTriggered?: boolean;
  encounterLog?: {
    phase: "normal" | "subBoss" | "boss";
    enemyName: string;
    enemyIcon: string;
    attempted: boolean;
    events: {
      mechanic: string;
      counterItemId?: ItemId;
      countered: boolean;
      resultText: string;
      positive: boolean;
      icon: string;
    }[];
  }[];
  mechanicEvents?: {
    phase: "normal" | "subBoss" | "boss";
    enemyName: string;
    mechanic: string;
    counterItemId?: ItemId;
    countered: boolean;
    resultText: string;
    severity: "low" | "medium" | "high";
    icon: string;
  }[];
  supplyUsage?: {
    itemId: ItemId;
    committed: number;
    needed: number;
  }[];
  phaseResults?: {
    phase: "normal" | "subBoss" | "boss";
    attempted?: boolean;
    success: boolean;
    chance: number;
  }[];
}

export interface RankUpTrialDefinition {
  id: string;
  fromRank: AdventurerRank;
  toRank: AdventurerRank;
  minLevel: number;
  minQuestClears: number;
  staminaCost: number;
  baseSuccessChance: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  requiredItems: {
    itemId: ItemId;
    needed: number;
  }[];
  recommendedItems?: {
    itemId: ItemId;
    needed: number;
  }[];
  reward: {
    xp: number;
    masteryXp: number;
    gold: number;
  };
}

export interface RankUpOutcome {
  success: boolean;
  fromRank: AdventurerRank;
  toRank: AdventurerRank;
  successChance: number;
  summary: string;
  healthDelta?: number;
}
