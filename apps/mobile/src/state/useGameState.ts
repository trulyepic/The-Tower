import { useEffect, useMemo, useState } from "react";
import { ABILITY_BY_ID } from "../data/abilities";
import { BASE_CLASSES } from "../data/classes";
import { CRAFT_RECIPES } from "../data/crafting";
import { INITIAL_DAILIES } from "../data/dailies";
import { FLOOR_ENCOUNTER_EVENTS, INITIAL_RIVAL_CLIMBERS } from "../data/floorStory";
import { getGuildMasterForRank } from "../data/guild";
import { ITEM_BY_ID } from "../data/items";
import { deriveMainQuestTracker } from "../data/mainQuest";
import { QUESTS } from "../data/quests";
import { RANK_UP_TRIALS } from "../data/rankTrials";
import { getMaxRankForLevel, getRankOrderIndex } from "../data/rankProgression";
import { TOWER_FLOORS } from "../data/towerFloors";
import { DEFAULT_AVATAR_BY_CLASS } from "../data/uiSprites";
import { loadPersistedState, savePersistedState } from "../lib/localStateStorage";
import { s3AssetWithFallback } from "../lib/assetSource";
import { applyLevelLoss } from "../lib/progression";
import { getXpToNextLevel } from "../lib/progression";
import { getBuffSlotLimit, pruneExpiredBuffs } from "../lib/buffs";
import { clampAffinity, getChoiceLockedReason } from "../lib/affinity";
import { TITLE_BY_ID } from "../data/titles";
import { getTitleSlotLimit, isTitleUnlocked } from "../lib/titles";
import { getDerivedHealthCap, getDerivedSkillResourceCap, getScaledCoreAttributes } from "../lib/combat";
import {
  FOCUS_REGEN_INTERVAL_MS,
  getAbilityCooldownRemainingSeconds,
  getAvailableWarriorPathChoices,
  getClassAbility,
  getSkillResourceLabel,
  getUnlockedActiveSkills,
  getUnlockedPassiveAbilities,
  isAbilityReady,
} from "../lib/abilities";
import {
  calculateRankUpSuccessChance,
  calculateQuestSuccessChance,
  calculateTowerSuccessChance,
  hasRankUpAccess,
  hasQuestAccess,
  hasTowerAccess,
  mockGameService,
} from "../services/gameService";
import {
  ActiveQuestState,
  AvatarId,
  BaseClassDefinition,
  BaseClassId,
  CharacterState,
  DailyTask,
  ItemId,
  HelpfulNpcAlly,
  MainQuestTracker,
  QuestOutcome,
  QuestDefinition,
  RankUpOutcome,
  RankUpTrialDefinition,
  RescueNpcStatus,
  ThornRunnerIntroductionChoice,
  ClimberEntry,
  FloorEncounterEventDefinition,
  StoryCheckpointTrigger,
  StoryNpcProfile,
  StoryNotification,
  StoryState,
  TowerWaveKey,
  TowerLiveBattleDirective,
  TowerWaveOutcome,
  TowerFloorDefinition,
  TowerOutcome,
} from "../types/game";

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const STAMINA_REGEN_TICK_MS = 30 * 1000;
const NOVICE_EMERGENCY_REVIVE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const RESCUE_QUEST_ID = "quest-aldric-child-rescue";
const LYRA_QUEST_ID = "quest-lyra-ember-maps";
const TAMSIN_QUEST_ID = "quest-tamsin-snagline-recovery";
const TAMSIN_NPC_ID = "npc-tamsin-vale";
const ALDRIC_RESCUE_DURATION_MS = 6 * 60 * 1000;
const FLOOR_INTEL_QUEST_UNLOCKS: Partial<Record<string, number>> = {
  "gather-shrine-wards": 1,
  "gather-briar-resin": 2,
  [TAMSIN_QUEST_ID]: 2,
};
const FLOOR_INTEL_NPC_UNLOCKS: Partial<Record<string, number>> = {
  [LYRA_QUEST_ID]: 1,
};
const LYRA_CONDITIONAL_ENCOUNTER_ID = "tower-floor1-lyra-intercept";
const ALDRIC_NPC_ID = "npc-aldric-vale";
const ALDRIC_ALLY_ID = "ally-aldric-vale";
const MAX_EQUIPPED_PASSIVES = 2;
const TOWER_USABLE_CONSUMABLE_IDS: ItemId[] = ["antitoxin-vial", "guard-tonic", "grounding-tonic"];

const mergeTowerStatusEffects = (
  current: NonNullable<TowerWaveOutcome["statusEffects"]>,
  incoming: NonNullable<TowerWaveOutcome["statusEffects"]>,
): NonNullable<TowerWaveOutcome["statusEffects"]> => {
  const next = new Map(current.map((entry) => [entry.id, entry]));
  for (const effect of incoming) {
    next.set(effect.id, effect);
  }
  return Array.from(next.values());
};

const clearTowerStatusesForConsumable = (
  current: NonNullable<TowerWaveOutcome["statusEffects"]>,
  itemId: ItemId,
): NonNullable<TowerWaveOutcome["statusEffects"]> => {
  if (itemId === "antitoxin-vial") {
    return current.filter((entry) => !entry.id.includes("poison") && !entry.name.toLowerCase().includes("poison"));
  }
  if (itemId === "guard-tonic") {
    return current.filter(
      (entry) =>
        !entry.id.includes("stagger") &&
        !entry.id.includes("overrun") &&
        !entry.id.includes("guard-broken") &&
        !entry.name.toLowerCase().includes("stagger") &&
        !entry.name.toLowerCase().includes("overrun") &&
        !entry.name.toLowerCase().includes("guard broken"),
    );
  }
  if (itemId === "grounding-tonic") {
    return current.filter(
      (entry) =>
        !entry.id.includes("shock") &&
        !entry.id.includes("overcharged") &&
        !entry.name.toLowerCase().includes("shock") &&
        !entry.name.toLowerCase().includes("overcharged"),
    );
  }
  return current;
};

const DEFAULT_STORY_STATE: StoryState = {
  questBoardPreviewEnabled: false,
  rescueNpcStatus: "locked",
  rescueNpcUnreadCount: 0,
  aldricRescueDeadlineAtMs: undefined,
  aldricQuestPath: "none",
  aldricDarkPathStarted: false,
  aldricOccasionalAidUnlocked: false,
  aldricFloor30Pending: false,
  thornRunnerQuestStatus: "locked",
  thornRunnerIntroductionChoice: undefined,
  thornRunnerFollowupReviewed: undefined,
  npcDispositionById: {},
  npcInteractionCountById: {},
  lyraMet: false,
  lyraTrust: 0,
  lyraHelpAccepted: 0,
  lyraHelpDeclined: 0,
  lyraQuestStatus: "locked",
  lyraQuestResolution: "none",
  lyraFirstContactStyle: undefined,
  lyraAshDebt: false,
  mainQuestStageId: "mq-guild-banner",
  mainQuestLog: [],
  mainQuestUnreadCount: 0,
  warriorPathGuideNoticeShown: false,
  climberRivals: INITIAL_RIVAL_CLIMBERS,
  lastLeaderboardRank: undefined,
  floorAttemptByNumber: {},
  floorEncounterProgressById: {},
  floorEncounterDecisionByAttempt: {},
  activeFloorEncounterBonus: null,
  encounteredNpcProfiles: [],
  nextStoryNpcSequence: 100,
};

const ALDRIC_ALLY_TEMPLATE = {
  id: ALDRIC_ALLY_ID,
  name: "Aldric Vale",
  title: "Oathbound Vanguard",
  classId: "warrior" as const,
  avatarId: "warrior-3" as const,
  avatarOverride: s3AssetWithFallback(
    "game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00062.png",
    require("../../assets/game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00062.png"),
  ),
  skillName: "Guardian Oath",
  skillSummary: "Floor 10 main boss mechanics: grants a major success boost and hazard mitigation (future).",
};

const getAldricAllyLevel = (playerLevel: number): number => Math.max(5, 5 + Math.max(0, playerLevel - 2) * 5);

const RESCUE_REWARD_WEAPON_BY_CLASS: Record<BaseClassId, ItemId> = {
  warrior: "weapon-warrior-emberblade",
  ranger: "weapon-ranger-dawnhunt-spear",
  mage: "weapon-mage-veilbloom-staff",
};
const DOWNSTATE_HP = 1;

const LYRA_PROFILE_BASE = {
  id: LYRA_CONDITIONAL_ENCOUNTER_ID,
  name: "Lyra Ashstep",
  title: "Ember Scout",
  role: "Ash-Route Scout",
  level: 3,
  floorReached: 1,
  avatarId: "ranger-3" as const,
  classId: "ranger" as const,
  licenseLabel: "Field Scout License",
  authBody: "Adventurers Guild • Unofficial Tower Field Log",
  signature: "L.A.",
  summary: "A lower-floor scout who appears only when the tower's ash lanes start drawing blood.",
};

const ALDRIC_PROFILE_BASE = {
  id: ALDRIC_NPC_ID,
  name: "Aldric Vale",
  title: "Desperate Father",
  role: "Guild Petitioning Adventurer",
  level: 5,
  floorReached: 0,
  avatarId: "warrior-3" as const,
  classId: "warrior" as const,
  licenseLabel: "Adventurer License",
  authBody: "Adventurers Guild • Petitioning Member",
  signature: "A. Vale",
  summary: "A father asking the guild for help after his daughter was taken by bandits beyond the safe roads.",
};

const TAMSIN_PROFILE_BASE = {
  id: TAMSIN_NPC_ID,
  name: "Tamsin Vale",
  title: "Thorn Runner",
  role: "Corridor Salvage Scout",
  level: 6,
  floorReached: 2,
  avatarId: "ranger-2" as const,
  classId: "ranger" as const,
  licenseLabel: "Field Runner License",
  authBody: "Adventurers Guild • Thorn Corridor Survey Desk",
  signature: "T. Vale",
  summary: "A corridor runner who retrieves trapped satchels, snapped route-lines, and whatever panic leaves behind in thorn lanes.",
};

const getFloorAttemptNumber = (floorNumber: number, story: StoryState): number =>
  (story.floorAttemptByNumber[String(floorNumber)] ?? 0) + 1;

const getFloorEncounterDecisionKey = (encounterId: string, attemptNumber: number): string =>
  `${encounterId}:${attemptNumber}`;

const getAvailableFloorEncounter = (
  floorNumber: number,
  story: StoryState,
): { encounter: FloorEncounterEventDefinition; attemptNumber: number } | null => {
  const encounter = FLOOR_ENCOUNTER_EVENTS.find((entry) => entry.floorNumber === floorNumber);
  if (!encounter) {
    return null;
  }
  const attemptNumber = getFloorAttemptNumber(floorNumber, story);
  if (attemptNumber < encounter.firstAttempt) {
    return null;
  }
  const cycleOffset = attemptNumber - encounter.firstAttempt;
  if (cycleOffset % Math.max(1, encounter.recurrenceEveryAttempts) !== 0) {
    return null;
  }
  return { encounter, attemptNumber };
};

const updateRivalClimbersByTrigger = (
  currentRivals: ClimberEntry[],
  trigger: StoryCheckpointTrigger,
): ClimberEntry[] => {
  return currentRivals.map((rival) => {
    const floorGainChance =
      trigger === "tower_clear" ? 0.7 : trigger === "quest_clear" ? 0.45 : 0.35;
    const levelGainChance =
      trigger === "tower_clear" ? 0.55 : trigger === "quest_clear" ? 0.3 : 0.7;
    const floorJump = Math.random() < floorGainChance ? (Math.random() < 0.2 ? 2 : 1) : 0;
    const levelGain = Math.random() < levelGainChance ? 1 : 0;
    const nextFloor = Math.max(1, Math.min(50, rival.floor + floorJump));
    const nextLevel = Math.max(1, Math.min(100, rival.level + levelGain));
    return {
      ...rival,
      floor: nextFloor,
      level: nextLevel,
      trend: nextFloor > rival.floor ? "up" : nextFloor < rival.floor ? "down" : "steady",
    };
  });
};

const upsertEncounteredStoryNpc = (
  story: StoryState,
  profile: Omit<StoryNpcProfile, "sequenceId" | "department"> & { sequenceId?: number },
): Pick<StoryState, "encounteredNpcProfiles" | "nextStoryNpcSequence"> => {
  const existingIndex = story.encounteredNpcProfiles.findIndex((entry) => entry.id === profile.id);
  if (existingIndex >= 0) {
    const nextProfiles = [...story.encounteredNpcProfiles];
    nextProfiles[existingIndex] = {
      ...nextProfiles[existingIndex],
      ...profile,
      department: "story",
      sequenceId: nextProfiles[existingIndex].sequenceId,
    };
    return {
      encounteredNpcProfiles: nextProfiles,
      nextStoryNpcSequence: story.nextStoryNpcSequence,
    };
  }
  const nextSequence = profile.sequenceId ?? story.nextStoryNpcSequence;
  return {
    encounteredNpcProfiles: [
      ...story.encounteredNpcProfiles,
      {
        ...profile,
        sequenceId: nextSequence,
        department: "story",
      },
    ],
    nextStoryNpcSequence: Math.max(story.nextStoryNpcSequence, nextSequence + 1),
  };
};

const applyStaminaRegen = (character: CharacterState, nowMs: number): CharacterState => {
  if (character.stamina >= character.staminaCap) {
    if (character.staminaLastTickAtMs === nowMs) {
      return character;
    }
    return { ...character, staminaLastTickAtMs: nowMs };
  }

  const elapsed = nowMs - character.staminaLastTickAtMs;
  if (elapsed < STAMINA_REGEN_INTERVAL_MS) {
    return character;
  }

  const recovered = Math.floor(elapsed / STAMINA_REGEN_INTERVAL_MS);
  if (recovered <= 0) {
    return character;
  }

  const nextStamina = Math.min(character.staminaCap, character.stamina + recovered);
  return {
    ...character,
    stamina: nextStamina,
    staminaLastTickAtMs: character.staminaLastTickAtMs + recovered * STAMINA_REGEN_INTERVAL_MS,
  };
};

const applyTimedState = (character: CharacterState, nowMs: number): CharacterState =>
  applyDerivedVitals(pruneExpiredBuffs(applyFocusRegen(applyStaminaRegen(character, nowMs), nowMs), nowMs));

const applyDerivedVitals = (character: CharacterState): CharacterState => {
  const nextHealthCap = getDerivedHealthCap(character);
  const nextFocusCap = getDerivedSkillResourceCap(character);
  if (
    character.healthCap === nextHealthCap &&
    character.focusCap === nextFocusCap &&
    character.health >= 0 &&
    character.focus >= 0
  ) {
    return character;
  }
  return {
    ...character,
    healthCap: nextHealthCap,
    health: Math.max(0, character.health),
    focusCap: nextFocusCap,
    focus: Math.max(0, character.focus),
  };
};

const applyFocusRegen = (character: CharacterState, nowMs: number): CharacterState => {
  if (character.focus >= character.focusCap) {
    if (character.focusLastTickAtMs === nowMs) {
      return character;
    }
    return { ...character, focusLastTickAtMs: nowMs };
  }

  const elapsed = nowMs - character.focusLastTickAtMs;
  if (elapsed < FOCUS_REGEN_INTERVAL_MS) {
    return character;
  }

  const recovered = Math.floor(elapsed / FOCUS_REGEN_INTERVAL_MS);
  if (recovered <= 0) {
    return character;
  }

  const nextFocus = Math.min(character.focusCap, character.focus + recovered);
  return {
    ...character,
    focus: nextFocus,
    focusLastTickAtMs: character.focusLastTickAtMs + recovered * FOCUS_REGEN_INTERVAL_MS,
  };
};

