export const HUD_ASSETS = {
  frames: {
    panelFill: require("../../assets/ui/hud/frames/panel_fill.png"),
    panelFrame: require("../../assets/ui/hud/frames/panel_frame.png"),
    panelCorners: require("../../assets/ui/hud/frames/panel_corners.png"),
  },
  buttons: {
    primary: require("../../assets/ui/hud/buttons/button_primary.png"),
    secondary: require("../../assets/ui/hud/buttons/button_secondary.png"),
  },
  tabs: {
    idle: require("../../assets/ui/hud/tabs/tab_idle.png"),
    active: require("../../assets/ui/hud/tabs/tab_active.png"),
  },
  slots: {
    empty: require("../../assets/ui/hud/slots/slot_empty.png"),
    common: require("../../assets/ui/hud/slots/slot_common.png"),
    rare: require("../../assets/ui/hud/slots/slot_rare.png"),
    epic: require("../../assets/ui/hud/slots/slot_epic.png"),
    legendary: require("../../assets/ui/hud/slots/slot_legendary.png"),
  },
  badges: {
    rank: require("../../assets/ui/hud/badges/rank_badge.png"),
    stamp: require("../../assets/ui/hud/badges/stamp_badge.png"),
  },
  progress: {
    track: require("../../assets/ui/hud/progress/progress_track.png"),
    xpFill: require("../../assets/ui/hud/progress/progress_fill_xp.png"),
    masteryFill: require("../../assets/ui/hud/progress/progress_fill_mastery.png"),
  },
  decor: {
    titlePlate: require("../../assets/ui/hud/decor/title_plate.png"),
    bannerLong: require("../../assets/ui/hud/decor/banner_long.png"),
    bannerShort: require("../../assets/ui/hud/decor/banner_short.png"),
  },
  icons: {
    info: require("../../assets/ui/hud/icons/icon_info.png"),
  },
  bgs: {
    inventoryBook: require("../../assets/ui/hud/bgs/inventory_book.png"),
  },
} as const;
