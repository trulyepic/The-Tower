import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { ITEM_BY_ID } from "../data/items";
import { getBuffAccent } from "../lib/itemVisuals";
import { ItemId } from "../types/game";

interface GameItemIconProps {
  itemId: ItemId;
  size?: number;
}

const SigilMiniShell = ({
  shape,
  color,
  size,
}: {
  shape: "square" | "diamond" | "crest" | "hex";
  color: string;
  size: number;
}) => {
  if (shape === "diamond") {
    return (
      <View style={[styles.sigilShellWrap, { width: size, height: size }]}>
        <View
          style={[
            styles.sigilDiamondOuter,
            {
              width: size * 0.82,
              height: size * 0.82,
              borderColor: color,
              backgroundColor: `${color}22`,
            },
          ]}
        />
        <View
          style={[
            styles.sigilDiamondInner,
            {
              width: size * 0.58,
              height: size * 0.58,
              borderColor: `${color}cc`,
            },
          ]}
        />
      </View>
    );
  }

  if (shape === "crest") {
    return (
      <View style={[styles.sigilShellWrap, { width: size, height: size }]}>
        <View
          style={[
            styles.sigilCrestPlate,
            {
              width: size * 0.68,
              height: size * 0.68,
              borderColor: color,
              backgroundColor: `${color}18`,
            },
          ]}
        />
        <View
          style={[
            styles.sigilCrestNode,
            {
              borderColor: `${color}dd`,
              backgroundColor: `${color}28`,
            },
          ]}
        />
      </View>
    );
  }

  if (shape === "hex") {
    const band = Math.max(4, Math.round(size * 0.12));
    return (
      <View style={[styles.sigilShellWrap, { width: size, height: size }]}>
        <View
          style={[
            styles.sigilHexBand,
            {
              top: size * 0.14,
              left: "24%",
              width: "52%",
              height: band,
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: band / 2,
            },
          ]}
        />
        <View
          style={[
            styles.sigilHexBand,
            {
              bottom: size * 0.14,
              left: "24%",
              width: "52%",
              height: band,
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: band / 2,
            },
          ]}
        />
        <View
          style={[
            styles.sigilHexBand,
            {
              left: size * 0.14,
              top: "24%",
              width: band,
              height: "52%",
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: band / 2,
            },
          ]}
        />
        <View
          style={[
            styles.sigilHexBand,
            {
              right: size * 0.14,
              top: "24%",
              width: band,
              height: "52%",
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: band / 2,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.sigilShellWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.sigilSquareOuter,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderColor: color,
            backgroundColor: `${color}16`,
            borderRadius: Math.round(size * 0.18),
          },
        ]}
      />
      <View
        style={[
          styles.sigilSquareInset,
          {
            width: size * 0.58,
            height: size * 0.58,
            borderColor: `${color}cc`,
            backgroundColor: `${color}10`,
            borderRadius: Math.round(size * 0.12),
          },
        ]}
      />
      <View
        style={[
          styles.sigilSquareRuneH,
          {
            width: size * 0.26,
            backgroundColor: `${color}8a`,
          },
        ]}
      />
      <View
        style={[
          styles.sigilSquareRuneV,
          {
            height: size * 0.26,
            backgroundColor: `${color}62`,
          },
        ]}
      />
      {[
        { top: size * 0.1, left: size * 0.1 },
        { top: size * 0.1, right: size * 0.1 },
        { bottom: size * 0.1, left: size * 0.1 },
        { bottom: size * 0.1, right: size * 0.1 },
      ].map((corner, index) => (
        <View
          key={`square-corner-${index}`}
          style={[
            styles.sigilSquareCorner,
            {
              borderColor: `${color}e2`,
              backgroundColor: `${color}22`,
              ...(corner as object),
            },
          ]}
        />
      ))}
      {[
        { top: size * 0.04, left: size * 0.28 },
        { top: size * 0.04, right: size * 0.28 },
      ].map((mark, index) => (
        <View
          key={`square-crown-${index}`}
          style={[
            styles.sigilSquareCrownMark,
            {
              borderColor: `${color}d8`,
              ...(mark as object),
            },
          ]}
        />
      ))}
    </View>
  );
};

export const GameItemIcon = ({ itemId, size = 18 }: GameItemIconProps) => {
  const item = ITEM_BY_ID[itemId];
  const frameSize = size + 8;
  const isLegendary = item?.rarity === "legendary";
  const buffAccent = item?.category === "buff" ? getBuffAccent(item.id) : null;
  const sigilVisual = item?.category === "buff" ? item.sigilVisual : null;

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

  if (sigilVisual) {
    return (
      <View style={[styles.wrap, isLegendary ? styles.legendaryWrap : null]}>
        <View style={[styles.sigilIconWrap, { width: frameSize, height: frameSize }]}>
          <SigilMiniShell shape={sigilVisual.frameShape} color={sigilVisual.accentColor} size={frameSize} />
          <View
            style={[
              styles.sigilCore,
              {
                width: Math.round(frameSize * 0.44),
                height: Math.round(frameSize * 0.44),
                borderColor: `${sigilVisual.accentColor}88`,
                backgroundColor: `${sigilVisual.accentColor}18`,
              },
            ]}
          />
        </View>
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
    shadowColor: "#ffc164",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  sigilIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  sigilShellWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sigilCore: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "rgba(15, 13, 25, 0.92)",
    zIndex: 3,
  },
  sigilSquareOuter: {
    position: "absolute",
    borderWidth: 2,
  },
  sigilSquareInset: {
    position: "absolute",
    borderWidth: 2,
  },
  sigilSquareCorner: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
  },
  sigilSquareRuneH: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    zIndex: 2,
  },
  sigilSquareRuneV: {
    position: "absolute",
    width: 2,
    borderRadius: 999,
    zIndex: 2,
  },
  sigilSquareCrownMark: {
    position: "absolute",
    width: 8,
    height: 8,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: "45deg" }],
    zIndex: 2,
  },
  sigilDiamondOuter: {
    position: "absolute",
    borderWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  sigilDiamondInner: {
    position: "absolute",
    borderWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
  sigilCrestPlate: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 10,
  },
  sigilCrestNode: {
    position: "absolute",
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  sigilHexBand: {
    position: "absolute",
    borderWidth: 1,
  },
});