const normalizeTitleLoadout = (character: CharacterState): CharacterState => {
  const discovered = character.discoveredTitleIds ?? [];
  const progress = { ...(character.titleProgressById ?? {}) };
  const owned = character.ownedTitleIds ?? [];
  const normalizedOwned = owned.filter((titleId) => {
    const title = TITLE_BY_ID[titleId];
    return Boolean(title && isTitleUnlocked(character, title));
  });
  for (const ownedTitleId of normalizedOwned) {
    const title = TITLE_BY_ID[ownedTitleId];
    if (!title) {
      continue;
    }
    const required = title.unlockRequirement?.requiredCount ?? 1;
    progress[ownedTitleId] = Math.max(progress[ownedTitleId] ?? 0, required);
  }
  const available = (character.equippedTitleIds ?? []).filter((titleId) => {
    const title = TITLE_BY_ID[titleId];
    const titleOwned = normalizedOwned.includes(titleId);
    return Boolean(title && titleOwned && isTitleUnlocked(character, title));
  });
  const slotLimit = getTitleSlotLimit(character.progression.level);
  const truncated = available.slice(0, slotLimit);
  return {
    ...character,
    ownedTitleIds: normalizedOwned,
    discoveredTitleIds: discovered,
    titleProgressById: progress,
    equippedTitleIds: truncated,
  };
};

const normalizeAbilityLoadout = (character: CharacterState): CharacterState => {
  const unlockedSkills = getUnlockedActiveSkills(character);
  const unlockedPassives = new Set(getUnlockedPassiveAbilities(character).map((ability) => ability.id));
  const pendingAbilityIds = Array.from(
    new Set(character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : [])),
  ).filter((abilityId) => unlockedSkills.some((ability) => ability.id === abilityId));
  const pendingAbilityId = pendingAbilityIds[0] ?? null;
  const activeClassSkillId =
    character.activeClassSkillId && unlockedSkills.some((ability) => ability.id === character.activeClassSkillId)
      ? character.activeClassSkillId
      : unlockedSkills[0]?.id ?? null;
  const equippedPassives = (character.equippedPassiveAbilityIds ?? [])
    .filter((abilityId) => unlockedPassives.has(abilityId))
    .slice(0, MAX_EQUIPPED_PASSIVES);
  return {
    ...character,
    warriorPathChoice: character.warriorPathChoice ?? null,
    pendingAbilityId,
    pendingAbilityIds,
    activeClassSkillId,
    equippedPassiveAbilityIds: equippedPassives,
  };
};

const normalizeRankForLevel = (character: CharacterState): CharacterState => {
  const level = character.progression?.level ?? 1;
  const maxRankForLevel = getMaxRankForLevel(level);
  const currentRank = character.adventurerRank ?? "F";

  // Migration guard:
  // - do not auto-promote rank by level (rank-ups require trials),
  // - only downgrade impossible legacy ranks for current level.
  if (getRankOrderIndex(currentRank) <= getRankOrderIndex(maxRankForLevel)) {
    return character;
  }
  return {
    ...character,
    adventurerRank: maxRankForLevel,
  };
};

const normalizeAffinity = (character: CharacterState): CharacterState => ({
  ...character,
  affinity: clampAffinity(character.affinity ?? 0),
});

const applyAffinityDelta = (character: CharacterState, delta: number): CharacterState => ({
  ...character,
  affinity: clampAffinity((character.affinity ?? 0) + delta),
});

const normalizeKnownTowerIntel = (character: CharacterState): CharacterState => ({
  ...character,
  knownTowerEnemyIds: Array.from(new Set(character.knownTowerEnemyIds ?? [])),
});

const normalizeAppraisedItems = (character: CharacterState): CharacterState => ({
  ...character,
  appraisedItemIds: Array.from(new Set(character.appraisedItemIds ?? [])),
  purchasedFloorIntelNumbers: Array.from(new Set(character.purchasedFloorIntelNumbers ?? [])),
});

const normalizeCharacterState = (character: CharacterState): CharacterState =>
  normalizeAppraisedItems(
    normalizeKnownTowerIntel(
    normalizeAffinity(normalizeAbilityLoadout(normalizeTitleLoadout(normalizeRankForLevel(applyDerivedVitals(character))))),
    ),
  );

