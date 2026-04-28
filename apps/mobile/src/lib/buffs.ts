import { ITEM_BY_ID } from "../data/items";
import { AdventurerRank, CharacterState } from "../types/game";

const BUFF_SLOT_LIMIT_BY_RANK: Record<AdventurerRank, number> = {
  F: 2,
  E: 2,
  D: 3,
  C: 3,
  B: 4,
  A: 4,
  S: 5,
  SS: 6,
};

export const getBuffSlotLimit = (rank: AdventurerRank, override?: number | null): number => {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.max(1, Math.floor(override));
  }
  return BUFF_SLOT_LIMIT_BY_RANK[rank] ?? 2;
};

export const getEquippedBuffItems = (character: CharacterState) =>
  (character.equippedBuffIds ?? [])
    .map((itemId) => ITEM_BY_ID[itemId])
    .filter((item) => item?.category === "buff");

export const isBuffActive = (character: CharacterState, itemId: string, nowMs = Date.now()): boolean =>
  (character.activeBuffExpiresAtMs?.[itemId] ?? 0) > nowMs;

export const getActiveBuffItems = (character: CharacterState, nowMs = Date.now()) =>
  (character.equippedBuffIds ?? [])
    .filter((itemId) => isBuffActive(character, itemId, nowMs))
    .map((itemId) => ITEM_BY_ID[itemId])
    .filter((item) => item?.category === "buff");

export const getBuffRemainingSeconds = (
  character: CharacterState,
  itemId: string,
  nowMs = Date.now(),
): number => {
  const expiresAt = character.activeBuffExpiresAtMs?.[itemId] ?? 0;
  if (expiresAt > nowMs) {
    return Math.max(0, Math.ceil((expiresAt - nowMs) / 1000));
  }
  const pausedMs = character.pausedBuffRemainingMs?.[itemId] ?? 0;
  return Math.max(0, Math.ceil(pausedMs / 1000));
};

export const pruneExpiredBuffs = (character: CharacterState, nowMs = Date.now()): CharacterState => {
  const equippedIds = character.equippedBuffIds ?? [];
  const currentActive = character.activeBuffExpiresAtMs ?? {};
  const currentPaused = character.pausedBuffRemainingMs ?? {};
  const activeEntries = Object.entries(currentActive);
  const pausedEntries = Object.entries(currentPaused);
  if (equippedIds.length === 0 && activeEntries.length === 0 && pausedEntries.length === 0) {
    return character;
  }

  const nextActive: Record<string, number> = {};
  for (const [itemId, expiresAt] of activeEntries) {
    if (equippedIds.includes(itemId) && expiresAt > nowMs) {
      nextActive[itemId] = expiresAt;
    }
  }
  const nextPaused: Record<string, number> = {};
  for (const [itemId, remainingMs] of pausedEntries) {
    if (equippedIds.includes(itemId) && remainingMs > 0 && !(nextActive[itemId] > nowMs)) {
      nextPaused[itemId] = remainingMs;
    }
  }
  if (
    Object.keys(nextActive).length === Object.keys(currentActive).length &&
    Object.keys(nextActive).every((itemId) => nextActive[itemId] === currentActive[itemId]) &&
    Object.keys(nextPaused).length === Object.keys(currentPaused).length &&
    Object.keys(nextPaused).every((itemId) => nextPaused[itemId] === currentPaused[itemId])
  ) {
    return character;
  }

  return {
    ...character,
    activeBuffExpiresAtMs: nextActive,
    pausedBuffRemainingMs: nextPaused,
  };
};

export const getEquippedBuffBonuses = (character: CharacterState) => {
  const activeBuffs = getActiveBuffItems(character);
  const equippedBuffs = getEquippedBuffItems(character);
  const activeBonuses = activeBuffs.reduce(
    (sum, buff) => ({
      damageFlat: sum.damageFlat + (buff?.buffStats?.damageFlat ?? 0),
      critFlat: sum.critFlat + (buff?.buffStats?.critFlat ?? 0),
      speedFlat: sum.speedFlat + (buff?.buffStats?.speedFlat ?? 0),
      questSuccessFlat: sum.questSuccessFlat + (buff?.buffStats?.questSuccessFlat ?? 0),
    }),
    {
      damageFlat: 0,
      critFlat: 0,
      speedFlat: 0,
      questSuccessFlat: 0,
    },
  );
  const armorFlat = equippedBuffs.reduce((sum, buff) => sum + (buff?.buffStats?.armorFlat ?? 0), 0);
  return {
    ...activeBonuses,
    armorFlat,
  };
};
