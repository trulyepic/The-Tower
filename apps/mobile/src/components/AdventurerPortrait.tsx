import { Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { CharacterState } from "../types/game";
import { getAvatarSprite } from "../data/uiSprites";
import { getSigilAvatarState } from "../lib/sigils";

type AdventurerPortraitProps = {
  character: CharacterState;
  size: number;
  showArmorBadge?: boolean;
  imageOverride?: ImageSourcePropType;
};

const PIP_POSITIONS = [
  { top: 4, left: "50%" },
  { top: 15, right: 6 },
  { top: "50%", right: 2 },
  { bottom: 15, right: 6 },
  { bottom: 4, left: "50%" },
  { bottom: 15, left: 6 },
  { top: "50%", left: 2 },
  { top: 15, left: 6 },
] as const;

const SigilShellLayer = ({
  shape,
  color,
  size,
  scale,
  opacity,
}: {
  shape: "square" | "diamond" | "crest" | "hex";
  color: string;
  size: number;
  scale: number;
  opacity: number;
}) => {
  const shellStyle = {
    width: size,
    height: size,
    transform: [{ scale }],
    opacity,
  } as const;

  if (shape === "diamond") {
    return (
      <View style={[styles.shellLayer, shellStyle]}>
        <View
          style={[
            styles.diamondShell,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderColor: color,
              backgroundColor: `${color}22`,
            },
          ]}
        />
        <View
          style={[
            styles.diamondInnerShell,
            {
              width: size * 0.5,
              height: size * 0.5,
              borderColor: `${color}cc`,
              backgroundColor: `${color}12`,
            },
          ]}
        />
        <View
          style={[
            styles.diamondEtch,
            {
              width: size * 0.34,
              height: 2,
              backgroundColor: `${color}88`,
            },
          ]}
        />
        <View
          style={[
            styles.diamondEtch,
            styles.diamondEtchVertical,
            {
              width: 2,
              height: size * 0.34,
              backgroundColor: `${color}66`,
            },
          ]}
        />
      </View>
    );
  }

  if (shape === "crest") {
    return (
      <View style={[styles.shellLayer, shellStyle]}>
        <View
          style={[
            styles.crestInsetPlate,
            {
              width: size * 0.5,
              height: size * 0.56,
              borderColor: `${color}88`,
              backgroundColor: `${color}16`,
            },
          ]}
        />
        <View
          style={[
            styles.crestNode,
            {
              top: size * 0.1,
              width: 16,
              height: 16,
              borderColor: `${color}dd`,
              backgroundColor: `${color}26`,
            },
          ]}
        />
        <View
          style={[
            styles.crestCoreRing,
            {
              width: size * 0.34,
              height: size * 0.34,
              borderColor: `${color}6e`,
              borderRadius: 999,
            },
          ]}
        />
      </View>
    );
  }

  if (shape === "hex") {
    const bandThickness = Math.max(10, Math.round(size * 0.16));
    return (
      <View style={[styles.shellLayer, shellStyle]}>
        <View
          style={[
            styles.hexBand,
            {
              top: size * 0.14,
              left: "26%",
              width: "48%",
              height: bandThickness,
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: bandThickness / 2,
            },
          ]}
        />
        <View
          style={[
            styles.hexCore,
            {
              width: size * 0.42,
              height: size * 0.42,
              borderColor: `${color}cc`,
              backgroundColor: `${color}10`,
            },
          ]}
        />
        <View
          style={[
            styles.hexBand,
            {
              bottom: size * 0.14,
              left: "26%",
              width: "48%",
              height: bandThickness,
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: bandThickness / 2,
            },
          ]}
        />
        <View
          style={[
            styles.hexBand,
            {
              left: size * 0.14,
              top: "26%",
              width: bandThickness,
              height: "48%",
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: bandThickness / 2,
            },
          ]}
        />
        <View
          style={[
            styles.hexBand,
            {
              right: size * 0.14,
              top: "26%",
              width: bandThickness,
              height: "48%",
              borderColor: color,
              backgroundColor: `${color}20`,
              borderRadius: bandThickness / 2,
            },
          ]}
        />
        {[
          { top: size * 0.19, left: size * 0.19 },
          { top: size * 0.19, right: size * 0.19 },
          { bottom: size * 0.19, left: size * 0.19 },
          { bottom: size * 0.19, right: size * 0.19 },
        ].map((dot, index) => (
          <View
            key={`hex-node-${index}`}
            style={[
              styles.hexNode,
              {
                borderColor: `${color}e6`,
                backgroundColor: `${color}24`,
                ...(dot as object),
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.hexRuneLine,
            {
              width: size * 0.28,
              backgroundColor: `${color}72`,
            },
          ]}
        />
        <View
          style={[
            styles.hexRuneLine,
            styles.hexRuneLineVertical,
            {
              height: size * 0.28,
              width: 2,
              backgroundColor: `${color}50`,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.shellLayer, shellStyle]}>
      <View
        style={[
          styles.squareShellOuter,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderColor: color,
            backgroundColor: `${color}14`,
            borderRadius: Math.round(size * 0.18),
          },
        ]}
      />
      <View
        style={[
          styles.squareShellInset,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderColor: `${color}cc`,
            backgroundColor: `${color}10`,
            borderRadius: Math.round(size * 0.12),
          },
        ]}
      />
      <View
        style={[
          styles.squareShellRuneH,
          {
            width: size * 0.24,
            backgroundColor: `${color}82`,
          },
        ]}
      />
      <View
        style={[
          styles.squareShellRuneV,
          {
            height: size * 0.24,
            backgroundColor: `${color}58`,
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
            styles.squareShellCorner,
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
            styles.squareShellCrownMark,
            {
              borderColor: `${color}d4`,
              ...(mark as object),
            },
          ]}
        />
      ))}
    </View>
  );
};

export const AdventurerPortrait = ({ character, size, showArmorBadge = true, imageOverride }: AdventurerPortraitProps) => {
  const sigilState = getSigilAvatarState(character);
  const isDefault = !sigilState.hasSigil;
  const portraitSize = isDefault ? size - 10 : Math.round(size * 0.72);
  const defaultFrameMode = character.sigilAppearanceMode === "default_frame";
  const shellBorderColor = sigilState.hasSigil ? sigilState.accentColor : "#957748";
  const armorAccentColor = defaultFrameMode ? "#b89a66" : shellBorderColor;
  const showLargeArmorBadge = showArmorBadge && sigilState.totalArmor > 0 && size >= 72;
  const showCompactArmorBadge = showArmorBadge && sigilState.totalArmor > 0 && size < 72;
  const visualLayers = sigilState.visualLayers ?? [];

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.baseFrame, { width: size, height: size }]}>
        {isDefault ? (
          <View
            style={[
              styles.defaultFrame,
              {
                width: size,
                height: size,
                borderColor: shellBorderColor,
                borderRadius: Math.round(size * 0.18),
              },
            ]}
          />
        ) : (
          visualLayers.map((visual, index) => {
            const depthFromTop = visualLayers.length - 1 - index;
            return (
              <SigilShellLayer
                key={`${visual.frameShape}-${visual.accentColor}-${index}`}
                shape={visual.frameShape}
                color={visual.accentColor}
                size={size}
                scale={depthFromTop === 0 ? 1 : depthFromTop === 1 ? 1.08 : 1.14}
                opacity={depthFromTop === 0 ? 1 : depthFromTop === 1 ? 0.42 : 0.24}
              />
            );
          })
        )}

        <View
          style={[
            styles.portraitClip,
            {
              width: portraitSize,
              height: portraitSize,
              borderRadius: isDefault ? Math.round(size * 0.16) : 999,
              borderColor: sigilState.hasSigil ? `${shellBorderColor}88` : "#4a3753",
            },
          ]}
        >
          <Image source={imageOverride ?? getAvatarSprite(character.avatarId, character.classId)} style={styles.portraitImage} resizeMode="cover" />
        </View>

        {!defaultFrameMode && sigilState.visibleArmorPips > 0
          ? PIP_POSITIONS.slice(0, sigilState.visibleArmorPips).map((position, index) => (
              <View
                key={`armor-pip-${index}`}
                style={[
                  styles.armorPip,
                  {
                    backgroundColor: armorAccentColor,
                    ...(position as object),
                    marginLeft: "left" in position && position.left === "50%" ? -5 : undefined,
                    marginTop: "top" in position && position.top === "50%" ? -5 : undefined,
                  },
                ]}
              />
            ))
          : null}

        {showLargeArmorBadge ? (
          <View style={[styles.armorBadge, { borderColor: `${armorAccentColor}99` }]}>
            <Text style={[styles.armorBadgeText, { color: armorAccentColor }]}>+{sigilState.totalArmor} ARM</Text>
          </View>
        ) : null}
        {showCompactArmorBadge ? (
          <View style={[styles.compactArmorBadge, { borderColor: `${armorAccentColor}aa` }]}>
            <Text style={[styles.compactArmorBadgeText, { color: armorAccentColor }]}>+{sigilState.totalArmor}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  baseFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
    position: "relative",
  },
  shellLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  defaultFrame: {
    position: "absolute",
    borderWidth: 2,
    backgroundColor: "rgba(26, 20, 35, 0.95)",
  },
  squareShellOuter: {
    position: "absolute",
    borderWidth: 3,
  },
  squareShellInset: {
    position: "absolute",
    borderWidth: 2,
  },
  squareShellCorner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    zIndex: 2,
  },
  squareShellRuneH: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    zIndex: 2,
  },
  squareShellRuneV: {
    position: "absolute",
    width: 2,
    borderRadius: 999,
    zIndex: 2,
  },
  squareShellCrownMark: {
    position: "absolute",
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: "45deg" }],
    zIndex: 2,
  },
  portraitClip: {
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "rgba(14, 12, 23, 0.96)",
    zIndex: 3,
  },
  portraitImage: {
    width: "100%",
    height: "100%",
  },
  diamondShell: {
    position: "absolute",
    borderWidth: 3,
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  diamondInnerShell: {
    position: "absolute",
    borderWidth: 2,
    transform: [{ rotate: "45deg" }],
    zIndex: 2,
  },
  diamondEtch: {
    position: "absolute",
    borderRadius: 999,
    zIndex: 2,
    transform: [{ rotate: "45deg" }],
  },
  diamondEtchVertical: {
    transform: [{ rotate: "45deg" }],
  },
  crestCoreRing: {
    position: "absolute",
    borderWidth: 2,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  crestTop: {
    position: "absolute",
    top: -2,
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  crestTopInner: {
    top: 10,
  },
  crestBottom: {
    position: "absolute",
    bottom: -2,
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  crestSide: {
    position: "absolute",
    top: "50%",
    width: 0,
    height: 0,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  crestLeft: {
    left: -2,
  },
  crestRight: {
    right: -2,
  },
  crestNode: {
    position: "absolute",
    alignSelf: "center",
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    zIndex: 3,
  },
  crestInsetPlate: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  hexCore: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 16,
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  hexBand: {
    position: "absolute",
    borderWidth: 2,
    zIndex: 2,
  },
  hexNode: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    zIndex: 3,
  },
  hexRuneLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    zIndex: 2,
  },
  hexRuneLineVertical: {
    transform: [{ rotate: "0deg" }],
  },
  armorPip: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "rgba(18, 14, 29, 0.72)",
    transform: [{ rotate: "45deg" }],
    zIndex: 4,
  },
  armorBadge: {
    position: "absolute",
    bottom: -7,
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: "rgba(13, 16, 28, 0.88)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    zIndex: 5,
  },
  armorBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  compactArmorBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: "rgba(13, 16, 28, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    zIndex: 5,
  },
  compactArmorBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
