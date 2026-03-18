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
