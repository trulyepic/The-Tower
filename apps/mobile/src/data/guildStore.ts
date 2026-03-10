import { BaseClassId, ItemId } from "../types/game";

export interface GuildStoreEntry {
  id: string;
  itemId: ItemId;
  label: string;
  unitPrice: number;
  sellText: string;
  featured?: boolean;
  classRestriction?: BaseClassId;
}

export const GUILD_STORE_ITEMS: GuildStoreEntry[] = [
  {
    id: "store-torch",
    itemId: "torch",
    label: "Torch Bundle",
    unitPrice: 12,
    sellText: "Reliable for ruins and dungeon routes.",
  },
  {
    id: "store-rope",
    itemId: "rope",
    label: "Climber Rope",
    unitPrice: 10,
    sellText: "Improves traversal quests and hazard checks.",
  },
  {
    id: "store-herb",
    itemId: "healing-herb",
    label: "Herbal Pack",
    unitPrice: 14,
    sellText: "Keeps your adventurer stable in tough runs.",
  },
  {
    id: "store-lockpick",
    itemId: "lockpick",
    label: "Lockpick Kit",
    unitPrice: 24,
    sellText: "Essential for sealed vaults and relic access.",
  },
  {
    id: "store-ward",
    itemId: "ward-charm",
    label: "Ward Charm",
    unitPrice: 30,
    sellText: "Protective charm for cursed or arcane zones.",
  },
  {
    id: "store-ore-iron",
    itemId: "ore-iron",
    label: "Iron Ore Crate",
    unitPrice: 18,
    sellText: "Base forging ore for common crafting loops.",
  },
  {
    id: "store-ingot-silver",
    itemId: "ingot-silver",
    label: "Silver Ingot",
    unitPrice: 54,
    sellText: "Refined bar used in higher-tier upgrades.",
  },
  {
    id: "store-ingot-steel",
    itemId: "ingot-steel",
    label: "Steel Ingot",
    unitPrice: 62,
    sellText: "Durable forged bar for weapon reinforcement.",
  },
  {
    id: "store-feather-special",
    itemId: "feather-special",
    label: "Special Feather",
    unitPrice: 88,
    sellText: "Rare fletching catalyst for precision crafting.",
  },
  {
    id: "store-dust-nova",
    itemId: "dust-nova",
    label: "Nova Dust Vial",
    unitPrice: 120,
    sellText: "Arcane dust used in advanced infusion recipes.",
  },
  {
    id: "store-focus-tonic",
    itemId: "focus-tonic",
    label: "Focus Tonic",
    unitPrice: 48,
    sellText: "Consumable. Restores +6 class skill resource instantly (best for Warrior/Ranger).",
  },
  {
    id: "store-mana-tonic",
    itemId: "mana-tonic",
    label: "Mana Tonic",
    unitPrice: 54,
    sellText: "Consumable. Restores +8 Intelligence resource instantly (Mage-focused).",
  },
  {
    id: "store-health-potion",
    itemId: "health-potion",
    label: "Health Potion",
    unitPrice: 22,
    sellText: "Consumable. Restores +35 HP. Use before risky quests or tower attempts.",
  },
  {
    id: "store-antitoxin-vial",
    itemId: "antitoxin-vial",
    label: "Antitoxin Vial",
    unitPrice: 16,
    sellText: "Counter supply for poison mechanics on lower tower floors.",
  },
  {
    id: "store-guard-tonic",
    itemId: "guard-tonic",
    label: "Guard Tonic",
    unitPrice: 18,
    sellText: "Counter supply against heavy sweep and control mechanics.",
  },
  {
    id: "store-grounding-tonic",
    itemId: "grounding-tonic",
    label: "Grounding Tonic",
    unitPrice: 30,
    sellText: "Counter supply against arc-overcharge mechanics.",
  },
  {
    id: "store-warrior-starter-weapon",
    itemId: "weapon-warrior-training-blade",
    label: "Training Shortsword",
    unitPrice: 0,
    sellText: "Free starter weapon for warrior loadout testing.",
    classRestriction: "warrior",
  },
  {
    id: "store-ranger-starter-weapon",
    itemId: "weapon-ranger-training-spear",
    label: "Scout Pike",
    unitPrice: 0,
    sellText: "Free starter weapon for ranger loadout testing.",
    classRestriction: "ranger",
  },
  {
    id: "store-mage-starter-weapon",
    itemId: "weapon-mage-training-staff",
    label: "Novice Oakstaff",
    unitPrice: 0,
    sellText: "Free starter weapon for mage loadout testing.",
    classRestriction: "mage",
  },
  {
    id: "store-warrior-weapon",
    itemId: "weapon-warrior-emberblade",
    label: "Emberblade Greatsword",
    unitPrice: 360,
    sellText: "Warrior exclusive. Heavy cleave blade forged in ashfire steel.",
    featured: true,
    classRestriction: "warrior",
  },
  {
    id: "store-ranger-weapon",
    itemId: "weapon-ranger-windlance",
    label: "Windlance Spear",
    unitPrice: 640,
    sellText: "Ranger exclusive. Swift thrust spear tuned for burst openings.",
    featured: true,
    classRestriction: "ranger",
  },
  {
    id: "store-mage-weapon",
    itemId: "weapon-mage-astralspire",
    label: "Astralspire Staff",
    unitPrice: 1080,
    sellText: "Mage exclusive. Arcane catalyst staff with void-core crystal.",
    featured: true,
    classRestriction: "mage",
  },
  {
    id: "store-buff-embershard",
    itemId: "buff-embershard-charm",
    label: "Embershard Charm",
    unitPrice: 40,
    sellText: "Common buff: minor attack increase with slight quest edge.",
  },
];
