import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GameItemIcon } from "./GameItemIcon";
import { ItemDefinition, ItemRarity } from "../types/game";
import { colors } from "../theme/colors";

interface EquippedWeaponCardProps {
  item: ItemDefinition;
  proficiencyPercent: number;
  effectiveAttack: number;
  effectiveCrit: number;
  effectiveSpeed: number;
  onPress?: () => void;
  onUnequip?: () => void;
}

const rarityColorMap: Record<ItemRarity, string> = {
  common: "#b9ac92",
  rare: "#ff78c9",
  epic: "#c48dff",
  legendary: "#ffbf6a",
};

const getRarityBackground = (rarity: ItemRarity) => {
  switch (rarity) {
    case "legendary":
      return "rgba(54, 38, 11, 0.78)";
    case "epic":
      return "rgba(45, 25, 74, 0.82)";
    case "rare":
      return "rgba(22, 42, 73, 0.82)";
    default:
      return "rgba(44, 44, 49, 0.82)";
  }
};

export const EquippedWeaponCard = ({
  item,
  proficiencyPercent,
  effectiveAttack,
  effectiveCrit,
  effectiveSpeed,
  onPress,
  onUnequip,
}: EquippedWeaponCardProps) => {
  const rarityColor = rarityColorMap[item.rarity];
  const markCount = item.weaponMarks?.length ?? 0;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: rarityColor,
          backgroundColor: getRarityBackground(item.rarity),
        },
      ]}
    >
      <View style={[styles.iconWrap, { borderColor: rarityColor }]}>
        {item.image ? (
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        ) : (
          <GameItemIcon itemId={item.id} size={54} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {item.rarity.toUpperCase()} • Lv {item.requiredLevel ?? 1}+ • {proficiencyPercent}% proficiency
        </Text>
        {proficiencyPercent < 100 ? (
          <Text style={styles.underleveledHint}>
            Underleveled weapon: you are only getting {proficiencyPercent}% of its listed weapon stats right now.
          </Text>
        ) : null}

        {(item.weaponMarkSlots ?? 0) > 0 ? (
          <View style={styles.markPreview}>
            <Text style={styles.markLabel}>
              Forge Marks {markCount}/{item.weaponMarkSlots}
            </Text>
            {Array.from({ length: item.weaponMarkSlots ?? 0 }).map((_, index) => {
              const mark = item.weaponMarks?.[index];
              const markColor = mark ? rarityColorMap[mark.rarity] : "#8f7a62";
              return (
                <View key={mark?.id ?? `equipped-weapon-mark-${item.id}-${index}`} style={styles.markEntry}>
                  <View style={styles.markRow}>
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
                    <Text style={[styles.markText, mark ? { color: markColor } : styles.markTextEmpty]} numberOfLines={1}>
                      {mark?.name ?? "Empty Socket"}
                    </Text>
                  </View>
                  {mark?.effectDescription ? <Text style={styles.markEffect}>{mark.effectDescription}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.statRow}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="sword-cross" size={12} color="#ffd58f" />
            <Text style={styles.statText}>+{effectiveAttack} ATK</Text>
          </View>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="star-four-points" size={12} color="#ffb6d8" />
            <Text style={styles.statText}>+{effectiveCrit}% CRIT</Text>
          </View>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="run-fast" size={12} color="#8de9a8" />
            <Text style={styles.statText}>+{effectiveSpeed} SPD</Text>
          </View>
        </View>
      </View>

      {onUnequip ? (
        <Pressable onPress={onUnequip} style={styles.unequipWrap}>
          <View style={styles.unequipButton}>
            <MaterialCommunityIcons name="sword-cross" size={14} color="#fff1cf" />
            <MaterialCommunityIcons name="close" size={11} color="#fff1cf" style={styles.unequipOverlayIcon} />
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconWrap: {
    width: 106,
    height: 106,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "rgba(26, 20, 36, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  image: {
    width: "98%",
    height: "98%",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  underleveledHint: {
    color: "#f3d2a0",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  markPreview: {
    marginTop: 4,
    gap: 4,
  },
  markLabel: {
    color: "#f4d79e",
    fontSize: 11,
    fontWeight: "800",
  },
  markEntry: {
    gap: 2,
  },
  markRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markDiamond: {
    width: 14,
    height: 14,
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
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  markText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  markTextEmpty: {
    color: "#b79f7c",
  },
  markEffect: {
    marginLeft: 22,
    color: "#dbc9a7",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },
  statChip: {
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
  statText: {
    color: "#f8e9c9",
    fontSize: 10,
    fontWeight: "800",
  },
  unequipWrap: {
    marginLeft: "auto",
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  unequipButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#a48550",
    backgroundColor: "rgba(45, 28, 17, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  unequipOverlayIcon: {
    position: "absolute",
    right: 6,
    bottom: 6,
  },
});
