import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GameItemIcon } from "./GameItemIcon";
import { ItemDefinition, ItemRarity } from "../types/game";
import { colors } from "../theme/colors";

const rarityColorMap: Record<ItemRarity, string> = {
  common: "#b9ac92",
  rare: "#ff78c9",
  epic: "#c48dff",
  legendary: "#ffbf6a",
};

const rarityBgMap: Record<ItemRarity, string> = {
  common: "rgba(67, 67, 74, 0.9)",
  rare: "rgba(30, 64, 108, 0.9)",
  epic: "rgba(72, 37, 109, 0.9)",
  legendary: "rgba(86, 62, 16, 0.92)",
};

interface WeaponRecordPanelProps {
  item: ItemDefinition;
  proficiencyPercent: number;
  warningText?: string | null;
  onClose: () => void;
  onPressArt?: () => void;
}

export function WeaponRecordPanel({
  item,
  proficiencyPercent,
  warningText,
  onClose,
  onPressArt,
}: WeaponRecordPanelProps) {
  const rarityColor = rarityColorMap[item.rarity];

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <MaterialCommunityIcons name="sword-cross" size={14} color="#ffe0a4" />
          <Text style={styles.bannerText}>Weapon Record</Text>
        </View>
        <Pressable onPress={onClose}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
        </Pressable>
      </View>
      <View style={styles.head}>
        <Text style={styles.title}>{item.name}</Text>
        <View
          style={[
            styles.gradePill,
            {
              borderColor: rarityColor,
              backgroundColor: rarityBgMap[item.rarity],
            },
          ]}
        >
          <Text
            style={[
              styles.gradeText,
              { color: rarityColor },
              item.rarity === "legendary" ? styles.legendaryTextGlow : null,
            ]}
          >
            {item.rarity.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.hero}>
        <Pressable style={[styles.artFrame, { borderColor: rarityColor }]} onPress={onPressArt}>
          {item.image ? (
            <Image source={item.image} style={styles.art} resizeMode="contain" />
          ) : (
            <GameItemIcon itemId={item.id} size={72} />
          )}
        </Pressable>
        <View style={styles.metaCol}>
          <Text style={styles.meta}>Required Level {item.requiredLevel ?? 1}</Text>
          <Text style={styles.meta}>Proficiency {proficiencyPercent}%</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          {warningText ? <Text style={styles.warn}>{warningText}</Text> : null}
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="sword-cross" size={16} color="#ffd786" />
          <Text style={styles.statLabel}>Attack</Text>
          <Text style={styles.statValue}>+{item.weaponStats?.attack ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#ff78c9" />
          <Text style={styles.statLabel}>Critical</Text>
          <Text style={styles.statValue}>+{item.weaponStats?.crit ?? 0}%</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="run-fast" size={16} color="#8de9a8" />
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>+{item.weaponStats?.speed ?? 0}</Text>
        </View>
      </View>
      {item.lore ? (
        <View style={styles.lorePanel}>
          <Text style={styles.sectionTitle}>Lore</Text>
          <Text style={styles.loreText}>{item.lore}</Text>
        </View>
      ) : null}
      {(item.weaponMarkSlots ?? 0) > 0 ? (
        <View style={styles.markPanel}>
          <Text style={styles.sectionTitle}>Forge Marks</Text>
          {Array.from({ length: item.weaponMarkSlots ?? 0 }).map((_, index) => {
            const mark = item.weaponMarks?.[index];
            const markColor = mark ? rarityColorMap[mark.rarity] : "#8f7a62";
            return (
              <View
                key={mark?.id ?? `empty-mark-${index}`}
                style={[
                  styles.markEntry,
                  mark
                    ? {
                        borderColor: `${markColor}44`,
                        backgroundColor: `${markColor}12`,
                      }
                    : styles.markEntryEmpty,
                ]}
              >
                <View
                  style={[
                    styles.markDiamond,
                    mark
                      ? {
                          borderColor: markColor,
                          backgroundColor: `${markColor}22`,
                        }
                      : styles.markDiamondEmpty,
                  ]}
                >
                  {mark ? <View style={[styles.markDiamondCore, { backgroundColor: markColor }]} /> : null}
                </View>
                <View style={styles.markBody}>
                  <View style={styles.markHead}>
                    <Text style={[styles.markName, mark ? { color: markColor } : styles.emptyMarkName]}>
                      {mark?.name ?? "Empty Socket"}
                    </Text>
                  </View>
                  {mark?.effectDescription ? <Text style={styles.markEffect}>{mark.effectDescription}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bf9251",
    backgroundColor: "rgba(113, 74, 27, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannerText: {
    color: "#ffe5b9",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  gradePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  hero: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  artFrame: {
    width: 104,
    height: 104,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(34, 24, 48, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  art: {
    width: 86,
    height: 86,
  },
  metaCol: {
    flex: 1,
    gap: 4,
  },
  meta: {
    color: "#ecd8b2",
    fontSize: 11,
    fontWeight: "800",
  },
  desc: {
    color: "#d7c3a0",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  warn: {
    color: "#ffd4a4",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
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
  statLabel: {
    color: "#e7d4af",
    fontSize: 10,
    fontWeight: "700",
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  lorePanel: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 33, 58, 0.93)",
    padding: 10,
    gap: 6,
  },
  sectionTitle: {
    color: "#ffe5b9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  loreText: {
    color: "#e8d7bb",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  markPanel: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7e6751",
    backgroundColor: "rgba(35, 26, 46, 0.9)",
    padding: 10,
    gap: 6,
  },
  markEntry: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  markEntryEmpty: {
    borderColor: "rgba(143, 122, 98, 0.3)",
    backgroundColor: "rgba(56, 42, 31, 0.36)",
  },
  markDiamond: {
    width: 18,
    height: 18,
    marginTop: 3,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  markDiamondEmpty: {
    borderColor: "#8f7a62",
    backgroundColor: "rgba(76, 58, 40, 0.35)",
  },
  markDiamondCore: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  markBody: {
    flex: 1,
    gap: 4,
  },
  markHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  markName: {
    fontSize: 15,
    fontWeight: "900",
  },
  emptyMarkName: {
    color: "#b79f7c",
  },
  markEffect: {
    color: "#ffe1a3",
    fontSize: 13,
    fontWeight: "800",
  },
  legendaryTextGlow: {
    textShadowColor: "rgba(255, 204, 116, 0.7)",
    textShadowRadius: 6,
  },
});
