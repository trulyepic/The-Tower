import { StyleSheet, View } from "react-native";

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: "xp" | "mastery" | "chance" | "time" | "skill";
}

export const ProgressBar = ({ value, max, variant = "chance" }: ProgressBarProps) => {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const chanceStyle =
    ratio >= 0.9
      ? { track: styles.variantChancePeak, fill: styles.fillChancePeak }
      : ratio >= 0.75
        ? { track: styles.variantChanceHigh, fill: styles.fillChanceHigh }
        : ratio >= 0.5
          ? { track: styles.variantChanceMid, fill: styles.fillChanceMid }
          : ratio >= 0.25
            ? { track: styles.variantChanceLow, fill: styles.fillChanceLow }
            : { track: styles.variantChanceRisk, fill: styles.fillChanceRisk };
  const variantStyle =
    variant === "xp"
      ? styles.variantXp
      : variant === "mastery"
        ? styles.variantMastery
        : variant === "time"
          ? styles.variantTime
          : variant === "skill"
            ? styles.variantSkill
          : chanceStyle.track;
  const fillStyle =
    variant === "xp"
      ? styles.fillXp
      : variant === "mastery"
        ? styles.fillMastery
        : variant === "time"
          ? styles.fillTime
          : variant === "skill"
            ? styles.fillSkill
          : chanceStyle.fill;

  return (
    <View style={[styles.track, variantStyle]}>
      <View style={[styles.fill, fillStyle, { width: `${ratio * 100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  variantChanceRisk: {
    borderColor: "rgba(214, 104, 112, 0.34)",
    backgroundColor: "rgba(48, 18, 24, 0.84)",
  },
  variantChanceLow: {
    borderColor: "rgba(228, 148, 94, 0.34)",
    backgroundColor: "rgba(54, 28, 12, 0.84)",
  },
  variantChanceMid: {
    borderColor: "rgba(223, 186, 113, 0.34)",
    backgroundColor: "rgba(45, 31, 14, 0.82)",
  },
  variantChanceHigh: {
    borderColor: "rgba(166, 215, 109, 0.34)",
    backgroundColor: "rgba(27, 44, 16, 0.84)",
  },
  variantChancePeak: {
    borderColor: "rgba(116, 229, 171, 0.34)",
    backgroundColor: "rgba(12, 45, 33, 0.84)",
  },
  variantXp: {
    borderColor: "rgba(121, 188, 255, 0.34)",
    backgroundColor: "rgba(16, 35, 53, 0.82)",
  },
  variantMastery: {
    borderColor: "rgba(187, 143, 255, 0.34)",
    backgroundColor: "rgba(29, 18, 51, 0.82)",
  },
  variantTime: {
    borderColor: "rgba(116, 228, 173, 0.34)",
    backgroundColor: "rgba(13, 35, 24, 0.82)",
  },
  variantSkill: {
    borderColor: "rgba(149, 156, 255, 0.34)",
    backgroundColor: "rgba(25, 23, 56, 0.82)",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  fillChanceRisk: {
    backgroundColor: "#d96474",
  },
  fillChanceLow: {
    backgroundColor: "#ea8e58",
  },
  fillChanceMid: {
    backgroundColor: "#dfb86a",
  },
  fillChanceHigh: {
    backgroundColor: "#98d45d",
  },
  fillChancePeak: {
    backgroundColor: "#5ad8a5",
  },
  fillXp: {
    backgroundColor: "#56a7ff",
  },
  fillMastery: {
    backgroundColor: "#ae7dff",
  },
  fillTime: {
    backgroundColor: "#62d99a",
  },
  fillSkill: {
    backgroundColor: "#8f98ff",
  },
});
