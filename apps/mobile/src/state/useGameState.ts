import { useEffect, useMemo, useState } from "react";
import { BASE_CLASSES } from "../data/classes";
import { INITIAL_DAILIES } from "../data/dailies";
import { ITEM_BY_ID } from "../data/items";
import { QUESTS } from "../data/quests";
import { TOWER_FLOORS } from "../data/towerFloors";
import { DEFAULT_AVATAR_BY_CLASS } from "../data/uiSprites";
import { loadPersistedState, savePersistedState } from "../lib/localStateStorage";
import { getBuffSlotLimit, pruneExpiredBuffs } from "../lib/buffs";
import {
  calculateQuestSuccessChance,
  calculateTowerSuccessChance,
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
  QuestOutcome,
  QuestDefinition,
  TowerFloorDefinition,
  TowerOutcome,
} from "../types/game";

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const STAMINA_REGEN_TICK_MS = 30 * 1000;

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
  pruneExpiredBuffs(applyStaminaRegen(character, nowMs), nowMs);

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
  isHydrated: boolean;
  canClaimQuest: boolean;
  chooseClass: (classId: BaseClassId) => void;
  createCharacter: (name: string, avatarId: AvatarId) => void;
  getQuestSuccessChance: (questId: string) => number;
  getQuestAccess: (questId: string) => { allowed: boolean; reason?: string };
  getTowerSuccessChance: (floorNumber: number) => number;
  getTowerAccess: (floorNumber: number) => { allowed: boolean; reason?: string };
  buyGuildItem: (
    itemId: ItemId,
    unitPrice: number,
    amount?: number,
    classRestriction?: BaseClassId,
  ) => { ok: boolean; reason?: string };
  equipWeapon: (itemId: ItemId) => { ok: boolean; reason?: string };
  unequipWeapon: () => { ok: boolean; reason?: string };
  equipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  unequipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  activateBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  deactivateBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  startQuest: (questId: string) => { ok: boolean; reason?: string };
  claimQuest: () => { ok: boolean; reason?: string };
  conquerTowerFloor: (floorNumber: number) => { ok: boolean; reason?: string };
}

