import { BaseClassDefinition } from "../types/game";

export const BASE_CLASSES: BaseClassDefinition[] = [
  {
    id: "warrior",
    name: "Warrior",
    fantasy: "Frontline bruiser with durable defenses and strong finishers.",
    passiveTrait: "Iron Resolve: +10% stamina recovery from activities.",
    statFocus: "Strength / Vitality",
    advancedJobOptions: ["Knight", "Berserker"],
  },
  {
    id: "ranger",
    name: "Ranger",
    fantasy: "Adaptive hunter that thrives in scouting and precision strikes.",
    passiveTrait: "Pathfinder: bonus rewards from gathering and exploration.",
    statFocus: "Agility / Vitality",
    advancedJobOptions: ["Assassin", "Beastmaster"],
  },
  {
    id: "mage",
    name: "Mage",
    fantasy: "Arcane specialist with high burst and utility control.",
    passiveTrait: "Aether Study: +15% class mastery XP from training.",
    statFocus: "Intelligence / Vitality",
    advancedJobOptions: ["Sorcerer", "Cleric"],
  },
];

