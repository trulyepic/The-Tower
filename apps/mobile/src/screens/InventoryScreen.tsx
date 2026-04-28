import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { AdventurerPortrait } from "../components/AdventurerPortrait";
import { GameItemIcon } from "../components/GameItemIcon";
import { WeaponRecordPanel } from "../components/WeaponRecordPanel";
import { EquippedWeaponCard } from "../components/EquippedWeaponCard";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { TITLE_BY_ID } from "../data/titles";
import { CURRENCY_SPRITES } from "../data/uiSprites";
import { TITLE_ICON_ART } from "../data/titleVisuals";
import { getBuffRemainingSeconds, getBuffSlotLimit } from "../lib/buffs";
import { getCharacterCombatStats, getWeaponProficiencyForItem } from "../lib/combat";
import {
  getDiscoveredTitleItems,
  getTitleProgress,
  getTitleRequiredProgress,
  getTitleSlotLimit,
  isTitleOwned,
  isTitleUnlocked,
} from "../lib/titles";
import { CharacterState, ItemId, ItemRarity } from "../types/game";
import { colors } from "../theme/colors";

interface InventoryScreenProps {
  character: CharacterState;
  towerModeActive: boolean;
  combatPouchItems: Record<ItemId, number>;
  combatPouchCapacity: number;
  requestedTab?: InventoryTab | null;
  onRequestedTabHandled?: () => void;
  onEquipWeapon: (itemId: ItemId) => { ok: boolean; reason?: string };
  onEquipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  onUnequipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  onSetSigilAppearanceMode: (mode: "dynamic" | "default_frame") => { ok: boolean; reason?: string };
  onSetSigilAppearanceItem: (itemId: ItemId | null) => { ok: boolean; reason?: string };
  onEquipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  onUnequipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  onUseSkillResourceItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  onUseHealthRecoveryItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  onAddCombatPouchItem: (itemId: ItemId, amount?: number | "all") => { ok: boolean; reason?: string };
  onRemoveCombatPouchItem: (itemId: ItemId, amount?: number | "all") => { ok: boolean; reason?: string };
}

interface RarityTheme {
  border: string;
  bg: string;
  text: string;
}

type InventoryTab = "all" | "weapons" | "sigils" | "materials" | "titles";

const POUCH_COMPATIBLE_ITEM_IDS: ItemId[] = [
  "healing-herb",
  "health-potion",
  "focus-tonic",
  "mana-tonic",
  "antitoxin-vial",
  "guard-tonic",
  "grounding-tonic",
];

const rarityThemeMap: Record<ItemRarity, RarityTheme> = {
  common: {
    border: "#9f8f74",
    bg: "rgba(84, 70, 48, 0.36)",
    text: "#dbc9a8",
  },
  rare: {
    border: "#ff78c9",
    bg: "rgba(117, 40, 88, 0.42)",
    text: "#ffd1eb",
  },
  epic: {
    border: "#9a6de0",
    bg: "rgba(94, 64, 145, 0.37)",
    text: "#d7b2ff",
  },
  legendary: {
    border: "#cb8e44",
    bg: "rgba(126, 76, 28, 0.42)",
    text: "#ffd08c",
  },
};

const rarityOrder: Record<ItemRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const getSigilStatLines = (itemId: ItemId): string[] => {
  const item = ITEM_BY_ID[itemId];
  if (!item || item.category !== "buff") {
    return [];
  }
  const stats = item.buffStats ?? {};
  const primary = [`ARM +${stats.armorFlat ?? 0}`];
  if (stats.damageFlat) {
    primary.push(`ATK +${stats.damageFlat}`);
  }
  const secondary: string[] = [];
  if (stats.questSuccessFlat) {
    secondary.push(`QUEST +${stats.questSuccessFlat}%`);
  }
  return [primary.join(" • "), secondary.join(" • ")].filter(Boolean);
};

