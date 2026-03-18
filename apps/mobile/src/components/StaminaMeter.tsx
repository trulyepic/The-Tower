import { Image, ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface StaminaMeterProps {
  current: number;
  max: number;
  icon?: ImageSourcePropType;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title?: string;
  meta?: string;
  compact?: boolean;
  bare?: boolean;
  containerStyle?: ViewStyle;
}

const getStaminaState = (percent: number) => {
  if (percent >= 70) {
    return {
      label: "Ready",
      container: styles.containerReady,
      track: styles.trackReady,
      fill: styles.fillReady,
      title: styles.titleReady,
      value: styles.valueReady,
      meta: styles.metaReady,
    };
  }
  if (percent >= 35) {
    return {
      label: "Used",
      container: styles.containerUsed,
      track: styles.trackUsed,
      fill: styles.fillUsed,
      title: styles.titleUsed,
      value: styles.valueUsed,
      meta: styles.metaUsed,
    };
  }
  return {
    label: "Drained",
    container: styles.containerDrained,
    track: styles.trackDrained,
    fill: styles.fillDrained,
    title: styles.titleDrained,
    value: styles.valueDrained,
    meta: styles.metaDrained,
  };
};

export const StaminaMeter = ({
  current,
  max,
  icon,
  iconName = "alert-octagon-outline",
  title = "Stamina",
  meta,
  compact = false,
  bare = false,
  containerStyle,
}: StaminaMeterProps) => {
  const percent = Math.max(0, Math.min(100, Math.round((current / Math.max(1, max)) * 100)));
  const state = getStaminaState(percent);

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
        {icon ? (
          <Image source={icon} style={[styles.icon, compact ? styles.iconCompact : null]} resizeMode="contain" />
        ) : (
          <MaterialCommunityIcons
            name={iconName}
            size={compact ? 14 : 16}
            color={state.label === "Ready" ? "#bde8ff" : state.label === "Used" ? "#ffe1a7" : "#f0c4d3"}
          />
        )}
        <Text style={[styles.title, state.title, compact ? styles.titleCompact : null]}>{title}</Text>
        <View style={styles.statePill}>
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
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
  containerReady: {
    borderColor: "#4d91bc",
    backgroundColor: "rgba(17, 38, 54, 0.9)",
  },
  containerUsed: {
    borderColor: "#b48d46",
    backgroundColor: "rgba(67, 50, 17, 0.9)",
  },
  containerDrained: {
    borderColor: "#956071",
    backgroundColor: "rgba(60, 25, 40, 0.9)",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    width: 16,
    height: 16,
  },
  iconCompact: {
    width: 14,
    height: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  titleCompact: {
    fontSize: 10,
  },
  titleReady: {
    color: "#bde8ff",
  },
  titleUsed: {
    color: "#ffe1a7",
  },
  titleDrained: {
    color: "#f0c4d3",
  },
  statePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(244, 212, 151, 0.52)",
    backgroundColor: "rgba(92, 60, 28, 0.74)",
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    fontSize: 12,
    fontWeight: "900",
  },
  valueCompact: {
    fontSize: 11,
  },
  valueReady: {
    color: "#dff5ff",
  },
  valueUsed: {
    color: "#fff0cf",
  },
  valueDrained: {
    color: "#ffe5ec",
  },
  meta: {
    fontSize: 10,
    fontWeight: "700",
  },
  metaCompact: {
    fontSize: 9,
  },
  metaReady: {
    color: "#abd1e8",
  },
  metaUsed: {
    color: "#e1c58d",
  },
  metaDrained: {
    color: "#ddb7c4",
  },
  track: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  trackCompact: {
    height: 10,
  },
  trackBare: {
    height: 8,
    borderWidth: 0,
  },
  trackReady: {
    borderColor: "rgba(124, 201, 246, 0.34)",
    backgroundColor: "rgba(8, 23, 35, 0.78)",
  },
  trackUsed: {
    borderColor: "rgba(255, 209, 130, 0.34)",
    backgroundColor: "rgba(36, 24, 6, 0.76)",
  },
  trackDrained: {
    borderColor: "rgba(255, 180, 196, 0.28)",
    backgroundColor: "rgba(24, 11, 19, 0.76)",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  fillReady: {
    backgroundColor: "#4ca8f2",
  },
  fillUsed: {
    backgroundColor: "#ffbf4d",
  },
  fillDrained: {
    backgroundColor: "#df5e85",
  },
});
