import { ITEM_BY_ID } from "../data/items";
import { ItemId } from "../types/game";

const alpha = (hex: string, opacityHex: string) => `${hex}${opacityHex}`;

export const getBuffAccent = (itemId: ItemId) => {
  const item = ITEM_BY_ID[itemId];
  const accentColor = item?.category === "buff" ? item.sigilVisual?.accentColor : null;

  if (accentColor) {
    return {
      primary: accentColor,
      border: alpha(accentColor, "dd"),
      softBg: alpha(accentColor, "22"),
    };
  }

  switch (item?.rarity) {
    case "legendary":
      return { primary: "#f0cb76", border: "#ffe0a8", softBg: "rgba(240, 203, 118, 0.2)" };
    case "epic":
      return { primary: "#b68cff", border: "#d1b0ff", softBg: "rgba(182, 140, 255, 0.2)" };
    case "rare":
      return { primary: "#78bbff", border: "#a5d2ff", softBg: "rgba(120, 187, 255, 0.18)" };
    default:
      return { primary: "#8f816c", border: "#b8ac98", softBg: "rgba(143, 129, 108, 0.18)" };
  }
};
