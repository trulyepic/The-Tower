import { TITLE_BY_ID, TITLES } from "../data/titles";
import { CharacterState, TitleDefinition } from "../types/game";

export const getTitleSlotLimit = (level: number): number => {
  if (level >= 35) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  return 1;
};

export const isTitleUnlocked = (character: CharacterState, title: TitleDefinition): boolean => {
  if (character.progression.level < title.minLevel) {
    return false;
  }
  if (title.classRestriction && title.classRestriction !== character.classId) {
    return false;
  }
  return true;
};

export const isTitleOwned = (character: CharacterState, titleId: string): boolean =>
  (character.ownedTitleIds ?? []).includes(titleId);

export const isTitleDiscovered = (character: CharacterState, titleId: string): boolean =>
  (character.discoveredTitleIds ?? []).includes(titleId);

export const getTitleProgress = (character: CharacterState, titleId: string): number =>
  character.titleProgressById?.[titleId] ?? 0;

export const getTitleRequiredProgress = (title: TitleDefinition): number =>
  title.unlockRequirement?.requiredCount ?? 1;

export const getUnlockedTitles = (character: CharacterState): TitleDefinition[] =>
  TITLES.filter((title) => isTitleUnlocked(character, title));

export const getEquippedTitleItems = (character: CharacterState): TitleDefinition[] =>
  (character.equippedTitleIds ?? []).map((id) => TITLE_BY_ID[id]).filter(Boolean);

export const getDiscoveredTitleItems = (character: CharacterState): TitleDefinition[] =>
  (character.discoveredTitleIds ?? []).map((id) => TITLE_BY_ID[id]).filter(Boolean);
