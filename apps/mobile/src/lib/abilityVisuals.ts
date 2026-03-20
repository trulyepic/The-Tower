import { ImageSourcePropType } from "react-native";
import { ABILITY_BY_ID } from "../data/abilities";
import { AbilityId, ClassAbilityDefinition } from "../types/game";

export type AbilityAccent = {
  border: string;
  background: string;
  icon: string;
  label: string;
};

const ART_BY_ABILITY_ID: Partial<Record<AbilityId, ImageSourcePropType>> = {
  "ability-warrior-iron-will": require("../../assets/game/abilities/warrior/iron-will-v2.png"),
};

const ACCENTS_BY_ABILITY_ID: Partial<Record<AbilityId, AbilityAccent>> = {
  "ability-warrior-iron-will": {
    border: "#d8ab66",
    background: "rgba(112, 71, 28, 0.9)",
    icon: "#ffdba0",
    label: "#ffd6a2",
  },
  "ability-warrior-combat-discipline": {
    border: "#7ecf9e",
    background: "rgba(39, 102, 71, 0.92)",
    icon: "#b9ffd3",
    label: "#d9ffea",
  },
  "ability-warrior-steel-rhythm": {
    border: "#a98fe8",
    background: "rgba(75, 53, 126, 0.9)",
    icon: "#ddcfff",
    label: "#efe4ff",
  },
  "ability-warrior-bulwark-oath": {
    border: "#67c1ea",
    background: "rgba(29, 73, 116, 0.9)",
    icon: "#a8e8ff",
    label: "#d7f3ff",
  },
  "ability-warrior-shield-doctrine": {
    border: "#77d3ff",
    background: "rgba(26, 70, 108, 0.92)",
    icon: "#b8ebff",
    label: "#dff6ff",
  },
  "ability-warrior-bloodrush": {
    border: "#ec838a",
    background: "rgba(111, 34, 48, 0.9)",
    icon: "#ffc2c5",
    label: "#ffd7d9",
  },
  "ability-warrior-frenzy-instinct": {
    border: "#ff9197",
    background: "rgba(121, 36, 53, 0.92)",
    icon: "#ffc8cb",
    label: "#ffe0e2",
  },
  "ability-ranger-scout-path": {
    border: "#7ecf9e",
    background: "rgba(39, 102, 71, 0.92)",
    icon: "#b9ffd3",
    label: "#d9ffea",
  },
  "ability-mage-arcane-surge": {
    border: "#8f8cff",
    background: "rgba(59, 52, 138, 0.92)",
    icon: "#d5d2ff",
    label: "#ecebff",
  },
};

export const getAbilityAccent = (abilityId?: string | null): AbilityAccent => {
  if (abilityId && ACCENTS_BY_ABILITY_ID[abilityId as AbilityId]) {
    return ACCENTS_BY_ABILITY_ID[abilityId as AbilityId] as AbilityAccent;
  }
  return {
    border: "#8e7b5f",
    background: "rgba(73, 57, 34, 0.92)",
    icon: "#f0dfb3",
    label: "#f2e5c7",
  };
};

export const getAbilityKindAccent = (ability: ClassAbilityDefinition): AbilityAccent => {
  const direct = getAbilityAccent(ability.id);
  if (ACCENTS_BY_ABILITY_ID[ability.id]) {
    return direct;
  }
  if ((ability.kind ?? "skill") === "passive") {
    if (ability.pathGroup === "knight") {
      return {
        border: "#77d3ff",
        background: "rgba(26, 70, 108, 0.92)",
        icon: "#b8ebff",
        label: "#dff6ff",
      };
    }
    if (ability.pathGroup === "berserker") {
      return {
        border: "#ff9197",
        background: "rgba(121, 36, 53, 0.92)",
        icon: "#ffc8cb",
        label: "#ffe0e2",
      };
    }
    return {
      border: "#7ecf9e",
      background: "rgba(39, 102, 71, 0.92)",
      icon: "#b9ffd3",
      label: "#d9ffea",
    };
  }
  return direct;
};

export const getAbilityDisplayName = (abilityId?: string | null): string => {
  if (!abilityId) {
    return "";
  }
  return ABILITY_BY_ID[abilityId as AbilityId]?.name ?? "";
};

export const getAbilityArtSource = (abilityId?: string | null): ImageSourcePropType | null => {
  if (!abilityId) {
    return null;
  }
  return ART_BY_ABILITY_ID[abilityId as AbilityId] ?? null;
};
