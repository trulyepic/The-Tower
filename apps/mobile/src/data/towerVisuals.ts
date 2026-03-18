import { ImageSourcePropType } from "react-native";
import { s3AssetWithFallback } from "../lib/assetSource";

export interface TowerVisualTheme {
  backdrop: ImageSourcePropType;
  sceneLabel: string;
  overlay: [string, string, string];
}

export const TOWER_BACKGROUND_ART: Record<string, TowerVisualTheme> = {
  "tower-floor-1": {
    backdrop: s3AssetWithFallback("game/tower/floor-1-gate-of-ash.png", require("../../assets/game/tower/floor-1-gate-of-ash.png")),
    sceneLabel: "Gate Sentinel And Warden Of Sparks",
    overlay: ["rgba(64, 32, 19, 0.44)", "rgba(35, 25, 48, 0.66)", "rgba(12, 12, 25, 0.84)"],
  },
};
