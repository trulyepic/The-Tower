import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { HUD_ASSETS } from "../data/hudAssets";

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: "xp" | "mastery";
}

export const ProgressBar = ({ value, max, variant = "xp" }: ProgressBarProps) => {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const fillAsset = variant === "mastery" ? HUD_ASSETS.progress.masteryFill : HUD_ASSETS.progress.xpFill;

  return (
    <ImageBackground source={HUD_ASSETS.progress.track} style={styles.track} resizeMode="stretch">
      <View style={[styles.fillMask, { width: `${ratio * 100}%` }]}>
        <Image source={fillAsset} style={styles.fillImage} resizeMode="repeat" />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 16,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  fillMask: {
    height: 4,
    overflow: "hidden",
    borderRadius: 999,
    marginTop: 1,
  },
  fillImage: {
    width: "100%",
    height: "100%",
  },
});
