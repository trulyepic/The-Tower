import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { ITEM_BY_ID } from "../data/items";
import { ItemId } from "../types/game";

interface GameItemIconProps {
  itemId: ItemId;
  size?: number;
}

export const GameItemIcon = ({ itemId, size = 18 }: GameItemIconProps) => {
  const item = ITEM_BY_ID[itemId];
  const frameSize = size + 8;
  const isLegendary = item?.rarity === "legendary";

  if (item?.image) {
    return (
      <View style={[styles.wrap, isLegendary ? styles.legendaryGlow : null]}>
        <Image source={item.image} style={{ width: frameSize, height: frameSize }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, isLegendary ? styles.legendaryGlow : null]}>
      <View style={[styles.fallback, { width: frameSize, height: frameSize }]}>
        <MaterialCommunityIcons
          name={(item?.icon ?? "package-variant-closed") as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color="#d8e7ff"
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
  legendaryGlow: {
    shadowColor: "#ffb347",
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
