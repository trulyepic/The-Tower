import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { IconTooltip } from "./IconTooltip";
import { colors } from "../theme/colors";
import { BaseClassId } from "../types/game";

interface StatGlyphBarsProps {
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
  classId?: BaseClassId;
  compact?: boolean;
}

const STAT_META = [
  {
    key: "strength",
    icon: "arm-flex",
    color: "#ff8f7d",
    title: "Strength",
    label: "Strength: physical attack power.",
  },
  {
    key: "agility",
    icon: "run-fast",
    color: "#8de9a8",
    title: "Agility",
    label: "Agility: speed, evasion, initiative.",
  },
  {
    key: "intelligence",
    icon: "creation",
    color: "#8ec8ff",
    title: "Intelligence",
    label: "Intelligence: magic damage and control.",
  },
  {
    key: "vitality",
    icon: "heart-pulse",
    color: "#ffc46c",
    title: "Vitality",
    label: "Vitality: health pool and survivability.",
  },
] as const;

export const StatGlyphBars = ({ stats, classId, compact = false }: StatGlyphBarsProps) => {
  const intelligenceMeta =
    classId === "mage"
      ? { title: "Resolve", label: "Resolve: class skill resource and tactical control.", icon: "creation" }
      : { title: "Resolve", label: "Resolve: class skill resource and tactical control.", icon: "target" };
  const statMeta = STAT_META.map((entry) =>
    entry.key === "intelligence"
      ? { ...entry, title: intelligenceMeta.title, label: intelligenceMeta.label, icon: intelligenceMeta.icon }
      : entry,
  );
  return (
    <View style={[styles.grid, compact ? styles.gridCompact : null]}>
      {statMeta.map((meta) => {
        const value = stats[meta.key];

        return (
          <View key={meta.key} style={[styles.item, compact ? styles.itemCompact : null]}>
            <View style={[styles.iconWrap, compact ? styles.iconWrapCompact : null]}>
              <View style={styles.iconTile}>
                <MaterialCommunityIcons
                  name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={compact ? 14 : 16}
                  color={meta.color}
                />
              </View>
              <View style={styles.metaWrap}>
                <Text style={[styles.statTitle, compact ? styles.statTitleCompact : null]} numberOfLines={1}>
                  {meta.title}
                </Text>
              </View>
              <View style={styles.iconTip}>
                <IconTooltip text={meta.label} />
              </View>
            </View>
            <View style={[styles.track, compact ? styles.trackCompact : null]}>
              <View style={[styles.fill, { width: `${value}%`, backgroundColor: meta.color }]} />
            </View>
            <View style={styles.valueBadge}>
              <Text style={[styles.value, compact ? styles.valueCompact : null]}>{value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 6,
  },
  gridCompact: {
    gap: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8a6e41",
    backgroundColor: "rgba(45, 33, 57, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  itemCompact: {
    paddingVertical: 4,
  },
  iconWrap: {
    width: 118,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  iconWrapCompact: {
    width: 108,
  },
  iconTile: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#9c7e4f",
    backgroundColor: "rgba(58, 42, 22, 0.86)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaWrap: {
    flex: 1,
  },
  statTitle: {
    color: "#e8d7b4",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statTitleCompact: {
    fontSize: 9,
  },
  iconTip: {
    marginTop: -1,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(17, 28, 52, 0.82)",
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    overflow: "hidden",
  },
  trackCompact: {
    height: 7,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  valueBadge: {
    minWidth: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(66, 46, 21, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  value: {
    width: 22,
    color: "#ffeac0",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "800",
  },
  valueCompact: {
    fontSize: 10,
  },
});
