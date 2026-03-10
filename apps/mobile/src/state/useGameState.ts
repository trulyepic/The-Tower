import { useEffect, useMemo, useState } from "react";
import { ABILITY_BY_ID } from "../data/abilities";
import { BASE_CLASSES } from "../data/classes";
import { INITIAL_DAILIES } from "../data/dailies";
import { getGuildMasterForRank } from "../data/guild";
import { ITEM_BY_ID } from "../data/items";
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
  QuestOutcome,
  QuestDefinition,
  RankUpOutcome,
  RankUpTrialDefinition,
  RescueNpcStatus,
  StoryNotification,
  StoryState,
  TowerFloorDefinition,
  TowerOutcome,
} from "../types/game";

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const STAMINA_REGEN_TICK_MS = 30 * 1000;
const RESCUE_QUEST_ID = "quest-aldric-child-rescue";
const ALDRIC_ALLY_ID = "ally-aldric-vale";
const MAX_EQUIPPED_PASSIVES = 2;

const DEFAULT_STORY_STATE: StoryState = {
  rescueNpcStatus: "locked",
  rescueNpcUnreadCount: 0,
  warriorPathGuideNoticeShown: false,
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
  affinity: Math.max(-100, Math.min(100, Math.round(character.affinity ?? 0))),
});

