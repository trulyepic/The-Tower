import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { CURRENCY_SPRITES, getAvatarSprite } from "../data/uiSprites";
import { TITLE_ICON_ART } from "../data/titleVisuals";
import { getBuffRemainingSeconds, getBuffSlotLimit } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
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
  towerPreparedItemIds: ItemId[];
  onEquipWeapon: (itemId: ItemId) => { ok: boolean; reason?: string };
  onEquipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  onUnequipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  onEquipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  onUnequipTitle: (titleId: ItemId) => { ok: boolean; reason?: string };
  onUseSkillResourceItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  onUseHealthRecoveryItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  onUseTowerConsumableItem: (itemId: ItemId) => { ok: boolean; reason?: string };
}

interface RarityTheme {
  border: string;
  bg: string;
  text: string;
}

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

export const InventoryScreen = ({
  character,
  towerModeActive,
  towerPreparedItemIds,
  onEquipWeapon,
  onEquipBuff,
  onUnequipBuff,
  onEquipTitle,
  onUnequipTitle,
  onUseSkillResourceItem,
  onUseHealthRecoveryItem,
  onUseTowerConsumableItem,
}: InventoryScreenProps) => {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [consumableToast, setConsumableToast] = useState<{
    itemId: ItemId;
    title: string;
    detail: string;
    tone: "ok" | "error";
  } | null>(null);
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

  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const nowMs = Date.now();
  const healthPulse = useRef(new Animated.Value(0)).current;
  const focusPulse = useRef(new Animated.Value(0)).current;
  const equippedBuffIds = character.equippedBuffIds ?? [];
  const buffSlotLimit = getBuffSlotLimit(character.adventurerRank);
  const titleSlotLimit = getTitleSlotLimit(character.progression.level);
  const equippedTitleIds = character.equippedTitleIds ?? [];
  const discoveredTitles = getDiscoveredTitleItems(character);
  const combat = getCharacterCombatStats(character);

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
          : onUseTowerConsumableItem(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Item used." : "Could not use item."));
    const detailByItem: Partial<Record<ItemId, string>> = {
      "healing-herb": "+12 HP",
      "health-potion": "+35 HP",
      "focus-tonic": "+6 Focus",
      "mana-tonic": "+8 Focus",
      "antitoxin-vial": "Poison counter prepared",
      "guard-tonic": "Guard counter prepared",
      "grounding-tonic": "Shock counter prepared",
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
      lines.push(`Required Level: ${item.requiredLevel ?? 1}`);
      lines.push(`Class: ${(item.classRestriction ?? "Any").toUpperCase()}`);
      lines.push(
        `Stats: +${item.weaponStats?.attack ?? 0} ATK • +${item.weaponStats?.crit ?? 0}% CRIT • +${item.weaponStats?.speed ?? 0} SPD`,
      );
      if (item.description) {
        lines.push(item.description);
      }
    } else if (item.category === "buff") {
      lines.push(
        `Sigil: +${item.buffStats?.damageFlat ?? 0} ATK • +${item.buffStats?.critFlat ?? 0}% CRIT • +${item.buffStats?.speedFlat ?? 0} SPD`,
      );
      lines.push(
        `Bonuses: +${item.buffStats?.questSuccessFlat ?? 0}% Quest Success`,
      );
      lines.push(`Duration: ${Math.floor((item.buffDurationSeconds ?? 0) / 60)}m ${(item.buffDurationSeconds ?? 0) % 60}s`);
      if (item.description) {
        lines.push(item.description);
      }
    } else {
      if (item.description) {
        lines.push(item.description);
      }
      lines.push("Use: Quest supplies, crafting, tower prep, and trade.");
    }
    setItemInfoPanel({
      itemId,
      title: item.name,
      rarity: item.rarity,
      lines,
    });
  };

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
              <Image source={getAvatarSprite(character.avatarId, character.classId)} style={styles.avatarImage} />
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
              <Text style={styles.stashValue}>{materialEntries.length} Materials</Text>
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
            <View style={styles.equippedCard}>
              <View style={styles.equippedIconWrap}>
                {equippedWeapon.image ? (
                  <Image source={equippedWeapon.image} style={styles.equippedWeaponImage} resizeMode="contain" />
                ) : (
                  <GameItemIcon itemId={equippedWeapon.id} size={42} />
                )}
              </View>
              <View style={styles.equippedMeta}>
                <Text style={styles.equippedName}>{equippedWeapon.name}</Text>
                <Text style={styles.equippedSub}>
                  {equippedWeapon.rarity.toUpperCase()} • Lv {equippedWeapon.requiredLevel ?? 1}+ • {combat.weaponProficiencyPercent}% proficiency
                </Text>
                <Text style={styles.equippedSub}>ATK {combat.damage} • CRIT {combat.critChance}% • SPD {combat.speed}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No weapon equipped yet.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(205, 150, 75, 0.09)", "rgba(97, 63, 151, 0.06)", "rgba(23, 16, 38, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Sigil Loadout ({equippedBuffIds.length}/{buffSlotLimit})</Text>
          {equippedBuffIds.length === 0 ? (
            <Text style={styles.emptyText}>No sigils equipped.</Text>
          ) : (
            equippedBuffIds.map((buffId) => {
              const buff = ITEM_BY_ID[buffId];
              if (!buff) {
                return null;
              }
              return (
                <View key={`eq-buff-${buffId}`} style={styles.equippedBuffCard}>
                  <GameItemIcon itemId={buffId} size={20} />
                  <View style={styles.equippedMeta}>
                    <Text style={styles.equippedName}>{buff.name}</Text>
                    <Text style={styles.equippedSub}>
                      {buff.rarity.toUpperCase()} SIGIL •{" "}
                      {(() => {
                        const active = (character.activeBuffExpiresAtMs?.[buffId] ?? 0) > nowMs;
                        const remaining = getBuffRemainingSeconds(character, buffId, nowMs);
                        if (active) {
                          return `Active ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`;
                        }
                        return remaining > 0
                          ? `Paused ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                          : "Inactive";
                      })()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleUnequipBuff(buffId)}
                    style={[styles.smallActionWrap, towerModeActive ? styles.buttonDisabled : null]}
                    disabled={towerModeActive}
                  >
                    <View style={styles.smallActionButton}>
                      <Text style={styles.smallActionText}>{towerModeActive ? "Tower Locked" : "Unequip"}</Text>
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(201, 148, 72, 0.08)", "rgba(95, 63, 150, 0.06)", "rgba(22, 16, 36, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Armory</Text>
          {weaponEntries.length === 0 ? (
            <Text style={styles.emptyText}>No class weapons owned yet. Visit the Guild Store.</Text>
          ) : (
            weaponEntries.map(({ item, itemId, amount }) => {
              if (!item) {
                return null;
              }

              const isEquipped = character.equippedWeaponId === itemId;
              const canEquip = !item.classRestriction || item.classRestriction === character.classId;
              const rarityTheme = rarityThemeMap[item.rarity];
              const isLegendary = item.rarity === "legendary";

              return (
                <View
                  key={itemId}
                  style={[
                    styles.weaponCard,
                    { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
                    isLegendary ? styles.legendaryCardGlow : null,
                  ]}
                >
                  <Pressable style={styles.weaponIconWrapLarge} onPress={() => openItemInfo(itemId)}>
                    <GameItemIcon itemId={itemId} size={44} />
                  </Pressable>
                  <View style={styles.weaponMain}>
                    <Text style={styles.weaponName}>{item.name}</Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.rarityPill, { borderColor: rarityTheme.border }]}>
                        <Text style={[styles.rarityText, { color: rarityTheme.text }, item.rarity === "legendary" ? styles.legendaryTextGlow : null]}>
                          {item.rarity.toUpperCase()}
                        </Text>
                      </View>
                      {item.classRestriction ? (
                        <View style={styles.classPill}>
                          <Text style={styles.classText}>{item.classRestriction.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.weaponOwned}>Owned x{amount} • Tap icon for details</Text>
                    <Text style={styles.weaponOwned}>
                      Requires Lv {item.requiredLevel ?? 1} • Proficiency{" "}
                      {character.progression.level >= (item.requiredLevel ?? 1) ? "100%" : "25%"}
                    </Text>
                    <Text style={styles.weaponOwned}>
                      WPN ATK {item.weaponStats?.attack ?? 0} • CRIT {item.weaponStats?.crit ?? 0}% • SPD {item.weaponStats?.speed ?? 0}
                    </Text>
                  </View>
                  <Pressable
                    disabled={towerModeActive || !canEquip || isEquipped}
                    onPress={() => handleEquip(itemId)}
                    style={[styles.equipButtonWrap, (towerModeActive || !canEquip || isEquipped) ? styles.buttonDisabled : null]}
                  >
                    <View style={styles.equipButton}>
                      <Text style={styles.equipText}>
                        {isEquipped ? "Equipped" : towerModeActive ? "Tower Locked" : canEquip ? "Equip" : "Locked"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(191, 139, 66, 0.08)", "rgba(90, 58, 143, 0.06)", "rgba(21, 15, 35, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Sigil Collection</Text>
          {buffEntries.length === 0 ? (
            <Text style={styles.emptyText}>No sigils owned yet. Visit Guild Store.</Text>
          ) : (
            buffEntries.map(({ item, itemId, amount }) => {
              if (!item) {
                return null;
              }
              const isEquipped = equippedBuffIds.includes(itemId);
              const canEquip = equippedBuffIds.length < buffSlotLimit || isEquipped;
              const rarityTheme = rarityThemeMap[item.rarity];
              const isLegendary = item.rarity === "legendary";

              return (
                <View
                  key={`buff-${itemId}`}
                  style={[
                    styles.weaponCard,
                    { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
                    isLegendary ? styles.legendaryCardGlow : null,
                  ]}
                >
                  <Pressable style={styles.weaponIconWrapLarge} onPress={() => openItemInfo(itemId)}>
                    <GameItemIcon itemId={itemId} size={42} />
                  </Pressable>
                  <View style={styles.weaponMain}>
                    <Text style={styles.weaponName}>{item.name}</Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.rarityPill, { borderColor: rarityTheme.border }]}>
                        <Text style={[styles.rarityText, { color: rarityTheme.text }, item.rarity === "legendary" ? styles.legendaryTextGlow : null]}>
                          {item.rarity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.weaponOwned}>Owned x{amount} • Tap icon for details</Text>
                    <Text style={styles.weaponOwned}>
                      DMG +{item.buffStats?.damageFlat ?? 0} • CRIT +{item.buffStats?.critFlat ?? 0}% • SPD +{item.buffStats?.speedFlat ?? 0} • QUEST +{item.buffStats?.questSuccessFlat ?? 0}%
                    </Text>
                    <Text style={styles.weaponOwned}>
                      Duration {(Math.floor((item.buffDurationSeconds ?? 0) / 60))}m {(item.buffDurationSeconds ?? 0) % 60}s
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => (isEquipped ? handleUnequipBuff(itemId) : handleEquipBuff(itemId))}
                    style={[styles.equipButtonWrap, (towerModeActive || (!canEquip && !isEquipped)) ? styles.buttonDisabled : null]}
                    disabled={towerModeActive || (!canEquip && !isEquipped)}
                  >
                    <View style={styles.equipButton}>
                      <Text style={styles.equipText}>{towerModeActive ? "Tower Locked" : isEquipped ? "Unequip" : "Equip"}</Text>
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(198, 143, 67, 0.09)", "rgba(88, 57, 143, 0.05)", "rgba(21, 15, 35, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Title Archive ({equippedTitleIds.length}/{titleSlotLimit})</Text>
          {discoveredTitles.length === 0 ? (
            <Text style={styles.emptyText}>No discovered titles yet. Start quests to reveal title trails.</Text>
          ) : discoveredTitles.map((title) => {
            const unlocked = isTitleUnlocked(character, title);
            const owned = isTitleOwned(character, title.id);
            const isEquipped = equippedTitleIds.includes(title.id);
            const slotsFull = equippedTitleIds.length >= titleSlotLimit;
            const canEquip = owned && unlocked && (!slotsFull || isEquipped);
            const rarityTheme = rarityThemeMap[title.rarity];
            const isLegendary = title.rarity === "legendary";
            const progress = getTitleProgress(character, title.id);
            const progressNeed = getTitleRequiredProgress(title);
            const progressPercent = Math.round((Math.min(progress, progressNeed) / Math.max(1, progressNeed)) * 100);
            return (
              <View
                key={`title-${title.id}`}
                style={[
                  styles.weaponCard,
                  { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
                  isLegendary ? styles.legendaryCardGlow : null,
                ]}
              >
                <Pressable
                  style={styles.weaponIconWrapLarge}
                  onPress={() =>
                    setItemInfoPanel({
                      itemId: title.id,
                      title: title.name,
                      rarity: title.rarity,
                      lines: [
                        title.flavor,
                        `Ability: ${title.abilityLabel}`,
                        `Requirement: Level ${title.minLevel}${title.classRestriction ? ` (${title.classRestriction.toUpperCase()})` : ""}`,
                        `Bonuses: +${title.bonuses.damageFlat ?? 0} ATK • +${title.bonuses.critFlat ?? 0}% CRIT • +${title.bonuses.speedFlat ?? 0} SPD • +${title.bonuses.questSuccessFlat ?? 0}% Quest`,
                      ],
                    })
                  }
                >
                  <ImageBackground
                    source={HUD_ASSETS.slots[title.rarity]}
                    style={styles.titleArchiveIconFrame}
                    resizeMode="contain"
                  >
                    <Image source={TITLE_ICON_ART[title.id]} style={styles.titleArchiveIconImage} resizeMode="contain" />
                  </ImageBackground>
                </Pressable>
                <View style={styles.weaponMain}>
                  <Text style={styles.weaponName}>{title.name}</Text>
                  <View style={styles.badgesRow}>
                    <View style={[styles.rarityPill, { borderColor: rarityTheme.border }]}>
                      <Text style={[styles.rarityText, { color: rarityTheme.text }]}>{title.rarity.toUpperCase()}</Text>
                    </View>
                    {title.classRestriction ? (
                      <View style={styles.classPill}>
                        <Text style={styles.classText}>{title.classRestriction.toUpperCase()}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.weaponOwned}>{title.flavor}</Text>
                  <Text style={styles.weaponOwned}>Tap icon for details</Text>
                  <Text style={styles.weaponOwned}>
                    Ability: {title.abilityLabel}
                  </Text>
                  <Text style={styles.weaponOwned}>Status: {owned ? "Earned" : "Not Earned"}</Text>
                  <Text style={styles.weaponOwned}>
                    Progress: {Math.min(progress, progressNeed)}/{progressNeed}
                  </Text>
                  <View style={styles.titleProgressTrack}>
                    <View style={[styles.titleProgressFill, { width: `${progressPercent}%`, backgroundColor: rarityTheme.border }]} />
                  </View>
                  <Text style={styles.weaponOwned}>
                    DMG +{title.bonuses.damageFlat ?? 0} • CRIT +{title.bonuses.critFlat ?? 0}% • SPD +{title.bonuses.speedFlat ?? 0} • QUEST +{title.bonuses.questSuccessFlat ?? 0}%
                  </Text>
                  {!owned || !unlocked ? (
                    <Text style={styles.weaponOwned}>
                      Requirement: {owned ? "" : "Earn title from achievements"}{!owned && !unlocked ? " • " : ""}{!unlocked ? `Level ${title.minLevel}${title.classRestriction ? ` (${title.classRestriction})` : ""}` : ""}
                    </Text>
                  ) : null}
                </View>
                  <Pressable
                    onPress={() => (isEquipped ? handleUnequipTitle(title.id) : handleEquipTitle(title.id))}
                    style={[styles.equipButtonWrap, (towerModeActive || (!canEquip && !isEquipped)) ? styles.buttonDisabled : null]}
                    disabled={towerModeActive || (!canEquip && !isEquipped)}
                  >
                    <View style={styles.equipButton}>
                      <Text style={styles.equipText}>
                        {isEquipped ? "Unequip" : towerModeActive ? "Tower Locked" : canEquip ? "Equip" : "Locked"}
                      </Text>
                    </View>
                  </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(198, 143, 67, 0.09)", "rgba(88, 57, 143, 0.05)", "rgba(21, 15, 35, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Materials Board</Text>
          <View style={styles.materialGrid}>
            {materialEntries.length === 0 ? (
              <Text style={styles.emptyText}>No materials yet. Run gather quests.</Text>
            ) : (
              materialEntries.map(({ item, itemId, amount }) => {
                const rarity = item?.rarity ?? "common";
                const rarityTheme = rarityThemeMap[rarity];
                const isLegendary = rarity === "legendary";
                const isAppraised = !item?.requiresAppraisal || (character.appraisedItemIds ?? []).includes(itemId);
                const displayName = item?.requiresAppraisal && !isAppraised ? "Unknown Remnant" : item?.name ?? itemId;
                const isUsableConsumable =
                  itemId === "healing-herb" ||
                  itemId === "focus-tonic" ||
                  itemId === "mana-tonic" ||
                  itemId === "health-potion" ||
                  (towerModeActive &&
                    (itemId === "antitoxin-vial" || itemId === "guard-tonic" || itemId === "grounding-tonic"));
                return (
                  <Pressable
                    key={itemId}
                    style={[
                      styles.materialCard,
                      { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
                      item?.requiresAppraisal && !isAppraised ? styles.appraisalGlow : null,
                      isLegendary ? styles.legendaryCardGlow : null,
                    ]}
                    onPress={() => openItemInfo(itemId)}
                  >
                    <View style={styles.materialHead}>
                      <GameItemIcon itemId={itemId} size={34} />
                      <Text style={styles.materialName} numberOfLines={1}>{displayName}</Text>
                    </View>
                    <View style={styles.materialFoot}>
                      <Text style={styles.materialCount}>x{amount}</Text>
                      <Text style={[styles.materialRarity, { color: rarityTheme.text }]}>
                        {item?.requiresAppraisal && !isAppraised ? "APPRAISE" : rarity.toUpperCase()}
                      </Text>
                    </View>
                    {isUsableConsumable ? (
                      <Pressable style={styles.materialUseButton} onPress={() => handleUseConsumable(itemId as ItemId)}>
                        <Text style={styles.materialUseText}>
                          {towerPreparedItemIds.includes(itemId as ItemId) ? "Prepared" : "Use"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
      {itemInfoPanel ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            setItemArtExpanded(false);
            setItemInfoPanel(null);
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
              <View style={styles.infoHead}>
                <Pressable
                  onPress={() => {
                    if (ITEM_BY_ID[itemInfoPanel.itemId]?.image) {
                      setItemArtExpanded(true);
                    }
                  }}
                  style={[styles.infoIconFrame, { borderColor: rarityThemeMap[itemInfoPanel.rarity].border }]}
                >
                  {ITEM_BY_ID[itemInfoPanel.itemId]?.image ? (
                    <Image source={ITEM_BY_ID[itemInfoPanel.itemId]?.image} style={styles.infoArt} resizeMode="contain" />
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
              <View style={styles.infoBody}>
                {itemInfoPanel.lines.map((line, index) => (
                  <Text key={`info-line-${index}`} style={styles.infoLine}>
                    {line}
                  </Text>
                ))}
              </View>
              <Pressable
                onPress={() => {
                  setItemArtExpanded(false);
                  setItemInfoPanel(null);
                }}
                style={styles.infoCloseWrap}
              >
                <View style={styles.infoCloseButton}>
                  <Text style={styles.infoCloseText}>Close</Text>
                </View>
              </Pressable>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#957748",
    backgroundColor: "rgba(26, 20, 35, 0.95)",
    overflow: "hidden",
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8f7244",
    backgroundColor: "rgba(33, 24, 45, 0.98)",
    padding: 13,
    gap: 10,
    overflow: "hidden",
    position: "relative",
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
  infoLine: {
    color: "#f0ddbe",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
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
