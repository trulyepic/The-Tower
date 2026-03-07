import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { CLASS_ARTWORK } from "../data/classArtwork";
import { BaseClassId } from "../types/game";
import { colors } from "../theme/colors";

interface ClassArtworkCardProps {
  classId: BaseClassId;
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export const ClassArtworkCard = ({ classId, title, subtitle, compact = false }: ClassArtworkCardProps) => {
  const art = CLASS_ARTWORK[classId];

  const cardHeight = compact ? 82 : 150;
  const iconSize = compact ? 30 : 38;

  return (
    <View style={[styles.shell, { height: cardHeight }]}>
      <ImageBackground source={art.image} style={styles.banner} imageStyle={styles.bannerImage}>
        <View style={styles.shadowTop} />
        <View style={styles.shadowBottom} />

        <View style={styles.emblemWrap}>
          <MaterialCommunityIcons
            name={art.icon}
            size={iconSize}
            color={colors.gold}
          />
        </View>
      </ImageBackground>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4e78cf",
    backgroundColor: "#122a57",
    justifyContent: "flex-end",
  },
  banner: {
    flex: 1,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  bannerImage: {
    resizeMode: "cover",
  },
  shadowTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 24,
    backgroundColor: "rgba(4, 9, 22, 0.2)",
  },
  shadowBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: "rgba(4, 9, 22, 0.28)",
  },
  emblemWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 15, 34, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255, 214, 120, 0.82)",
  },
  textBlock: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(5, 12, 27, 0.58)",
    borderTopWidth: 1,
    borderTopColor: "rgba(127, 164, 239, 0.55)",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
});
