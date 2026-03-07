import { StyleSheet, View } from "react-native";

type AtmosphereVariant = "camp" | "guild" | "inventory" | "class" | "creation";

interface AtmosphereBackdropProps {
  variant?: AtmosphereVariant;
}

const PRESETS: Record<
  AtmosphereVariant,
  { top: string; center: string; bottom: string; right: string; opacity: number }
> = {
  camp: {
    top: "#b98738",
    center: "#7a5a2a",
    bottom: "#3a284f",
    right: "#d3a24a",
    opacity: 0.2,
  },
  guild: {
    top: "#a5752d",
    center: "#8d6631",
    bottom: "#402a58",
    right: "#cc9940",
    opacity: 0.22,
  },
  inventory: {
    top: "#8f692f",
    center: "#6e4f2a",
    bottom: "#4e3464",
    right: "#b5863c",
    opacity: 0.19,
  },
  class: {
    top: "#8f6a2f",
    center: "#5b4122",
    bottom: "#573576",
    right: "#b78639",
    opacity: 0.19,
  },
  creation: {
    top: "#a27734",
    center: "#75552b",
    bottom: "#4b3166",
    right: "#c79344",
    opacity: 0.2,
  },
};

export const AtmosphereBackdrop = ({ variant = "camp" }: AtmosphereBackdropProps) => {
  const preset = PRESETS[variant];

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.orb, styles.orbTop, { backgroundColor: preset.top, opacity: preset.opacity }]} />
      <View
        style={[styles.orb, styles.orbCenter, { backgroundColor: preset.center, opacity: preset.opacity }]}
      />
      <View
        style={[styles.orb, styles.orbBottom, { backgroundColor: preset.bottom, opacity: preset.opacity }]}
      />
      <View
        style={[styles.orb, styles.orbMidRight, { backgroundColor: preset.right, opacity: preset.opacity }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTop: {
    width: 330,
    height: 330,
    top: -145,
    right: -70,
  },
  orbCenter: {
    width: 270,
    height: 270,
    top: "31%",
    left: -120,
  },
  orbBottom: {
    width: 280,
    height: 280,
    bottom: -120,
    right: -70,
  },
  orbMidRight: {
    width: 210,
    height: 210,
    top: "44%",
    right: -75,
  },
});
