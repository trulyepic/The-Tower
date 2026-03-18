import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { StatGlyphBars } from "../components/StatGlyphBars";
import { CLASS_VISUALS } from "../data/classVisuals";
import { HUD_ASSETS } from "../data/hudAssets";
import {
  CLASS_AVATAR_OPTIONS,
  DEFAULT_AVATAR_BY_CLASS,
  getAvatarSprite,
} from "../data/uiSprites";
import { AvatarId, BaseClassDefinition, BaseClassId } from "../types/game";
import { colors } from "../theme/colors";

interface ClassSelectionScreenProps {
  classes: BaseClassDefinition[];
  selectedClass: BaseClassId | null;
  onSelectClass: (classId: BaseClassId) => void;
  onCreateCharacter: (name: string, avatarId: AvatarId) => void;
}

const STARTING_AVATAR_SELECTION: Record<BaseClassId, AvatarId> = {
  warrior: DEFAULT_AVATAR_BY_CLASS.warrior,
  ranger: DEFAULT_AVATAR_BY_CLASS.ranger,
  mage: DEFAULT_AVATAR_BY_CLASS.mage,
};

export const ClassSelectionScreen = ({
  classes,
  selectedClass,
  onSelectClass,
  onCreateCharacter,
}: ClassSelectionScreenProps) => {
  const [name, setName] = useState("Aria");
  const [avatarByClass, setAvatarByClass] = useState<Record<BaseClassId, AvatarId>>(
    STARTING_AVATAR_SELECTION,
  );

  const portraitResizeMode = "contain";
  const canCreate = name.trim().length >= 2 && selectedClass !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="creation" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Adventurer Registry</Text>
            <View style={styles.titlePlate}>
              <Text style={styles.title}>Forge Your Hero</Text>
            </View>
          </View>
          <ImageBackground source={HUD_ASSETS.badges.rank} style={styles.headerBadge} resizeMode="contain">
            <Image
              source={
                selectedClass
                  ? getAvatarSprite(avatarByClass[selectedClass], selectedClass)
                  : getAvatarSprite(DEFAULT_AVATAR_BY_CLASS.warrior, "warrior")
              }
              style={styles.headerBadgePortrait}
              resizeMode="cover"
            />
          </ImageBackground>
        </View>

        <View style={styles.nameCard}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(214, 160, 82, 0.12)", "rgba(103, 68, 161, 0.07)", "rgba(26, 18, 41, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Text style={styles.nameLabel}>Adventurer Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Name your hero"
            placeholderTextColor={colors.textMuted}
            maxLength={18}
          />
          <Text style={styles.nameHint}>2-18 characters. This will be your adventurer name.</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Choose Class</Text>
          {selectedClass ? (
            <View style={styles.readyChip}>
              <MaterialCommunityIcons name="check" size={12} color={colors.success} />
              <Text style={styles.readyChipText}>Class Locked In</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.classGrid}>
          {classes.map((classDef) => {
            const isSelected = selectedClass === classDef.id;
            const classStats = CLASS_VISUALS[classDef.id].stats;

            return (
              <View
                key={classDef.id}
                style={[styles.classCard, isSelected ? styles.classCardSelected : null]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(205, 150, 75, 0.09)", "rgba(97, 63, 151, 0.06)", "rgba(23, 16, 38, 0.02)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                />
                <Pressable onPress={() => onSelectClass(classDef.id)} style={styles.classPressArea}>
                  <ImageBackground
                    source={getAvatarSprite(avatarByClass[classDef.id], classDef.id)}
                    style={styles.classArt}
                    imageStyle={styles.classArtImage}
                    resizeMode={portraitResizeMode}
                  >
                    <View style={styles.classArtShade} />
                    <View style={styles.classTag}>
                      <Text style={styles.classTagText}>{classDef.name}</Text>
                    </View>
                  </ImageBackground>
                  <Text style={styles.classFantasy}>{classDef.fantasy}</Text>
                  <StatGlyphBars stats={classStats} classId={classDef.id} compact />
                </Pressable>

                {isSelected ? (
                  <View style={styles.selectedAvatarSection}>
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionTitle}>Profile Icon</Text>
                      <Text style={styles.sectionMeta}>Pick your look now</Text>
                    </View>
                    <View style={styles.avatarRow}>
                      {/* Keep profile choice visible right under selected class. */}
                      {CLASS_AVATAR_OPTIONS[classDef.id].map((option) => {
                        const selected = avatarByClass[classDef.id] === option.id;

                        return (
                          <Pressable
                            key={option.id}
                            onPress={() =>
                              setAvatarByClass((current) => ({
                                ...current,
                                [classDef.id]: option.id,
                              }))
                            }
                            style={[styles.avatarButton, selected ? styles.avatarButtonSelected : null]}
                          >
                            <Image source={option.image} style={styles.avatarImage} resizeMode={portraitResizeMode} />
                            <View style={styles.avatarCaption}>
                              <Text style={styles.avatarLabel}>{option.label}</Text>
                              <Text style={styles.avatarSubLabel}>Starter</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.classSummaryCard}>
                      <Text style={styles.classSummaryTitle}>{classDef.name}</Text>
                      <Text style={styles.classSummaryBody}>{classDef.passiveTrait}</Text>
                      <Text style={styles.classSummaryBody}>
                        Advanced: {classDef.advancedJobOptions.join(" / ")}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {selectedClass ? (
          <View style={styles.selectionHint}>
            <MaterialCommunityIcons name="account-check-outline" size={15} color={colors.accent} />
            <Text style={styles.selectionHintText}>Class + profile selected. Ready to launch.</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!canCreate}
          onPress={() => {
            if (!selectedClass) {
              return;
            }

            onCreateCharacter(name.trim(), avatarByClass[selectedClass]);
          }}
          style={styles.actionWrap}
        >
          <View style={[styles.createButton, !canCreate ? styles.createButtonDisabled : null]}>
            <MaterialCommunityIcons name="rocket-launch" size={18} color="#ffffff" />
            <Text style={styles.createButtonText}>Start Adventure</Text>
          </View>
        </Pressable>
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
    paddingTop: 14,
    paddingBottom: 30,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  kicker: {
    color: "#b8a17a",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 33,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(6, 12, 30, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titlePlate: {
    minHeight: 62,
    width: "100%",
    maxWidth: 380,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignSelf: "flex-start",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#d0a65a",
    backgroundColor: "rgba(73, 49, 20, 0.9)",
    shadowColor: "#d2a85b",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c59449",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  headerBadgePortrait: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(218, 181, 111, 0.8)",
  },
  nameCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8f6f3f",
    backgroundColor: "rgba(36, 27, 47, 0.95)",
    padding: 12,
    gap: 8,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  nameLabel: {
    color: "#d2bc94",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9a7b47",
    backgroundColor: "rgba(16, 12, 24, 0.95)",
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "700",
  },
  nameHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  readyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#96713c",
    backgroundColor: "rgba(86, 61, 27, 0.75)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readyChipText: {
    color: "#ffe2ae",
    fontSize: 11,
    fontWeight: "700",
  },
  classGrid: {
    gap: 10,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  classCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#866638",
    backgroundColor: "rgba(34, 25, 44, 0.95)",
    padding: 10,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  classCardSelected: {
    borderColor: "#d0a358",
    backgroundColor: "rgba(58, 40, 23, 0.98)",
    shadowColor: "#d6a85d",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  classPressArea: {
    gap: 8,
  },
  classArt: {
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 11, 23, 0.94)",
  },
  classArtImage: {
    borderRadius: 12,
  },
  classArtShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 5, 13, 0.35)",
  },
  classTag: {
    alignSelf: "flex-start",
    margin: 8,
    backgroundColor: "rgba(24, 16, 35, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(205, 162, 86, 0.85)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  classTagText: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },
  classFantasy: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedAvatarSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86663a",
    backgroundColor: "rgba(27, 20, 39, 0.96)",
    padding: 10,
    gap: 10,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  avatarButton: {
    flexBasis: "48%",
    maxWidth: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7f6238",
    backgroundColor: "rgba(20, 15, 31, 0.92)",
    overflow: "hidden",
  },
  avatarButtonSelected: {
    borderColor: "#d2a45b",
    backgroundColor: "rgba(62, 44, 24, 0.98)",
  },
  avatarImage: {
    width: "100%",
    height: 100,
    backgroundColor: "rgba(11, 9, 19, 0.95)",
  },
  avatarCaption: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center",
    gap: 1,
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  avatarSubLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  classSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#806238",
    backgroundColor: "rgba(22, 17, 33, 0.9)",
    padding: 10,
    gap: 6,
  },
  classSummaryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  classSummaryBody: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  selectionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8d6e3f",
    backgroundColor: "rgba(48, 35, 21, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  selectionHintText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  createButton: {
    marginTop: 4,
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 2,
    borderColor: "#d3a75a",
    backgroundColor: "#6f4e1f",
    shadowColor: "#d4ab5f",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  actionWrap: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  createButtonDisabled: {
    opacity: 0.45,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
