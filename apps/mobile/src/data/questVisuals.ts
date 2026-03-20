import { ImageSourcePropType } from "react-native";
import { s3AssetWithFallback } from "../lib/assetSource";

export interface QuestVisualTheme {
  backdrop: ImageSourcePropType;
  sceneLabel: string;
  overlay: [string, string, string];
}

export const QUEST_BACKGROUND_ART: Record<string, QuestVisualTheme> = {
  "gather-herb-run": {
    backdrop: s3AssetWithFallback("game/quests/forage-near-camp-full.png", require("../../assets/game/quests/forage-near-camp-full.png")),
    sceneLabel: "Campfire Foraging Route",
    overlay: ["rgba(24, 18, 9, 0.2)", "rgba(18, 20, 40, 0.54)", "rgba(10, 11, 23, 0.84)"],
  },
  "gather-ruin-supplies": {
    backdrop: s3AssetWithFallback("game/quests/scavenge-ruin-supplies.png", require("../../assets/game/quests/scavenge-ruin-supplies.png")),
    sceneLabel: "Collapsed Ruins",
    overlay: ["rgba(58, 43, 29, 0.56)", "rgba(33, 33, 48, 0.72)", "rgba(14, 14, 27, 0.85)"],
  },
  "quest-bandit-hideout": {
    backdrop: s3AssetWithFallback("game/quests/raid-bandit-hideout.png", require("../../assets/game/quests/raid-bandit-hideout.png")),
    sceneLabel: "Bandit Encampment",
    overlay: ["rgba(66, 30, 24, 0.56)", "rgba(35, 29, 46, 0.74)", "rgba(14, 12, 24, 0.86)"],
  },
  "quest-aldric-child-rescue": {
    backdrop: s3AssetWithFallback("game/quests/raid-bandit-hideout.png", require("../../assets/game/quests/raid-bandit-hideout.png")),
    sceneLabel: "Bandit Rescue Trail",
    overlay: ["rgba(66, 30, 24, 0.58)", "rgba(32, 24, 42, 0.74)", "rgba(13, 10, 23, 0.88)"],
  },
  "quest-sealed-crypt": {
    backdrop: s3AssetWithFallback("game/quests/seal-the-crypt.png", require("../../assets/game/quests/seal-the-crypt.png")),
    sceneLabel: "Sealed Crypt Chamber",
    overlay: ["rgba(42, 28, 66, 0.58)", "rgba(26, 28, 48, 0.74)", "rgba(12, 12, 24, 0.88)"],
  },
  "quest-ancient-relay": {
    backdrop: s3AssetWithFallback("game/quests/retrieve-ancient-relay-core.png", require("../../assets/game/quests/retrieve-ancient-relay-core.png")),
    sceneLabel: "Ancient Relay Core",
    overlay: ["rgba(23, 39, 68, 0.58)", "rgba(28, 26, 50, 0.74)", "rgba(10, 14, 26, 0.88)"],
  },
  "quest-cinder-vulture-cull": {
    backdrop: s3AssetWithFallback("game/quests/raid-bandit-hideout.png", require("../../assets/game/quests/raid-bandit-hideout.png")),
    sceneLabel: "Cinder Gully Broodgrounds",
    overlay: ["rgba(61, 28, 21, 0.58)", "rgba(35, 27, 45, 0.72)", "rgba(14, 12, 23, 0.86)"],
  },
  "quest-lamp-reliquary-descent": {
    backdrop: s3AssetWithFallback("game/quests/seal-the-crypt.png", require("../../assets/game/quests/seal-the-crypt.png")),
    sceneLabel: "Hollow Lamp Reliquary",
    overlay: ["rgba(53, 36, 19, 0.54)", "rgba(28, 27, 48, 0.76)", "rgba(12, 11, 22, 0.88)"],
  },
  "hunt-leviathor-coiling-deep": {
    backdrop: s3AssetWithFallback("game/quests/retrieve-ancient-relay-core.png", require("../../assets/game/quests/retrieve-ancient-relay-core.png")),
    sceneLabel: "The Coiling Deep",
    overlay: ["rgba(16, 39, 70, 0.52)", "rgba(28, 23, 48, 0.76)", "rgba(8, 12, 24, 0.9)"],
  },
};