const normalizeCharacterState = (character: CharacterState): CharacterState =>
  normalizeAffinity(normalizeAbilityLoadout(normalizeTitleLoadout(normalizeRankForLevel(applyDerivedVitals(character)))));

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
  storyNotification: StoryNotification | null;
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
  startQuest: (questId: string, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  claimQuest: () => { ok: boolean; reason?: string };
  conquerTowerFloor: (floorNumber: number, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  attemptRankUp: (committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  clearLevelUpEvent: () => void;
  clearLevelDownEvent: () => void;
  dismissStoryNotification: () => void;
  markNpcTabOpened: () => void;
  respondRescueNpcRequest: (accept: boolean) => { ok: boolean; reason?: string; status?: RescueNpcStatus };
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
  const [lastRankUpOutcome, setLastRankUpOutcome] = useState<RankUpOutcome | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<GameState["levelUpEvent"]>(null);
  const [levelDownEvent, setLevelDownEvent] = useState<GameState["levelDownEvent"]>(null);
  const [storyState, setStoryState] = useState<StoryState>(DEFAULT_STORY_STATE);
  const [storyNotification, setStoryNotification] = useState<StoryNotification | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const currentGuildMaster = getGuildMasterForRank(character?.adventurerRank);

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
              towerProgress: state.character.towerProgress ?? { highestFloorCleared: 0 },
              health: state.character.health ?? 100,
              healthCap: state.character.healthCap ?? 100,
              staminaLastTickAtMs: state.character.staminaLastTickAtMs ?? Date.now(),
              focus: state.character.focus ?? 12,
              focusCap: state.character.focusCap ?? 12,
              focusLastTickAtMs: state.character.focusLastTickAtMs ?? Date.now(),
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

    setStoryState({
      rescueNpcStatus: "available",
      rescueNpcUnreadCount: 1,
    });
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
    setLastTowerOutcome(null);
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

  const createCharacter = (name: string, avatarId: AvatarId) => {
    if (!selectedClass || character) {
      return;
    }

    const nextSequence = (classSequenceByClass[selectedClass] ?? 0) + 1;
    const created = mockGameService.createCharacter(name, selectedClass, avatarId, nextSequence);
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
      QUESTS.filter((quest) =>
        quest.id === RESCUE_QUEST_ID ? storyState.rescueNpcStatus === "accepted" : true,
      ),
    [storyState.rescueNpcStatus],
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
    setLastQuestOutcome(null);
    setLastTowerOutcome(null);
    setLastRankUpOutcome(null);
    return { ok: true, reason: result.reason };
  };

  const claimQuest = () => {
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
    });

    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to claim quest." };
    }

    let nextCharacter = result.character;
    let nextOutcome = result.outcome ?? null;
    let claimReason = result.outcome?.summary;
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
    }

    captureLevelUpEvent(currentCharacter, nextCharacter);
    captureLevelDownEvent(currentCharacter, nextCharacter, "Rank trial penalty");
    setCharacter(normalizeCharacterState(nextCharacter));
    setDailies(result.dailies);
    if (nextOutcome) {
      setLastQuestOutcome(nextOutcome);
    }
    if (result.outcome?.success) {
      setCompletedQuestCount((count) => count + 1);
    }
    setActiveQuest(null);
    setLastRankUpOutcome(null);
    return { ok: true, reason: claimReason };
  };

  const conquerTowerFloor = (floorNumber: number, committedItems?: Record<ItemId, number>) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(normalizeCharacterState(currentCharacter));
    }
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const result = mockGameService.conquerTowerFloor({
      character: currentCharacter,
      dailies,
      floor,
      committedItems,
    });

    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to challenge floor." };
    }

    captureLevelUpEvent(currentCharacter, result.character);
    setCharacter(normalizeCharacterState(result.character));
    setDailies(result.dailies);
    setLastTowerOutcome(result.outcome ?? null);
    setLastRankUpOutcome(null);
    return { ok: true, reason: result.outcome?.summary };
  };

  const canClaimQuest = useMemo(
    () => Boolean(activeQuest && Date.now() >= activeQuest.endsAtMs),
    [activeQuest],
  );

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
    if (currentCharacter.health <= 0) {
      return { allowed: false, reason: "Incapacitated. Visit Guild NPC for revival." };
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
    return calculateTowerSuccessChance(currentCharacter, floor, committedItems);
  };

  const getTowerAccess = (floorNumber: number): { allowed: boolean; reason?: string } => {
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!floor || !currentCharacter) {
      return { allowed: false, reason: "Character unavailable." };
    }
    if (currentCharacter.health <= 0) {
      return { allowed: false, reason: "Incapacitated. Visit Guild NPC for revival." };
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

  const requestGuildMageRecovery = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }
    if (character.health > 0) {
      return { ok: false, reason: "Guild revival is only available when HP is 0." };
    }
    if (character.progression.level <= 1) {
      return { ok: false, reason: "Guild mage recovery requires at least Level 2." };
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
    return { ok: true, reason: "10th-circle mage revived you to full health. Level -1 applied." };
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
    if (itemId && itemId !== "health-potion") {
      return { ok: false, reason: "This item does not restore health." };
    }
    const owned = currentCharacter.inventory["health-potion"] ?? 0;
    if (owned <= 0) {
      return { ok: false, reason: "No Health Potion in inventory." };
    }
    const restoreAmount = 35;
    const nextHealth = currentCharacter.health + restoreAmount;
    setCharacter(
      normalizeCharacterState({
        ...currentCharacter,
        health: nextHealth,
        inventory: {
          ...(currentCharacter.inventory ?? {}),
          "health-potion": owned - 1,
        },
      }),
    );
    return { ok: true, reason: `Health Potion used. Recovered ${nextHealth - currentCharacter.health} HP.` };
  };

  const dismissStoryNotification = () => setStoryNotification(null);

  const markNpcTabOpened = () => {
    setStoryState((current) =>
      current.rescueNpcUnreadCount > 0 ? { ...current, rescueNpcUnreadCount: 0 } : current,
    );
  };

  const respondRescueNpcRequest = (accept: boolean) => {
    const currentStatus = storyState.rescueNpcStatus;
    if (!character || character.progression.level < 2) {
      return { ok: false, reason: "This request has not appeared yet." };
    }
    if (currentStatus === "locked" || currentStatus === "gone") {
      return { ok: false, reason: "The adventurer is no longer in the guild hall." };
    }

    if (accept) {
      setStoryState({
        rescueNpcStatus: "accepted",
        rescueNpcUnreadCount: 0,
      });
      setStoryNotification(null);
      return {
        ok: true,
        reason: "You accepted the request. New quest unlocked: Aldric Vale's Child Rescue.",
        status: "accepted" as RescueNpcStatus,
      };
    }

    if (currentStatus === "available") {
      setStoryState((current) => ({ ...current, rescueNpcStatus: "refused_once", rescueNpcUnreadCount: 0 }));
      return {
        ok: true,
        reason: "Aldric pleads again: \"Please, she is all I have. I beg you... reconsider.\"",
        status: "refused_once" as RescueNpcStatus,
      };
    }

    setStoryState((current) => ({ ...current, rescueNpcStatus: "gone", rescueNpcUnreadCount: 0 }));
    return {
      ok: true,
      reason: "You refused again. Aldric quietly leaves the guild hall.",
      status: "gone" as RescueNpcStatus,
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
    lastRankUpOutcome,
    levelUpEvent,
    levelDownEvent,
    storyState,
    storyNotification,
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
    getQuestSuccessChance,
    getQuestAccess,
    getTowerSuccessChance,
    getTowerAccess,
    getNextRankTrial,
    getRankTrialAccess,
    getRankTrialSuccessChance,
    buyGuildItem,
    sellGuildItem,
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
    startQuest,
    claimQuest,
    conquerTowerFloor,
    attemptRankUp,
    clearLevelUpEvent,
    clearLevelDownEvent,
    dismissStoryNotification,
    markNpcTabOpened,
    respondRescueNpcRequest,
  };
};
