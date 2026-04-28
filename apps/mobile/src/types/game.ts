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
export type QuestBoardCategory = "job" | "story" | "urgent" | "special" | "hunt" | "wanted";
export type QuestCombatModel = "passive" | "live" | "raid";
export type QuestThreadState =
  | "discovered"
  | "available"
  | "accepted"
  | "active"
  | "paused"
  | "follow_up"
  | "timed_out"
  | "failed"
  | "refused"
  | "completed"
  | "archived";
export type RescueNpcStatus = "locked" | "available" | "refused_once" | "accepted" | "gone";
export type AldricQuestPath = "none" | "refused" | "too_late" | "saved";
export type ThornRunnerQuestStatus = "locked" | "available" | "completed";
export type ThornRunnerIntroductionChoice = "steady" | "mercenary";
export type LyraQuestStatus = "locked" | "available" | "completed";
export type LyraQuestResolution = "none" | "unresolved" | "returned" | "kept" | "reported";
export type LyraContactStyle = "rescued" | "disciplined";
export type MainQuestStageId =
  | "mq-guild-banner"
  | "mq-ashen-threshold"
  | "mq-lyra-contact"
  | "mq-ember-map"
  | "mq-lyra-judgment"
  | "mq-rank-e-ascent"
  | "mq-thorn-corridor"
  | "mq-beyond-beginnings";
export type WarriorPathChoice = "knight" | "berserker";
export type StoryCheckpointTrigger = "quest_clear" | "tower_clear" | "level_up";
export type ClimberTrend = "up" | "down" | "steady";
export type TowerWaveKey = "normal" | "subBoss" | "boss";

export interface ClimberEntry {
  id: string;
  name: string;
  classId: BaseClassId;
  avatarId: AvatarId;
  level: number;
  floor: number;
  trend: ClimberTrend;
}

export interface StoryNpcProfile {
  id: string;
  name: string;
  title: string;
  role: string;
  level: number;
  floorReached: number;
  avatarId: AvatarId;
  classId: BaseClassId;
  sequenceId: number;
  department: "story";
  licenseLabel: string;
  authBody: string;
  signature: string;
  summary?: string;
  avatarOverride?: ImageSourcePropType;
}

export interface FloorEncounterBonusState {
  encounterId: string;
  floorNumber: number;
  attemptNumber: number;
  towerSuccessFlat: number;
}

export interface FloorEncounterEventDefinition {
  id: string;
  floorNumber: number;
  npcName: string;
  npcTitle: string;
  classId: BaseClassId;
  avatarId: AvatarId;
  line: string;
  acceptLine: string;
  declineLine: string;
  recurrenceEveryAttempts: number;
  firstAttempt: number;
  towerSuccessFlat: number;
}

export interface StoryState {
  questBoardPreviewEnabled?: boolean;
  rescueNpcStatus: RescueNpcStatus;
  rescueNpcUnreadCount: number;
  aldricRescueDeadlineAtMs?: number;
  aldricQuestPath: AldricQuestPath;
  aldricDarkPathStarted: boolean;
  aldricOccasionalAidUnlocked: boolean;
  aldricFloor30Pending: boolean;
  thornRunnerQuestStatus: ThornRunnerQuestStatus;
  thornRunnerIntroductionChoice?: ThornRunnerIntroductionChoice;
  thornRunnerFollowupReviewed?: boolean;
  thornRunnerCorridorReportReady?: boolean;
  thornRunnerCorridorReportReviewed?: boolean;
  thornRunnerDeepLaneWarningReady?: boolean;
  thornRunnerDeepLaneWarningReviewed?: boolean;
  thornRunnerFloorTwoAftermathReady?: boolean;
  thornRunnerFloorTwoAftermathReviewed?: boolean;
  floorTwoTitleBackfillNotified?: boolean;
  npcDispositionById: Record<string, number>;
  npcInteractionCountById: Record<string, number>;
  lyraMet: boolean;
  lyraTrust: number;
  lyraHelpAccepted: number;
  lyraHelpDeclined: number;
  lyraQuestStatus: LyraQuestStatus;
  lyraQuestResolution: LyraQuestResolution;
  lyraFirstContactStyle?: LyraContactStyle;
  lyraAshDebt: boolean;
  mainQuestStageId: MainQuestStageId;
  mainQuestLog: MainQuestLogEntry[];
  mainQuestUnreadCount: number;
  warriorPathGuideNoticeShown?: boolean;
  unlockedRaidQuestIds?: string[];
  climberRivals: ClimberEntry[];
  lastLeaderboardRank?: number;
  floorAttemptByNumber: Record<string, number>;
  floorEncounterProgressById: Record<
    string,
    {
      seen: number;
      accepted: number;
      declined: number;
    }
  >;
  floorEncounterDecisionByAttempt: Record<string, "accepted" | "declined">;
  activeFloorEncounterBonus: FloorEncounterBonusState | null;
  encounteredNpcProfiles: StoryNpcProfile[];
  nextStoryNpcSequence: number;
}

