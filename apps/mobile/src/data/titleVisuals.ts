import { ImageSourcePropType } from "react-native";
import { TitleId } from "../types/game";
import { s3AssetWithFallback } from "../lib/assetSource";

export const TITLE_ICON_ART: Record<TitleId, ImageSourcePropType> = {
  "title-camp-vanguard": s3AssetWithFallback("ui/hud/badges/stamp_badge.png", require("../../assets/ui/hud/badges/stamp_badge.png")),
  "title-forest-strider": s3AssetWithFallback("game/materials/epic/feather-special.png", require("../../assets/game/materials/epic/feather-special.png")),
  "title-iron-oath": s3AssetWithFallback("game/weapons/class/warrior-emberblade.png", require("../../assets/game/weapons/class/warrior-emberblade.png")),
  "title-arcane-disciple": s3AssetWithFallback("game/weapons/class/mage-astralspire.png", require("../../assets/game/weapons/class/mage-astralspire.png")),
  "title-tower-trailblazer": s3AssetWithFallback("game/materials/epic/dust-nova.png", require("../../assets/game/materials/epic/dust-nova.png")),
  "title-first-snare": s3AssetWithFallback("ui/hud/badges/rank_badge.png", require("../../assets/ui/hud/badges/rank_badge.png")),
  "title-crown-aspirant": s3AssetWithFallback("ui/hud/badges/rank_badge.png", require("../../assets/ui/hud/badges/rank_badge.png")),
};