export interface GameState {
  classes: BaseClassDefinition[];
  quests: QuestDefinition[];
  towerFloors: TowerFloorDefinition[];
  dailies: DailyTask[];
  character: CharacterState | null;
  selectedClass: BaseClassId | null;
  activeQuest: ActiveQuestState | null;
  lastQuestOutcome: QuestOutcome | null;
  completedQuestCount: number;
  lastTowerOutcome: TowerOutcome | null;
  lastTowerWaveOutcome: TowerWaveOutcome | null;
  towerStatusEffects: NonNullable<TowerWaveOutcome["statusEffects"]>;
  towerPreparedItemIds: ItemId[];
  lastRankUpOutcome: RankUpOutcome | null;
  levelUpEvent: {
    fromLevel: number;
    toLevel: number;
    attributeDelta: {
      strength: number;
      agility: number;
      intelligence: number;
      vitality: number;
    };
  } | null;
  levelDownEvent: {
    fromLevel: number;
    toLevel: number;
    attributeLoss: {
      strength: number;
      agility: number;
      intelligence: number;
      vitality: number;
    };
    reason: string;
  } | null;
  storyState: StoryState;
  mainQuestTracker: MainQuestTracker | null;
  storyNotification: StoryNotification | null;
  encounteredNpcProfiles: StoryNpcProfile[];
  climberLeaderboard: Array<ClimberEntry & { isPlayer?: boolean; rank: number }>;
  activeFloorEncounter:
    | { encounter: FloorEncounterEventDefinition; attemptNumber: number; decision?: "accepted" | "declined" }
    | null;
  helpfulAllies: HelpfulNpcAlly[];
  isHydrated: boolean;
  currentGuildMasterName: string;
  canClaimQuest: boolean;
  chooseClass: (classId: BaseClassId) => void;
  createCharacter: (name: string, avatarId: AvatarId) => void;
  chooseWarriorPath: (path: "knight" | "berserker") => { ok: boolean; reason?: string };
  setActiveClassSkill: (abilityId: ItemId) => { ok: boolean; reason?: string };
  togglePassiveAbility: (abilityId: ItemId) => { ok: boolean; reason?: string };
  resetGame: () => void;
  resetTowerProgress: () => void;
  devIncreaseLevel: () => { ok: boolean; reason?: string };
  devRestoreAdventurer: () => { ok: boolean; reason?: string };
  devFractureAdventurer: () => { ok: boolean; reason?: string };
  devAdvanceTowerFloor: () => { ok: boolean; reason?: string };
  devResetAppraisals: () => { ok: boolean; reason?: string };
  devTriggerLyraQuest: () => { ok: boolean; reason?: string };
  devTriggerAldricQuest: () => { ok: boolean; reason?: string };
  devTriggerTamsinQuest: () => { ok: boolean; reason?: string };
  devSetAldricOutcome: (path: "saved" | "too_late") => { ok: boolean; reason?: string };
  devSetAffinity: (value: number) => { ok: boolean; reason?: string };
  devSetupWarriorBattlePreset: (preset: "shared" | "knight" | "berserker") => { ok: boolean; reason?: string };
  devPreviewQuestBoardContracts: () => { ok: boolean; reason?: string };
  getQuestSuccessChance: (questId: string, committedItems?: Record<ItemId, number>) => number;
  getQuestAccess: (questId: string) => { allowed: boolean; reason?: string };
  getTowerSuccessChance: (floorNumber: number, committedItems?: Record<ItemId, number>) => number;
  getTowerAccess: (floorNumber: number) => { allowed: boolean; reason?: string };
  getNextRankTrial: () => RankUpTrialDefinition | null;
  getRankTrialAccess: () => { allowed: boolean; reason?: string };
  getRankTrialSuccessChance: (committedItems?: Record<ItemId, number>) => number;
  buyGuildItem: (
    itemId: ItemId,
    unitPrice: number,
    amount?: number,
    classRestriction?: BaseClassId,
  ) => { ok: boolean; reason?: string };
  sellGuildItem: (itemId: ItemId, unitPrice: number, amount?: number) => { ok: boolean; reason?: string };
  craftRecipe: (recipeId: string) => { ok: boolean; reason?: string };
  appraiseItem: (itemId: ItemId) => { ok: boolean; reason?: string };
  buyFloorIntel: (floorNumber: number, price: number) => { ok: boolean; reason?: string };
  requestGuildMageRecovery: () => { ok: boolean; reason?: string };
  equipWeapon: (itemId: ItemId) => { ok: boolean; reason?: string };
  unequipWeapon: () => { ok: boolean; reason?: string };
  equipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  unequipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  equipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  unequipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  activateBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  deactivateBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  activateClassAbility: (abilityId?: ItemId) => { ok: boolean; reason?: string };
  deactivateClassAbility: (abilityId?: ItemId) => { ok: boolean; reason?: string };
  useSkillResourceItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  useHealthRecoveryItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  useTowerConsumableItem: (itemId: ItemId) => { ok: boolean; reason?: string };
  startQuest: (questId: string, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  claimQuest: (forcedSuccess?: boolean, summaryOverride?: string) => { ok: boolean; reason?: string };
  resolveLyraQuestChoice: (choice: "returned" | "kept" | "reported") => { ok: boolean; reason?: string };
  conquerTowerFloor: (floorNumber: number, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  resolveTowerWave: (
    floorNumber: number,
    wave: TowerWaveKey,
    committedItems?: Record<ItemId, number>,
    liveBattle?: TowerLiveBattleDirective,
  ) => { ok: boolean; reason?: string; outcome?: TowerWaveOutcome };
  finalizeTowerFloor: (floorNumber: number) => { ok: boolean; reason?: string };
  attemptRankUp: (committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  clearLevelUpEvent: () => void;
  clearLevelDownEvent: () => void;
  dismissStoryNotification: () => void;
  markMainQuestViewed: () => void;
  recordNpcInteraction: (npcId: string, dispositionDelta?: number, interactionDelta?: number) => void;
  markNpcTabOpened: () => void;
  respondRescueNpcRequest: (accept: boolean) => { ok: boolean; reason?: string; status?: RescueNpcStatus };
  respondThornRunnerIntroduction: (
    choice: ThornRunnerIntroductionChoice,
  ) => { ok: boolean; reason?: string; choice?: ThornRunnerIntroductionChoice };
  acknowledgeThornRunnerFollowup: () => { ok: boolean; reason?: string };
  respondFloorEncounter: (
    floorNumber: number,
    encounterId: string,
    accept: boolean,
  ) => { ok: boolean; reason?: string };
  respondTowerConditionalEncounter: (
    encounterId: string,
    accept: boolean,
    contactStyle?: "rescued" | "disciplined",
  ) => { ok: boolean; reason?: string };
}

export const useGameState = (): GameState => {
  const [classSequenceByClass, setClassSequenceByClass] = useState<Record<BaseClassId, number>>({
    warrior: 0,
    ranger: 0,
    mage: 0,
  });
  const [selectedClass, setSelectedClass] = useState<BaseClassId | null>(null);
  const [character, setCharacter] = useState<CharacterState | null>(null);
  const [activeQuest, setActiveQuest] = useState<ActiveQuestState | null>(null);
  const [lastQuestOutcome, setLastQuestOutcome] = useState<QuestOutcome | null>(null);
  const [dailies, setDailies] = useState<DailyTask[]>(INITIAL_DAILIES);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [lastTowerOutcome, setLastTowerOutcome] = useState<TowerOutcome | null>(null);
  const [lastTowerWaveOutcome, setLastTowerWaveOutcome] = useState<TowerWaveOutcome | null>(null);
  const [towerStatusEffects, setTowerStatusEffects] = useState<NonNullable<TowerWaveOutcome["statusEffects"]>>([]);
  const [towerPreparedItemIds, setTowerPreparedItemIds] = useState<ItemId[]>([]);
  const [lastRankUpOutcome, setLastRankUpOutcome] = useState<RankUpOutcome | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<GameState["levelUpEvent"]>(null);
  const [levelDownEvent, setLevelDownEvent] = useState<GameState["levelDownEvent"]>(null);
  const [storyState, setStoryState] = useState<StoryState>(DEFAULT_STORY_STATE);
  const [storyNotification, setStoryNotification] = useState<StoryNotification | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const currentGuildMaster = getGuildMasterForRank(character?.adventurerRank);
  const mainQuestTracker = useMemo(
    () =>
      character
        ? deriveMainQuestTracker({
            character,
            completedQuestCount,
            storyState,
          })
        : null,
    [character, completedQuestCount, storyState],
  );

  const captureLevelUpEvent = (previous: CharacterState | null, next: CharacterState | null) => {
    if (!previous || !next) {
      return;
    }
    if (next.progression.level <= previous.progression.level) {
      return;
    }
    const before = getScaledCoreAttributes(previous);
    const after = getScaledCoreAttributes(next);
    setLevelUpEvent({
      fromLevel: previous.progression.level,
      toLevel: next.progression.level,
      attributeDelta: {
        strength: after.strength - before.strength,
        agility: after.agility - before.agility,
        intelligence: after.intelligence - before.intelligence,
        vitality: after.vitality - before.vitality,
      },
    });
    applyClimberCheckpointUpdate("level_up", next);
  };
  const captureLevelDownEvent = (previous: CharacterState | null, next: CharacterState | null, reason: string) => {
    if (!previous || !next) {
      return;
    }
    if (next.progression.level >= previous.progression.level) {
      return;
    }
    const before = getScaledCoreAttributes(previous);
    const after = getScaledCoreAttributes(next);
    setLevelDownEvent({
      fromLevel: previous.progression.level,
      toLevel: next.progression.level,
      attributeLoss: {
        strength: Math.max(0, before.strength - after.strength),
        agility: Math.max(0, before.agility - after.agility),
        intelligence: Math.max(0, before.intelligence - after.intelligence),
        vitality: Math.max(0, before.vitality - after.vitality),
      },
      reason,
    });
  };

  const applyClimberCheckpointUpdate = (
    trigger: StoryCheckpointTrigger,
    nextCharacter: CharacterState,
  ) => {
    let summary = "";
    let shouldNotify = false;
    setStoryState((current) => {
      const nextRivals = updateRivalClimbersByTrigger(current.climberRivals, trigger);
      const leaderboard = [
        ...nextRivals.map((entry) => ({ ...entry, isPlayer: false })),
        {
          id: "player",
          name: nextCharacter.name,
          classId: nextCharacter.classId,
          avatarId: nextCharacter.avatarId,
          level: nextCharacter.progression.level,
          floor: nextCharacter.towerProgress?.highestFloorCleared ?? 0,
          trend: "steady" as const,
          isPlayer: true,
        },
      ].sort((a, b) => {
        if (b.floor !== a.floor) {
          return b.floor - a.floor;
        }
        if (b.level !== a.level) {
          return b.level - a.level;
        }
        return a.name.localeCompare(b.name);
      });
      const nextRank = leaderboard.findIndex((entry) => entry.isPlayer) + 1;
      const previousRank = current.lastLeaderboardRank ?? nextRank;
      const movedUp = nextRank < previousRank;
      const movedDown = nextRank > previousRank;
      if (movedUp) {
        summary = `Leaderboard updated: you climbed to #${nextRank}.`;
        shouldNotify = true;
      } else if (movedDown) {
        summary = `Leaderboard updated: you slipped to #${nextRank}.`;
        shouldNotify = true;
      }
      return {
        ...current,
        climberRivals: nextRivals,
        lastLeaderboardRank: nextRank,
      };
    });
    if (shouldNotify) {
      setStoryNotification({
        id: `climber-${trigger}-${Date.now()}`,
        title: "Climber Board Update",
        message: summary,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const state = await loadPersistedState();
      if (!mounted) {
        return;
      }

      if (state) {
        const normalizedCharacter = state.character
          ? {
              ...state.character,
              adventurerRank: state.character.adventurerRank ?? "F",
              classSequence: state.character.classSequence ?? 1,
              avatarId: state.character.avatarId ?? DEFAULT_AVATAR_BY_CLASS[state.character.classId],
              equippedWeaponId: state.character.equippedWeaponId ?? null,
              ownedTitleIds: state.character.ownedTitleIds ?? [],
              discoveredTitleIds: state.character.discoveredTitleIds ?? state.character.ownedTitleIds ?? [],
              titleProgressById: state.character.titleProgressById ?? {},
              equippedBuffIds: state.character.equippedBuffIds ?? [],
              equippedTitleIds: state.character.equippedTitleIds ?? [],
              activeBuffExpiresAtMs:
                state.character.activeBuffExpiresAtMs ??
                // Backward compatibility for previous field name.
                (state.character as CharacterState & { equippedBuffExpiresAtMs?: Record<string, number> })
                  .equippedBuffExpiresAtMs ??
                {},
              pausedBuffRemainingMs: state.character.pausedBuffRemainingMs ?? {},
              inventory: state.character.inventory ?? {},
              knownTowerEnemyIds: state.character.knownTowerEnemyIds ?? [],
              towerProgress: state.character.towerProgress ?? { highestFloorCleared: 0 },
              health: state.character.health ?? 100,
              healthCap: state.character.healthCap ?? 100,
              staminaLastTickAtMs: state.character.staminaLastTickAtMs ?? Date.now(),
              focus: state.character.focus ?? 12,
              focusCap: state.character.focusCap ?? 12,
              focusLastTickAtMs: state.character.focusLastTickAtMs ?? Date.now(),
              noviceEmergencyReviveAvailableAtMs: state.character.noviceEmergencyReviveAvailableAtMs ?? 0,
              pendingAbilityId: state.character.pendingAbilityId ?? null,
              pendingAbilityIds:
                state.character.pendingAbilityIds ??
                (state.character.pendingAbilityId ? [state.character.pendingAbilityId] : []),
              abilityCooldownsUntilMs: state.character.abilityCooldownsUntilMs ?? {},
              alliedNpcIds: state.character.alliedNpcIds ?? [],
              warriorPathChoice: state.character.warriorPathChoice ?? null,
              activeClassSkillId: state.character.activeClassSkillId ?? null,
              equippedPassiveAbilityIds: state.character.equippedPassiveAbilityIds ?? [],
            }
          : state.character;
        const hydratedCharacter = normalizedCharacter
          ? normalizeCharacterState(applyTimedState(normalizedCharacter, Date.now()))
          : normalizedCharacter;
        const normalizedActiveQuest =
          state.activeQuest &&
          typeof state.activeQuest.successChanceAtStart !== "number" &&
          hydratedCharacter
            ? {
                ...state.activeQuest,
                successChanceAtStart: calculateQuestSuccessChance(
                  hydratedCharacter,
                  QUESTS.find((quest) => quest.id === state.activeQuest?.questId) ?? QUESTS[0],
                ),
              }
            : state.activeQuest;

        setSelectedClass(state.selectedClass);
        setClassSequenceByClass(
          state.classSequenceByClass ?? {
            warrior: state.character?.classId === "warrior" ? state.character.classSequence ?? 1 : 0,
            ranger: state.character?.classId === "ranger" ? state.character.classSequence ?? 1 : 0,
            mage: state.character?.classId === "mage" ? state.character.classSequence ?? 1 : 0,
          },
        );
        setCharacter(hydratedCharacter);
        setActiveQuest(normalizedActiveQuest);
        setDailies(state.dailies);
        setCompletedQuestCount(state.completedQuestCount);
        setStoryState({
          ...DEFAULT_STORY_STATE,
          ...(state.storyState ?? {}),
        });
      }

      setIsHydrated(true);
    };

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !character ||
      storyState.rescueNpcStatus !== "accepted" ||
      !storyState.aldricRescueDeadlineAtMs ||
      activeQuest?.questId === RESCUE_QUEST_ID
    ) {
      return;
    }

    const nowMs = Date.now();
    const remainingMs = storyState.aldricRescueDeadlineAtMs - nowMs;

    const expireAldricWindow = () => {
      setStoryState((current) => {
        if (
          current.rescueNpcStatus !== "accepted" ||
          !current.aldricRescueDeadlineAtMs ||
          current.aldricRescueDeadlineAtMs > Date.now()
        ) {
          return current;
        }
        const upserted = upsertEncounteredStoryNpc(current, {
          ...ALDRIC_PROFILE_BASE,
          summary:
            "Aldric accepted that you meant to help, but the delay still cost his daughter her life. Grief has started bending him toward darker answers.",
        });
        return {
          ...current,
          ...upserted,
          rescueNpcStatus: "gone",
          rescueNpcUnreadCount: 0,
          aldricRescueDeadlineAtMs: undefined,
          aldricQuestPath: "too_late",
          aldricDarkPathStarted: true,
          aldricOccasionalAidUnlocked: true,
          aldricFloor30Pending: true,
          npcDispositionById: {
            ...current.npcDispositionById,
            [ALDRIC_NPC_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) - 8)),
          },
          npcInteractionCountById: {
            ...current.npcInteractionCountById,
            [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
          },
        };
      });
      setStoryNotification({
        id: "aldric-too-late-deadline",
        title: "Too Late For Watchtrail",
        message:
          "Aldric waited as long as he could. The rescue window closed, his daughter is dead, and grief has started dragging him toward darker company.",
        variant: "guild",
      });
    };

    if (remainingMs <= 0) {
      expireAldricWindow();
      return;
    }

    const timer = setTimeout(expireAldricWindow, remainingMs + 20);
    return () => clearTimeout(timer);
  }, [character, storyState.rescueNpcStatus, storyState.aldricRescueDeadlineAtMs, activeQuest?.questId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void savePersistedState({
      selectedClass,
      character,
      classSequenceByClass,
      activeQuest,
      dailies,
      completedQuestCount,
      storyState,
    });
  }, [selectedClass, character, classSequenceByClass, activeQuest, dailies, completedQuestCount, storyState, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !character) {
      return;
    }
    if (character.progression.level < 2 || storyState.rescueNpcStatus !== "locked") {
      return;
    }

    setStoryState((current) => ({
      ...current,
      rescueNpcStatus: "available",
      rescueNpcUnreadCount: 1,
    }));
    setStoryNotification({
      id: "npc-rescue-intro",
      title: "Guild Notice",
      message: "A distressed adventurer is waiting in the NPC hall. He urgently wants to speak with you.",
    });
  }, [isHydrated, character, storyState.rescueNpcStatus]);

  useEffect(() => {
    if (!isHydrated || !character || character.classId !== "warrior") {
      return;
    }
    if (character.progression.level < 15 || storyState.warriorPathGuideNoticeShown) {
      return;
    }
    setStoryState((current) => ({
      ...current,
      warriorPathGuideNoticeShown: true,
      rescueNpcUnreadCount: Math.max(1, current.rescueNpcUnreadCount),
    }));
    setStoryNotification({
      id: "warrior-path-guide",
      title: "Guild Notice",
      message:
        "Level 15 reached. A guild NPC will soon guide your final Knight/Berserker specialization trial.",
    });
  }, [isHydrated, character, storyState.warriorPathGuideNoticeShown]);

  useEffect(() => {
    if (!isHydrated || !character) {
      return;
    }
    if (!storyState.lyraMet || storyState.lyraQuestStatus !== "locked") {
      return;
    }
    if (storyState.lyraHelpAccepted > 0 || storyState.lyraHelpDeclined < 1) {
      return;
    }
    if (completedQuestCount < 2) {
      return;
    }

    setStoryState((current) => ({
      ...current,
      lyraQuestStatus: "available",
      lyraQuestResolution: "none",
      lyraTrust: Math.max(current.lyraTrust, 1),
      npcDispositionById: {
        ...current.npcDispositionById,
        [LYRA_CONDITIONAL_ENCOUNTER_ID]: Math.max(
          0,
          Math.min(100, (current.npcDispositionById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 34) + 8),
        ),
      },
      npcInteractionCountById: {
        ...current.npcInteractionCountById,
        [LYRA_CONDITIONAL_ENCOUNTER_ID]: (current.npcInteractionCountById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 0) + 1,
      },
    }));
    setStoryNotification((current) =>
      current?.id === "lyra-quest-reconcile"
        ? current
        : {
            id: "lyra-quest-reconcile",
            title: "Ash Marks Reappear",
            message:
              "Though you refused her once, Lyra has left another quiet posting. Your recent work proved you may still be worth trusting.",
            variant: "guild",
          },
    );
  }, [
    isHydrated,
    character,
    completedQuestCount,
    storyState.lyraMet,
    storyState.lyraQuestStatus,
    storyState.lyraHelpAccepted,
    storyState.lyraHelpDeclined,
  ]);

  useEffect(() => {
    if (!isHydrated || !character || !mainQuestTracker) {
      return;
    }
    if (storyState.mainQuestStageId === mainQuestTracker.stageId && storyState.mainQuestLog.length > 0) {
      return;
    }

    const logEntry = {
      id: `main-quest-${mainQuestTracker.stageId}`,
      stageId: mainQuestTracker.stageId,
      chapter: mainQuestTracker.chapter,
      title: mainQuestTracker.title,
      message: mainQuestTracker.currentDirective,
      icon: mainQuestTracker.icon,
      loggedAtMs: Date.now(),
    };

    setStoryState((current) => {
      if (current.mainQuestStageId === mainQuestTracker.stageId && current.mainQuestLog.length > 0) {
        return current;
      }
      return {
        ...current,
        mainQuestStageId: mainQuestTracker.stageId,
        mainQuestLog: [logEntry, ...current.mainQuestLog.filter((entry) => entry.stageId !== mainQuestTracker.stageId)].slice(0, 12),
        mainQuestUnreadCount: current.mainQuestUnreadCount + 1,
      };
    });

    setStoryNotification((current) =>
      current
        ? current
        : {
            id: `main-quest-notice-${mainQuestTracker.stageId}`,
            title: mainQuestTracker.notificationTitle,
            message: mainQuestTracker.notificationMessage,
            variant: "main-quest",
          },
    );
  }, [isHydrated, character, mainQuestTracker, storyState.mainQuestLog.length, storyState.mainQuestStageId]);

  useEffect(() => {
    if (!isHydrated || !character) {
      return;
    }
    if (storyState.thornRunnerQuestStatus !== "locked") {
      return;
    }
    if (character.adventurerRank === "F" || character.progression.level < 5) {
      return;
    }

    setStoryState((current) => {
      if (current.thornRunnerQuestStatus !== "locked") {
        return current;
      }
      const upserted = upsertEncounteredStoryNpc(current, TAMSIN_PROFILE_BASE);
      return {
        ...current,
        ...upserted,
        thornRunnerQuestStatus: "available",
        thornRunnerFollowupReviewed: undefined,
        npcDispositionById: {
          ...current.npcDispositionById,
          [TAMSIN_NPC_ID]: Math.max(0, Math.min(100, current.npcDispositionById[TAMSIN_NPC_ID] ?? 52)),
        },
      };
    });
    setStoryNotification((current) =>
      current?.id === "tamsin-thorn-runner"
        ? current
        : {
            id: "tamsin-thorn-runner",
            title: "Runner's Notice",
            message:
              "Tamsin Vale, a Thorn Runner, has posted a recovery contract to the quest board. She says Thorn Corridor punishes anyone who mistakes snare work for brute force.",
            variant: "guild",
          },
    );
  }, [isHydrated, character, storyState.thornRunnerQuestStatus]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timer = setInterval(() => {
      setCharacter((current) =>
        current ? normalizeCharacterState(applyTimedState(current, Date.now())) : current,
      );
    }, STAMINA_REGEN_TICK_MS);

    return () => clearInterval(timer);
  }, [isHydrated]);

  const chooseClass = (classId: BaseClassId) => setSelectedClass(classId);

  const resetGame = () => {
    setSelectedClass(null);
    setCharacter(null);
    setActiveQuest(null);
    setLastQuestOutcome(null);
    setLastTowerOutcome(null);
    setLastTowerWaveOutcome(null);
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    setLastRankUpOutcome(null);
    setLevelUpEvent(null);
    setLevelDownEvent(null);
    setStoryState(DEFAULT_STORY_STATE);
    setStoryNotification(null);
    setDailies(INITIAL_DAILIES);
    setCompletedQuestCount(0);
    setClassSequenceByClass({ warrior: 0, ranger: 0, mage: 0 });
  };

  const resetTowerProgress = () => {
    setCharacter((current) =>
      current ? normalizeCharacterState({ ...current, towerProgress: { highestFloorCleared: 0 } }) : current,
    );
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    setStoryState((current) => ({
      ...current,
      floorAttemptByNumber: {},
      floorEncounterDecisionByAttempt: {},
      activeFloorEncounterBonus: null,
    }));
    setLastTowerOutcome(null);
    setLastTowerWaveOutcome(null);
  };

