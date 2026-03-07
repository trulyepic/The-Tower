import { BaseClassId } from "../types/game";

export interface ClassArtwork {
  image: number;
  icon: "sword-cross" | "bow-arrow" | "auto-fix";
  top: string;
  bottom: string;
  glow: string;
  spark: string;
}

export const CLASS_ARTWORK: Record<BaseClassId, ClassArtwork> = {
  warrior: {
    image: require("../../assets/game/characters/class/warrior-portrait.png"),
    icon: "sword-cross",
    top: "#2a4d9e",
    bottom: "#7b2f34",
    glow: "#ff9f6e",
    spark: "#ffd08a",
  },
  ranger: {
    image: require("../../assets/game/characters/class/ranger-portrait.png"),
    icon: "bow-arrow",
    top: "#22507c",
    bottom: "#1a6b58",
    glow: "#7ce3c0",
    spark: "#b4f9cf",
  },
  mage: {
    image: require("../../assets/game/characters/class/mage-portrait.png"),
    icon: "auto-fix",
    top: "#3f4bb9",
    bottom: "#7a339e",
    glow: "#9fd8ff",
    spark: "#d8c8ff",
  },
};
