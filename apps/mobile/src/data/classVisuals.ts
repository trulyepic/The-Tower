import { BaseClassId } from "../types/game";

export interface ClassVisualProfile {
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
}

export const CLASS_VISUALS: Record<BaseClassId, ClassVisualProfile> = {
  warrior: {
    stats: {
      strength: 88,
      agility: 42,
      intelligence: 28,
      vitality: 82,
    },
  },
  ranger: {
    stats: {
      strength: 56,
      agility: 86,
      intelligence: 44,
      vitality: 62,
    },
  },
  mage: {
    stats: {
      strength: 24,
      agility: 38,
      intelligence: 92,
      vitality: 50,
    },
  },
};

