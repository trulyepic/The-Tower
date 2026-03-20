import { ClimberEntry, FloorEncounterEventDefinition } from "../types/game";

export const INITIAL_RIVAL_CLIMBERS: ClimberEntry[] = [
  {
    id: "rival-kael",
    name: "Kael Thorn",
    classId: "warrior",
    avatarId: "warrior-2",
    level: 3,
    floor: 2,
    trend: "steady",
  },
  {
    id: "rival-seris",
    name: "Seris Vale",
    classId: "mage",
    avatarId: "mage-4",
    level: 4,
    floor: 3,
    trend: "steady",
  },
  {
    id: "rival-rowan",
    name: "Rowan Pike",
    classId: "ranger",
    avatarId: "ranger-1",
    level: 2,
    floor: 1,
    trend: "steady",
  },
  {
    id: "rival-nyx",
    name: "Nyx Ember",
    classId: "mage",
    avatarId: "mage-1",
    level: 5,
    floor: 4,
    trend: "steady",
  },
];

// Generic floor encounter board is reserved for opt-in, pre-entry encounters.
// Lyra Ashstep is intentionally not listed here because her appearance is a
// conditional in-floor rescue event triggered by poison pressure during Floor 1.
export const FLOOR_ENCOUNTER_EVENTS: FloorEncounterEventDefinition[] = [];

export const FLOOR_ENTRY_LORE: Record<
  number,
  {
    title: string;
    body: string;
  }
> = {
  1: {
    title: "Ashen Threshold",
    body:
      "The first gate remembers every climber. Ember dust hangs in the air, and the wardstones still whisper names " +
      "of those who turned back. Step forward, and the Tower marks you as one who chose ascent over safety.",
  },
  2: {
    title: "Thorn Corridor",
    body:
      "The second floor does not rush to kill you. It teaches the slower lesson first: the Tower can hold you in place, cut you open, and let the floor itself finish the work. Every vine here tests whether you learned to prepare before you learned to boast.",
  },
};

export const FLOOR_CLEAR_STORY: Record<
  number,
  {
    title: string;
    body: string;
    implication: string;
    mainQuestTitle: string;
    mainQuestBody: string;
    icon: string;
  }
> = {
  1: {
    title: "The Threshold Opens",
    body:
      "You did more than survive the first gate. Ashen Threshold has now recognized your climb as real, and the guild can no longer write you off as a beginner who merely got lucky once.",
    implication:
      "Clearing Floor 1 moves the climb out of raw survival and into deliberate ascent. The guild starts expecting preparation, not just nerve.",
    mainQuestTitle: "Chapter II Begins",
    mainQuestBody:
      "Thorn Corridor is now the next real measure of the climb. You can challenge it whenever you want, but better supplies, intel, and steadier footing will make the Tower pay more dearly for every mistake.",
    icon: "stairs-up",
  },
  2: {
    title: "The First Snare Breaks",
    body:
      "Thorn Corridor no longer owns your pace. You have proven that the climb can survive pressure that binds, bleeds, and drags instead of simply striking head-on.",
    implication:
      "Clearing Floor 2 tells the guild and the Tower the same thing: your ascent is no longer a novice's gamble. The early climb is over.",
    mainQuestTitle: "Beyond Beginnings",
    mainQuestBody:
      "The Tower will now test whether your route can keep shape past the first real trap. Build on this momentum before the next chapter turns restraint into punishment.",
    icon: "sprout-outline",
  },
};
