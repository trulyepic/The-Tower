import { ImageSourcePropType } from "react-native";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { QUEST_TYPE_SPRITE } from "../data/uiSprites";
import { s3AssetWithFallback } from "../lib/assetSource";

export type AppTabId = "home" | "quests" | "inventory" | "class";

interface TabItem {
  id: AppTabId;
  label: string;
  icon: ImageSourcePropType;
}

const TAB_ITEMS: TabItem[] = [
  { id: "home", label: "Camp", icon: QUEST_TYPE_SPRITE.adventure },
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
}

export const AppTabs = ({ activeTab, onChangeTab }: AppTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<AppTabId | null>(null);

  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const isHovered = hoveredTab === tab.id;
        return (
          <View key={tab.id} style={styles.tabSlot}>
            {index > 0 ? <View style={styles.tabDivider} /> : null}
            <Pressable
              onPress={() => onChangeTab(tab.id)}
              onHoverIn={() => setHoveredTab(tab.id)}
              onHoverOut={() => setHoveredTab((current) => (current === tab.id ? null : current))}
              style={({ pressed }) => [
                styles.tabOuter,
                isActive ? styles.tabOuterActive : null,
                isHovered ? styles.tabOuterHover : null,
                pressed ? styles.tabOuterPressed : null,
              ]}
            >
              {isActive ? <View style={styles.activeMarker} /> : null}
              <Image source={tab.icon} style={[styles.tabIcon, isActive ? styles.tabIconActive : null]} resizeMode="contain" />
              <Text style={[styles.tabLabel, isActive ? styles.activeTabLabel : null]} numberOfLines={1}>
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
    minHeight: 52,
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
  tabLabel: {
    color: "#c5b08b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.15,
    maxWidth: "100%",
  },
  activeTabLabel: {
    color: "#fff1d0",
  },
});
