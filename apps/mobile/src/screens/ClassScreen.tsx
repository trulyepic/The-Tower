import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { HUD_ASSETS } from "../data/hudAssets";
import { getAvatarSprite } from "../data/uiSprites";
import { getBuffRemainingSeconds, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { BaseClassDefinition, CharacterState } from "../types/game";
import { colors } from "../theme/colors";

interface ClassScreenProps {
  character: CharacterState;
  classes: BaseClassDefinition[];
}

export const ClassScreen = ({ character, classes }: ClassScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const combat = getCharacterCombatStats(character);
  const activeClass = classes.find((classDef) => classDef.id === character.classId) ?? null;
  const activeBuffIds = (character.equippedBuffIds ?? []).filter((buffId) => isBuffActive(character, buffId, nowMs));

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="class" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.kicker}>Buildcraft</Text>
        <View style={styles.titlePlate}>
          <Text style={styles.title}>Class Path</Text>
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(212, 157, 79, 0.11)", "rgba(99, 65, 155, 0.07)", "rgba(25, 18, 40, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.classHeader}>
            <ImageBackground source={HUD_ASSETS.slots.rare} style={styles.classPortraitFrame} resizeMode="contain">
              <Image
                source={getAvatarSprite(character.avatarId, character.classId)}
                style={styles.classPortrait}
                resizeMode="cover"
              />
            </ImageBackground>
            <Text style={styles.sectionTitle}>{activeClass?.name ?? "Unknown Class"}</Text>
          </View>
          <Text style={styles.meta}>Trait: {activeClass?.passiveTrait ?? "N/A"}</Text>
          <Text style={styles.meta}>Focus: {activeClass?.statFocus ?? "N/A"}</Text>
          <Text style={styles.meta}>Fantasy: {activeClass?.fantasy ?? "N/A"}</Text>
          <Text style={styles.meta}>Current Level: {character.progression.level}</Text>
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(201, 146, 69, 0.11)", "rgba(95, 62, 151, 0.07)", "rgba(23, 17, 39, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Combat Profile</Text>
          <View style={styles.metricRow}>
            <Text style={styles.meta}>Damage {combat.damage}</Text>
            <Text style={styles.meta}>Critical {combat.critChance}%</Text>
            <Text style={styles.meta}>Speed {combat.speed}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.meta}>Buff DMG +{combat.buffBonuses.damageFlat}</Text>
            <Text style={styles.meta}>Buff CRIT +{combat.buffBonuses.critFlat}%</Text>
            <Text style={styles.meta}>Buff SPD +{combat.buffBonuses.speedFlat}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.meta}>Tower Success +{combat.buffBonuses.questSuccessFlat}%</Text>
          </View>
          <Text style={styles.sectionSubTitle}>Active Buffs</Text>
          {activeBuffIds.length === 0 ? (
            <Text style={styles.meta}>No active buffs.</Text>
          ) : (
            <View style={styles.activeBuffRow}>
              {activeBuffIds.map((buffId) => (
                <View key={`class-buff-${buffId}`} style={styles.activeBuffChip}>
                  <GameItemIcon itemId={buffId} size={14} />
                  <Text style={styles.activeBuffText}>
                    {Math.floor(getBuffRemainingSeconds(character, buffId, nowMs) / 60)}:
                    {(getBuffRemainingSeconds(character, buffId, nowMs) % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(198, 143, 67, 0.1)", "rgba(88, 57, 143, 0.06)", "rgba(22, 16, 36, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.sectionTitle}>Advanced Jobs</Text>
          {(activeClass?.advancedJobOptions ?? []).map((job) => (
            <View key={job} style={styles.jobRow}>
              <MaterialCommunityIcons name="lock-outline" size={16} color={colors.textMuted} />
              <Text style={styles.meta}>{job} (unlock rules pending)</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  page: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 24,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  titlePlate: {
    minHeight: 56,
    width: 260,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(70, 48, 23, 0.9)",
  },
  panel: {
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 12,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  classPortraitFrame: {
    width: 44,
    height: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  classPortrait: {
    width: 36,
    height: 36,
    borderRadius: 999,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#886a3f",
    backgroundColor: "rgba(50, 37, 57, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sectionSubTitle: {
    color: "#e6cea1",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  activeBuffRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  activeBuffChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9c7a45",
    backgroundColor: "rgba(63, 45, 23, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBuffText: {
    color: "#ffe8bd",
    fontSize: 11,
    fontWeight: "800",
  },
});
