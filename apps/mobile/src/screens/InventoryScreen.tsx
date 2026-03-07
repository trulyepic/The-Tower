import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { ITEM_BY_ID } from "../data/items";
import { CURRENCY_SPRITES, getAvatarSprite } from "../data/uiSprites";
import { getBuffRemainingSeconds, getBuffSlotLimit } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { CharacterState, ItemId, ItemRarity } from "../types/game";
import { colors } from "../theme/colors";

interface InventoryScreenProps {
  character: CharacterState;
  onEquipWeapon: (itemId: ItemId) => { ok: boolean; reason?: string };
  onEquipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
  onUnequipBuff: (itemId: ItemId) => { ok: boolean; reason?: string };
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

export const InventoryScreen = ({ character, onEquipWeapon, onEquipBuff, onUnequipBuff }: InventoryScreenProps) => {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

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
        .filter((entry) => entry.item?.category !== "weapon")
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
  const equippedBuffIds = character.equippedBuffIds ?? [];
  const buffSlotLimit = getBuffSlotLimit(character.adventurerRank);
  const combat = getCharacterCombatStats(character);

  const handleEquip = (itemId: ItemId) => {
    const result = onEquipWeapon(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Weapon equipped." : result.reason ?? "Could not equip weapon.");
  };

  const handleEquipBuff = (itemId: ItemId) => {
    const result = onEquipBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Buff equipped." : result.reason ?? "Could not equip buff.");
  };

  const handleUnequipBuff = (itemId: ItemId) => {
    const result = onUnequipBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Buff unequipped." : result.reason ?? "Could not unequip buff.");
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
            <View style={styles.stashChip}>
              <Image source={CURRENCY_SPRITES.gold} style={styles.stashIcon} resizeMode="contain" />
              <Text style={styles.stashValue}>{character.gold}</Text>
            </View>
            <View style={styles.stashChip}>
              <MaterialCommunityIcons name="sword-cross" size={15} color={colors.accent} />
              <Text style={styles.stashValue}>{weaponEntries.length} Weapons</Text>
            </View>
            <View style={styles.stashChip}>
              <MaterialCommunityIcons name="archive" size={15} color={colors.accentSecondary} />
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
                <GameItemIcon itemId={equippedWeapon.id} size={26} />
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
          <Text style={styles.sectionTitle}>Buff Loadout ({equippedBuffIds.length}/{buffSlotLimit})</Text>
          {equippedBuffIds.length === 0 ? (
            <Text style={styles.emptyText}>No buffs equipped.</Text>
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
                      {buff.rarity.toUpperCase()} BUFF •{" "}
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
                  <Pressable onPress={() => handleUnequipBuff(buffId)} style={styles.smallActionWrap}>
                    <View style={styles.smallActionButton}>
                      <Text style={styles.smallActionText}>Unequip</Text>
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
                  <View style={styles.weaponIconWrap}>
                    <GameItemIcon itemId={itemId} size={28} />
                  </View>
                  <View style={styles.weaponMain}>
                    <Text style={styles.weaponName}>{item.name}</Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.rarityPill, { borderColor: rarityTheme.border }]}>
                        <Text style={[styles.rarityText, { color: rarityTheme.text }]}>{item.rarity.toUpperCase()}</Text>
                      </View>
                      {item.classRestriction ? (
                        <View style={styles.classPill}>
                          <Text style={styles.classText}>{item.classRestriction.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.weaponOwned}>Owned x{amount}</Text>
                    <Text style={styles.weaponOwned}>
                      Requires Lv {item.requiredLevel ?? 1} • Proficiency{" "}
                      {character.progression.level >= (item.requiredLevel ?? 1) ? "100%" : "25%"}
                    </Text>
                    <Text style={styles.weaponOwned}>
                      WPN ATK {item.weaponStats?.attack ?? 0} • CRIT {item.weaponStats?.crit ?? 0}% • SPD {item.weaponStats?.speed ?? 0}
                    </Text>
                  </View>
                  <Pressable
                    disabled={!canEquip || isEquipped}
                    onPress={() => handleEquip(itemId)}
                    style={[styles.equipButtonWrap, (!canEquip || isEquipped) ? styles.buttonDisabled : null]}
                  >
                    <View style={styles.equipButton}>
                      <Text style={styles.equipText}>{isEquipped ? "Equipped" : canEquip ? "Equip" : "Locked"}</Text>
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
          <Text style={styles.sectionTitle}>Buff Collection</Text>
          {buffEntries.length === 0 ? (
            <Text style={styles.emptyText}>No buffs owned yet. Visit Guild Store.</Text>
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
                  <View style={styles.weaponIconWrap}>
                    <GameItemIcon itemId={itemId} size={26} />
                  </View>
                  <View style={styles.weaponMain}>
                    <Text style={styles.weaponName}>{item.name}</Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.rarityPill, { borderColor: rarityTheme.border }]}>
                        <Text style={[styles.rarityText, { color: rarityTheme.text }]}>{item.rarity.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.weaponOwned}>Owned x{amount}</Text>
                    <Text style={styles.weaponOwned}>
                      DMG +{item.buffStats?.damageFlat ?? 0} • CRIT +{item.buffStats?.critFlat ?? 0}% • SPD +{item.buffStats?.speedFlat ?? 0} • QUEST +{item.buffStats?.questSuccessFlat ?? 0}%
                    </Text>
                    <Text style={styles.weaponOwned}>
                      Duration {(Math.floor((item.buffDurationSeconds ?? 0) / 60))}m {(item.buffDurationSeconds ?? 0) % 60}s
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => (isEquipped ? handleUnequipBuff(itemId) : handleEquipBuff(itemId))}
                    style={[styles.equipButtonWrap, (!canEquip && !isEquipped) ? styles.buttonDisabled : null]}
                    disabled={!canEquip && !isEquipped}
                  >
                    <View style={styles.equipButton}>
                      <Text style={styles.equipText}>{isEquipped ? "Unequip" : "Equip"}</Text>
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
          <Text style={styles.sectionTitle}>Materials Board</Text>
          <View style={styles.materialGrid}>
            {materialEntries.length === 0 ? (
              <Text style={styles.emptyText}>No materials yet. Run gather quests.</Text>
            ) : (
              materialEntries.map(({ item, itemId, amount }) => {
                const rarity = item?.rarity ?? "common";
                const rarityTheme = rarityThemeMap[rarity];
                const isLegendary = rarity === "legendary";
                return (
                  <View
                    key={itemId}
                    style={[
                      styles.materialCard,
                      { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg },
                      isLegendary ? styles.legendaryCardGlow : null,
                    ]}
                  >
                    {/* Materials use icon-first cards to reduce text clutter and feel more game-like. */}
                    <View style={styles.materialHead}>
                      <GameItemIcon itemId={itemId} size={20} />
                      <Text style={styles.materialName} numberOfLines={1}>{item?.name ?? itemId}</Text>
                    </View>
                    <View style={styles.materialFoot}>
                      <Text style={styles.materialCount}>x{amount}</Text>
                      <Text style={[styles.materialRarity, { color: rarityTheme.text }]}>{rarity.toUpperCase()}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
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
    alignSelf: "flex-start",
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
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9f7f4b",
    backgroundColor: "rgba(26, 20, 36, 0.95)",
    alignItems: "center",
    justifyContent: "center",
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
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
});
