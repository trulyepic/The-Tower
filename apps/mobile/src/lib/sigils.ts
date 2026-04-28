import { ITEM_BY_ID } from "../data/items";
import { CharacterState, ItemDefinition } from "../types/game";

export const getEquippedSigilItems = (character: CharacterState): ItemDefinition[] =>
  (character.equippedBuffIds ?? [])
    .map((itemId) => ITEM_BY_ID[itemId])
    .filter((item): item is ItemDefinition => Boolean(item && item.category === "buff"));

const getPreferredSigilVisual = (character: CharacterState) => {
  const preferredItemId = character.sigilAppearanceItemId;
  if (!preferredItemId || (character.inventory?.[preferredItemId] ?? 0) <= 0) {
    return null;
  }
  const item = ITEM_BY_ID[preferredItemId];
  return item?.category === "buff" ? item.sigilVisual ?? null : null;
};

export const getEquippedSigilArmor = (character: CharacterState): number =>
  getEquippedSigilItems(character).reduce((sum, item) => sum + (item.buffStats?.armorFlat ?? 0), 0);

export const getPrimarySigilVisual = (character: CharacterState) => {
  if (character.sigilAppearanceMode === "default_frame") {
    return null;
  }
  const preferredVisual = getPreferredSigilVisual(character);
  if (preferredVisual) {
    return preferredVisual;
  }
  const sigils = getEquippedSigilItems(character).filter((item) => item.sigilVisual);
  if (sigils.length === 0) {
    return null;
  }
  const selected = sigils[sigils.length - 1];
  return selected?.sigilVisual ?? null;
};

export const getSigilVisualLayers = (character: CharacterState) =>
  character.sigilAppearanceMode === "default_frame"
    ? []
    : (() => {
        const equippedSigils = getEquippedSigilItems(character).filter((item) => item.sigilVisual);
        if (equippedSigils.length === 0) {
          return [];
        }
        const preferredVisual = getPreferredSigilVisual(character);
        if (preferredVisual) {
          return Array.from({ length: Math.min(3, equippedSigils.length) }, () => preferredVisual);
        }
        return equippedSigils
          .slice(-3)
          .map((item) => item.sigilVisual!)
          .filter(Boolean);
      })();

export const getSigilAvatarState = (character: CharacterState) => {
  const totalArmor = getEquippedSigilArmor(character);
  const primaryVisual = getPrimarySigilVisual(character);
  const visualLayers = getSigilVisualLayers(character);
  return {
    hasSigil: Boolean(primaryVisual),
    totalArmor,
    visibleArmorPips: Math.max(0, Math.min(8, totalArmor)),
    frameShape: primaryVisual?.frameShape ?? "square",
    accentColor: primaryVisual?.accentColor ?? "#d1b07b",
    visualLayers,
  };
};
