/**
 * Shared game domain contracts.
 * These interfaces are intentionally framework-agnostic so mobile and backend
 * can import the same source of truth for gameplay data shapes.
 */

export type ClassId = string;
export type JobId = string;
export type QuestId = string;
export type ActivityType = "quest" | "training" | "gathering";

export interface StatBlock {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
}

export interface BaseClassDefinition {
  id: ClassId;
  name: string;
  description: string;
  statBias: Partial<StatBlock>;
  passiveTrait: string;
  contentTags: string[];
}

export interface AdvancedJobDefinition {
  id: JobId;
  baseClassId: ClassId;
  name: string;
  description: string;
  uniqueMechanic: string;
  unlockRequirements: {
    minLevel: number;
    requiredQuestIds: QuestId[];
    tokenCost?: number;
  };
}

export interface CharacterProgression {
  level: number;
  xp: number;
  classMasteryLevel: number;
  classMasteryXp: number;
}

export interface CharacterProfile {
  id: string;
  playerId: string;
  name: string;
  baseClassId: ClassId;
  activeJobId?: JobId;
  stats: StatBlock;
  progression: CharacterProgression;
}

export interface ActivityInstance {
  id: string;
  characterId: string;
  type: ActivityType;
  startedAtIso: string;
  endsAtIso: string;
  staminaCost: number;
}

export interface RewardBundle {
  xp: number;
  classMasteryXp: number;
  gold: number;
  itemIds: string[];
}

