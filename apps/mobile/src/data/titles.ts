import { TitleDefinition, TitleId } from "../types/game";

export const TITLES: TitleDefinition[] = [
  {
    id: "title-camp-vanguard",
    name: "Camp Vanguard",
    icon: "campfire",
    rarity: "common",
    minLevel: 1,
    flavor: "Trusted first responder of the guild perimeter.",
    abilityLabel: "Steady Hands",
    unlockRequirement: {
      type: "quest_starts",
      questId: "gather-herb-run",
      requiredCount: 3,
    },
    bonuses: {
      damageFlat: 2,
      questSuccessFlat: 2,
    },
  },
  {
    id: "title-forest-strider",
    name: "Forest Strider",
    icon: "pine-tree",
    rarity: "rare",
    minLevel: 6,
    classRestriction: "ranger",
    flavor: "Tracks movement through rough routes without losing pace.",
    abilityLabel: "Trail Instinct",
    bonuses: {
      speedFlat: 3,
      critFlat: 2,
      questSuccessFlat: 2,
    },
  },
  {
    id: "title-iron-oath",
    name: "Iron Oath",
    icon: "shield-sword-outline",
    rarity: "rare",
    minLevel: 6,
    classRestriction: "warrior",
    flavor: "A sworn wall who breaks enemy lines by force.",
    abilityLabel: "Frontline Command",
    bonuses: {
      damageFlat: 4,
      questSuccessFlat: 1,
    },
  },
  {
    id: "title-arcane-disciple",
    name: "Arcane Disciple",
    icon: "magic-staff",
    rarity: "rare",
    minLevel: 6,
    classRestriction: "mage",
    flavor: "Channeler marked by stable and disciplined casting.",
    abilityLabel: "Mana Precision",
    bonuses: {
      critFlat: 3,
      questSuccessFlat: 2,
    },
  },
  {
    id: "title-tower-trailblazer",
    name: "Tower Trailblazer",
    icon: "stairs",
    rarity: "epic",
    minLevel: 12,
    flavor: "Recognized for repeated breakthroughs on higher floors.",
    abilityLabel: "Momentum Drive",
    bonuses: {
      damageFlat: 5,
      speedFlat: 3,
      questSuccessFlat: 4,
    },
  },
  {
    id: "title-crown-aspirant",
    name: "Crown Aspirant",
    icon: "crown-outline",
    rarity: "legendary",
    minLevel: 20,
    flavor: "A claimant whose will bends every expedition forward.",
    abilityLabel: "Royal Pressure",
    bonuses: {
      damageFlat: 8,
      critFlat: 5,
      speedFlat: 4,
      questSuccessFlat: 6,
    },
  },
];

export const TITLE_BY_ID: Record<TitleId, TitleDefinition> = Object.fromEntries(
  TITLES.map((title) => [title.id, title]),
) as Record<TitleId, TitleDefinition>;