export const InventoryScreen = ({
  character,
  towerModeActive,
  combatPouchItems,
  combatPouchCapacity,
  requestedTab,
  onRequestedTabHandled,
  onEquipWeapon,
  onEquipBuff,
  onUnequipBuff,
  onSetSigilAppearanceMode,
  onSetSigilAppearanceItem,
  onEquipTitle,
  onUnequipTitle,
  onUseSkillResourceItem,
  onUseHealthRecoveryItem,
  onAddCombatPouchItem,
  onRemoveCombatPouchItem,
}: InventoryScreenProps) => {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [activeTab, setActiveTab] = useState<InventoryTab>("all");
  const [consumableToast, setConsumableToast] = useState<{
    itemId: ItemId;
    title: string;
    detail: string;
    tone: "ok" | "error";
  } | null>(null);
  const [combatPouchDraft, setCombatPouchDraft] = useState<Record<ItemId, number>>(combatPouchItems);
  const [itemInfoPanel, setItemInfoPanel] = useState<{
    itemId: ItemId;
    title: string;
    rarity: ItemRarity;
    hideRarity?: boolean;
    lines: string[];
  } | null>(null);
  const [itemArtExpanded, setItemArtExpanded] = useState(false);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!consumableToast) {
      return;
    }
    const timer = setTimeout(() => setConsumableToast(null), 2400);
    return () => clearTimeout(timer);
  }, [consumableToast]);

  useEffect(() => {
    setCombatPouchDraft(combatPouchItems);
  }, [combatPouchItems]);

  useEffect(() => {
    if (!requestedTab) {
      return;
    }
    setActiveTab(requestedTab);
    onRequestedTabHandled?.();
  }, [requestedTab, onRequestedTabHandled]);

  const inventoryEntries = useMemo(
    () => Object.entries(character.inventory ?? {}).filter(([, amount]) => amount > 0),
    [character.inventory],
  );

  const weaponEntries = useMemo(
    () =>
      inventoryEntries
        .map(([itemId, amount]) => ({ item: ITEM_BY_ID[itemId], itemId, amount }))
        .filter((entry) => entry.item?.category === "weapon")
        .sort((a, b) => {
          const rarityDiff =
            rarityOrder[(b.item?.rarity ?? "common") as ItemRarity] -
            rarityOrder[(a.item?.rarity ?? "common") as ItemRarity];
          if (rarityDiff !== 0) {
            return rarityDiff;
          }
          return (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId);
        }),
    [inventoryEntries],
  );

  const materialEntries = useMemo(
    () =>
      inventoryEntries
        .map(([itemId, amount]) => ({ item: ITEM_BY_ID[itemId], itemId, amount }))
        .filter((entry) => entry.item?.category === "material")
        .sort((a, b) => (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId)),
    [inventoryEntries],
  );
  const buffEntries = useMemo(
    () =>
      inventoryEntries
        .map(([itemId, amount]) => ({ item: ITEM_BY_ID[itemId], itemId, amount }))
        .filter((entry) => entry.item?.category === "buff")
        .sort((a, b) => {
          const rarityDiff =
            rarityOrder[(b.item?.rarity ?? "common") as ItemRarity] -
            rarityOrder[(a.item?.rarity ?? "common") as ItemRarity];
          if (rarityDiff !== 0) {
            return rarityDiff;
          }
          return (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId);
        }),
    [inventoryEntries],
  );
  const allItemEntries = useMemo(
    () =>
      inventoryEntries
        .map(([itemId, amount]) => ({ item: ITEM_BY_ID[itemId], itemId, amount }))
        .filter((entry) => Boolean(entry.item))
        .sort((a, b) => {
          const rarityDiff =
            rarityOrder[(b.item?.rarity ?? "common") as ItemRarity] -
            rarityOrder[(a.item?.rarity ?? "common") as ItemRarity];
          if (rarityDiff !== 0) {
            return rarityDiff;
          }
          return (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId);
        }),
    [inventoryEntries],
  );

  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const combatPouchEntries = useMemo(() => Object.entries(combatPouchItems), [combatPouchItems]);
  const nowMs = Date.now();
  const healthPulse = useRef(new Animated.Value(0)).current;
  const focusPulse = useRef(new Animated.Value(0)).current;
  const equippedBuffIds = character.equippedBuffIds ?? [];
  const buffSlotLimit = getBuffSlotLimit(character.adventurerRank, character.devBuffSlotLimitOverride);
  const sigilAppearanceMode = character.sigilAppearanceMode ?? "dynamic";
  const sigilAppearanceItemId = character.sigilAppearanceItemId ?? null;
  const titleSlotLimit = getTitleSlotLimit(character.progression.level);
  const equippedTitleIds = character.equippedTitleIds ?? [];
  const discoveredTitles = getDiscoveredTitleItems(character);
  const combat = getCharacterCombatStats(character);

  const getWeaponPreview = (itemId?: ItemId) => {
    if (!itemId) {
      return null;
    }
    const item = ITEM_BY_ID[itemId];
    if (!item || item.category !== "weapon") {
      return null;
    }

    const requiredLevel = item.requiredLevel ?? 1;
    const classLocked = Boolean(item.classRestriction && item.classRestriction !== character.classId);
    const proficiency = classLocked ? 0 : getWeaponProficiencyForItem(character, item);

    return {
      requiredLevel,
      proficiencyPercent: Math.round(proficiency * 100),
      effectiveAttack: Math.round((item.weaponStats?.attack ?? 0) * proficiency),
      effectiveCrit: Math.round((item.weaponStats?.crit ?? 0) * proficiency),
      effectiveSpeed: Math.round((item.weaponStats?.speed ?? 0) * proficiency),
      classLocked,
      underleveled: !classLocked && character.progression.level < requiredLevel,
    };
  };

  const triggerPulse = (animatedValue: Animated.Value) => {
    animatedValue.stopAnimation();
    animatedValue.setValue(0);
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const healthPulseStyle = {
    transform: [
      {
        scale: healthPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
    ],
  };

  const focusPulseStyle = {
    transform: [
      {
        scale: focusPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
    ],
  };

  const handleEquip = (itemId: ItemId) => {
    const result = onEquipWeapon(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Weapon equipped." : result.reason ?? "Could not equip weapon.");
  };

  const handleEquipBuff = (itemId: ItemId) => {
    const result = onEquipBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Sigil equipped." : result.reason ?? "Could not equip sigil.");
  };

  const handleUnequipBuff = (itemId: ItemId) => {
    const result = onUnequipBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Sigil unequipped." : result.reason ?? "Could not unequip sigil.");
  };

  const handleSetSigilAppearanceMode = (mode: "dynamic" | "default_frame") => {
    const result = onSetSigilAppearanceMode(mode);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Sigil appearance updated." : "Could not update sigil appearance."));
  };

  const handleSetSigilAppearanceItem = (itemId: ItemId | null) => {
    const result = onSetSigilAppearanceItem(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Sigil appearance updated." : "Could not update sigil appearance."));
  };

  const handleEquipTitle = (titleId: ItemId) => {
    const result = onEquipTitle(titleId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Title equipped." : result.reason ?? "Could not equip title.");
  };

  const handleUnequipTitle = (titleId: ItemId) => {
    const result = onUnequipTitle(titleId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Title unequipped." : result.reason ?? "Could not unequip title.");
  };
  const handleUseConsumable = (itemId: ItemId) => {
    const result =
      itemId === "health-potion" || itemId === "healing-herb"
        ? onUseHealthRecoveryItem(itemId)
        : itemId === "focus-tonic" || itemId === "mana-tonic"
          ? onUseSkillResourceItem(itemId)
          : { ok: false, reason: "Pack this item into your combat pouch to use it in battle." };
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Item used." : "Could not use item."));
    const detailByItem: Partial<Record<ItemId, string>> = {
      "healing-herb": "+12 HP",
      "health-potion": "+35 HP",
      "focus-tonic": "+6 Focus",
      "mana-tonic": "+8 Focus",
      "antitoxin-vial": "Packed for poison-heavy fights",
      "guard-tonic": "Packed for heavy impact fights",
      "grounding-tonic": "Packed for shock-heavy fights",
    };
    setConsumableToast({
      itemId,
      title: ITEM_BY_ID[itemId]?.name ?? (result.ok ? "Item Used" : "Item Failed"),
      detail: result.ok ? detailByItem[itemId] ?? "Effect applied" : result.reason ?? "Could not use item.",
      tone: result.ok ? "ok" : "error",
    });
    if (result.ok) {
      if (itemId === "healing-herb" || itemId === "health-potion") {
        triggerPulse(healthPulse);
      }
      if (itemId === "focus-tonic" || itemId === "mana-tonic") {
        triggerPulse(focusPulse);
      }
    }
  };

  const handleAdjustPouch = (itemId: ItemId, direction: "add" | "remove", owned: number) => {
    const currentDraft = combatPouchDraft[itemId] ?? combatPouchItems[itemId] ?? 0;
    const nextDraft =
      direction === "add"
        ? Math.min(owned, currentDraft + 1)
        : Math.max(0, currentDraft - 1);
    setCombatPouchDraft((current) => {
      const next = { ...current };
      next[itemId] = nextDraft;
      return next;
    });
  };

  const handleApplyPouchDraft = (itemId: ItemId) => {
    if (towerModeActive) {
      setNoticeTone("error");
      setNotice("You cannot repack your combat pouch while you are inside the tower.");
      return;
    }
    const packedCount = combatPouchItems[itemId] ?? 0;
    const draftCount = combatPouchDraft[itemId] ?? 0;
    if (draftCount === packedCount) {
      return;
    }
    const result =
      draftCount > packedCount
        ? onAddCombatPouchItem(itemId, draftCount - packedCount)
        : onRemoveCombatPouchItem(itemId, packedCount - draftCount);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(
      result.reason ??
        (result.ok ? "Pouch stack updated." : "Could not update pouch."),
    );
  };

  const handleRemovePouchStack = (itemId: ItemId) => {
    if (towerModeActive) {
      setNoticeTone("error");
      setNotice("You cannot repack your combat pouch while you are inside the tower.");
      return;
    }
    const result = onRemoveCombatPouchItem(itemId, "all");
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Item removed from pouch." : "Could not update pouch."));
    if (result.ok) {
      setCombatPouchDraft((current) => ({
        ...current,
        [itemId]: 0,
      }));
    }
  };

  const renderPouchControl = (itemId: ItemId, owned: number, variant: "full" | "compact" = "full") => {
    const packedCount = combatPouchItems[itemId] ?? 0;
    const draftCount = Math.min(owned, Object.prototype.hasOwnProperty.call(combatPouchDraft, itemId) ? (combatPouchDraft[itemId] ?? 0) : packedCount);
    const canAddMore = draftCount < owned;
    const hasPendingChange = draftCount !== packedCount;
    const compact = variant === "compact";
    if (packedCount <= 0 && draftCount <= 0) {
      return (
        <Pressable
          style={[
            compact ? styles.tilePouchAddCompact : styles.tileActionWrap,
            towerModeActive ? styles.buttonDisabled : null,
          ]}
          onPress={() => handleAdjustPouch(itemId, "add", owned)}
          disabled={towerModeActive}
        >
          {compact ? (
            <View style={styles.tilePouchAddCompactButton}>
              <MaterialCommunityIcons name="bag-personal-outline" size={12} color="#dff8ea" />
              <Text style={styles.tilePouchAddCompactText}>Pouch</Text>
            </View>
          ) : (
            <View style={styles.tileActionButton}>
              <Text style={styles.tileActionText}>Add To Pouch</Text>
            </View>
          )}
        </Pressable>
      );
    }

    return (
      <View
        style={[
          compact ? styles.tilePouchControlWrap : styles.pouchControlWrap,
          hasPendingChange ? (compact ? styles.tilePouchControlWrapPending : styles.pouchControlWrapPending) : null,
          towerModeActive ? styles.buttonDisabled : null,
        ]}
      >
        <View style={compact ? styles.tilePouchStepper : styles.pouchStepper}>
          <Pressable
            style={compact ? styles.tilePouchStepperButton : styles.pouchStepperButton}
            onPress={() => handleAdjustPouch(itemId, "remove", owned)}
            disabled={towerModeActive}
          >
            <Text style={compact ? styles.tilePouchStepperButtonText : styles.pouchStepperButtonText}>-</Text>
          </Pressable>
          <View style={compact ? styles.tilePouchStepperValueWrap : styles.pouchStepperValueWrap}>
            {compact ? (
              <>
                <MaterialCommunityIcons name="bag-personal-outline" size={11} color="#dff8ea" />
                <Text style={styles.tilePouchStepperValue}>x{draftCount}</Text>
              </>
            ) : (
              <Text style={styles.pouchStepperValue}>Pouch x{draftCount}</Text>
            )}
          </View>
          <Pressable
            style={[
              compact ? styles.tilePouchStepperButton : styles.pouchStepperButton,
              !canAddMore ? styles.buttonDisabled : null,
            ]}
            onPress={() => handleAdjustPouch(itemId, "add", owned)}
            disabled={towerModeActive || !canAddMore}
          >
            <Text style={compact ? styles.tilePouchStepperButtonText : styles.pouchStepperButtonText}>+</Text>
          </Pressable>
        </View>
        {hasPendingChange ? (
          <Pressable
            style={compact ? styles.tilePouchApplyButton : styles.pouchApplyButton}
            onPress={() => handleApplyPouchDraft(itemId)}
            disabled={towerModeActive}
          >
            <MaterialCommunityIcons name="check-bold" size={16} color="#fff0cd" />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const openItemInfo = (itemId: ItemId) => {
    const item = ITEM_BY_ID[itemId];
    if (!item) {
      return;
    }
    const isAppraised = !item.requiresAppraisal || (character.appraisedItemIds ?? []).includes(itemId);
    if (item.requiresAppraisal && !isAppraised) {
      setItemInfoPanel({
        itemId,
        title: "Unknown Remnant",
        rarity: item.rarity,
        hideRarity: true,
        lines: [
          "A rare floor remnant wrapped in unstable afterglow.",
          "Take it to Quartermaster Bran for appraisal before its true name and function can be recorded.",
        ],
      });
      return;
    }
    const lines: string[] = [];
    if (item.category === "weapon") {
      const weaponPreview = getWeaponPreview(itemId);
      lines.push(`Required Level: ${item.requiredLevel ?? 1}`);
      lines.push(`Class: ${(item.classRestriction ?? "Any").toUpperCase()}`);
      lines.push(
        `Stats: +${item.weaponStats?.attack ?? 0} ATK • +${item.weaponStats?.crit ?? 0}% CRIT • +${item.weaponStats?.speed ?? 0} SPD`,
      );
      if (item.lore) {
        lines.push(`Lore: ${item.lore}`);
      }
      if (weaponPreview) {
        lines.push(
          `Current Use: +${weaponPreview.effectiveAttack} ATK • +${weaponPreview.effectiveCrit}% CRIT • +${weaponPreview.effectiveSpeed} SPD`,
        );
        if (weaponPreview.classLocked) {
          lines.push(`Current Status: Wrong class. This weapon gives no combat benefit on ${character.classId.toUpperCase()}.`);
        } else if (weaponPreview.underleveled) {
          lines.push(`Current Status: Underleveled. You are using it at ${weaponPreview.proficiencyPercent}% proficiency until Level ${weaponPreview.requiredLevel}.`);
        }
      }
      if (item.description) {
        lines.push(item.description);
      }
    } else if (item.category === "buff") {
      lines.push(`Sigil Armor: +${item.buffStats?.armorFlat ?? 0} ARM`);
      if (item.buffStats?.damageFlat) {
        lines.push(`Legendary Edge: +${item.buffStats.damageFlat} ATK while the sigil effect is active`);
      }
      if (item.buffStats?.questSuccessFlat) {
        lines.push(`Field Fortune: +${item.buffStats.questSuccessFlat}% Quest Success`);
      }
      lines.push(`Duration: ${Math.floor((item.buffDurationSeconds ?? 0) / 60)}m ${(item.buffDurationSeconds ?? 0) % 60}s`);
      if (item.description) {
        lines.push(item.description);
      }
    } else {
      if (item.description) {
        lines.push(item.description);
      }
      if (itemId === "health-potion" || itemId === "healing-herb" || itemId === "focus-tonic" || itemId === "mana-tonic") {
        lines.push("Use: Consumable field supply. Drink it from the bag, or pack it into the Combat Pouch for live combat.");
      } else if (POUCH_COMPATIBLE_ITEM_IDS.includes(itemId)) {
        lines.push("Use: Pack it into the Combat Pouch for live combat, or hold it in the bag for later prep.");
      } else {
        lines.push("Use: Crafting, quest hand-ins, appraisal, or trade.");
      }
    }
    setItemInfoPanel({
      itemId,
      title: item.name,
      rarity: item.rarity,
      lines,
    });
  };


  const openTitleInfo = (titleId: ItemId) => {
    const title = TITLE_BY_ID[titleId];
    if (!title) {
      return;
    }
    const progress = getTitleProgress(character, title.id);
    const progressNeed = getTitleRequiredProgress(title);
    setItemInfoPanel({
      itemId: title.id,
      title: title.name,
      rarity: title.rarity,
      lines: [
        title.flavor,
        `Ability: ${title.abilityLabel}`,
        `Requirement: Level ${title.minLevel}${title.classRestriction ? ` (${title.classRestriction.toUpperCase()})` : ""}`,
        `Progress: ${Math.min(progress, progressNeed)}/${progressNeed}`,
        `Bonuses: +${title.bonuses.damageFlat ?? 0} ATK • +${title.bonuses.critFlat ?? 0}% CRIT • +${title.bonuses.speedFlat ?? 0} SPD • +${title.bonuses.questSuccessFlat ?? 0}% Quest`,
      ],
    });
  };

  const renderInventorySquareTile = ({
    keyId,
    rarity,
    count,
    onPress,
    content,
    statusIcon,
    statusColor,
    secondaryStatusIcon,
    secondaryStatusColor,
    dimmed,
    compact,
  }: {
    keyId: string;
    rarity: ItemRarity;
    count?: number;
    onPress: () => void;
    content: ReactNode;
    statusIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    statusColor?: string;
    secondaryStatusIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    secondaryStatusColor?: string;
    dimmed?: boolean;
    compact?: boolean;
  }) => {
    const rarityTheme = rarityThemeMap[rarity];
    return (
      <Pressable
        key={keyId}
        onPress={onPress}
        style={[
          styles.squareTile,
          compact ? styles.squareTileCompact : null,
          { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
          dimmed ? styles.squareTileDimmed : null,
        ]}
      >
        {typeof count === "number" ? (
          <View style={[styles.squareTileCount, compact ? styles.squareTileCountCompact : null]}>
            <Text style={[styles.squareTileCountText, compact ? styles.squareTileCountTextCompact : null]}>x{count}</Text>
          </View>
        ) : null}
        {statusIcon ? (
          <View style={[styles.squareTileStatus, compact ? styles.squareTileStatusCompact : null]}>
            <MaterialCommunityIcons name={statusIcon} size={compact ? 11 : 12} color={statusColor ?? "#ffe4b0"} />
          </View>
        ) : null}
        {secondaryStatusIcon ? (
          <View style={[styles.squareTileStatusSecondary, compact ? styles.squareTileStatusCompact : null]}>
            <MaterialCommunityIcons name={secondaryStatusIcon} size={compact ? 11 : 12} color={secondaryStatusColor ?? "#ffe4b0"} />
          </View>
        ) : null}
        <View style={styles.squareTileIconWrap}>{content}</View>
      </Pressable>
    );
  };

  const closeItemInfo = () => {
    setItemArtExpanded(false);
    setItemInfoPanel(null);
  };

  const inventoryTabs: Array<{ id: InventoryTab; label: string }> = [
    { id: "all", label: "All Items" },
    { id: "weapons", label: "Weapons" },
    { id: "sigils", label: "Sigils" },
    { id: "materials", label: "Supplies" },
    { id: "titles", label: "Titles" },
  ];

  const infoItem = itemInfoPanel ? ITEM_BY_ID[itemInfoPanel.itemId] : undefined;
  const infoTitle = itemInfoPanel ? TITLE_BY_ID[itemInfoPanel.itemId] : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="inventory" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.kicker}>Vault Quarter</Text>
        <View style={styles.titlePlate}>
          <Text style={styles.title}>Inventory</Text>
        </View>
        {notice ? (
          <View style={[styles.noticeBanner, noticeTone === "ok" ? styles.noticeBannerOk : styles.noticeBannerErr]}>
            <MaterialCommunityIcons
              name={noticeTone === "ok" ? "check-circle-outline" : "alert-circle-outline"}
              size={15}
              color={noticeTone === "ok" ? "#93efb7" : "#ffc5c5"}
            />
            <Text style={styles.noticeBannerText}>{notice}</Text>
          </View>
        ) : null}
        {towerModeActive ? (
          <View style={[styles.noticeBanner, styles.noticeBannerOk]}>
            <MaterialCommunityIcons name="tower-fire" size={15} color="#93efb7" />
            <Text style={styles.noticeBannerText}>
              Tower Mode: only item use is available. Loadout changes are locked until you leave the tower.
            </Text>
          </View>
        ) : null}

        <View style={styles.vaultHeader}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(215, 160, 83, 0.12)", "rgba(102, 66, 159, 0.07)", "rgba(24, 18, 40, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.vaultIdRow}>
            <View style={styles.avatarFrame}>
              <AdventurerPortrait character={character} size={52} />
            </View>
            <View style={styles.vaultTitleWrap}>
              <Text style={styles.vaultTitle}>{character.name}'s Vault</Text>
              <Text style={styles.vaultSubtitle}>Class {character.classId.toUpperCase()} • Rank {character.adventurerRank}</Text>
            </View>
            <View style={styles.vaultBadge}>
              <MaterialCommunityIcons name="shield-crown" size={18} color={colors.gold} />
            </View>
          </View>

          <View style={styles.stashRow}>
            <Animated.View style={[styles.stashChip, styles.stashChipHp, healthPulseStyle]}>
              <MaterialCommunityIcons name="heart-pulse" size={14} color="#97f1ab" />
              <Text style={styles.stashValue}>{character.health}/{character.healthCap} HP</Text>
            </Animated.View>
            <Animated.View style={[styles.stashChip, styles.stashChipFocus, focusPulseStyle]}>
              <MaterialCommunityIcons name="creation-outline" size={14} color="#9ed2ff" />
              <Text style={styles.stashValue}>{character.focus}/{character.focusCap} Focus</Text>
            </Animated.View>
            <View style={styles.stashChip}>
              <Image source={CURRENCY_SPRITES.gold} style={styles.stashIcon} resizeMode="contain" />
              <Text style={styles.stashValue}>{character.gold}</Text>
            </View>
            <View style={styles.stashChip}>
              <GameItemIcon itemId="weapon-warrior-training-blade" size={13} />
              <Text style={styles.stashValue}>{weaponEntries.length} Weapons</Text>
            </View>
            <View style={styles.stashChip}>
              <GameItemIcon itemId="ore-iron" size={13} />
              <Text style={styles.stashValue}>{materialEntries.length} Supplies</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(215, 160, 83, 0.1)", "rgba(103, 70, 163, 0.06)", "rgba(27, 19, 43, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Equipped</Text>
          {equippedWeapon ? (
            <EquippedWeaponCard
              item={equippedWeapon}
              proficiencyPercent={combat.weaponProficiencyPercent}
              effectiveAttack={combat.effectiveWeaponAttack}
              effectiveCrit={combat.effectiveWeaponCrit}
              effectiveSpeed={combat.effectiveWeaponSpeed}
              onPress={() => openItemInfo(equippedWeapon.id)}
            />
          ) : (
            <Text style={styles.emptyText}>No weapon equipped yet.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(113, 176, 135, 0.12)", "rgba(68, 101, 160, 0.08)", "rgba(21, 16, 33, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Combat Pouch</Text>
            <Text style={styles.collectionHint}>{combatPouchEntries.length}/{combatPouchCapacity} slots used</Text>
          </View>
          <Text style={styles.collectionHint}>
            Pack combat consumables here once. Tap a packed item to inspect it and manage the stack from the detail panel.
          </Text>
          <View style={styles.pouchGrid}>
            {combatPouchEntries.length ? (
              combatPouchEntries.map(([itemId, amount]) => (
                renderInventorySquareTile({
                  keyId: `pouch-${itemId}`,
                  rarity: ITEM_BY_ID[itemId]?.rarity ?? "common",
                  count: amount,
                  onPress: () => openItemInfo(itemId as ItemId),
                  compact: true,
                  statusIcon: "bag-personal-outline",
                  statusColor: "#8fe3bc",
                  content: <GameItemIcon itemId={itemId as ItemId} size={38} />,
                })
              ))
            ) : (
              <Text style={styles.emptyText}>Your pouch is empty. Pack consumables from any inventory tab to make them available in live combat.</Text>
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(205, 150, 75, 0.09)", "rgba(97, 63, 151, 0.06)", "rgba(23, 16, 38, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Collection</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {inventoryTabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.inventoryTab, activeTab === tab.id ? styles.inventoryTabActive : null]}
              >
                <Text style={[styles.inventoryTabText, activeTab === tab.id ? styles.inventoryTabTextActive : null]}>{tab.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {activeTab === "all" ? (
            <>
              <Text style={styles.collectionHint}>Tap any item to inspect it. Green check means equipped, blue eye means saved sigil look, gold help means it still needs appraisal.</Text>
              <View style={styles.inventoryGrid}>
                {allItemEntries.length === 0 ? (
                  <Text style={styles.emptyText}>No items yet. Visit the Guild Store or clear quests and floors.</Text>
                ) : (
                  allItemEntries.map(({ item, itemId, amount }) => {
                    if (!item) {
                      return null;
                    }
                    const isWeaponEquipped = item.category === "weapon" && character.equippedWeaponId === itemId;
                    const isSigilEquipped = item.category === "buff" && equippedBuffIds.includes(itemId as ItemId);
                    const isPinnedLook = item.category === "buff" && sigilAppearanceItemId === itemId;
                    const isAppraised = !item.requiresAppraisal || (character.appraisedItemIds ?? []).includes(itemId);
                    return renderInventorySquareTile({
                      keyId: `all-${itemId}`,
                      rarity: item.rarity,
                      count: amount,
                      onPress: () => openItemInfo(itemId as ItemId),
                      statusIcon: isWeaponEquipped || isSigilEquipped ? "check-decagram" : item.requiresAppraisal && !isAppraised ? "help-circle" : undefined,
                      statusColor: isWeaponEquipped || isSigilEquipped ? "#9af0b8" : item.requiresAppraisal && !isAppraised ? "#ffe09a" : undefined,
                      secondaryStatusIcon: isPinnedLook ? "eye-circle" : undefined,
                      secondaryStatusColor: isPinnedLook ? "#9fd2ff" : undefined,
                      content: <GameItemIcon itemId={itemId as ItemId} size={44} />,
                    });
                  })
                )}
              </View>
            </>
          ) : null}

          {activeTab === "weapons" ? (
            <>
              <Text style={styles.collectionHint}>Weapons sit in a cleaner rack now. Tap one to inspect it and equip it from the record.</Text>
              {weaponEntries.length === 0 ? (
                <Text style={styles.emptyText}>No class weapons owned yet. Visit the Guild Store.</Text>
              ) : (
                <View style={styles.inventoryGrid}>
                  {weaponEntries.map(({ item, itemId, amount }) => {
                    if (!item) {
                      return null;
                    }
                    const isEquipped = character.equippedWeaponId === itemId;
                    return renderInventorySquareTile({
                      keyId: `weapon-tab-${itemId}`,
                      rarity: item.rarity,
                      count: amount,
                      onPress: () => openItemInfo(itemId as ItemId),
                      statusIcon: isEquipped ? "check-decagram" : undefined,
                      statusColor: isEquipped ? "#9af0b8" : undefined,
                      content: <GameItemIcon itemId={itemId as ItemId} size={48} />,
                    });
                  })}
                </View>
              )}
            </>
          ) : null}

          {activeTab === "sigils" ? (
            <>
              <Text style={styles.collectionHint}>Equipped sigils: {equippedBuffIds.length}/{buffSlotLimit}</Text>
              {buffEntries.length === 0 ? (
                <Text style={styles.emptyText}>No sigils owned yet. Visit Guild Store.</Text>
              ) : (
                <View style={styles.inventoryGrid}>
                  {buffEntries.map(({ item, itemId, amount }) => {
                    if (!item) {
                      return null;
                    }
                    const isEquipped = equippedBuffIds.includes(itemId as ItemId);
                    const isPinnedLook = sigilAppearanceItemId === itemId;
                    return renderInventorySquareTile({
                      keyId: `sigil-tab-${itemId}`,
                      rarity: item.rarity,
                      count: amount,
                      onPress: () => openItemInfo(itemId as ItemId),
                      statusIcon: isEquipped ? "check-decagram" : undefined,
                      statusColor: isEquipped ? "#9af0b8" : undefined,
                      secondaryStatusIcon: isPinnedLook ? "eye-circle" : undefined,
                      secondaryStatusColor: isPinnedLook ? "#9fd2ff" : undefined,
                      content: <GameItemIcon itemId={itemId as ItemId} size={44} />,
                    });
                  })}
                </View>
              )}
              <View style={styles.sigilAppearancePanel}>
                <Text style={styles.sigilAppearanceTitle}>Sigil Appearance</Text>
                <Text style={styles.collectionHint}>Green check means equipped. Blue eye means the shell look is pinned here.</Text>
                <View style={styles.sigilAppearanceModeRow}>
                  <Pressable
                    onPress={() => handleSetSigilAppearanceMode("dynamic")}
                    style={[
                      styles.sigilAppearanceModeButton,
                      sigilAppearanceMode === "dynamic" ? styles.sigilAppearanceModeButtonActive : null,
                      towerModeActive ? styles.buttonDisabled : null,
                    ]}
                    disabled={towerModeActive}
                  >
                    <Text
                      style={[
                        styles.sigilAppearanceModeText,
                        sigilAppearanceMode === "dynamic" ? styles.sigilAppearanceModeTextActive : null,
                      ]}
                    >
                      Dynamic Shell
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSetSigilAppearanceMode("default_frame")}
                    style={[
                      styles.sigilAppearanceModeButton,
                      sigilAppearanceMode === "default_frame" ? styles.sigilAppearanceModeButtonActive : null,
                      towerModeActive ? styles.buttonDisabled : null,
                    ]}
                    disabled={towerModeActive}
                  >
                    <Text
                      style={[
                        styles.sigilAppearanceModeText,
                        sigilAppearanceMode === "default_frame" ? styles.sigilAppearanceModeTextActive : null,
                      ]}
                    >
                      Default Frame
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.sigilAppearancePinnedRow}>
                  <Text style={styles.sigilAppearancePinnedText}>
                    {sigilAppearanceMode === "default_frame"
                      ? sigilAppearanceItemId
                        ? `Default Frame is active. Saved shell look: ${ITEM_BY_ID[sigilAppearanceItemId]?.name ?? sigilAppearanceItemId}`
                        : "Default Frame is active. Shell visuals are hidden while keeping armor markers."
                      : sigilAppearanceItemId
                        ? `Pinned Look: ${ITEM_BY_ID[sigilAppearanceItemId]?.name ?? sigilAppearanceItemId}`
                        : "Pinned Look: Equipped Order"}
                  </Text>
                  {sigilAppearanceItemId ? (
                    <Pressable onPress={() => handleSetSigilAppearanceItem(null)} style={[styles.smallActionWrap, towerModeActive ? styles.buttonDisabled : null]} disabled={towerModeActive}>
                      <View style={styles.smallActionButton}>
                        <Text style={styles.smallActionText}>Use Equip Order</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}

          {activeTab === "materials" ? (
            <>
              <Text style={styles.collectionHint}>Consumables and field materials stay together here. Tap one to inspect it and manage it from the detail panel.</Text>
              <View style={styles.inventoryGrid}>
                {materialEntries.length === 0 ? (
                  <Text style={styles.emptyText}>No supplies yet. Run gather quests.</Text>
                ) : (
                  materialEntries.map(({ item, itemId, amount }) => {
                    const rarity = item?.rarity ?? "common";
                    const isAppraised = !item?.requiresAppraisal || (character.appraisedItemIds ?? []).includes(itemId);
                    const statusIcon = item?.requiresAppraisal && !isAppraised ? "help-circle" : undefined;
                    return renderInventorySquareTile({
                      keyId: `material-tab-${itemId}`,
                      rarity,
                      count: amount,
                      onPress: () => openItemInfo(itemId as ItemId),
                      statusIcon,
                      statusColor: statusIcon ? "#ffe09a" : undefined,
                      content: <GameItemIcon itemId={itemId as ItemId} size={42} />,
                    });
                  })
                )}
              </View>
            </>
          ) : null}

          {activeTab === "titles" ? (
            <>
              <Text style={styles.collectionHint}>Title slots: {equippedTitleIds.length}/{titleSlotLimit}</Text>
              <Text style={styles.collectionHint}>Corner marks: check means equipped, ribbon means earned, lock means still locked.</Text>
              {discoveredTitles.length === 0 ? (
                <Text style={styles.emptyText}>No discovered titles yet. Start quests to reveal title trails.</Text>
              ) : (
                <View style={styles.inventoryGrid}>
                  {discoveredTitles.map((title) => {
                    const unlocked = isTitleUnlocked(character, title);
                    const owned = isTitleOwned(character, title.id);
                    const isEquipped = equippedTitleIds.includes(title.id);
                    return renderInventorySquareTile({
                      keyId: `title-${title.id}`,
                      rarity: title.rarity,
                      onPress: () => openTitleInfo(title.id),
                      statusIcon: isEquipped ? "check-decagram" : owned ? "bookmark-check" : "lock-outline",
                      statusColor: isEquipped ? "#9af0b8" : owned ? "#d9c08d" : "#b89b79",
                      dimmed: !owned || !unlocked,
                      content: (
                        <ImageBackground source={HUD_ASSETS.slots[title.rarity]} style={styles.squareTitleFrame} resizeMode="contain">
                          <Image source={TITLE_ICON_ART[title.id]} style={styles.squareTitleArt} resizeMode="contain" />
                        </ImageBackground>
                      ),
                    });
                  })}
                </View>
              )}
            </>
          ) : null}
        </View>

      </ScrollView>
      {itemInfoPanel ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            closeItemInfo();
          }}
        >
          <View style={styles.infoOverlay}>
            <View style={styles.infoModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.14)", "rgba(96, 64, 154, 0.08)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              {infoItem?.category === "weapon" ? (
                <>
                  <ScrollView style={styles.weaponRecordScroll} contentContainerStyle={styles.weaponRecordScrollContent} showsVerticalScrollIndicator={false}>
                    <WeaponRecordPanel
                      item={infoItem}
                      proficiencyPercent={getWeaponPreview(itemInfoPanel.itemId)?.proficiencyPercent ?? 100}
                      warningText={
                        getWeaponPreview(itemInfoPanel.itemId)?.classLocked
                          ? `Wrong class. This weapon gives no combat benefit on ${character.classId.toUpperCase()}.`
                          : getWeaponPreview(itemInfoPanel.itemId)?.underleveled
                            ? `Underleveled. You are using it at ${getWeaponPreview(itemInfoPanel.itemId)?.proficiencyPercent}% proficiency until Level ${getWeaponPreview(itemInfoPanel.itemId)?.requiredLevel}.`
                            : null
                      }
                      onClose={closeItemInfo}
                      onPressArt={() => {
                        if (infoItem.image) {
                          setItemArtExpanded(true);
                        }
                      }}
                    />
                  </ScrollView>
                  <View style={styles.infoActionRow}>
                    <Pressable
                      onPress={() => {
                        if (character.equippedWeaponId !== infoItem.id) {
                          handleEquip(infoItem.id);
                        }
                      }}
                      style={[
                        styles.infoActionButton,
                        (towerModeActive || character.equippedWeaponId === infoItem.id || Boolean(infoItem.classRestriction && infoItem.classRestriction !== character.classId))
                          ? styles.buttonDisabled
                          : null,
                      ]}
                      disabled={towerModeActive || character.equippedWeaponId === infoItem.id || Boolean(infoItem.classRestriction && infoItem.classRestriction !== character.classId)}
                    >
                      <Text style={styles.infoActionText}>
                        {character.equippedWeaponId === infoItem.id ? "Equipped" : towerModeActive ? "Tower Locked" : infoItem.classRestriction && infoItem.classRestriction !== character.classId ? "Wrong Class" : "Equip"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
              <View style={styles.infoHead}>
                <Pressable
                  onPress={() => {
                    if (infoItem?.image) {
                      setItemArtExpanded(true);
                    }
                  }}
                  style={[styles.infoIconFrame, { borderColor: rarityThemeMap[itemInfoPanel.rarity].border }]}
                >
                  {infoItem?.image ? (
                    <Image source={infoItem.image} style={styles.infoArt} resizeMode="contain" />
                  ) : infoTitle ? (
                    <ImageBackground source={HUD_ASSETS.slots[infoTitle.rarity as keyof typeof HUD_ASSETS.slots]} style={styles.infoTitleFrame} resizeMode="contain">
                      <Image source={TITLE_ICON_ART[infoTitle.id]} style={styles.infoTitleArt} resizeMode="contain" />
                    </ImageBackground>
                  ) : (
                    <GameItemIcon itemId={itemInfoPanel.itemId} size={82} />
                  )}
                </Pressable>
                <View style={styles.infoHeadText}>
                  <Text style={styles.infoTitle}>{itemInfoPanel.title}</Text>
                  {!itemInfoPanel.hideRarity ? (
                    <View
                      style={[
                        styles.infoRarityPill,
                        {
                          borderColor: rarityThemeMap[itemInfoPanel.rarity].border,
                          backgroundColor: rarityThemeMap[itemInfoPanel.rarity].bg,
                        },
                      ]}
                    >
                      <Text style={[styles.infoRarityText, { color: rarityThemeMap[itemInfoPanel.rarity].text }]}>
                        {itemInfoPanel.rarity.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBody}>
                  {itemInfoPanel.lines.map((line, index) => (
                    <Text key={`info-line-${index}`} style={styles.infoLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.infoActionRow}>
                {infoItem?.category === "buff" ? (
                  <>
                    <Pressable
                      onPress={() => {
                        const isEquipped = equippedBuffIds.includes(infoItem.id);
                        if (isEquipped) {
                          handleUnequipBuff(infoItem.id);
                        } else {
                          handleEquipBuff(infoItem.id);
                        }
                      }}
                      style={[
                        styles.infoActionButton,
                        (towerModeActive || (!equippedBuffIds.includes(infoItem.id) && equippedBuffIds.length >= buffSlotLimit)) ? styles.buttonDisabled : null,
                      ]}
                      disabled={towerModeActive || (!equippedBuffIds.includes(infoItem.id) && equippedBuffIds.length >= buffSlotLimit)}
                    >
                      <Text style={styles.infoActionText}>
                        {towerModeActive ? "Tower Locked" : equippedBuffIds.includes(infoItem.id) ? "Unequip" : "Equip"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSetSigilAppearanceItem(sigilAppearanceItemId === infoItem.id ? null : infoItem.id)}
                      style={[styles.infoActionButton, towerModeActive ? styles.buttonDisabled : null]}
                      disabled={towerModeActive}
                    >
                      <Text style={styles.infoActionText}>{sigilAppearanceItemId === infoItem.id ? "Clear Look" : "Use Look"}</Text>
                    </Pressable>
                  </>
                ) : null}
                {infoItem?.category === "material" ? (
                  <>
                    {infoItem.id === "health-potion" || infoItem.id === "healing-herb" || infoItem.id === "focus-tonic" || infoItem.id === "mana-tonic" ? (
                      <Pressable onPress={() => handleUseConsumable(infoItem.id)} style={[styles.infoActionButton, towerModeActive ? styles.buttonDisabled : null]} disabled={towerModeActive}>
                        <Text style={styles.infoActionText}>Use</Text>
                      </Pressable>
                    ) : null}
                    {POUCH_COMPATIBLE_ITEM_IDS.includes(infoItem.id) ? (
                      <>
                        <View style={styles.infoPouchReadout}>
                          <Text style={styles.infoPouchReadoutText}>Combat Pouch x{combatPouchItems[infoItem.id] ?? 0}</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            const result = onAddCombatPouchItem(infoItem.id, 1);
                            setNoticeTone(result.ok ? "ok" : "error");
                            setNotice(result.reason ?? (result.ok ? "Pouch stack updated." : "Could not update pouch."));
                          }}
                          style={[styles.infoActionButton, towerModeActive ? styles.buttonDisabled : null]}
                          disabled={towerModeActive}
                        >
                          <Text style={styles.infoActionText}>Pack 1</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            const result = onRemoveCombatPouchItem(infoItem.id, 1);
                            setNoticeTone(result.ok ? "ok" : "error");
                            setNotice(result.reason ?? (result.ok ? "Pouch stack updated." : "Could not update pouch."));
                          }}
                          style={[styles.infoActionButton, towerModeActive || (combatPouchItems[infoItem.id] ?? 0) <= 0 ? styles.buttonDisabled : null]}
                          disabled={towerModeActive || (combatPouchItems[infoItem.id] ?? 0) <= 0}
                        >
                          <Text style={styles.infoActionText}>Remove 1</Text>
                        </Pressable>
                      </>
                    ) : null}
                  </>
                ) : null}
                {infoTitle ? (
                  <Pressable
                    onPress={() => {
                      const isEquipped = equippedTitleIds.includes(infoTitle.id);
                      if (isEquipped) {
                        handleUnequipTitle(infoTitle.id);
                      } else {
                        handleEquipTitle(infoTitle.id);
                      }
                    }}
                    style={[
                      styles.infoActionButton,
                      (towerModeActive || (!equippedTitleIds.includes(infoTitle.id) && (!isTitleOwned(character, infoTitle.id) || !isTitleUnlocked(character, infoTitle) || equippedTitleIds.length >= titleSlotLimit)))
                        ? styles.buttonDisabled
                        : null,
                    ]}
                    disabled={towerModeActive || (!equippedTitleIds.includes(infoTitle.id) && (!isTitleOwned(character, infoTitle.id) || !isTitleUnlocked(character, infoTitle) || equippedTitleIds.length >= titleSlotLimit))}
                  >
                    <Text style={styles.infoActionText}>
                      {towerModeActive ? "Tower Locked" : equippedTitleIds.includes(infoTitle.id) ? "Unequip" : "Equip"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={closeItemInfo}
                style={styles.infoCloseWrap}
              >
                <View style={styles.infoCloseButton}>
                  <Text style={styles.infoCloseText}>Close</Text>
                </View>
              </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
      {itemArtExpanded && itemInfoPanel && ITEM_BY_ID[itemInfoPanel.itemId]?.image ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setItemArtExpanded(false)}>
          <Pressable style={styles.expandedArtOverlay} onPress={() => setItemArtExpanded(false)}>
            <View style={styles.expandedArtCard}>
              <Text style={styles.expandedArtTitle}>{itemInfoPanel.title}</Text>
              <View
                style={[
                  styles.expandedArtRarityPill,
                  {
                    borderColor: rarityThemeMap[itemInfoPanel.rarity].border,
                    backgroundColor: rarityThemeMap[itemInfoPanel.rarity].bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.expandedArtRarityText,
                    { color: rarityThemeMap[itemInfoPanel.rarity].text },
                    itemInfoPanel.rarity === "legendary" ? styles.legendaryTextGlow : null,
                  ]}
                >
                  {itemInfoPanel.rarity.toUpperCase()}
                </Text>
              </View>
              <Image source={ITEM_BY_ID[itemInfoPanel.itemId]?.image} style={styles.expandedArtImage} resizeMode="contain" />
              <Text style={styles.expandedArtHint}>Tap anywhere to close</Text>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {consumableToast ? (
        <View style={styles.consumableToastWrap} pointerEvents="none">
          <View
            style={[
              styles.consumableToastCard,
              consumableToast.tone === "ok" ? styles.consumableToastCardOk : styles.consumableToastCardErr,
            ]}
          >
            <View style={styles.consumableToastIconWrap}>
              <GameItemIcon itemId={consumableToast.itemId} size={26} />
            </View>
            <View style={styles.consumableToastTextWrap}>
              <Text style={styles.consumableToastTitle}>{consumableToast.title}</Text>
              <Text style={styles.consumableToastDetail}>{consumableToast.detail}</Text>
            </View>
            <MaterialCommunityIcons
              name={consumableToast.tone === "ok" ? "check-circle" : "alert-circle"}
              size={18}
              color={consumableToast.tone === "ok" ? "#9df1b8" : "#ffb4b4"}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  page: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 24,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 31,
    fontWeight: "800",
    marginTop: -2,
    textAlign: "center",
  },
  titlePlate: {
    minHeight: 56,
    width: 270,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: -1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(70, 48, 23, 0.9)",
  },
  vaultHeader: {
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 12,
    gap: 10,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  vaultIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarFrame: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  vaultTitleWrap: {
    flex: 1,
    gap: 1,
  },
  vaultTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },
  vaultSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  vaultBadge: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d09a47",
    backgroundColor: "rgba(108, 69, 18, 0.56)",
    alignItems: "center",
    justifyContent: "center",
  },
  stashRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  stashChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#876a3d",
    backgroundColor: "rgba(48, 35, 22, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stashChipHp: {
    borderColor: "#4ea56d",
    backgroundColor: "rgba(20, 69, 36, 0.9)",
  },
  stashChipFocus: {
    borderColor: "#578db2",
    backgroundColor: "rgba(22, 48, 79, 0.9)",
  },
  stashIcon: {
    width: 16,
    height: 16,
  },
  stashValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  panel: {
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 12,
    gap: 8,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  equippedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 34, 57, 0.93)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  equippedBuffCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 34, 57, 0.93)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  equippedIconWrap: {
    width: 106,
    height: 106,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9f7f4b",
    backgroundColor: "rgba(26, 20, 36, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  equippedWeaponImage: {
    width: "98%",
    height: "98%",
  },
  equippedMeta: {
    flex: 1,
    gap: 2,
  },
  equippedName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  equippedSub: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  equippedMarkPreview: {
    marginTop: 6,
    gap: 4,
  },
  equippedMarkLabel: {
    color: "#f4d79e",
    fontSize: 11,
    fontWeight: "800",
  },
  equippedMarkEntry: {
    gap: 2,
  },
  equippedMarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  equippedMarkDiamond: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  equippedMarkDiamondEmpty: {
    borderColor: "#8f7a62",
    backgroundColor: "rgba(76, 58, 40, 0.35)",
  },
  equippedMarkDiamondCore: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  equippedMarkText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  equippedMarkEffect: {
    marginLeft: 22,
    color: "#dbc9a7",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  equippedMarkTextEmpty: {
    color: "#b79f7c",
  },
  weaponBonusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },
  weaponBonusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a48550",
    backgroundColor: "rgba(33, 24, 44, 0.82)",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  weaponBonusText: {
    color: "#f8e9c9",
    fontSize: 10,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  weaponCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  legendaryCardGlow: {
    shadowColor: "#ffb347",
    shadowOpacity: 0.88,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  appraisalGlow: {
    shadowColor: "#95a6ff",
    shadowOpacity: 0.75,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  weaponIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(176, 203, 255, 0.34)",
    backgroundColor: "rgba(8, 18, 40, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  weaponIconWrapLarge: {
    width: 66,
    height: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(176, 203, 255, 0.36)",
    backgroundColor: "rgba(8, 18, 40, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleArchiveIconFrame: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleArchiveIconImage: {
    width: 28,
    height: 28,
  },
  weaponMain: {
    flex: 1,
    gap: 2,
  },
  weaponName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rarityPill: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(8, 16, 36, 0.62)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  legendaryTextGlow: {
    textShadowColor: "rgba(255, 204, 116, 0.7)",
    textShadowRadius: 6,
  },
  classPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9f804d",
    backgroundColor: "rgba(52, 40, 24, 0.88)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  classText: {
    color: "#f2ddaf",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  weaponOwned: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  underleveledHint: {
    color: "#ffd69b",
    fontSize: 11,
    fontWeight: "800",
  },
  titleProgressTrack: {
    marginTop: 2,
    width: "100%",
    height: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#84673b",
    backgroundColor: "rgba(28, 21, 39, 0.9)",
    overflow: "hidden",
  },
  titleProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  equipButtonWrap: {
    minWidth: 72,
    borderRadius: 9,
    overflow: "hidden",
  },
  smallActionWrap: {
    minWidth: 72,
    borderRadius: 9,
    overflow: "hidden",
  },
  smallActionButton: {
    borderWidth: 1,
    borderColor: "#b28a4b",
    backgroundColor: "rgba(78, 57, 29, 0.72)",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  smallActionText: {
    color: "#ffecc5",
    fontSize: 11,
    fontWeight: "800",
  },
  smallActionButtonActive: {
    borderColor: "#84c8ff",
    backgroundColor: "rgba(22, 58, 101, 0.82)",
  },
  equipButton: {
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  equipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  tabRow: {
    gap: 8,
    paddingBottom: 4,
  },
  inventoryTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(196, 157, 92, 0.34)",
    backgroundColor: "rgba(28, 22, 43, 0.86)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inventoryTabActive: {
    borderColor: "#d2a45a",
    backgroundColor: "rgba(92, 63, 23, 0.92)",
  },
  inventoryTabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  inventoryTabTextActive: {
    color: "#ffe9bb",
  },
  collectionHint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sigilAppearancePanel: {
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(121, 194, 255, 0.28)",
    backgroundColor: "rgba(20, 24, 42, 0.82)",
    padding: 10,
    gap: 8,
  },
  sigilAppearanceTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  sigilAppearanceModeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sigilAppearanceModeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(158, 186, 230, 0.26)",
    backgroundColor: "rgba(30, 26, 48, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sigilAppearanceModeButtonActive: {
    borderColor: "#85c7ff",
    backgroundColor: "rgba(22, 58, 101, 0.84)",
  },
  sigilAppearanceModeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  sigilAppearanceModeTextActive: {
    color: "#e5f3ff",
  },
  sigilAppearancePinnedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  sigilAppearancePinnedText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  squareTile: {
    width: 92,
    height: 92,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  squareTileCompact: {
    width: 82,
    height: 82,
    borderRadius: 12,
  },
  squareTileDimmed: {
    opacity: 0.68,
  },
  squareTileCount: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240, 220, 169, 0.4)",
    backgroundColor: "rgba(15, 11, 24, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    zIndex: 2,
  },
  squareTileCountCompact: {
    top: 5,
    right: 5,
    paddingHorizontal: 5,
  },
  squareTileCountText: {
    color: "#fff0c8",
    fontSize: 10,
    fontWeight: "800",
  },
  squareTileCountTextCompact: {
    fontSize: 9,
  },
  squareTileStatus: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240, 220, 169, 0.4)",
    backgroundColor: "rgba(15, 11, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  squareTileStatusCompact: {
    width: 18,
    height: 18,
  },
  squareTileStatusSecondary: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240, 220, 169, 0.4)",
    backgroundColor: "rgba(15, 11, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  squareTileIconWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  squareTitleFrame: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  squareTitleArt: {
    width: 34,
    height: 34,
  },
  inventoryTile: {
    width: "31.8%",
    minHeight: 138,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    overflow: "hidden",
  },
  inventoryTileTall: {
    minHeight: 196,
  },
  inventoryTilePress: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  inventoryTileCount: {
    position: "absolute",
    top: 7,
    right: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240, 220, 169, 0.4)",
    backgroundColor: "rgba(15, 11, 24, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  inventoryTileCountText: {
    color: "#fff0c8",
    fontSize: 10,
    fontWeight: "900",
  },
  inventoryTileName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    minHeight: 30,
  },
  inventoryTileType: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  inventoryTileStat: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  tileActionWrap: {
    width: "100%",
    borderRadius: 9,
    overflow: "hidden",
  },
  tileActionButton: {
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tileActionText: {
    color: "#fff0cd",
    fontSize: 11,
    fontWeight: "900",
  },
  pouchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  pouchChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(134, 224, 182, 0.34)",
    backgroundColor: "rgba(17, 33, 31, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: "relative",
  },
  pouchRemoveButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 183, 176, 0.32)",
    backgroundColor: "rgba(84, 35, 40, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  pouchIconSlot: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 227, 188, 0.26)",
    backgroundColor: "rgba(10, 19, 18, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#09120f",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pouchTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 3,
  },
  pouchName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  pouchMeta: {
    color: "#9fdcc4",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pouchStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 216, 176, 0.25)",
    backgroundColor: "rgba(33, 61, 52, 0.96)",
    overflow: "hidden",
  },
  pouchStepperButton: {
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    backgroundColor: "rgba(70, 113, 94, 0.96)",
  },
  pouchStepperButtonText: {
    color: "#dbffec",
    fontSize: 14,
    fontWeight: "900",
  },
  pouchStepperValueWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pouchStepperValue: {
    color: "#e7f8ef",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  pouchControlWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    alignSelf: "center",
    maxWidth: "50%",
  },
  pouchControlWrapPending: {
    backgroundColor: "rgba(112, 85, 32, 0.2)",
    borderRadius: 999,
    padding: 4,
  },
  pouchApplyButton: {
    flexShrink: 0,
    minWidth: 38,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e0ca8e",
    backgroundColor: "rgba(115, 85, 31, 0.98)",
    alignItems: "center",
    justifyContent: "center",
  },
  tilePouchAddCompact: {
    alignSelf: "center",
  },
  tilePouchAddCompactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(135, 224, 181, 0.28)",
    backgroundColor: "rgba(42, 74, 63, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tilePouchAddCompactText: {
    color: "#dff8ea",
    fontSize: 11,
    fontWeight: "900",
  },
  tilePouchControlWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  tilePouchControlWrapPending: {
    backgroundColor: "rgba(112, 85, 32, 0.18)",
    borderRadius: 999,
    padding: 3,
  },
  tilePouchStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 216, 176, 0.22)",
    backgroundColor: "rgba(33, 61, 52, 0.95)",
    overflow: "hidden",
  },
  tilePouchStepperButton: {
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    backgroundColor: "rgba(70, 113, 94, 0.92)",
  },
  tilePouchStepperButtonText: {
    color: "#dbffec",
    fontSize: 13,
    fontWeight: "900",
  },
  tilePouchStepperValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tilePouchStepperValue: {
    color: "#e7f8ef",
    fontSize: 11,
    fontWeight: "900",
  },
  tilePouchApplyButton: {
    minWidth: 34,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e0ca8e",
    backgroundColor: "rgba(115, 85, 31, 0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  materialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  materialCard: {
    width: "48.5%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  materialHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  materialName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  materialFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  materialCount: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  materialRarity: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  materialUseButton: {
    marginTop: 2,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#ca9b54",
    backgroundColor: "rgba(85, 57, 20, 0.95)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  materialUseText: {
    color: "#ffe2a8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  noticeBannerOk: {
    borderColor: "#4e9a72",
    backgroundColor: "rgba(21, 74, 48, 0.8)",
  },
  noticeBannerErr: {
    borderColor: "#a15b67",
    backgroundColor: "rgba(84, 33, 46, 0.84)",
  },
  noticeBannerText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  consumableToastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    alignItems: "center",
  },
  consumableToastCard: {
    minWidth: 240,
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
  },
  consumableToastCardOk: {
    borderColor: "#5fc37c",
    backgroundColor: "rgba(16, 54, 28, 0.96)",
  },
  consumableToastCardErr: {
    borderColor: "#d16f6f",
    backgroundColor: "rgba(72, 24, 26, 0.96)",
  },
  consumableToastIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(26, 20, 36, 0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  consumableToastTextWrap: {
    flex: 1,
    gap: 1,
  },
  consumableToastTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  consumableToastDetail: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 8, 15, 0.66)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  infoModal: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "86%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8f7244",
    backgroundColor: "rgba(33, 24, 45, 0.98)",
    padding: 13,
    gap: 10,
    overflow: "hidden",
    position: "relative",
  },
  weaponRecordScroll: {
    flexGrow: 0,
  },
  weaponRecordScrollContent: {
    paddingBottom: 10,
  },
  infoHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIconFrame: {
    width: 172,
    height: 172,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: "rgba(11, 18, 36, 0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoArt: {
    width: "92%",
    height: "92%",
  },
  infoHeadText: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 21,
  },
  infoRarityPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  infoRarityText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  infoBody: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#866c42",
    backgroundColor: "rgba(42, 31, 20, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  infoScroll: {
    maxHeight: 260,
    marginTop: 12,
  },
  infoScrollContent: {
    paddingBottom: 2,
  },
  infoActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  infoActionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b58a48",
    backgroundColor: "rgba(75, 49, 20, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  infoPouchReadout: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#866c42",
    backgroundColor: "rgba(42, 31, 20, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  infoPouchReadoutText: {
    color: "#f0ddbe",
    fontSize: 12,
    fontWeight: "800",
  },
  infoActionText: {
    color: "#fff0cd",
    fontSize: 12,
    fontWeight: "800",
  },
  infoLine: {
    color: "#f0ddbe",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  infoTitleFrame: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitleArt: {
    width: 48,
    height: 48,
  },
  infoMarkSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 214, 147, 0.18)",
    paddingTop: 12,
    gap: 8,
  },
  infoMarkSectionTitle: {
    color: "#ffe5b9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  infoMarkEntry: {
    gap: 3,
  },
  infoMarkName: {
    fontSize: 14,
    fontWeight: "900",
  },
  infoMarkEffect: {
    color: "#ffe1a3",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  infoWeaponMetaBlock: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(154, 124, 76, 0.5)",
    backgroundColor: "rgba(26, 18, 40, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  infoWeaponMetaLine: {
    color: "#ecd8b2",
    fontSize: 11,
    fontWeight: "800",
  },
  infoWeaponMetaWarn: {
    color: "#ffd4a4",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  infoWeaponStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoWeaponStatCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#977442",
    backgroundColor: "rgba(58, 41, 23, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
    alignItems: "center",
  },
  infoWeaponStatLabel: {
    color: "#e7d4af",
    fontSize: 10,
    fontWeight: "700",
  },
  infoWeaponStatValue: {
    color: "#fff1cb",
    fontSize: 18,
    fontWeight: "900",
  },
  infoWeaponLoreBlock: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#866c42",
    backgroundColor: "rgba(42, 31, 20, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  infoWeaponLoreTitle: {
    color: "#ffe5b9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  infoWeaponLoreText: {
    color: "#f0ddbe",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  infoMarkFlavor: {
    color: "#d9c8ae",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  infoCloseWrap: {
    alignSelf: "flex-end",
    borderRadius: 10,
    overflow: "hidden",
  },
  infoCloseButton: {
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  infoCloseText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  expandedArtOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 8, 17, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  expandedArtCard: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
    gap: 12,
  },
  expandedArtTitle: {
    color: "#fff0ca",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  expandedArtRarityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expandedArtRarityText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  expandedArtImage: {
    width: "100%",
    height: 420,
  },
  expandedArtHint: {
    color: "#d6c29d",
    fontSize: 11,
    fontWeight: "700",
  },
});
