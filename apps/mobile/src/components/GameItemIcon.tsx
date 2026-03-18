import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { ITEM_BY_ID } from "../data/items";
import { getBuffAccent } from "../lib/itemVisuals";
import { ItemId } from "../types/game";

interface GameItemIconProps {
  itemId: ItemId;
  size?: number;
}

export const GameItemIcon = ({ itemId, size = 18 }: GameItemIconProps) => {
  const item = ITEM_BY_ID[itemId];
  const frameSize = size + 8;
  const isLegendary = item?.rarity === "legendary";
  const buffAccent = item?.category === "buff" ? getBuffAccent(item.id) : null;

  if (item?.image) {
    return (
      <View
        style={[
          styles.wrap,
          buffAccent ? { borderWidth: 1, borderColor: buffAccent.border, backgroundColor: buffAccent.softBg } : null,
          isLegendary ? styles.legendaryWrap : null,
        ]}
      >
        <Image source={item.image} style={{ width: frameSize, height: frameSize }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, isLegendary ? styles.legendaryWrap : null]}>
      <View
        style={[
          styles.fallback,
          { width: frameSize, height: frameSize },
          buffAccent ? { borderWidth: 1, borderColor: buffAccent.border, backgroundColor: buffAccent.softBg } : null,
        ]}
      >
        <MaterialCommunityIcons
          name={(item?.icon ?? "package-variant-closed") as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color={buffAccent?.primary ?? "#d8e7ff"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  legendaryWrap: {
    borderWidth: 2,
    borderColor: "rgba(255, 214, 122, 0.96)",
    backgroundColor: "rgba(255, 196, 96, 0.22)",
    padding: 3,
    shadowColor: "#ffc164",
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
