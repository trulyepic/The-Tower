import { CraftRecipeDefinition } from "../types/game";

export const CRAFT_RECIPES: CraftRecipeDefinition[] = [
  {
    id: "craft-antitoxin-vial",
    name: "Antitoxin Brew",
    description: "A simple field mixture for poison-heavy tower runs.",
    unlockLevel: 1,
    output: { itemId: "antitoxin-vial", amount: 1 },
    ingredients: [
      { itemId: "remnant-ash-rat-fang", amount: 1 },
      { itemId: "healing-herb", amount: 1 },
    ],
  },
  {
    id: "craft-guard-tonic",
    name: "Guard Tonic Blend",
    description: "Turns crawler shell into a cheap guard mix for heavy impact floors.",
    unlockLevel: 2,
    output: { itemId: "guard-tonic", amount: 1 },
    ingredients: [
      { itemId: "remnant-dust-crawler-shell", amount: 1 },
      { itemId: "ore-iron", amount: 1 },
    ],
  },
  {
    id: "craft-ward-charm",
    name: "Ward Charm Lattice",
    description: "A low-rank protective charm shaped around sentinel remnants.",
    unlockLevel: 4,
    unlockFloorCleared: 1,
    output: { itemId: "ward-charm", amount: 1 },
    ingredients: [
      { itemId: "remnant-sentinel-shard", amount: 1 },
      { itemId: "guard-tonic", amount: 1 },
      { itemId: "ore-iron", amount: 1 },
    ],
  },
  {
    id: "craft-grounding-tonic",
    name: "Grounding Draft",
    description: "A stabilizing shock counter brewed from sentinel residue and recovery stock.",
    unlockLevel: 5,
    unlockRank: "E",
    output: { itemId: "grounding-tonic", amount: 1 },
    ingredients: [
      { itemId: "remnant-sentinel-shard", amount: 1 },
      { itemId: "health-potion", amount: 1 },
      { itemId: "healing-herb", amount: 1 },
    ],
  },
  {
    id: "craft-thorn-salve",
    name: "Thorn Salve Stitch",
    description: "A resin-binding salve for thorn pressure and corridor lash wounds.",
    unlockLevel: 5,
    unlockRank: "E",
    output: { itemId: "thorn-salve", amount: 1 },
    ingredients: [
      { itemId: "briar-resin", amount: 1 },
      { itemId: "healing-herb", amount: 1 },
    ],
  },
];
