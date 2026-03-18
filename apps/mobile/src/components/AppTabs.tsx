import { ImageSourcePropType } from "react-native";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { QUEST_TYPE_SPRITE } from "../data/uiSprites";
import { s3AssetWithFallback } from "../lib/assetSource";

export type AppTabId = "home" | "story" | "quests" | "inventory" | "class";

interface TabItem {
  id: AppTabId;
  label: string;
  icon?: ImageSourcePropType;
  materialIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const TAB_ITEMS: TabItem[] = [
  { id: "home", label: "Camp", icon: QUEST_TYPE_SPRITE.adventure },
  { id: "story", label: "Main Quest", materialIcon: "book-open-page-variant-outline" },
  {
    id: "inventory",
    label: "Inventory",
    icon: s3AssetWithFallback(
      "game/materials/source/singles-update-1/utility/488_Iron_Bag_Leather_B.png",
      require("../../assets/game/materials/source/singles-update-1/utility/488_Iron_Bag_Leather_B.png"),
    ),
  },
  {
    id: "quests",
    label: "Guild",
    icon: s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_14.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_14.png")),
  },
  {
    id: "class",
    label: "Class",
    icon: s3AssetWithFallback("game/characters/class/warrior-portrait.png", require("../../assets/game/characters/class/warrior-portrait.png")),
  },
];

interface AppTabsProps {
  activeTab: AppTabId;
  onChangeTab: (tabId: AppTabId) => void;
  disabledTabIds?: AppTabId[];
  badgeCountByTab?: Partial<Record<AppTabId, number>>;
}

export const AppTabs = ({ activeTab, onChangeTab, disabledTabIds = [], badgeCountByTab = {} }: AppTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<AppTabId | null>(null);

  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const isHovered = hoveredTab === tab.id;
        const isDisabled = disabledTabIds.includes(tab.id);
        const badgeCount = badgeCountByTab[tab.id] ?? 0;
        return (
          <View key={tab.id} style={styles.tabSlot}>
            {index > 0 ? <View style={styles.tabDivider} /> : null}
            <Pressable
              onPress={() => {
                if (isDisabled) {
                  return;
                }
                onChangeTab(tab.id);
              }}
              onHoverIn={() => {
                if (!isDisabled) {
                  setHoveredTab(tab.id);
                }
              }}
              onHoverOut={() => setHoveredTab((current) => (current === tab.id ? null : current))}
              disabled={isDisabled}
              style={({ pressed }) => [
                styles.tabOuter,
                isActive ? styles.tabOuterActive : null,
                isHovered ? styles.tabOuterHover : null,
                isDisabled ? styles.tabOuterDisabled : null,
                pressed ? styles.tabOuterPressed : null,
              ]}
            >
              {isActive ? <View style={styles.activeMarker} /> : null}
              {badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
                </View>
              ) : null}
              {tab.icon ? (
                <Image
                  source={tab.icon}
                  style={[styles.tabIcon, isActive ? styles.tabIconActive : null, isDisabled ? styles.tabIconDisabled : null]}
                  resizeMode="contain"
                />
              ) : (
                <MaterialCommunityIcons
                  name={tab.materialIcon ?? "circle-outline"}
                  size={20}
                  color={
                    isDisabled ? "#84765d" : isActive ? "#fff0c9" : isHovered ? "#f1d093" : "#c5b08b"
                  }
                />
              )}
              <Text style={[styles.tabLabel, isActive ? styles.activeTabLabel : null, isDisabled ? styles.tabLabelDisabled : null]} numberOfLines={2}>
                {tab.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#130f1f",
    borderTopWidth: 1,
    borderTopColor: "#7b6234",
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabSlot: {
    flex: 1,
    minHeight: 52,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabDivider: {
    position: "absolute",
    left: 0,
    top: 9,
    bottom: 8,
    width: 1,
    backgroundColor: "rgba(175, 139, 76, 0.55)",
  },
  tabOuter: {
    minHeight: 56,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(162, 128, 70, 0.52)",
    backgroundColor: "rgba(36, 28, 46, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tabOuterActive: {
    borderColor: "#d5a957",
    backgroundColor: "rgba(84, 58, 24, 0.95)",
    shadowColor: "#d9ab58",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tabOuterHover: {
    borderColor: "#c2944a",
    backgroundColor: "rgba(70, 48, 21, 0.9)",
  },
  tabOuterPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  tabOuterDisabled: {
    opacity: 0.42,
    borderColor: "rgba(115, 94, 57, 0.34)",
    backgroundColor: "rgba(28, 23, 36, 0.62)",
  },
  activeMarker: {
    position: "absolute",
    top: 3,
    width: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#ffe39b",
  },
  tabIcon: {
    width: 19,
    height: 19,
    opacity: 0.88,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabIconDisabled: {
    opacity: 0.45,
  },
  tabLabel: {
    color: "#c5b08b",
    fontSize: 10.5,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.15,
    maxWidth: "100%",
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#fff1d0",
  },
  tabLabelDisabled: {
    color: "#84765d",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c94f5d",
    borderWidth: 1,
    borderColor: "#ffd1aa",
  },
  badgeText: {
    color: "#fff4df",
    fontSize: 10,
    fontWeight: "800",
  },
});
