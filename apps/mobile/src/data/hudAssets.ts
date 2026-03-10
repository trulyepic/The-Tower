import { s3AssetWithFallback } from "../lib/assetSource";

export const HUD_ASSETS = {
  frames: {
    panelFill: s3AssetWithFallback("ui/hud/frames/panel_fill.png", require("../../assets/ui/hud/frames/panel_fill.png")),
    panelFrame: s3AssetWithFallback("ui/hud/frames/panel_frame.png", require("../../assets/ui/hud/frames/panel_frame.png")),
    panelCorners: s3AssetWithFallback("ui/hud/frames/panel_corners.png", require("../../assets/ui/hud/frames/panel_corners.png")),
  },
  buttons: {
    primary: s3AssetWithFallback("ui/hud/buttons/button_primary.png", require("../../assets/ui/hud/buttons/button_primary.png")),
    secondary: s3AssetWithFallback("ui/hud/buttons/button_secondary.png", require("../../assets/ui/hud/buttons/button_secondary.png")),
  },
  tabs: {
    idle: s3AssetWithFallback("ui/hud/tabs/tab_idle.png", require("../../assets/ui/hud/tabs/tab_idle.png")),
    active: s3AssetWithFallback("ui/hud/tabs/tab_active.png", require("../../assets/ui/hud/tabs/tab_active.png")),
  },
  slots: {
    empty: s3AssetWithFallback("ui/hud/slots/slot_empty.png", require("../../assets/ui/hud/slots/slot_empty.png")),
    common: s3AssetWithFallback("ui/hud/slots/slot_common.png", require("../../assets/ui/hud/slots/slot_common.png")),
    rare: s3AssetWithFallback("ui/hud/slots/slot_rare.png", require("../../assets/ui/hud/slots/slot_rare.png")),
    epic: s3AssetWithFallback("ui/hud/slots/slot_epic.png", require("../../assets/ui/hud/slots/slot_epic.png")),
    legendary: s3AssetWithFallback("ui/hud/slots/slot_legendary.png", require("../../assets/ui/hud/slots/slot_legendary.png")),
  },
  badges: {
    rank: s3AssetWithFallback("ui/hud/badges/rank_badge.png", require("../../assets/ui/hud/badges/rank_badge.png")),
    stamp: s3AssetWithFallback("ui/hud/badges/stamp_badge.png", require("../../assets/ui/hud/badges/stamp_badge.png")),
  },
  progress: {
    track: s3AssetWithFallback("ui/hud/progress/progress_track.png", require("../../assets/ui/hud/progress/progress_track.png")),
    xpFill: s3AssetWithFallback("ui/hud/progress/progress_fill_xp.png", require("../../assets/ui/hud/progress/progress_fill_xp.png")),
    masteryFill: s3AssetWithFallback("ui/hud/progress/progress_fill_mastery.png", require("../../assets/ui/hud/progress/progress_fill_mastery.png")),
  },
  decor: {
    titlePlate: s3AssetWithFallback("ui/hud/decor/title_plate.png", require("../../assets/ui/hud/decor/title_plate.png")),
    bannerLong: s3AssetWithFallback("ui/hud/decor/banner_long.png", require("../../assets/ui/hud/decor/banner_long.png")),
    bannerShort: s3AssetWithFallback("ui/hud/decor/banner_short.png", require("../../assets/ui/hud/decor/banner_short.png")),
  },
  icons: {
    info: s3AssetWithFallback("ui/hud/icons/icon_info.png", require("../../assets/ui/hud/icons/icon_info.png")),
  },
  bgs: {
    inventoryBook: s3AssetWithFallback("ui/hud/bgs/inventory_book.png", require("../../assets/ui/hud/bgs/inventory_book.png")),
  },
} as const;
