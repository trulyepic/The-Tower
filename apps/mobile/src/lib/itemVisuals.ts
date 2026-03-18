import { ItemId } from "../types/game";

const BUFF_ACCENT_PALETTE = [
  { primary: "#ff7aa8", border: "#ff9fca", softBg: "rgba(255, 122, 168, 0.18)" },
  { primary: "#68d3ff", border: "#94e2ff", softBg: "rgba(104, 211, 255, 0.18)" },
  { primary: "#8dff95", border: "#b5ffc0", softBg: "rgba(141, 255, 149, 0.18)" },
  { primary: "#c59bff", border: "#d8bcff", softBg: "rgba(197, 155, 255, 0.18)" },
  { primary: "#ffd27d", border: "#ffe0a8", softBg: "rgba(255, 210, 125, 0.2)" },
  { primary: "#7df4df", border: "#a4fcee", softBg: "rgba(125, 244, 223, 0.18)" },
  { primary: "#ff9f6e", border: "#ffc19f", softBg: "rgba(255, 159, 110, 0.2)" },
  { primary: "#9eb3ff", border: "#becdff", softBg: "rgba(158, 179, 255, 0.2)" },
] as const;

const hashItemId = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const getBuffAccent = (itemId: ItemId) => {
  const index = hashItemId(itemId) % BUFF_ACCENT_PALETTE.length;
  return BUFF_ACCENT_PALETTE[index];
};