  const devIncreaseLevel = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const nextLevel = currentCharacter.progression.level + 1;
    const nextProgression = {
      ...currentCharacter.progression,
      level: nextLevel,
      xpInLevel: 0,
      xpToNextLevel: getXpToNextLevel(nextLevel),
    };
    const nextHealthCap = getDerivedHealthCap({
      ...currentCharacter,
      progression: nextProgression,
    });
    const nextFocusCap = getDerivedSkillResourceCap({
      ...currentCharacter,
      progression: nextProgression,
    });
    const nextCharacter = {
      ...currentCharacter,
      progression: nextProgression,
      healthCap: nextHealthCap,
      health: nextHealthCap,
      focusCap: nextFocusCap,
      focus: nextFocusCap,
    };
    captureLevelUpEvent(currentCharacter, nextCharacter);
    setCharacter(normalizeCharacterState(nextCharacter));
    return { ok: true, reason: `Dev level increased: ${currentCharacter.progression.level} -> ${nextLevel}` };
  };

  const devRestoreAdventurer = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        health: currentCharacter.healthCap,
        stamina: currentCharacter.staminaCap,
        focus: currentCharacter.focusCap,
      }),
    );
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    return { ok: true, reason: "Dev restore applied: HP, stamina, and focus refilled." };
  };

  const devFractureAdventurer = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    setCharacter(normalizeCharacterState({ ...currentCharacter, health: DOWNSTATE_HP }));
    setStoryNotification({
      id: `story-dev-fracture-${Date.now()}`,
      title: "The Tower Casts You Out",
      message: "Your being has been forced into a fractured state for testing. Visit the Archmage to restore it.",
      variant: "tower-collapse",
    });
    return { ok: true, reason: "Dev fracture applied. Adventurer set to fractured state." };
  };

  const devAdvanceTowerFloor = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const currentCleared = currentCharacter.towerProgress?.highestFloorCleared ?? 0;
    const nextCleared = Math.min(TOWER_FLOORS.length, currentCleared + 1);
    if (nextCleared === currentCleared) {
      return { ok: false, reason: "Tower already at max implemented floor." };
    }
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        towerProgress: { highestFloorCleared: nextCleared },
      }),
    );
    setLastTowerOutcome(null);
    setLastTowerWaveOutcome(null);
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    return { ok: true, reason: `Dev tower advance applied. Highest cleared floor is now ${nextCleared}.` };
  };

  const devTriggerLyraQuest = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    setStoryState((current) => {
      const npcState = upsertEncounteredStoryNpc(current, {
        ...LYRA_PROFILE_BASE,
      });
      return {
        ...current,
        ...npcState,
        lyraMet: true,
        lyraTrust: Math.max(current.lyraTrust, 18),
        lyraHelpAccepted: Math.max(current.lyraHelpAccepted, 1),
        lyraQuestStatus: current.lyraQuestStatus === "completed" ? "completed" : "available",
        npcDispositionById: {
          ...current.npcDispositionById,
          [LYRA_CONDITIONAL_ENCOUNTER_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 58))),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [LYRA_CONDITIONAL_ENCOUNTER_ID]: Math.max(1, current.npcInteractionCountById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 0),
        },
      };
    });
    setStoryNotification({
      id: `story-dev-lyra-${Date.now()}`,
      title: "Lyra Thread Opened",
      message: "Lyra Ashstep has been added to the guild records and her current quest is now available for testing.",
      variant: "guild",
    });
    return { ok: true, reason: "Dev Lyra trigger applied. Lyra's quest is available." };
  };

  const devTriggerAldricQuest = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const leveledCharacter =
      currentCharacter.progression.level >= 2
        ? currentCharacter
        : normalizeCharacterState({
            ...currentCharacter,
            progression: {
              ...currentCharacter.progression,
              level: 2,
              xpInLevel: 0,
              xpToNextLevel: getXpToNextLevel(2),
            },
          });
    setCharacter(leveledCharacter);
    setStoryState((current) => {
      const npcState = upsertEncounteredStoryNpc(current, {
        ...ALDRIC_PROFILE_BASE,
      });
      return {
        ...current,
        ...npcState,
        rescueNpcStatus: current.rescueNpcStatus === "accepted" ? "accepted" : "available",
        rescueNpcUnreadCount: 1,
        aldricQuestPath: current.rescueNpcStatus === "accepted" ? current.aldricQuestPath : "none",
        aldricDarkPathStarted: current.rescueNpcStatus === "accepted" ? current.aldricDarkPathStarted : false,
        aldricOccasionalAidUnlocked: current.rescueNpcStatus === "accepted" ? current.aldricOccasionalAidUnlocked : false,
        aldricFloor30Pending: current.rescueNpcStatus === "accepted" ? current.aldricFloor30Pending : false,
        npcDispositionById: {
          ...current.npcDispositionById,
          [ALDRIC_NPC_ID]: Math.max(0, Math.min(100, current.npcDispositionById[ALDRIC_NPC_ID] ?? 42)),
        },
      };
    });
    setStoryNotification({
      id: `story-dev-aldric-${Date.now()}`,
      title: "Guild Petition Added",
      message: "Aldric Vale is now waiting in the guild hall so his rescue quest can be tested.",
      variant: "guild",
    });
    return { ok: true, reason: "Dev Aldric trigger applied. His guild petition is available and your character is now eligible to answer it." };
  };

  const devTriggerTamsinQuest = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const leveledCharacter =
      currentCharacter.progression.level >= 5 && currentCharacter.adventurerRank !== "F"
        ? currentCharacter
        : normalizeCharacterState({
            ...currentCharacter,
            progression: {
              ...currentCharacter.progression,
              level: Math.max(5, currentCharacter.progression.level),
              xpInLevel: 0,
              xpToNextLevel: getXpToNextLevel(Math.max(5, currentCharacter.progression.level)),
            },
            adventurerRank: currentCharacter.adventurerRank === "F" ? "E" : currentCharacter.adventurerRank,
          });
    setCharacter(leveledCharacter);
    setStoryState((current) => {
      const npcState = upsertEncounteredStoryNpc(current, TAMSIN_PROFILE_BASE);
      return {
        ...current,
        ...npcState,
        thornRunnerQuestStatus: "available",
        thornRunnerFollowupReviewed: undefined,
        npcDispositionById: {
          ...current.npcDispositionById,
          [TAMSIN_NPC_ID]: Math.max(0, Math.min(100, current.npcDispositionById[TAMSIN_NPC_ID] ?? 52)),
        },
      };
    });
    setStoryNotification({
      id: "tamsin-dev-trigger",
      title: "Tamsin Posted A Recovery Run",
      message: "Tamsin Vale has been added to the guild records and her Floor 2 board contract is now available for testing.",
      variant: "guild",
    });
    return { ok: true, reason: "Dev Tamsin trigger applied. Her Floor 2 quest is available." };
  };

  const devSetAldricOutcome = (path: "saved" | "too_late") => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (path === "saved") {
      const rewardWeaponId = RESCUE_REWARD_WEAPON_BY_CLASS[character.classId];
      setCharacter(
        normalizeCharacterState({
          ...character,
          inventory: {
            ...character.inventory,
            [rewardWeaponId]: (character.inventory[rewardWeaponId] ?? 0) + 1,
          },
          alliedNpcIds: Array.from(new Set([...(character.alliedNpcIds ?? []), ALDRIC_ALLY_ID])),
        }),
      );
      setStoryState((current) => {
        const npcState = upsertEncounteredStoryNpc(current, {
          ...ALDRIC_PROFILE_BASE,
          summary: "Aldric's daughter lives. He now stands behind your climb as one of the guild's most loyal allies.",
        });
        return {
          ...current,
          ...npcState,
          rescueNpcStatus: "gone",
          rescueNpcUnreadCount: 0,
          aldricQuestPath: "saved",
          aldricDarkPathStarted: false,
          aldricOccasionalAidUnlocked: true,
          aldricFloor30Pending: false,
          npcDispositionById: {
            ...current.npcDispositionById,
            [ALDRIC_NPC_ID]: 92,
          },
        };
      });
      return { ok: true, reason: "Dev Aldric route set to saved." };
    }

    setStoryState((current) => {
      const npcState = upsertEncounteredStoryNpc(current, {
        ...ALDRIC_PROFILE_BASE,
        summary: "Aldric knows you accepted the plea, but you arrived too late. Grief has started bending him toward darker answers.",
      });
      return {
        ...current,
        ...npcState,
        rescueNpcStatus: "gone",
        rescueNpcUnreadCount: 0,
        aldricQuestPath: "too_late",
        aldricDarkPathStarted: true,
        aldricOccasionalAidUnlocked: true,
        aldricFloor30Pending: true,
        npcDispositionById: {
          ...current.npcDispositionById,
          [ALDRIC_NPC_ID]: 34,
        },
      };
    });
    return { ok: true, reason: "Dev Aldric route set to too late." };
  };

  const devResetAppraisals = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    setCharacter(
      normalizeCharacterState({
        ...character,
        appraisedItemIds: [],
      }),
    );
    return { ok: true, reason: "All appraisals cleared for testing." };
  };

  const createCharacter = (name: string, avatarId: AvatarId) => {
    if (!selectedClass || character) {
      return;
    }

    const nextSequence = (classSequenceByClass[selectedClass] ?? 0) + 1;
    const created = mockGameService.createCharacter(name, selectedClass, avatarId, nextSequence);
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    setLastTowerOutcome(null);
    setLastTowerWaveOutcome(null);
    setStoryNotification(null);
    setCharacter(normalizeCharacterState(created));
    setClassSequenceByClass((current) => ({ ...current, [selectedClass]: nextSequence }));
  };

  const chooseWarriorPath = (path: "knight" | "berserker") => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (character.classId !== "warrior") {
      return { ok: false, reason: "Path choice is Warrior-only." };
    }
    const options = getAvailableWarriorPathChoices(character);
    if (options.length === 0) {
      return { ok: false, reason: "Final path choice unlocks at Level 15 after NPC guidance." };
    }
    if (character.warriorPathChoice) {
      return { ok: false, reason: `Path locked: ${character.warriorPathChoice}.` };
    }
    if (!options.includes(path)) {
      return { ok: false, reason: "Invalid path choice." };
    }

    const pathSetCharacter = {
      ...character,
      warriorPathChoice: path,
    };
    const normalized = normalizeAbilityLoadout(pathSetCharacter);
    const pathSkill = getUnlockedActiveSkills(normalized).find(
      (ability) => ability.pathGroup === path && (ability.kind ?? "skill") === "skill",
    );
    const nextCharacter = {
      ...normalized,
      activeClassSkillId: pathSkill?.id ?? normalized.activeClassSkillId,
    };
    setCharacter(normalizeCharacterState(nextCharacter));
    return { ok: true, reason: `Warrior path locked: ${path === "knight" ? "Knight" : "Berserker"}.` };
  };

  const setActiveClassSkill = (abilityId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const unlockedSkills = getUnlockedActiveSkills(character);
    if (!unlockedSkills.some((ability) => ability.id === abilityId)) {
      return { ok: false, reason: "Skill is not unlocked for your current path/level." };
    }
    setCharacter(normalizeCharacterState({ ...character, activeClassSkillId: abilityId }));
    return { ok: true };
  };

  const togglePassiveAbility = (abilityId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const unlockedPassiveIds = new Set(getUnlockedPassiveAbilities(character).map((ability) => ability.id));
    if (!unlockedPassiveIds.has(abilityId)) {
      return { ok: false, reason: "Passive is not unlocked for your current path/level." };
    }
    const equipped = character.equippedPassiveAbilityIds ?? [];
    if (equipped.includes(abilityId)) {
      setCharacter(
        normalizeCharacterState({
          ...character,
          equippedPassiveAbilityIds: equipped.filter((id) => id !== abilityId),
        }),
      );
      return { ok: true, reason: "Passive unequipped." };
    }
    if (equipped.length >= MAX_EQUIPPED_PASSIVES) {
      return { ok: false, reason: `Only ${MAX_EQUIPPED_PASSIVES} passives can be equipped.` };
    }
    setCharacter(
      normalizeCharacterState({
        ...character,
        equippedPassiveAbilityIds: [...equipped, abilityId],
      }),
    );
    return { ok: true, reason: "Passive equipped." };
  };

  const availableQuests = useMemo(
    () =>
      character
        ? QUESTS.filter((quest) => {
            const playerRankIndex = getRankOrderIndex(character.adventurerRank);
            const questRankIndex = getRankOrderIndex(quest.rank);
            if (questRankIndex > playerRankIndex) {
              return false;
            }
            if (quest.id === RESCUE_QUEST_ID) {
              return storyState.rescueNpcStatus === "accepted";
            }
            if (quest.id === LYRA_QUEST_ID) {
              return storyState.lyraQuestStatus === "available";
            }
            if (quest.id === TAMSIN_QUEST_ID) {
              return storyState.thornRunnerQuestStatus === "available";
            }
            return true;
          })
        : [],
    [character, storyState.rescueNpcStatus, storyState.lyraQuestStatus, storyState.thornRunnerQuestStatus],
  );

  const startQuest = (questId: string, committedItems?: Record<ItemId, number>) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const quest = availableQuests.find((item) => item.id === questId);
    const result = mockGameService.startQuest({
      character: currentCharacter,
      activeQuest,
      dailies,
      quest,
      committedItems,
      nowMs: Date.now(),
    });

    if (!result.ok || !result.character || !result.dailies || !result.activeQuest) {
      return { ok: false, reason: result.reason ?? "Unable to start quest." };
    }

    captureLevelUpEvent(currentCharacter, result.character);
    captureLevelDownEvent(currentCharacter, result.character, "Tower knockout penalty");
    setCharacter(normalizeCharacterState(result.character));
    setDailies(result.dailies);
    setActiveQuest(result.activeQuest);
    if (questId === RESCUE_QUEST_ID) {
      setStoryState((current) => ({
        ...current,
        aldricRescueDeadlineAtMs: undefined,
      }));
    }
    setLastQuestOutcome(null);
    setLastTowerOutcome(null);
    setLastRankUpOutcome(null);
    return { ok: true, reason: result.reason };
  };

  const claimQuest = (forcedSuccess?: boolean, summaryOverride?: string) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const quest = availableQuests.find((item) => item.id === activeQuest?.questId);
    const result = mockGameService.claimQuest({
      character: currentCharacter,
      activeQuest,
      dailies,
      quest,
      nowMs: Date.now(),
      forcedSuccess,
      summaryOverride,
    });

    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to claim quest." };
    }

    let nextCharacter = result.character;
    let nextOutcome = result.outcome ?? null;
    let claimReason = result.outcome?.summary;
    let grantedFloorIntel: number | null = null;
    let floorIntelSource = "";
    if (result.outcome?.success && activeQuest?.questId === RESCUE_QUEST_ID) {
      const alreadyAllied = (nextCharacter.alliedNpcIds ?? []).includes(ALDRIC_ALLY_ID);
      if (!alreadyAllied) {
        const rewardWeaponId = RESCUE_REWARD_WEAPON_BY_CLASS[nextCharacter.classId];
        const currentCount = nextCharacter.inventory[rewardWeaponId] ?? 0;
        const rewardWeaponName = ITEM_BY_ID[rewardWeaponId]?.name ?? rewardWeaponId;
        const updatedSummary =
          `${result.outcome.summary} Aldric personally gifted you ${rewardWeaponName} and swore to fight beside you.`;

        nextCharacter = {
          ...nextCharacter,
          inventory: {
            ...nextCharacter.inventory,
            [rewardWeaponId]: currentCount + 1,
          },
          alliedNpcIds: [...(nextCharacter.alliedNpcIds ?? []), ALDRIC_ALLY_ID],
        };
        nextOutcome = {
          ...result.outcome,
          summary: updatedSummary,
        };
        claimReason = updatedSummary;
      }
      setStoryState((current) => {
        const upserted = upsertEncounteredStoryNpc(current, {
          ...ALDRIC_PROFILE_BASE,
          summary: "Aldric's daughter lives. He now stands behind your climb as one of the most loyal people in the guild willing to fight beside you.",
        });
        return {
          ...current,
          ...upserted,
          rescueNpcStatus: "gone",
          rescueNpcUnreadCount: 0,
          aldricRescueDeadlineAtMs: undefined,
          aldricQuestPath: "saved",
          aldricDarkPathStarted: false,
          aldricOccasionalAidUnlocked: true,
          aldricFloor30Pending: false,
          npcDispositionById: {
            ...current.npcDispositionById,
            [ALDRIC_NPC_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) + 28)),
          },
          npcInteractionCountById: {
            ...current.npcInteractionCountById,
            [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
          },
        };
      });
      setStoryNotification({
        id: "aldric-saved-route",
        title: "Aldric's Oath Holds",
        message: "You brought Aldric's daughter home alive. He now treats your climb as part of his own oath.",
        variant: "guild",
      });
    }
    if (result.outcome && !result.outcome.success && activeQuest?.questId === RESCUE_QUEST_ID) {
      const failureSummary =
        result.outcome.successChance < 35
          ? "You pushed into Watchtrail underprepared. The bandits stripped your momentum, and by the time you forced the lane the rescue had already failed."
          : result.outcome.successChance < 60
            ? "The rescue push stalled under stronger resistance than you could break quickly. The lost time cost Aldric's daughter her life."
            : "You forced your way into the camp, but the bandit leader bled just enough time out of the fight for the rescue to fail before the lane opened.";
      claimReason =
        "You reached the bandit trail too late. Aldric's daughter is dead, and what happened there breaks something in him that will not mend.";
      nextOutcome = {
        ...result.outcome,
        success: false,
        summary: failureSummary,
      };
      setStoryState((current) => {
        const upserted = upsertEncounteredStoryNpc(current, {
          ...ALDRIC_PROFILE_BASE,
          summary:
            "Aldric accepted that you tried, but his daughter is still gone. He has started walking a dark road toward vengeance, and his grief no longer points entirely away from you.",
        });
        return {
          ...current,
          ...upserted,
          rescueNpcStatus: "gone",
          rescueNpcUnreadCount: 0,
          aldricRescueDeadlineAtMs: undefined,
          aldricQuestPath: "too_late",
          aldricDarkPathStarted: true,
          aldricOccasionalAidUnlocked: true,
          aldricFloor30Pending: true,
          npcDispositionById: {
            ...current.npcDispositionById,
            [ALDRIC_NPC_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) - 8)),
          },
          npcInteractionCountById: {
            ...current.npcInteractionCountById,
            [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
          },
        };
      });
      setStoryNotification({
        id: "aldric-too-late-route",
        title: "Too Late For Watchtrail",
        message:
          "Aldric's daughter is dead. He does not turn fully against you, but grief and vengeance have started dragging him toward darker company.",
        variant: "guild",
      });
    }
    if (result.outcome?.success && activeQuest?.questId === LYRA_QUEST_ID) {
      setStoryState((current) => {
        const upserted = upsertEncounteredStoryNpc(current, {
          ...LYRA_PROFILE_BASE,
          summary: "Lyra waits to see what you do with the recovered ember satchel before deciding how far she can trust you.",
        });
        return {
          ...current,
          ...upserted,
          lyraQuestResolution: "unresolved",
          lyraQuestStatus: "completed",
        };
      });
    }
    if (result.outcome?.success && activeQuest?.questId === TAMSIN_QUEST_ID) {
      setStoryState((current) => {
        const upserted = upsertEncounteredStoryNpc(current, {
          ...TAMSIN_PROFILE_BASE,
          summary: "Tamsin now treats you as someone who can bring corridor work back alive instead of feeding it to the thorns.",
        });
        return {
          ...current,
          ...upserted,
          thornRunnerQuestStatus: "completed",
          thornRunnerFollowupReviewed: false,
          npcDispositionById: {
            ...current.npcDispositionById,
            [TAMSIN_NPC_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[TAMSIN_NPC_ID] ?? 52) + 14)),
          },
          npcInteractionCountById: {
            ...current.npcInteractionCountById,
            [TAMSIN_NPC_ID]: (current.npcInteractionCountById[TAMSIN_NPC_ID] ?? 0) + 1,
          },
        };
      });
    }
    if (result.outcome?.success && activeQuest?.questId) {
      const questIntelFloor = FLOOR_INTEL_QUEST_UNLOCKS[activeQuest.questId];
      if (questIntelFloor && !(nextCharacter.purchasedFloorIntelNumbers ?? []).includes(questIntelFloor)) {
        nextCharacter = normalizeCharacterState({
          ...nextCharacter,
          purchasedFloorIntelNumbers: [...(nextCharacter.purchasedFloorIntelNumbers ?? []), questIntelFloor],
        });
        grantedFloorIntel = questIntelFloor;
        floorIntelSource = "board";
      }
    }

    captureLevelUpEvent(currentCharacter, nextCharacter);
    captureLevelDownEvent(currentCharacter, nextCharacter, "Rank trial penalty");
    setCharacter(normalizeCharacterState(nextCharacter));
    setDailies(result.dailies);
    if (nextOutcome) {
      setLastQuestOutcome({
        ...nextOutcome,
        questId: activeQuest?.questId,
      });
    }
    if (result.outcome?.success) {
      setCompletedQuestCount((count) => count + 1);
      applyClimberCheckpointUpdate("quest_clear", nextCharacter);
      if (grantedFloorIntel !== null) {
        setStoryNotification({
          id: `floor-intel-quest-${activeQuest?.questId}-${grantedFloorIntel}`,
          title: `Floor ${grantedFloorIntel} Intel Logged`,
          message:
            floorIntelSource === "board"
              ? `Guild board records from ${quest?.title ?? "this contract"} have been copied into your ledger. Floor ${grantedFloorIntel} weaknesses, optional drops, and hidden aids are now documented.`
              : `New field notes have been added to your guild ledger for Floor ${grantedFloorIntel}.`,
          variant: "guild",
        });
        claimReason = `${claimReason ?? "Quest cleared."} Floor ${grantedFloorIntel} intel was added to your guild ledger.`;
      }
    }
    setActiveQuest(null);
    setLastRankUpOutcome(null);
    return { ok: true, reason: claimReason };
  };

  const resolveLyraQuestChoice = (choice: "returned" | "kept" | "reported") => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (storyState.lyraQuestStatus !== "completed" || storyState.lyraQuestResolution !== "unresolved") {
      return { ok: false, reason: "Lyra has no unresolved request right now." };
    }

    let dispositionDelta = 0;
    let trustDelta = 0;
    let summary = "";
    let notificationTitle = "";
    let notificationBody = "";
    const lockedReason = getChoiceLockedReason(character.affinity ?? 0, choice === "returned" ? "good" : choice === "reported" ? "evil" : "neutral");
    if (lockedReason) {
      return { ok: false, reason: lockedReason };
    }

    let nextCharacter = character;
    const ashDebt = storyState.lyraAshDebt;
    let grantedFloorIntel: number | null = null;

    if (choice === "returned") {
      dispositionDelta = ashDebt ? 12 : 16;
      trustDelta = ashDebt ? 1 : 2;
      nextCharacter = normalizeCharacterState(applyAffinityDelta({
        ...character,
        inventory: {
          ...character.inventory,
          "ward-charm": (character.inventory["ward-charm"] ?? 0) + 1,
        },
      }, 8));
      summary = ashDebt
        ? "You returned the satchel unopened. Lyra accepts the restraint, though the ash-debt between you only begins to cool rather than vanish."
        : "You returned the satchel unopened. Lyra accepts the restraint and leaves you a Warding Seal in silent thanks.";
      notificationTitle = "Lyra Accepts Your Restraint";
      notificationBody = ashDebt
        ? "You returned the satchel untouched. Lyra acknowledges the restraint, but she has not forgotten that your first meeting began as a rescue."
        : "You returned the satchel untouched. Lyra now sees you as someone who can hold dangerous truth without grabbing for it.";
      const intelFloor = FLOOR_INTEL_NPC_UNLOCKS[LYRA_QUEST_ID];
      if (intelFloor && !(nextCharacter.purchasedFloorIntelNumbers ?? []).includes(intelFloor)) {
        nextCharacter = normalizeCharacterState({
          ...nextCharacter,
          purchasedFloorIntelNumbers: [...(nextCharacter.purchasedFloorIntelNumbers ?? []), intelFloor],
        });
        grantedFloorIntel = intelFloor;
      }
    } else if (choice === "kept") {
      dispositionDelta = ashDebt ? 5 : 8;
      trustDelta = ashDebt ? 0 : 1;
      nextCharacter = normalizeCharacterState(applyAffinityDelta({
        ...character,
        inventory: {
          ...character.inventory,
          "grounding-tonic": (character.inventory["grounding-tonic"] ?? 0) + 1,
        },
      }, 0));
      summary = ashDebt
        ? "You studied the satchel in secret. Lyra reads the caution, but the memory of dragging you out of a poisoned lane makes her slower to forgive."
        : "You studied the satchel in secret and kept what you learned to yourself. Lyra senses the caution, but not full obedience.";
      notificationTitle = "Lyra Notes Your Caution";
      notificationBody = ashDebt
        ? "You kept the maps and their secrets close. Lyra recognizes the instinct to survive, but the rescue still hangs between you."
        : "You kept the maps and their secrets close. Lyra does not fully approve, but she recognizes your instinct to survive before speaking.";
      const intelFloor = FLOOR_INTEL_NPC_UNLOCKS[LYRA_QUEST_ID];
      if (intelFloor && !(nextCharacter.purchasedFloorIntelNumbers ?? []).includes(intelFloor)) {
        nextCharacter = normalizeCharacterState({
          ...nextCharacter,
          purchasedFloorIntelNumbers: [...(nextCharacter.purchasedFloorIntelNumbers ?? []), intelFloor],
        });
        grantedFloorIntel = intelFloor;
      }
    } else {
      dispositionDelta = ashDebt ? -24 : -18;
      trustDelta = ashDebt ? -3 : -2;
      nextCharacter = normalizeCharacterState(applyAffinityDelta({
        ...character,
        gold: character.gold + 18,
      }, -10));
      summary = ashDebt
        ? "You reported the satchel to guild command. Lyra learns of it quickly, and the fact that she once had to pull you out of the ash only deepens the insult."
        : "You reported the satchel to guild command. Lyra learns of it quickly and her trust hardens into distance.";
      notificationTitle = "Word Reaches Lyra";
      notificationBody = ashDebt
        ? "Guild command now has a copy of the ember route report. Lyra will remember that she rescued you first and was repaid with exposure."
        : "Guild command now has a copy of the ember route report. Lyra will remember who opened that door.";
    }

    setCharacter(nextCharacter);
    setStoryState((current) => {
      const upserted = upsertEncounteredStoryNpc(current, {
        ...LYRA_PROFILE_BASE,
        summary,
      });
      return {
        ...current,
        ...upserted,
        lyraTrust: Math.max(0, current.lyraTrust + trustDelta),
        lyraQuestResolution: choice,
        lyraAshDebt: choice === "returned" ? false : current.lyraAshDebt,
        npcDispositionById: {
          ...current.npcDispositionById,
          [LYRA_CONDITIONAL_ENCOUNTER_ID]: Math.max(
            0,
            Math.min(100, (current.npcDispositionById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 34) + dispositionDelta),
          ),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [LYRA_CONDITIONAL_ENCOUNTER_ID]: (current.npcInteractionCountById[LYRA_CONDITIONAL_ENCOUNTER_ID] ?? 0) + 1,
        },
      };
    });
    setStoryNotification({
      id: `lyra-quest-complete-${choice}`,
      title: notificationTitle,
      message:
        grantedFloorIntel !== null
          ? `${notificationBody} Lyra's field notes also open your Floor ${grantedFloorIntel} intel ledger.`
          : notificationBody,
      variant: "guild",
    });
    return {
      ok: true,
      reason: grantedFloorIntel !== null ? `${summary} Floor ${grantedFloorIntel} intel was added to your guild ledger.` : summary,
    };
  };

  const conquerTowerFloor = (floorNumber: number, committedItems?: Record<ItemId, number>) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const attemptNumber = getFloorAttemptNumber(floorNumber, storyState);
    const activeEncounterBonus = storyState.activeFloorEncounterBonus;
    const encounterBonusFlat =
      activeEncounterBonus &&
      activeEncounterBonus.floorNumber === floorNumber &&
      activeEncounterBonus.attemptNumber === attemptNumber
        ? activeEncounterBonus.towerSuccessFlat
        : 0;
    const result = mockGameService.conquerTowerFloor({
      character: currentCharacter,
      dailies,
      floor,
      committedItems,
      externalSuccessFlat: encounterBonusFlat,
    });

    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to challenge floor." };
    }

    captureLevelUpEvent(currentCharacter, result.character);
    setCharacter(normalizeCharacterState(result.character));
    setDailies(result.dailies);
    setLastTowerOutcome(result.outcome ?? null);
    setLastRankUpOutcome(null);
    setStoryState((current) => {
      const conditionalEncounter = result.outcome?.conditionalEncounter;
      const upserted = conditionalEncounter
        ? upsertEncounteredStoryNpc(current, {
            id: conditionalEncounter.id,
            name: conditionalEncounter.npcName,
            title: conditionalEncounter.npcTitle,
            role: "Tower Encounter Witness",
            level: Math.max(1, floorNumber + 2),
            floorReached: floorNumber,
            avatarId: conditionalEncounter.avatarId,
            classId: conditionalEncounter.classId,
            licenseLabel: "Field Encounter License",
            authBody: "Adventurers Guild • Tower Field Log",
            signature: conditionalEncounter.npcName
              .split(" ")
              .map((part) => `${part.charAt(0)}.`)
              .join(""),
            summary: conditionalEncounter.message,
          })
        : {
            encounteredNpcProfiles: current.encounteredNpcProfiles,
            nextStoryNpcSequence: current.nextStoryNpcSequence,
          };
      return {
        ...current,
        ...upserted,
        floorAttemptByNumber: {
          ...current.floorAttemptByNumber,
          [String(floorNumber)]: attemptNumber,
        },
        activeFloorEncounterBonus: null,
      };
    });
    if (result.outcome?.success) {
      applyClimberCheckpointUpdate("tower_clear", result.character);
    }
    return { ok: true, reason: result.outcome?.summary };
  };

  const resolveTowerWave = (
    floorNumber: number,
    wave: TowerWaveKey,
    committedItems?: Record<ItemId, number>,
    liveBattle?: TowerLiveBattleDirective,
  ) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const mergedCommittedItems = {
      ...(committedItems ?? {}),
      ...Object.fromEntries(towerPreparedItemIds.map((itemId) => [itemId, Math.max(1, committedItems?.[itemId] ?? 1)])),
    } as Record<ItemId, number>;
    const result = mockGameService.resolveTowerWave({
      character: currentCharacter,
      floor,
      wave,
      committedItems: mergedCommittedItems,
      liveBattle,
    });
    if (!result.ok || !result.character || !result.outcome) {
      return { ok: false, reason: result.reason ?? "Unable to resolve wave." };
    }
    const collapsedInTower = result.character.health <= DOWNSTATE_HP;
    const mergedCooldowns = Object.fromEntries(
      Object.entries({
        ...(result.character.abilityCooldownsUntilMs ?? {}),
        ...(liveBattle?.abilityCooldownsUntilMs ?? {}),
      }).filter(([, value]) => typeof value === "number"),
    ) as Record<string, number>;
    const nextCharacter = collapsedInTower
      ? normalizeCharacterState({
          ...result.character,
          focus: liveBattle?.focusAfterBattle ?? result.character.focus,
          abilityCooldownsUntilMs: mergedCooldowns,
          health: DOWNSTATE_HP,
        })
      : normalizeCharacterState(result.character);
    const adjustedCharacter = normalizeCharacterState({
      ...nextCharacter,
      focus: liveBattle?.focusAfterBattle ?? nextCharacter.focus,
      abilityCooldownsUntilMs: Object.fromEntries(
        Object.entries({
          ...(nextCharacter.abilityCooldownsUntilMs ?? {}),
          ...(liveBattle?.abilityCooldownsUntilMs ?? {}),
        }).filter(([, value]) => typeof value === "number"),
      ) as Record<string, number>,
    });
    captureLevelDownEvent(currentCharacter, adjustedCharacter, "Tower wave collapse");
    setCharacter(adjustedCharacter);
    const outcome = {
      ...result.outcome,
      collapsed: collapsedInTower,
      collapseMessage: collapsedInTower
        ? "A hush of ancient mercy closes around you. The Tower refuses your final breath and casts you back to the guild at 1 HP. Your body remains standing, but your being is fractured. Seek the Archmage to restore yourself before venturing out again."
        : result.outcome.collapseMessage,
    };
    setLastTowerWaveOutcome(outcome);
    if (collapsedInTower) {
      setTowerStatusEffects(liveBattle?.persistentStatusEffects ?? []);
      setTowerPreparedItemIds([]);
    } else {
      setTowerStatusEffects(
        liveBattle?.persistentStatusEffects
          ? mergeTowerStatusEffects(liveBattle.persistentStatusEffects, result.outcome?.statusEffects ?? [])
          : mergeTowerStatusEffects([], result.outcome?.statusEffects ?? []),
      );
      setTowerPreparedItemIds([]);
    }
    return { ok: true, reason: result.outcome.summary, outcome };
  };

  const finalizeTowerFloor = (floorNumber: number) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const result = mockGameService.finalizeTowerFloor({
      character: currentCharacter,
      dailies,
      floor,
    });
    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to finalize floor." };
    }
    captureLevelUpEvent(currentCharacter, result.character);
    setCharacter(normalizeCharacterState(result.character));
    setDailies(result.dailies);
    setLastTowerOutcome(result.outcome ?? null);
    setLastTowerWaveOutcome(null);
    setTowerStatusEffects([]);
    setTowerPreparedItemIds([]);
    setLastRankUpOutcome(null);
    applyClimberCheckpointUpdate("tower_clear", result.character);
    return { ok: true, reason: result.outcome?.summary ?? `Floor ${floorNumber} finalized.` };
  };

  const canClaimQuest = useMemo(
    () => Boolean(activeQuest && Date.now() >= activeQuest.endsAtMs),
    [activeQuest],
  );


  const devSetAffinity = (value: number) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    setCharacter(normalizeCharacterState({ ...character, affinity: clampAffinity(value) }));
    return {
      ok: true,
      reason:
        value >= 90
          ? "Affinity set to extreme Aetherbound for choice-lock testing."
          : value <= -90
            ? "Affinity set to extreme Abyssworn for choice-lock testing."
            : "Affinity set to an open middle state for choice testing.",
    };
  };

  const devSetupWarriorBattlePreset = (preset: "shared" | "knight" | "berserker") => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (character.classId !== "warrior") {
      return { ok: false, reason: "Warrior battle presets require a Warrior character." };
    }

    const baseLevel = preset === "shared" ? 12 : 15;
    const nextPathChoice = preset === "shared" ? null : preset;
    const nextActiveSkillId =
      preset === "shared"
        ? "ability-warrior-steel-rhythm"
        : preset === "knight"
          ? "ability-warrior-bulwark-oath"
          : "ability-warrior-bloodrush";
    const nextPassiveIds =
      preset === "shared"
        ? ["ability-warrior-combat-discipline"]
        : preset === "knight"
          ? ["ability-warrior-combat-discipline", "ability-warrior-shield-doctrine"]
          : ["ability-warrior-combat-discipline", "ability-warrior-frenzy-instinct"];

    const nextLevel = Math.max(baseLevel, character.progression.level);
    const nextCharacterDraft = {
      ...character,
      progression: {
        ...character.progression,
        level: nextLevel,
        xpToNextLevel: getXpToNextLevel(nextLevel),
        xpInLevel: Math.min(character.progression.xpInLevel, getXpToNextLevel(nextLevel) - 1),
      },
      warriorPathChoice: nextPathChoice,
      activeClassSkillId: nextActiveSkillId,
      equippedPassiveAbilityIds: nextPassiveIds,
      abilityCooldownsUntilMs: {},
      pendingAbilityId: null,
      pendingAbilityIds: [],
    };
    const nextHealthCap = getDerivedHealthCap(nextCharacterDraft);
    const nextFocusCap = getDerivedSkillResourceCap(nextCharacterDraft);

    setCharacter(
      normalizeCharacterState({
        ...nextCharacterDraft,
        healthCap: nextHealthCap,
        health: nextHealthCap,
        focusCap: nextFocusCap,
        focus: nextFocusCap,
      }),
    );

    return {
      ok: true,
      reason:
        preset === "shared"
          ? "Shared Warrior preset ready: Level 12, Steel Rhythm active, Combat Discipline equipped."
          : preset === "knight"
            ? "Knight preset ready: Level 15, Bulwark Oath active, Combat Discipline + Shield Doctrine equipped."
            : "Berserker preset ready: Level 15, Bloodrush active, Combat Discipline + Frenzy Instinct equipped.",
    };
  };

  const devPreviewQuestBoardContracts = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    const previewLevel = Math.max(60, currentCharacter.progression.level);
    const previewRank =
      getRankOrderIndex(currentCharacter.adventurerRank) >= getRankOrderIndex("S")
        ? currentCharacter.adventurerRank
        : "S";

    const nextCharacterDraft = {
      ...currentCharacter,
      progression: {
        ...currentCharacter.progression,
        level: previewLevel,
        xpToNextLevel: getXpToNextLevel(previewLevel),
        xpInLevel: Math.min(currentCharacter.progression.xpInLevel, getXpToNextLevel(previewLevel) - 1),
      },
      adventurerRank: previewRank,
    };
    const nextHealthCap = getDerivedHealthCap(nextCharacterDraft);
    const nextFocusCap = getDerivedSkillResourceCap(nextCharacterDraft);

    setCharacter(
      normalizeCharacterState({
        ...nextCharacterDraft,
        healthCap: nextHealthCap,
        health: nextHealthCap,
        focusCap: nextFocusCap,
        focus: nextFocusCap,
        stamina: nextCharacterDraft.staminaCap,
      }),
    );
    setStoryState((current) => ({
      ...current,
      questBoardPreviewEnabled: true,
    }));

    setStoryNotification({
      id: `story-dev-quest-preview-${Date.now()}`,
      title: "Quest Board Preview Ready",
      message: "Your character was raised to Level 60 and S-rank so placeholder adventure, dungeon, and hunt contracts can be reviewed on the Guild board.",
      variant: "guild",
    });

    return {
      ok: true,
      reason: "Quest board preview preset ready: Level 60, S-rank, full resources.",
    };
  };

  const getQuestSuccessChance = (questId: string, committedItems?: Record<ItemId, number>): number => {
    const quest = availableQuests.find((item) => item.id === questId);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!quest || !currentCharacter) {
      return 0;
    }
    return calculateQuestSuccessChance(currentCharacter, quest, committedItems);
  };

  const getQuestAccess = (questId: string): { allowed: boolean; reason?: string } => {
    const quest = availableQuests.find((item) => item.id === questId);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!quest || !currentCharacter) {
      return { allowed: false, reason: "Character unavailable." };
    }
    if (currentCharacter.health <= DOWNSTATE_HP) {
      return { allowed: false, reason: "Your being is fractured. Visit the Archmage in the guild." };
    }
    const healthGate = Math.ceil(currentCharacter.healthCap * 0.5);
    if (currentCharacter.health < healthGate) {
      return { allowed: false, reason: `Requires at least ${healthGate}/${currentCharacter.healthCap} HP.` };
    }
    return hasQuestAccess(currentCharacter, quest);
  };

  const getTowerSuccessChance = (floorNumber: number, committedItems?: Record<ItemId, number>): number => {
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!floor || !currentCharacter) {
      return 0;
    }
    const attemptNumber = getFloorAttemptNumber(floorNumber, storyState);
    const activeEncounterBonus = storyState.activeFloorEncounterBonus;
    const encounterBonusFlat =
      activeEncounterBonus &&
      activeEncounterBonus.floorNumber === floorNumber &&
      activeEncounterBonus.attemptNumber === attemptNumber
        ? activeEncounterBonus.towerSuccessFlat
        : 0;
    return calculateTowerSuccessChance(currentCharacter, floor, committedItems, encounterBonusFlat);
  };

  const getTowerAccess = (floorNumber: number): { allowed: boolean; reason?: string } => {
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!floor || !currentCharacter) {
      return { allowed: false, reason: "Character unavailable." };
    }
    if (currentCharacter.health <= DOWNSTATE_HP) {
      return { allowed: false, reason: "Your being is fractured. Visit the Archmage in the guild." };
    }
    return hasTowerAccess(currentCharacter, floor);
  };

  const getNextRankTrial = (): RankUpTrialDefinition | null => {
    if (!character) {
      return null;
    }
    return RANK_UP_TRIALS.find((trial) => trial.fromRank === character.adventurerRank) ?? null;
  };

  const getRankTrialAccess = (): { allowed: boolean; reason?: string } => {
    if (!character) {
      return { allowed: false, reason: "Character unavailable." };
    }
    const trial = getNextRankTrial();
    if (!trial) {
      return { allowed: false, reason: "Max rank reached." };
    }
    return hasRankUpAccess(character, trial, completedQuestCount);
  };

  const getRankTrialSuccessChance = (committedItems?: Record<ItemId, number>): number => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    const trial =
      currentCharacter
        ? RANK_UP_TRIALS.find((entry) => entry.fromRank === currentCharacter.adventurerRank)
        : undefined;
    if (!currentCharacter || !trial) {
      return 0;
    }
    return calculateRankUpSuccessChance(currentCharacter, trial, committedItems);
  };

  const attemptRankUp = (committedItems?: Record<ItemId, number>) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const trial =
      currentCharacter
        ? RANK_UP_TRIALS.find((entry) => entry.fromRank === currentCharacter.adventurerRank)
        : undefined;
    const result = mockGameService.attemptRankUp({
      character: currentCharacter,
      completedQuestCount,
      trial,
      committedItems,
      nowMs: Date.now(),
    });

    if (!result.ok || !result.character || !result.outcome) {
      return { ok: false, reason: result.reason ?? "Unable to start rank trial." };
    }

    captureLevelUpEvent(currentCharacter, result.character);
    setCharacter(normalizeCharacterState(result.character));
    setLastRankUpOutcome(result.outcome);
    setLastQuestOutcome(null);
    setLastTowerOutcome(null);
    return { ok: true, reason: result.outcome.summary };
  };

  const buyGuildItem = (
    itemId: ItemId,
    unitPrice: number,
    amount = 1,
    classRestriction?: BaseClassId,
  ) => {
    const result = mockGameService.buyGuildItem({
      character,
      itemId,
      unitPrice,
      amount,
      classRestriction,
    });

    if (!result.ok || !result.character) {
      return { ok: false, reason: result.reason ?? "Purchase failed." };
    }

    setCharacter(normalizeCharacterState(result.character));
    return { ok: true };
  };

  const sellGuildItem = (itemId: ItemId, unitPrice: number, amount = 1) => {
    const result = mockGameService.sellGuildItem({
      character,
      itemId,
      unitPrice,
      amount,
    });
    if (!result.ok || !result.character) {
      return { ok: false, reason: result.reason ?? "Sell failed." };
    }
    setCharacter(normalizeCharacterState(result.character));
    return { ok: true };
  };

  const craftRecipe = (recipeId: string) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const recipe = CRAFT_RECIPES.find((entry) => entry.id === recipeId);
    if (!recipe) {
      return { ok: false, reason: "Unknown recipe." };
    }
    for (const ingredient of recipe.ingredients) {
      if ((character.inventory[ingredient.itemId] ?? 0) < ingredient.amount) {
        return { ok: false, reason: `Missing ${ITEM_BY_ID[ingredient.itemId]?.name ?? ingredient.itemId}.` };
      }
    }
    const nextInventory = { ...character.inventory };
    for (const ingredient of recipe.ingredients) {
      nextInventory[ingredient.itemId] = Math.max(0, (nextInventory[ingredient.itemId] ?? 0) - ingredient.amount);
    }
    nextInventory[recipe.output.itemId] = (nextInventory[recipe.output.itemId] ?? 0) + recipe.output.amount;
    setCharacter(normalizeCharacterState({ ...character, inventory: nextInventory }));
    return { ok: true, reason: `${ITEM_BY_ID[recipe.output.itemId]?.name ?? recipe.output.itemId} crafted.` };
  };

  const appraiseItem = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const item = ITEM_BY_ID[itemId];
    if (!item) {
      return { ok: false, reason: "Unknown item." };
    }
    if (!item.requiresAppraisal) {
      return { ok: false, reason: `${item.name} does not need appraisal.` };
    }
    if ((character.inventory[itemId] ?? 0) <= 0) {
      return { ok: false, reason: `${item.name} is not in your inventory.` };
    }
    if ((character.appraisedItemIds ?? []).includes(itemId)) {
      return { ok: false, reason: `${item.name} has already been appraised.` };
    }
    setCharacter(
      normalizeCharacterState({
        ...character,
        appraisedItemIds: [...(character.appraisedItemIds ?? []), itemId],
      }),
    );
    return { ok: true, reason: `Appraisal complete: ${item.name}. Bran records it in the guild ledger.` };
  };

  const buyFloorIntel = (floorNumber: number, price: number) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if ((character.purchasedFloorIntelNumbers ?? []).includes(floorNumber)) {
      return { ok: false, reason: `Floor ${floorNumber} intel already purchased.` };
    }
    if (character.gold < price) {
      return { ok: false, reason: `Need ${price}g for Floor ${floorNumber} intel.` };
    }
    setCharacter(
      normalizeCharacterState({
        ...character,
        gold: character.gold - price,
        purchasedFloorIntelNumbers: [...(character.purchasedFloorIntelNumbers ?? []), floorNumber],
      }),
    );
    return { ok: true, reason: `Purchased Floor ${floorNumber} guild intel.` };
  };

  const requestGuildMageRecovery = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (character.health > DOWNSTATE_HP) {
      return { ok: false, reason: "Archmage restoration is only available when your being is fractured." };
    }
    if (character.progression.level <= 1) {
      const nowMs = Date.now();
      const nextAvailableAt = character.noviceEmergencyReviveAvailableAtMs ?? 0;
      if (nextAvailableAt > nowMs) {
        const remainingMs = Math.max(0, nextAvailableAt - nowMs);
        const minutes = Math.floor(remainingMs / (60 * 1000));
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
        return {
          ok: false,
          reason: `Mercy Thread is sealed for ${minutes}:${seconds.toString().padStart(2, "0")}.`,
        };
      }
      const partialHealth = Math.max(1, Math.ceil(character.healthCap * 0.5));
      const recoveredCharacter = {
        ...character,
        health: partialHealth,
        noviceEmergencyReviveAvailableAtMs: nowMs + NOVICE_EMERGENCY_REVIVE_COOLDOWN_MS,
      };
      setCharacter(normalizeCharacterState(recoveredCharacter));
      return {
        ok: true,
        reason: "Mercy Thread cast complete. Vitality restored to 50% with no level toll. The thread is now sealed.",
      };
    }

    const downgradedProgression = applyLevelLoss(character.progression, 1);
    const nextHealthCap = getDerivedHealthCap({
      ...character,
      progression: downgradedProgression,
    });
    const nextFocusCap = getDerivedSkillResourceCap({
      ...character,
      progression: downgradedProgression,
    });

    setCharacter(
      normalizeCharacterState({
        ...character,
        progression: downgradedProgression,
        healthCap: nextHealthCap,
        health: nextHealthCap,
        focusCap: nextFocusCap,
        focus: Math.min(character.focus, nextFocusCap),
      }),
    );
    captureLevelDownEvent(
      character,
      {
        ...character,
        progression: downgradedProgression,
        healthCap: nextHealthCap,
        health: nextHealthCap,
        focusCap: nextFocusCap,
        focus: Math.min(character.focus, nextFocusCap),
      },
      "10th-Level Mage Recovery",
    );
    return { ok: true, reason: "Veilweave Restoration complete. Full vitality restored. Level toll -1 applied." };
  };

  const equipWeapon = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const item = ITEM_BY_ID[itemId];
    if (!item || item.category !== "weapon") {
      return { ok: false, reason: "Invalid weapon selection." };
    }

    if ((character.inventory[itemId] ?? 0) <= 0) {
      return { ok: false, reason: "You don't own this weapon yet." };
    }

    if (item.classRestriction && item.classRestriction !== character.classId) {
      return { ok: false, reason: `${item.classRestriction} weapon only.` };
    }

    setCharacter(normalizeCharacterState({ ...character, equippedWeaponId: itemId }));

    return { ok: true };
  };

  const unequipWeapon = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (!character.equippedWeaponId) {
      return { ok: false, reason: "No weapon equipped." };
    }

    setCharacter(normalizeCharacterState({ ...character, equippedWeaponId: null }));

    return { ok: true };
  };

  const equipBuff = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const item = ITEM_BY_ID[itemId];
    if (!item || item.category !== "buff") {
      return { ok: false, reason: "Invalid buff selection." };
    }

    if ((character.inventory[itemId] ?? 0) <= 0) {
      return { ok: false, reason: "You don't own this buff yet." };
    }

    const nowMs = Date.now();
    const currentCharacter = applyTimedState(character, nowMs);
    const equipped = currentCharacter.equippedBuffIds ?? [];
    if (equipped.includes(itemId)) {
      return { ok: false, reason: "Buff already equipped." };
    }

    const slotLimit = getBuffSlotLimit(currentCharacter.adventurerRank);
    if (equipped.length >= slotLimit) {
      return { ok: false, reason: `All buff slots are filled (${slotLimit}/${slotLimit}).` };
    }

    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        equippedBuffIds: [...equipped, itemId],
      }),
    );
    return { ok: true };
  };

  const unequipBuff = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    const equipped = currentCharacter.equippedBuffIds ?? [];
    if (!equipped.includes(itemId)) {
      return { ok: false, reason: "Buff is not equipped." };
    }

    const nextExpiries = { ...(currentCharacter.activeBuffExpiresAtMs ?? {}) };
    const nextPaused = { ...(currentCharacter.pausedBuffRemainingMs ?? {}) };
    delete nextExpiries[itemId];
    delete nextPaused[itemId];
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        equippedBuffIds: equipped.filter((id) => id !== itemId),
        activeBuffExpiresAtMs: nextExpiries,
        pausedBuffRemainingMs: nextPaused,
      }),
    );
    return { ok: true };
  };

  const activateBuff = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    const equipped = currentCharacter.equippedBuffIds ?? [];
    if (!equipped.includes(itemId)) {
      return { ok: false, reason: "Equip this buff first." };
    }

    const item = ITEM_BY_ID[itemId];
    if (!item || item.category !== "buff") {
      return { ok: false, reason: "Invalid buff selection." };
    }

    const nowMs = Date.now();
    const activeUntil = currentCharacter.activeBuffExpiresAtMs?.[itemId] ?? 0;
    if (activeUntil > nowMs) {
      return { ok: false, reason: "Buff is already active." };
    }

    const pausedRemainingMs = currentCharacter.pausedBuffRemainingMs?.[itemId] ?? 0;
    const baseDurationMs = (item.buffDurationSeconds ?? 900) * 1000;
    const durationMs = pausedRemainingMs > 0 ? pausedRemainingMs : baseDurationMs;
    const nextPaused = { ...(currentCharacter.pausedBuffRemainingMs ?? {}) };
    delete nextPaused[itemId];

    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        activeBuffExpiresAtMs: {
          ...(currentCharacter.activeBuffExpiresAtMs ?? {}),
          [itemId]: nowMs + durationMs,
        },
        pausedBuffRemainingMs: nextPaused,
      }),
    );
    return { ok: true };
  };

  const equipTitle = (titleId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const title = TITLE_BY_ID[titleId];
    if (!title) {
      return { ok: false, reason: "Invalid title selection." };
    }
    if (!(character.ownedTitleIds ?? []).includes(titleId)) {
      return { ok: false, reason: "You have not earned this title yet." };
    }
    if (!isTitleUnlocked(character, title)) {
      return { ok: false, reason: `Unlocks at level ${title.minLevel}${title.classRestriction ? ` (${title.classRestriction} only)` : ""}.` };
    }

    const equipped = character.equippedTitleIds ?? [];
    if (equipped.includes(titleId)) {
      return { ok: false, reason: "Title already equipped." };
    }

    const slotLimit = getTitleSlotLimit(character.progression.level);
    if (equipped.length >= slotLimit) {
      return { ok: false, reason: `All title slots are filled (${slotLimit}/${slotLimit}).` };
    }

    setCharacter(normalizeCharacterState({ ...character, equippedTitleIds: [...equipped, titleId] }));
    return { ok: true };
  };

  const unequipTitle = (titleId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const equipped = character.equippedTitleIds ?? [];
    if (!equipped.includes(titleId)) {
      return { ok: false, reason: "Title is not equipped." };
    }

    setCharacter(normalizeCharacterState({ ...character, equippedTitleIds: equipped.filter((id) => id !== titleId) }));
    return { ok: true };
  };

  const deactivateBuff = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    const equipped = currentCharacter.equippedBuffIds ?? [];
    if (!equipped.includes(itemId)) {
      return { ok: false, reason: "Equip this buff first." };
    }

    const nowMs = Date.now();
    const activeUntil = currentCharacter.activeBuffExpiresAtMs?.[itemId] ?? 0;
    if (activeUntil <= nowMs) {
      return { ok: false, reason: "Buff is not active." };
    }

    const remainingMs = Math.max(0, activeUntil - nowMs);
    const nextActive = { ...(currentCharacter.activeBuffExpiresAtMs ?? {}) };
    const nextPaused = { ...(currentCharacter.pausedBuffRemainingMs ?? {}) };
    delete nextActive[itemId];
    nextPaused[itemId] = remainingMs;

    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        activeBuffExpiresAtMs: nextActive,
        pausedBuffRemainingMs: nextPaused,
      }),
    );
    return { ok: true };
  };

  const activateClassAbility = (abilityId?: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const nowMs = Date.now();
    const currentCharacter = applyTimedState(character, nowMs);
    const defaultAbility = getClassAbility(currentCharacter);
    const targetAbilityId = abilityId ?? defaultAbility?.id;
    const classAbility = targetAbilityId ? ABILITY_BY_ID[targetAbilityId] : null;
    if (!classAbility || classAbility.kind !== "skill") {
      return { ok: false, reason: "No valid skill selected." };
    }
    const unlockedIds = new Set(getUnlockedActiveSkills(currentCharacter).map((ability) => ability.id));
    if (!unlockedIds.has(classAbility.id)) {
      return { ok: false, reason: "Skill is not unlocked yet." };
    }
    const pendingAbilityIds = currentCharacter.pendingAbilityIds ?? [];
    if (pendingAbilityIds.includes(classAbility.id)) {
      return { ok: false, reason: `${classAbility.name} is already primed.` };
    }
    if (!isAbilityReady(currentCharacter, classAbility.id, nowMs)) {
      const remaining = getAbilityCooldownRemainingSeconds(currentCharacter, classAbility.id, nowMs);
      return { ok: false, reason: `${classAbility.name} cooldown: ${remaining}s remaining.` };
    }
    if (currentCharacter.focus < classAbility.focusCost) {
      const resourceLabel = getSkillResourceLabel(currentCharacter.classId);
      return { ok: false, reason: `Not enough ${resourceLabel.toLowerCase()}. Need ${classAbility.focusCost}.` };
    }

    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        focus: currentCharacter.focus - classAbility.focusCost,
        pendingAbilityId: classAbility.id,
        pendingAbilityIds: [...pendingAbilityIds, classAbility.id],
      }),
    );
    return {
      ok: true,
      reason: `${classAbility.name} primed (${pendingAbilityIds.length + 1} queued).`,
    };
  };

  const deactivateClassAbility = (abilityId?: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const pendingIds = currentCharacter.pendingAbilityIds ?? [];
    const targetAbilityId = abilityId ?? getClassAbility(currentCharacter)?.id;
    if (!targetAbilityId) {
      return { ok: false, reason: "No skill selected." };
    }
    if (!pendingIds.includes(targetAbilityId)) {
      return { ok: false, reason: "Skill is not currently active." };
    }
    const ability = ABILITY_BY_ID[targetAbilityId];
    if (!ability) {
      return { ok: false, reason: "Skill metadata missing." };
    }
    const nextPendingIds = pendingIds.filter((id) => id !== targetAbilityId);
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        pendingAbilityId: nextPendingIds[0] ?? null,
        pendingAbilityIds: nextPendingIds,
        focus: currentCharacter.focus + ability.focusCost,
      }),
    );
    return { ok: true, reason: `${ability.name} deactivated.` };
  };

  const useSkillResourceItem = (itemId?: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    let consumeItemId: ItemId | null = null;
    if (itemId === "focus-tonic" || itemId === "mana-tonic") {
      consumeItemId = itemId;
    } else {
      const preferredItemId: ItemId = currentCharacter.classId === "mage" ? "mana-tonic" : "focus-tonic";
      const fallbackItemId: ItemId | null = currentCharacter.classId === "mage" ? "focus-tonic" : null;
      const preferredOwned = currentCharacter.inventory[preferredItemId] ?? 0;
      const fallbackOwned = fallbackItemId ? currentCharacter.inventory[fallbackItemId] ?? 0 : 0;
      consumeItemId = preferredOwned > 0 ? preferredItemId : fallbackOwned > 0 && fallbackItemId ? fallbackItemId : null;
    }
    if (!consumeItemId) {
      return {
        ok: false,
        reason:
          currentCharacter.classId === "mage"
            ? "No Mana Tonic or Focus Tonic in inventory."
            : "No Focus Tonic in inventory.",
      };
    }
    const consumeOwned = currentCharacter.inventory[consumeItemId] ?? 0;
    if (consumeOwned <= 0) {
      return { ok: false, reason: `${ITEM_BY_ID[consumeItemId]?.name ?? consumeItemId} not in inventory.` };
    }
    const restoreAmount = consumeItemId === "mana-tonic" ? 8 : 6;
    const nextFocus = currentCharacter.focus + restoreAmount;
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        focus: nextFocus,
        inventory: {
          ...(currentCharacter.inventory ?? {}),
          [consumeItemId]: Math.max(0, consumeOwned - 1),
        },
      }),
    );
    const itemLabel = ITEM_BY_ID[consumeItemId]?.name ?? consumeItemId;
    return { ok: true, reason: `${itemLabel} used. Recovered ${nextFocus - currentCharacter.focus} skill energy.` };
  };

  const useHealthRecoveryItem = (itemId?: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    const currentCharacter = applyTimedState(character, Date.now());
    if (itemId && itemId !== "health-potion" && itemId !== "healing-herb") {
      return { ok: false, reason: "This item does not restore health." };
    }
    const consumeItemId: ItemId = itemId === "healing-herb" ? "healing-herb" : "health-potion";
    const owned = currentCharacter.inventory[consumeItemId] ?? 0;
    if (owned <= 0) {
      return { ok: false, reason: `No ${ITEM_BY_ID[consumeItemId]?.name ?? consumeItemId} in inventory.` };
    }
    const restoreAmount = consumeItemId === "healing-herb" ? 12 : 35;
    const nextHealth = currentCharacter.health + restoreAmount;
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        health: nextHealth,
        inventory: {
          ...(currentCharacter.inventory ?? {}),
          [consumeItemId]: owned - 1,
        },
      }),
    );
    const itemLabel = ITEM_BY_ID[consumeItemId]?.name ?? consumeItemId;
    return { ok: true, reason: `${itemLabel} used. Recovered ${nextHealth - currentCharacter.health} HP.` };
  };

  const useTowerConsumableItem = (itemId: ItemId) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (!TOWER_USABLE_CONSUMABLE_IDS.includes(itemId)) {
      return { ok: false, reason: "This item is not usable in the tower." };
    }
    const currentCharacter = applyTimedState(character, Date.now());
    const owned = currentCharacter.inventory[itemId] ?? 0;
    if (owned <= 0) {
      return { ok: false, reason: `${ITEM_BY_ID[itemId]?.name ?? itemId} not in inventory.` };
    }
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        inventory: {
          ...(currentCharacter.inventory ?? {}),
          [itemId]: Math.max(0, owned - 1),
        },
      }),
    );
    setTowerPreparedItemIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
    setTowerStatusEffects((current) => clearTowerStatusesForConsumable(current, itemId));
    return { ok: true, reason: `${ITEM_BY_ID[itemId]?.name ?? itemId} is ready for your next tower exchange.` };
  };

  const dismissStoryNotification = () => setStoryNotification(null);
  const markMainQuestViewed = () =>
    setStoryState((current) =>
      current.mainQuestUnreadCount > 0 ? { ...current, mainQuestUnreadCount: 0 } : current,
    );

  const recordNpcInteraction = (npcId: string, dispositionDelta = 0, interactionDelta = 1) => {
    setStoryState((current) => ({
      ...current,
      npcDispositionById: {
        ...current.npcDispositionById,
        [npcId]: Math.max(0, Math.min(100, (current.npcDispositionById[npcId] ?? 50) + dispositionDelta)),
      },
      npcInteractionCountById: {
        ...current.npcInteractionCountById,
        [npcId]: Math.max(0, (current.npcInteractionCountById[npcId] ?? 0) + interactionDelta),
      },
    }));
  };

  const markNpcTabOpened = () => {
    return;
  };

  const respondRescueNpcRequest = (accept: boolean) => {
    if (character) {
      const lockedReason = getChoiceLockedReason(character.affinity ?? 0, accept ? "good" : "evil");
      if (lockedReason) {
        return { ok: false, reason: lockedReason, status: storyState.rescueNpcStatus };
      }
    }
    const currentStatus = storyState.rescueNpcStatus;
    if (!character) {
      return { ok: false, reason: "This request has not appeared yet." };
    }
    if (currentStatus === "locked" || currentStatus === "gone") {
      return { ok: false, reason: "The adventurer is no longer in the guild hall." };
    }

    if (accept) {
      const acceptedAtMs = Date.now();
      setCharacter(normalizeCharacterState(applyAffinityDelta(character, 10)));
      setStoryState((current) => ({
        ...current,
        rescueNpcStatus: "accepted",
        rescueNpcUnreadCount: 0,
        aldricRescueDeadlineAtMs: acceptedAtMs + ALDRIC_RESCUE_DURATION_MS,
        aldricQuestPath: "none",
        npcDispositionById: {
          ...current.npcDispositionById,
          [ALDRIC_NPC_ID]: Math.max(
            0,
            Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) + 20),
          ),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
        },
      }));
      setStoryNotification(null);
      return {
        ok: true,
        reason: "You accepted the request. New quest unlocked: Aldric Vale's Child Rescue.",
        status: "accepted" as RescueNpcStatus,
      };
    }

    if (currentStatus === "available") {
      setCharacter(normalizeCharacterState(applyAffinityDelta(character, -8)));
      setStoryState((current) => ({
        ...current,
        rescueNpcStatus: "refused_once",
        rescueNpcUnreadCount: 0,
        aldricRescueDeadlineAtMs: current.aldricRescueDeadlineAtMs,
        npcDispositionById: {
          ...current.npcDispositionById,
          [ALDRIC_NPC_ID]: Math.max(
            0,
            Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) - 12),
          ),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
        },
      }));
      setStoryNotification({
        id: "aldric-refused-once",
        title: "A Plea Not Yet Finished",
        message:
          "Aldric catches himself before leaving and asks one last time. He is still in the hall, still desperate, and still clinging to the hope that you will reconsider before he goes alone.",
        variant: "guild",
      });
      return {
        ok: true,
        reason: "Aldric pleads one last time before he leaves the guild hall.",
        status: "refused_once" as RescueNpcStatus,
      };
    }

    setCharacter(normalizeCharacterState(applyAffinityDelta(character, -12)));
    setStoryState((current) => ({
      ...current,
      rescueNpcStatus: "gone",
      rescueNpcUnreadCount: 0,
      aldricRescueDeadlineAtMs: undefined,
      aldricQuestPath: "refused",
      aldricDarkPathStarted: true,
      aldricOccasionalAidUnlocked: false,
      aldricFloor30Pending: true,
      npcDispositionById: {
        ...current.npcDispositionById,
        [ALDRIC_NPC_ID]: Math.max(
          0,
          Math.min(100, (current.npcDispositionById[ALDRIC_NPC_ID] ?? 42) - 28),
        ),
      },
      npcInteractionCountById: {
        ...current.npcInteractionCountById,
        [ALDRIC_NPC_ID]: (current.npcInteractionCountById[ALDRIC_NPC_ID] ?? 0) + 1,
      },
    }));
    setStoryNotification({
      id: "aldric-refused-route",
      title: "Watchtrail Ends In Blood",
      message:
        "You refused Aldric's plea. He went after the bandits alone, failed, and came back broken. His daughter is dead. The bandit leader violated and murdered her, and Aldric survived wounded enough to end his life as a successful adventurer. By nightfall, his petition line is crossed out in soot-black ink.",
      variant: "guild",
    });
    return {
      ok: true,
      reason: "You refused again. Aldric quietly leaves the guild hall.",
      status: "gone" as RescueNpcStatus,
    };
  };

  const respondThornRunnerIntroduction = (choice: ThornRunnerIntroductionChoice) => {
    const lockedReason = character ? getChoiceLockedReason(character.affinity ?? 0, choice === "steady" ? "good" : "evil") : null;
    if (lockedReason) {
      return { ok: false, reason: lockedReason };
    }
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (storyState.thornRunnerQuestStatus === "locked") {
      return { ok: false, reason: "Tamsin has not opened corridor work for you yet." };
    }
    if (storyState.thornRunnerIntroductionChoice) {
      return {
        ok: false,
        reason:
          storyState.thornRunnerIntroductionChoice === "steady"
            ? "Tamsin already marked you as someone who respects corridor work."
            : "Tamsin already marked you as someone chasing the pay before the lane.",
        choice: storyState.thornRunnerIntroductionChoice,
      };
    }

    const dispositionDelta = choice === "steady" ? 12 : -6;
    setCharacter(normalizeCharacterState(applyAffinityDelta(character, choice === "steady" ? 4 : -4)));
    const summary =
      choice === "steady"
        ? "Tamsin now treats you like someone who understands Thorn Corridor is route work first and reward second."
        : "Tamsin still posts work for you, but now watches to see whether coin matters more to you than bringing corridor work back alive.";
    setStoryState((current) => {
      const upserted = upsertEncounteredStoryNpc(current, {
        ...TAMSIN_PROFILE_BASE,
        summary,
      });
      return {
        ...current,
        ...upserted,
        thornRunnerIntroductionChoice: choice,
        npcDispositionById: {
          ...current.npcDispositionById,
          [TAMSIN_NPC_ID]: Math.max(0, Math.min(100, (current.npcDispositionById[TAMSIN_NPC_ID] ?? 52) + dispositionDelta)),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [TAMSIN_NPC_ID]: (current.npcInteractionCountById[TAMSIN_NPC_ID] ?? 0) + 1,
        },
      };
    });

    return {
      ok: true,
      choice,
      reason:
        choice === "steady"
          ? "Tamsin nods once and pins her snagline contract to the board. She trusts you with corridor work now."
          : "Tamsin gives you the job anyway, but the look she leaves you with says she will remember where your mind went first.",
    };
  };

  const acknowledgeThornRunnerFollowup = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (storyState.thornRunnerQuestStatus !== "completed") {
      return { ok: false, reason: "Tamsin has no finished corridor notes to review yet." };
    }
    if (storyState.thornRunnerFollowupReviewed) {
      return { ok: false, reason: "Tamsin has already walked you through her thorn notes." };
    }

    const summary =
      storyState.thornRunnerIntroductionChoice === "mercenary"
        ? "Tamsin records your corridor work in the guild ledger, but keeps her thorn notes practical and brief until you prove the lane matters more than the payout."
        : "Tamsin adds you to her trusted thorn-lane ledger and leaves marked corridor notes open to you when Floor 2 work turns tight.";

    setStoryState((current) => {
      const upserted = upsertEncounteredStoryNpc(current, {
        ...TAMSIN_PROFILE_BASE,
        summary,
      });
      return {
        ...current,
        ...upserted,
        thornRunnerFollowupReviewed: true,
        npcDispositionById: {
          ...current.npcDispositionById,
          [TAMSIN_NPC_ID]: Math.max(
            0,
            Math.min(
              100,
              (current.npcDispositionById[TAMSIN_NPC_ID] ?? 66) + (current.thornRunnerIntroductionChoice === "mercenary" ? 4 : 8),
            ),
          ),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [TAMSIN_NPC_ID]: (current.npcInteractionCountById[TAMSIN_NPC_ID] ?? 0) + 1,
        },
      };
    });

    return {
      ok: true,
      reason:
        storyState.thornRunnerIntroductionChoice === "mercenary"
          ? "Tamsin logs the recovered satchel and gives you the short version of her corridor notes. You earned the work, but not the warm read."
          : "Tamsin unseals her thorn notes for you and records the recovered satchel in her corridor ledger.",
    };
  };

  const respondFloorEncounter = (floorNumber: number, encounterId: string, accept: boolean) => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    const available = getAvailableFloorEncounter(floorNumber, storyState);
    if (!available || available.encounter.id !== encounterId) {
      return { ok: false, reason: "No active floor encounter right now." };
    }
    const decisionKey = getFloorEncounterDecisionKey(encounterId, available.attemptNumber);
    if (storyState.floorEncounterDecisionByAttempt[decisionKey]) {
      return { ok: false, reason: "Encounter already resolved for this attempt." };
    }
    const progress = storyState.floorEncounterProgressById[encounterId] ?? {
      seen: 0,
      accepted: 0,
      declined: 0,
    };
    const nextProgress = {
      seen: progress.seen + 1,
      accepted: progress.accepted + (accept ? 1 : 0),
      declined: progress.declined + (accept ? 0 : 1),
    };
    setStoryState((current) => {
      const upserted = upsertEncounteredStoryNpc(current, {
        id: available.encounter.id,
        name: available.encounter.npcName,
        title: available.encounter.npcTitle,
        role: "Tower Encounter Scout",
        level: Math.max(1, floorNumber + 1),
        floorReached: floorNumber,
        avatarId: available.encounter.avatarId,
        classId: available.encounter.classId,
        licenseLabel: "Field Encounter License",
        authBody: "Adventurers Guild • Tower Field Log",
        signature: available.encounter.npcName
          .split(" ")
          .map((part) => `${part.charAt(0)}.`)
          .join(""),
        summary: available.encounter.line,
      });
      return {
        ...current,
        ...upserted,
        npcDispositionById: {
          ...current.npcDispositionById,
          [encounterId]: Math.max(0, Math.min(100, (current.npcDispositionById[encounterId] ?? 50) + (accept ? 10 : -8))),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [encounterId]: (current.npcInteractionCountById[encounterId] ?? 0) + 1,
        },
        floorEncounterProgressById: {
          ...current.floorEncounterProgressById,
          [encounterId]: nextProgress,
        },
        floorEncounterDecisionByAttempt: {
          ...current.floorEncounterDecisionByAttempt,
          [decisionKey]: accept ? "accepted" : "declined",
        },
        activeFloorEncounterBonus: accept
          ? {
              encounterId,
              floorNumber,
              attemptNumber: available.attemptNumber,
              towerSuccessFlat: available.encounter.towerSuccessFlat,
            }
          : null,
      };
    });
    return {
      ok: true,
      reason: accept ? available.encounter.acceptLine : available.encounter.declineLine,
    };
  };

  const respondTowerConditionalEncounter = (
    encounterId: string,
    accept: boolean,
    contactStyle: "rescued" | "disciplined" = "rescued",
  ) => {
    if (encounterId !== LYRA_CONDITIONAL_ENCOUNTER_ID) {
      return { ok: false, reason: "Unknown conditional encounter." };
    }
    setStoryState((current) => {
      const trustGain = accept ? (contactStyle === "disciplined" ? 2 : 1) : 0;
      const dispositionShift = accept
        ? contactStyle === "disciplined"
          ? 22
          : 10
        : contactStyle === "disciplined"
          ? -6
          : -10;
      const nextTrust = Math.max(0, current.lyraTrust + trustGain);
      const nextQuestStatus =
        accept && current.lyraQuestStatus === "locked"
          ? "available"
          : current.lyraQuestStatus;
      const upserted = upsertEncounteredStoryNpc(current, {
        ...LYRA_PROFILE_BASE,
        summary: accept
          ? contactStyle === "disciplined"
            ? "Lyra marked an ember-safe route after noticing your discipline in the ash lanes."
            : "Lyra marked an ember-safe route after dragging your climb back from poison pressure."
          : contactStyle === "disciplined"
            ? "Lyra offered a hidden route after noticing your discipline, but you chose to push on without her guidance."
            : "Lyra offered a hidden route, but you chose to push on after forcing a rescue.",
      });
      return {
        ...current,
        ...upserted,
        npcDispositionById: {
          ...current.npcDispositionById,
          [encounterId]: Math.max(0, Math.min(100, (current.npcDispositionById[encounterId] ?? 34) + dispositionShift)),
        },
        npcInteractionCountById: {
          ...current.npcInteractionCountById,
          [encounterId]: (current.npcInteractionCountById[encounterId] ?? 0) + 1,
        },
        lyraMet: true,
        lyraTrust: nextTrust,
        lyraHelpAccepted: current.lyraHelpAccepted + (accept ? 1 : 0),
        lyraHelpDeclined: current.lyraHelpDeclined + (accept ? 0 : 1),
        lyraQuestStatus: nextQuestStatus,
        lyraFirstContactStyle: current.lyraFirstContactStyle ?? contactStyle,
        lyraAshDebt: current.lyraAshDebt || contactStyle === "rescued",
      };
    });
    if (accept) {
      setStoryNotification((current) =>
        current?.id === "lyra-quest-unlock"
          ? current
          : {
              id: "lyra-quest-unlock",
              title: "A Quiet Request Appears",
              message:
                "Lyra Ashstep has left a discreet guild posting for you: recover a lost ember satchel from the ash lanes.",
              variant: "guild",
            },
      );
    }
    return {
      ok: true,
      reason: accept
        ? contactStyle === "disciplined"
          ? "Lyra noticed your discipline and trusted you with more. New quest unlocked: Lyra's Ember Map Recovery."
          : "Lyra steadied your climb after a rough first wave. New quest unlocked: Lyra's Ember Map Recovery."
        : contactStyle === "disciplined"
          ? "Lyra offered respect and route knowledge, but you chose to push on alone."
          : "Lyra watches in silence and lets you pass after a costly first wave. She will remember the refusal.",
    };
  };

  const clearLevelUpEvent = () => setLevelUpEvent(null);
  const clearLevelDownEvent = () => setLevelDownEvent(null);

  const helpfulAllies = useMemo<HelpfulNpcAlly[]>(() => {
    if (!character) {
      return [];
    }
    const alliedIds = character.alliedNpcIds ?? [];
    if (!alliedIds.includes(ALDRIC_ALLY_ID)) {
      return [];
    }
    return [
      {
        ...ALDRIC_ALLY_TEMPLATE,
        level: getAldricAllyLevel(character.progression.level),
      },
    ];
  }, [character]);

  const climberLeaderboard = useMemo<Array<ClimberEntry & { isPlayer?: boolean; rank: number }>>(() => {
    if (!character) {
      return storyState.climberRivals
        .slice()
        .sort((a, b) => (b.floor !== a.floor ? b.floor - a.floor : b.level - a.level))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }
    const combined = [
      ...storyState.climberRivals.map((entry) => ({ ...entry, isPlayer: false })),
      {
        id: "player",
        name: character.name,
        classId: character.classId,
        avatarId: character.avatarId,
        level: character.progression.level,
        floor: character.towerProgress?.highestFloorCleared ?? 0,
        trend: "steady" as const,
        isPlayer: true,
      },
    ]
      .sort((a, b) => {
        if (b.floor !== a.floor) {
          return b.floor - a.floor;
        }
        if (b.level !== a.level) {
          return b.level - a.level;
        }
        return a.name.localeCompare(b.name);
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    return combined;
  }, [character, storyState.climberRivals]);

  const activeFloorEncounter = useMemo<
    { encounter: FloorEncounterEventDefinition; attemptNumber: number; decision?: "accepted" | "declined" } | null
  >(() => {
    if (!character) {
      return null;
    }
    const nextFloor = (character.towerProgress?.highestFloorCleared ?? 0) + 1;
    const available = getAvailableFloorEncounter(nextFloor, storyState);
    if (!available) {
      return null;
    }
    const decision =
      storyState.floorEncounterDecisionByAttempt[
        getFloorEncounterDecisionKey(available.encounter.id, available.attemptNumber)
      ];
    return {
      ...available,
      decision,
    };
  }, [
    character,
    storyState,
  ]);

  return {
    classes: BASE_CLASSES,
    quests: availableQuests,
    towerFloors: TOWER_FLOORS,
    dailies,
    character,
    selectedClass,
    activeQuest,
    lastQuestOutcome,
    completedQuestCount,
    lastTowerOutcome,
    lastTowerWaveOutcome,
    towerStatusEffects,
    towerPreparedItemIds,
    lastRankUpOutcome,
    levelUpEvent,
    levelDownEvent,
    storyState,
    mainQuestTracker,
    storyNotification,
    encounteredNpcProfiles: storyState.encounteredNpcProfiles,
    climberLeaderboard,
    activeFloorEncounter,
    helpfulAllies,
    isHydrated,
    currentGuildMasterName: `${currentGuildMaster.title} ${currentGuildMaster.name}`,
    canClaimQuest,
    chooseClass,
    createCharacter,
    chooseWarriorPath,
    setActiveClassSkill,
    togglePassiveAbility,
    resetGame,
    resetTowerProgress,
    devIncreaseLevel,
    devRestoreAdventurer,
    devFractureAdventurer,
    devAdvanceTowerFloor,
    devResetAppraisals,
    devTriggerLyraQuest,
    devTriggerAldricQuest,
    devTriggerTamsinQuest,
    devSetAldricOutcome,
    devSetAffinity,
    devSetupWarriorBattlePreset,
    devPreviewQuestBoardContracts,
    getQuestSuccessChance,
    getQuestAccess,
    getTowerSuccessChance,
    getTowerAccess,
    getNextRankTrial,
    getRankTrialAccess,
    getRankTrialSuccessChance,
    buyGuildItem,
    sellGuildItem,
    craftRecipe,
    appraiseItem,
    buyFloorIntel,
    requestGuildMageRecovery,
    equipWeapon,
    unequipWeapon,
    equipBuff,
    unequipBuff,
    equipTitle,
    unequipTitle,
    activateBuff,
    deactivateBuff,
    activateClassAbility,
    deactivateClassAbility,
    useSkillResourceItem,
    useHealthRecoveryItem,
    useTowerConsumableItem,
    startQuest,
    claimQuest,
    resolveLyraQuestChoice,
    conquerTowerFloor,
    resolveTowerWave,
    finalizeTowerFloor,
    attemptRankUp,
    clearLevelUpEvent,
    clearLevelDownEvent,
    dismissStoryNotification,
    markMainQuestViewed,
    recordNpcInteraction,
    markNpcTabOpened,
    respondRescueNpcRequest,
    respondThornRunnerIntroduction,
    acknowledgeThornRunnerFollowup,
    respondFloorEncounter,
    respondTowerConditionalEncounter,
  };
};
