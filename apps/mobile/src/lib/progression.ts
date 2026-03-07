import { CharacterProgress } from "../types/game";

export const getXpToNextLevel = (level: number): number => 100 + (level - 1) * 60;

export const getMasteryXpToNextLevel = (masteryLevel: number): number =>
  80 + (masteryLevel - 1) * 40;

export const createInitialProgress = (): CharacterProgress => ({
  level: 1,
  xpInLevel: 0,
  xpToNextLevel: getXpToNextLevel(1),
  masteryLevel: 1,
  masteryXpInLevel: 0,
  masteryXpToNextLevel: getMasteryXpToNextLevel(1),
});

/**
 * Applies XP and mastery XP using level-up loops so progress can support
 * larger rewards in a single claim (important for future events/boosts).
 */
export const applyProgressGain = (
  current: CharacterProgress,
  xpGain: number,
  masteryXpGain: number,
): CharacterProgress => {
  let level = current.level;
  let xpInLevel = current.xpInLevel + xpGain;
  let xpToNextLevel = current.xpToNextLevel;

  while (xpInLevel >= xpToNextLevel) {
    xpInLevel -= xpToNextLevel;
    level += 1;
    xpToNextLevel = getXpToNextLevel(level);
  }

  let masteryLevel = current.masteryLevel;
  let masteryXpInLevel = current.masteryXpInLevel + masteryXpGain;
  let masteryXpToNextLevel = current.masteryXpToNextLevel;

  while (masteryXpInLevel >= masteryXpToNextLevel) {
    masteryXpInLevel -= masteryXpToNextLevel;
    masteryLevel += 1;
    masteryXpToNextLevel = getMasteryXpToNextLevel(masteryLevel);
  }

  return {
    level,
    xpInLevel,
    xpToNextLevel,
    masteryLevel,
    masteryXpInLevel,
    masteryXpToNextLevel,
  };
};