export interface MainQuestLogEntry {
  id: string;
  stageId: MainQuestStageId;
  chapter: string;
  title: string;
  message: string;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  loggedAtMs: number;
}

export interface MainQuestObjective {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
}

export interface MainQuestTracker {
  stageId: MainQuestStageId;
  chapter: string;
  title: string;
  summary: string;
  currentDirective: string;
  stakes: string;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  accent: string;
  progressIndex: number;
  totalStages: number;
  objectives: MainQuestObjective[];
  notificationTitle: string;
  notificationMessage: string;
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
  boardCategory?: QuestBoardCategory;
  combatModel?: QuestCombatModel;
  rank: AdventurerRank;
  minLevel: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  durationSeconds: number;
  staminaCost: number;
  baseSuccessChance: number;
  loreSummary?: string;
  raidLabel?: string;
  encounterStages?: string[];
  signatureMechanics?: string[];
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
  noviceEmergencyReviveAvailableAtMs: number;
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
  combatPouchItems?: Record<ItemId, number>;
  combatPouchCapacity?: number;
  devBuffSlotLimitOverride?: number;
  sigilAppearanceMode?: "dynamic" | "default_frame";
  sigilAppearanceItemId?: ItemId | null;
  knownTowerEnemyIds?: string[];
  appraisedItemIds?: ItemId[];
  purchasedFloorIntelNumbers?: number[];
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
  variant?: "guild" | "leaderboard" | "tower-collapse" | "main-quest";
}

export type TowerBattlePosition = "front" | "mid" | "rear";

export interface TowerEnemyPositioningProfile {
  advantagePositions?: TowerBattlePosition[];
  blockedPositions?: TowerBattlePosition[];
  note?: string;
}

export interface TowerEnemySpecialMeterProfile {
  label: string;
  triggerLabel: string;
  startValue?: number;
  maxValue?: number;
  fillPerEnemyTurn: number;
  interruptPerTurn: number;
  resetValue?: number;
}

export interface TowerLiveBattleResponse {
  telegraphId?: string;
  enemyId: string;
  mechanic: string;
  responseType: "attack" | "item" | "skill" | "move" | "brace" | "pass" | "interrupt";
  responseId?: ItemId | AbilityId | TowerBattlePosition;
  success: boolean;
}

export interface TowerLiveBattleDirective {
  position: TowerBattlePosition;
  skillId?: AbilityId | null;
  braceUsed?: boolean;
  itemIdsUsed?: ItemId[];
  responses?: TowerLiveBattleResponse[];
  finalPlayerHp?: number;
  finalEnemyHpById?: Record<string, number>;
  battleLog?: string[];
  focusAfterBattle?: number;
  abilityCooldownsUntilMs?: Partial<Record<AbilityId, number>>;
  persistentStatusEffects?: {
    id: string;
    name: string;
    icon: string;
    tone: "good" | "bad" | "neutral";
    detail: string;
    stacks?: number;
    expiresAtMs?: number;
  }[];
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
  lore?: string;
  icon: string;
  rarity: ItemRarity;
  category: ItemCategory;
  isRemnant?: boolean;
  requiresAppraisal?: boolean;
  sellValue?: number;
  classRestriction?: BaseClassId;
  requiredLevel?: number;
  weaponStats?: {
    attack: number;
    crit: number;
    speed: number;
  };
  weaponMarkSlots?: number;
  weaponMarks?: Array<{
    id: string;
    name: string;
    rarity: ItemRarity;
    icon: string;
    detail: string;
    effectDescription?: string;
    accentColor?: string;
    combatEffect?:
      | {
          kind: "below-half-armor";
          armorFlat: number;
          durationTurns: number;
          triggerThresholdRatio?: number;
          triggerLimit?: number;
        }
      | {
          kind: "below-half-damage";
          damageFlat: number;
          durationTurns: number;
          triggerThresholdRatio?: number;
          triggerLimit?: number;
        }
      | {
          kind: "battle-start-armor";
          armorFlat: number;
          durationTurns: number;
        }
      | {
          kind: "battle-start-damage";
          damageFlat: number;
          durationTurns: number;
        }
      | {
          kind: "battle-start-negate-hit";
        };
  }>;
  buffStats?: {
    damageFlat?: number;
    critFlat?: number;
    speedFlat?: number;
    questSuccessFlat?: number;
    armorFlat?: number;
  };
  sigilVisual?: {
    frameShape: "square" | "diamond" | "crest" | "hex";
    accentColor: string;
  };
  buffDurationSeconds?: number;
  image?: ImageSourcePropType;
}

