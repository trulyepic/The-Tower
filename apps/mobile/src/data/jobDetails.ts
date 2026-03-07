export interface JobDetail {
  name: string;
  icon: string;
  role: string;
  pitch: string;
  tags: string[];
}

export const JOB_DETAILS: Record<string, JobDetail> = {
  Knight: {
    name: "Knight",
    icon: "shield-crown",
    role: "Vanguard Tank",
    pitch: "Absorbs damage and protects allies with guard stances.",
    tags: ["Guard", "Counter", "High Vitality"],
  },
  Berserker: {
    name: "Berserker",
    icon: "axe-battle",
    role: "Burst Bruiser",
    pitch: "Trades defense for explosive damage and rage spikes.",
    tags: ["Rage", "Execute", "Lifesteal"],
  },
  Assassin: {
    name: "Assassin",
    icon: "knife-military",
    role: "Critical Striker",
    pitch: "High mobility finisher that chains stealth attacks.",
    tags: ["Stealth", "Crit", "Bleed"],
  },
  Beastmaster: {
    name: "Beastmaster",
    icon: "paw",
    role: "Summon Controller",
    pitch: "Commands companions for pressure and utility control.",
    tags: ["Summon", "Traps", "Utility"],
  },
  Sorcerer: {
    name: "Sorcerer",
    icon: "weather-lightning",
    role: "Arcane Nuker",
    pitch: "Builds spell charge and unleashes massive bursts.",
    tags: ["Burst", "Mana", "AOE"],
  },
  Cleric: {
    name: "Cleric",
    icon: "hand-heart",
    role: "Battle Support",
    pitch: "Sustains allies with heals and holy protection.",
    tags: ["Heal", "Shield", "Purify"],
  },
};