export const useGameState = (): GameState => {
  const [selectedClass, setSelectedClass] = useState<BaseClassId | null>(null);
  const [character, setCharacter] = useState<CharacterState | null>(null);
  const [activeQuest, setActiveQuest] = useState<ActiveQuestState | null>(null);
  const [lastQuestOutcome, setLastQuestOutcome] = useState<QuestOutcome | null>(null);
  const [dailies, setDailies] = useState<DailyTask[]>(INITIAL_DAILIES);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [lastTowerOutcome, setLastTowerOutcome] = useState<TowerOutcome | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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
              avatarId: state.character.avatarId ?? DEFAULT_AVATAR_BY_CLASS[state.character.classId],
              equippedWeaponId: state.character.equippedWeaponId ?? null,
              equippedBuffIds: state.character.equippedBuffIds ?? [],
              activeBuffExpiresAtMs:
                state.character.activeBuffExpiresAtMs ??
                // Backward compatibility for previous field name.
                (state.character as CharacterState & { equippedBuffExpiresAtMs?: Record<string, number> })
                  .equippedBuffExpiresAtMs ??
                {},
              pausedBuffRemainingMs: state.character.pausedBuffRemainingMs ?? {},
              inventory: state.character.inventory ?? {},
              towerProgress: state.character.towerProgress ?? { highestFloorCleared: 0 },
              staminaLastTickAtMs: state.character.staminaLastTickAtMs ?? Date.now(),
            }
          : state.character;
        const hydratedCharacter = normalizedCharacter
          ? applyTimedState(normalizedCharacter, Date.now())
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
        setCharacter(hydratedCharacter);
        setActiveQuest(normalizedActiveQuest);
        setDailies(state.dailies);
        setCompletedQuestCount(state.completedQuestCount);
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
      activeQuest,
      dailies,
      completedQuestCount,
    });
  }, [selectedClass, character, activeQuest, dailies, completedQuestCount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timer = setInterval(() => {
      setCharacter((current) => (current ? applyTimedState(current, Date.now()) : current));
    }, STAMINA_REGEN_TICK_MS);

    return () => clearInterval(timer);
  }, [isHydrated]);

  const chooseClass = (classId: BaseClassId) => setSelectedClass(classId);

  const createCharacter = (name: string, avatarId: AvatarId) => {
    if (!selectedClass || character) {
      return;
    }

    setCharacter(mockGameService.createCharacter(name, selectedClass, avatarId));
  };

  const startQuest = (questId: string) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(currentCharacter);
    }
    const quest = QUESTS.find((item) => item.id === questId);
    const result = mockGameService.startQuest({
      character: currentCharacter,
      activeQuest,
      dailies,
      quest,
      nowMs: Date.now(),
    });

    if (!result.ok || !result.character || !result.dailies || !result.activeQuest) {
      return { ok: false, reason: result.reason ?? "Unable to start quest." };
    }

    setCharacter(result.character);
    setDailies(result.dailies);
    setActiveQuest(result.activeQuest);
    setLastQuestOutcome(null);
    setLastTowerOutcome(null);
    return { ok: true };
  };

  const claimQuest = () => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(currentCharacter);
    }
    const quest = QUESTS.find((item) => item.id === activeQuest?.questId);
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

    setCharacter(result.character);
    setDailies(result.dailies);
    if (result.outcome) {
      setLastQuestOutcome(result.outcome);
    }
    if (result.outcome?.success) {
      setCompletedQuestCount((count) => count + 1);
    }
    setActiveQuest(null);
    return { ok: true, reason: result.outcome?.summary };
  };

  const conquerTowerFloor = (floorNumber: number) => {
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (currentCharacter && currentCharacter !== character) {
      setCharacter(currentCharacter);
    }
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const result = mockGameService.conquerTowerFloor({
      character: currentCharacter,
      dailies,
      floor,
    });

    if (!result.ok || !result.character || !result.dailies) {
      return { ok: false, reason: result.reason ?? "Unable to challenge floor." };
    }

    setCharacter(result.character);
    setDailies(result.dailies);
    setLastTowerOutcome(result.outcome ?? null);
    return { ok: true, reason: result.outcome?.summary };
  };

  const canClaimQuest = useMemo(
    () => Boolean(activeQuest && Date.now() >= activeQuest.endsAtMs),
    [activeQuest],
  );

  const getQuestSuccessChance = (questId: string): number => {
    const quest = QUESTS.find((item) => item.id === questId);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!quest || !currentCharacter) {
      return 0;
    }
    return calculateQuestSuccessChance(currentCharacter, quest);
  };

  const getQuestAccess = (questId: string): { allowed: boolean; reason?: string } => {
    const quest = QUESTS.find((item) => item.id === questId);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!quest || !currentCharacter) {
      return { allowed: false, reason: "Character unavailable." };
    }
    return hasQuestAccess(currentCharacter, quest);
  };

  const getTowerSuccessChance = (floorNumber: number): number => {
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!floor || !currentCharacter) {
      return 0;
    }
    return calculateTowerSuccessChance(currentCharacter, floor);
  };

  const getTowerAccess = (floorNumber: number): { allowed: boolean; reason?: string } => {
    const floor = TOWER_FLOORS.find((item) => item.floorNumber === floorNumber);
    const currentCharacter = character ? applyTimedState(character, Date.now()) : character;
    if (!floor || !currentCharacter) {
      return { allowed: false, reason: "Character unavailable." };
    }
    return hasTowerAccess(currentCharacter, floor);
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

    setCharacter(result.character);
    return { ok: true };
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

    setCharacter({
      ...character,
      equippedWeaponId: itemId,
    });

    return { ok: true };
  };

  const unequipWeapon = () => {
    if (!character) {
      return { ok: false, reason: "Create your adventurer first." };
    }

    if (!character.equippedWeaponId) {
      return { ok: false, reason: "No weapon equipped." };
    }

    setCharacter({
      ...character,
      equippedWeaponId: null,
    });

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

    setCharacter({
      ...currentCharacter,
      equippedBuffIds: [...equipped, itemId],
    });
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
    setCharacter({
      ...currentCharacter,
      equippedBuffIds: equipped.filter((id) => id !== itemId),
      activeBuffExpiresAtMs: nextExpiries,
      pausedBuffRemainingMs: nextPaused,
    });
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

    setCharacter({
      ...currentCharacter,
      activeBuffExpiresAtMs: {
        ...(currentCharacter.activeBuffExpiresAtMs ?? {}),
        [itemId]: nowMs + durationMs,
      },
      pausedBuffRemainingMs: nextPaused,
    });
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

    setCharacter({
      ...currentCharacter,
      activeBuffExpiresAtMs: nextActive,
      pausedBuffRemainingMs: nextPaused,
    });
    return { ok: true };
  };

  return {
    classes: BASE_CLASSES,
    quests: QUESTS,
    towerFloors: TOWER_FLOORS,
    dailies,
    character,
    selectedClass,
    activeQuest,
    lastQuestOutcome,
    completedQuestCount,
    lastTowerOutcome,
    isHydrated,
    canClaimQuest,
    chooseClass,
    createCharacter,
    getQuestSuccessChance,
    getQuestAccess,
    getTowerSuccessChance,
    getTowerAccess,
    buyGuildItem,
    equipWeapon,
    unequipWeapon,
    equipBuff,
    unequipBuff,
    activateBuff,
    deactivateBuff,
    startQuest,
    claimQuest,
    conquerTowerFloor,
  };
};