export interface CraftRecipeDefinition {
  id: string;
  name: string;
  description: string;
  unlockLevel?: number;
  unlockRank?: AdventurerRank;
  unlockFloorCleared?: number;
  output: {
    itemId: ItemId;
    amount: number;
  };
  ingredients: Array<{
    itemId: ItemId;
    amount: number;
  }>;
}

export interface QuestOutcome {
  questId?: string;
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
  requiredRank?: AdventurerRank;
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
  lore?: string;
  weaknessNotes?: string[];
  weaknessItemIds?: ItemId[];
  mechanics?: string[];
  phaseLabel?: string;
  roleTag?: string;
  loadoutNotes?: string[];
  specialMeter?: TowerEnemySpecialMeterProfile;
  combatStats?: {
    damage: number;
    critChance: number;
    speed: number;
    armor?: number;
  };
  positioning?: TowerEnemyPositioningProfile;
}

export interface FloorIntelDefinition {
  floorNumber: number;
  title: string;
  price: number;
  summary: string;
  reveals: string[];
}

export interface TowerOutcome {
  success: boolean;
  floorNumber: number;
  successChance: number;
  summary: string;
  titleRewardId?: TitleId;
  itemRewards?: Array<{
    itemId: ItemId;
    amount: number;
    guaranteed?: boolean;
  }>;
  healthDelta?: number;
  levelPenaltyApplied?: number;
  emergencyReviveTriggered?: boolean;
  encounterLog?: {
    phase: "normal" | "subBoss" | "boss";
    enemyId?: string;
    enemyName: string;
    enemyIcon: string;
    enemyRole?: "normal" | "subBoss" | "boss";
    enemyLevel?: number;
    enemyHealth?: number;
    turnsToDefeat?: number;
    playerDamagePerTurn?: number;
    damageTaken?: number;
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
  conditionalEncounter?: {
    id: string;
    npcName: string;
    npcTitle: string;
    classId: BaseClassId;
    avatarId: AvatarId;
    contactStyle?: LyraContactStyle;
    triggerPhase: "normal" | "subBoss" | "boss";
    message: string;
    acceptLabel: string;
    declineLabel: string;
    acceptOutcome: string;
    declineOutcome: string;
  };
}

export interface TowerWaveOutcome {
  floorNumber: number;
  wave: TowerWaveKey;
  success: boolean;
  collapsed?: boolean;
  collapseMessage?: string;
  battlePosition?: TowerBattlePosition;
  healthDelta: number;
  countered: number;
  triggered: number;
  summary: string;
  lines: string[];
  enemyBattles?: {
    enemyId?: string;
    enemyName: string;
    enemyIcon: string;
    enemyRole?: "normal" | "subBoss" | "boss";
    enemyLevel: number;
    enemyHealth: number;
    enemyHealthRemaining: number;
    defeated: boolean;
    turnsToDefeat: number;
    playerDamagePerTurn: number;
    damageTaken: number;
    events: {
      mechanic: string;
      counterItemId?: ItemId;
      countered: boolean;
      resultText: string;
      positive: boolean;
      icon: string;
    }[];
  }[];
  statusEffects?: {
    id: string;
    name: string;
    icon: string;
    tone: "good" | "bad" | "neutral";
    detail: string;
    stacks?: number;
    expiresAtMs?: number;
  }[];
  conditionalEncounter?: {
    id: string;
    npcName: string;
    npcTitle: string;
    classId: BaseClassId;
    avatarId: AvatarId;
    contactStyle?: LyraContactStyle;
    triggerPhase: "normal" | "subBoss" | "boss";
    message: string;
    acceptLabel: string;
    declineLabel: string;
    acceptOutcome: string;
    declineOutcome: string;
  };
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
