import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface HealthMeterProps {
  current: number;
  max: number;
  title?: string;
  meta?: string;
  compact?: boolean;
  bare?: boolean;
  containerStyle?: ViewStyle;
}

const getHealthState = (percent: number) => {
  if (percent <= 1) {
    return {
      label: "Fractured",
      fill: styles.fillFractured,
      pill: styles.statePillFractured,
      value: styles.valueFractured,
      title: styles.titleFractured,
      icon: "#d8b6ff",
      container: styles.containerFractured,
      track: styles.trackFractured,
      meta: styles.metaFractured,
    };
  }
  if (percent >= 70) {
    return {
      label: "Healthy",
      fill: styles.fillSafe,
      pill: styles.statePillSafe,
      value: styles.valueSafe,
      title: styles.titleSafe,
      icon: "#8ef0a8",
      container: styles.containerSafe,
      track: styles.trackSafe,
      meta: styles.metaSafe,
    };
  }
  if (percent >= 35) {
    return {
      label: "Wounded",
      fill: styles.fillWarn,
      pill: styles.statePillWarn,
      value: styles.valueWarn,
      title: styles.titleWarn,
      icon: "#ffcf78",
      container: styles.containerWarn,
      track: styles.trackWarn,
      meta: styles.metaWarn,
    };
  }
  return {
    label: "Critical",
    fill: styles.fillCritical,
    pill: styles.statePillCritical,
    value: styles.valueCritical,
    title: styles.titleCritical,
    icon: "#ff8f98",
    container: styles.containerCritical,
    track: styles.trackCritical,
    meta: styles.metaCritical,
  };
};

export const HealthMeter = ({
  current,
  max,
  title = "HP",
  meta,
  compact = false,
  bare = false,
  containerStyle,
}: HealthMeterProps) => {
  const percent = Math.max(0, Math.min(100, Math.round((current / Math.max(1, max)) * 100)));
  const state = getHealthState(percent);

  return (
    <View
      style={[
        styles.container,
        state.container,
        compact ? styles.containerCompact : null,
        bare ? styles.containerBare : null,
        containerStyle,
      ]}
    >
      <View style={styles.head}>
        <MaterialCommunityIcons name="heart-pulse" size={compact ? 14 : 16} color={state.icon} />
        <Text style={[styles.title, state.title, compact ? styles.titleCompact : null]}>{title}</Text>
        <View style={[styles.statePill, state.pill]}>
          <Text style={styles.stateText}>{state.label}</Text>
        </View>
        <Text style={[styles.value, state.value, compact ? styles.valueCompact : null]}>
          {current}/{max}
        </Text>
      </View>
      <View style={[styles.track, state.track, compact ? styles.trackCompact : null, bare ? styles.trackBare : null]}>
        <View style={[styles.fill, state.fill, { width: `${percent}%` }]} />
      </View>
      {meta ? <Text style={[styles.meta, state.meta, compact ? styles.metaCompact : null]}>{meta}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7ea36a",
    backgroundColor: "rgba(23, 41, 29, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  containerSafe: {
    borderColor: "#64ab74",
    backgroundColor: "rgba(20, 47, 29, 0.9)",
  },
  containerWarn: {
    borderColor: "#c49447",
    backgroundColor: "rgba(67, 43, 16, 0.9)",
  },
  containerCritical: {
    borderColor: "#a56066",
    backgroundColor: "rgba(66, 26, 39, 0.9)",
  },
  containerFractured: {
    borderColor: "#8b69bb",
    backgroundColor: "rgba(40, 23, 66, 0.92)",
  },
  containerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  containerBare: {
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#d6ffe0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  titleSafe: {
    color: "#c9ffd6",
  },
  titleWarn: {
    color: "#ffe1ae",
  },
  titleCritical: {
    color: "#ffd2d6",
  },
  titleFractured: {
    color: "#e6d6ff",
  },
  titleCompact: {
    fontSize: 10,
  },
  statePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statePillSafe: {
    borderColor: "rgba(253, 206, 150, 0.48)",
    backgroundColor: "rgba(92, 48, 30, 0.72)",
  },
  statePillWarn: {
    borderColor: "rgba(255, 196, 120, 0.58)",
    backgroundColor: "rgba(111, 66, 18, 0.7)",
  },
  statePillCritical: {
    borderColor: "rgba(255, 153, 163, 0.62)",
    backgroundColor: "rgba(102, 28, 43, 0.76)",
  },
  statePillFractured: {
    borderColor: "rgba(203, 160, 255, 0.62)",
    backgroundColor: "rgba(75, 39, 110, 0.8)",
  },
  stateText: {
    color: "#ffe7bd",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  value: {
    marginLeft: "auto",
    color: "#e8ffef",
    fontSize: 12,
    fontWeight: "900",
  },
  valueSafe: {
    color: "#e2ffea",
  },
  valueWarn: {
    color: "#fff0cf",
  },
  valueCritical: {
    color: "#ffe8ea",
  },
  valueFractured: {
    color: "#f0e6ff",
  },
  valueCompact: {
    fontSize: 11,
  },
  meta: {
    color: "#b8e2c2",
    fontSize: 10,
    fontWeight: "700",
  },
  metaSafe: {
    color: "#b9eac8",
  },
  metaWarn: {
    color: "#e7c993",
  },
  metaCritical: {
    color: "#e4c3c8",
  },
  metaFractured: {
    color: "#d7c2f3",
  },
  metaCompact: {
    fontSize: 9,
  },
  track: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(149, 225, 171, 0.32)",
    backgroundColor: "rgba(10, 25, 14, 0.72)",
    overflow: "hidden",
  },
  trackSafe: {
    borderColor: "rgba(149, 225, 171, 0.32)",
    backgroundColor: "rgba(10, 25, 14, 0.72)",
  },
  trackWarn: {
    borderColor: "rgba(255, 206, 134, 0.34)",
    backgroundColor: "rgba(39, 23, 5, 0.72)",
  },
  trackCritical: {
    borderColor: "rgba(255, 197, 203, 0.28)",
    backgroundColor: "rgba(23, 11, 20, 0.72)",
  },
  trackFractured: {
    borderColor: "rgba(209, 176, 255, 0.32)",
    backgroundColor: "rgba(20, 12, 34, 0.78)",
  },
  trackCompact: {
    height: 10,
  },
  trackBare: {
    height: 8,
    borderWidth: 0,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  fillSafe: {
    backgroundColor: "#57d47a",
  },
  fillWarn: {
    backgroundColor: "#ffb55f",
  },
  fillCritical: {
    backgroundColor: "#ff6a76",
  },
  fillFractured: {
    backgroundColor: "#b688ff",
  },
});
