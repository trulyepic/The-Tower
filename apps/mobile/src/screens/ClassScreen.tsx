import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { ABILITY_BY_ID } from "../data/abilities";
import { HUD_ASSETS } from "../data/hudAssets";
import { TITLE_BY_ID } from "../data/titles";
import { getAvatarSprite } from "../data/uiSprites";
import {
  getAbilityComboProfile,
  getAbilityCooldownRemainingSeconds,
  getAvailableWarriorPathChoices,
  getClassAbility,
  getSkillResourceLabel,
  getUnlockedActiveSkills,
  getUnlockedPassiveAbilities,
} from "../lib/abilities";
import { getBuffRemainingSeconds, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { AbilityId, BaseClassDefinition, CharacterState, WarriorPathChoice } from "../types/game";
import { colors } from "../theme/colors";

interface ClassScreenProps {
  character: CharacterState;
  classes: BaseClassDefinition[];
  onChooseWarriorPath: (path: WarriorPathChoice) => { ok: boolean; reason?: string };
}

type WarriorPathNode = {
  id: string;
  level: number;
  group: "shared" | WarriorPathChoice;
};

const WARRIOR_PATH_NODES: WarriorPathNode[] = [
  { id: "ability-warrior-iron-will", level: 1, group: "shared" },
  { id: "ability-warrior-combat-discipline", level: 4, group: "shared" },
  { id: "ability-warrior-bulwark-oath", level: 8, group: "knight" },
  { id: "ability-warrior-bloodrush", level: 8, group: "berserker" },
  { id: "ability-warrior-steel-rhythm", level: 12, group: "shared" },
  { id: "ability-warrior-shield-doctrine", level: 12, group: "knight" },
  { id: "ability-warrior-frenzy-instinct", level: 12, group: "berserker" },
];

const PATH_COLORS: Record<"shared" | WarriorPathChoice, string> = {
  shared: "#7dc7ff",
  knight: "#79f0bd",
  berserker: "#ff8f93",
};

const NODE_FRAME_BY_PATH: Record<"shared" | WarriorPathChoice, ImageSourcePropType> = {
  shared: HUD_ASSETS.slots.rare,
  knight: HUD_ASSETS.slots.epic,
  berserker: HUD_ASSETS.slots.legendary,
};

const PATH_LABEL: Record<"shared" | WarriorPathChoice, string> = {
  shared: "Shared",
  knight: "Knight Path",
  berserker: "Berserker Path",
};

const SKILL_TILE_THEME_BY_ID: Record<
  string,
  {
    border: string;
    bg: string;
    activeBorder: string;
    activeBg: string;
    icon: string;
    iconBorder: string;
    iconBg: string;
    iconActiveBorder: string;
    iconActiveBg: string;
  }
> = {
  "ability-warrior-iron-will": {
    border: "#d8ab66",
    bg: "rgba(92, 61, 26, 0.9)",
    activeBorder: "#f4c87b",
    activeBg: "rgba(119, 77, 29, 0.94)",
    icon: "#ffdba0",
    iconBorder: "#d9a963",
    iconBg: "rgba(112, 71, 28, 0.9)",
    iconActiveBorder: "#ffd286",
    iconActiveBg: "rgba(138, 89, 32, 0.95)",
  },
  "ability-warrior-bulwark-oath": {
    border: "#79d4ff",
    bg: "rgba(25, 57, 95, 0.9)",
    activeBorder: "#a8e7ff",
    activeBg: "rgba(27, 79, 126, 0.95)",
    icon: "#a8e8ff",
    iconBorder: "#67c1ea",
    iconBg: "rgba(29, 73, 116, 0.9)",
    iconActiveBorder: "#9ee4ff",
    iconActiveBg: "rgba(33, 99, 153, 0.95)",
  },
  "ability-warrior-bloodrush": {
    border: "#ff8f93",
    bg: "rgba(96, 32, 43, 0.9)",
    activeBorder: "#ffb1b4",
    activeBg: "rgba(126, 39, 53, 0.95)",
    icon: "#ffc2c5",
    iconBorder: "#ec838a",
    iconBg: "rgba(111, 34, 48, 0.9)",
    iconActiveBorder: "#ffb4b8",
    iconActiveBg: "rgba(143, 42, 60, 0.95)",
  },
  "ability-warrior-steel-rhythm": {
    border: "#b9a4ff",
    bg: "rgba(62, 42, 109, 0.9)",
    activeBorder: "#d0c2ff",
    activeBg: "rgba(80, 57, 138, 0.95)",
    icon: "#ddcfff",
    iconBorder: "#a98fe8",
    iconBg: "rgba(75, 53, 126, 0.9)",
    iconActiveBorder: "#d2c4ff",
    iconActiveBg: "rgba(92, 64, 155, 0.95)",
  },
};

const MetricChip = ({ icon, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; value: string }) => (
  <View style={styles.metricChip}>
    <MaterialCommunityIcons name={icon} size={13} color="#ffdca1" />
    <Text style={styles.metricChipText}>{value}</Text>
  </View>
);

const AbilityTile = ({
  icon,
  title,
  sub,
  selected,
  onPress,
  kind,
  theme,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  sub: string;
  selected?: boolean;
  onPress?: () => void;
  kind: "skill" | "passive";
  theme?: {
    border: string;
    bg: string;
    activeBorder: string;
    activeBg: string;
    icon: string;
    iconBorder: string;
    iconBg: string;
    iconActiveBorder: string;
    iconActiveBg: string;
  };
}) => {
  const passiveTheme = {
    border: "#7ecf9e",
    bg: "rgba(33, 88, 61, 0.9)",
    activeBorder: "#9ff0bf",
    activeBg: "rgba(36, 108, 74, 0.95)",
    icon: "#b9ffd3",
    iconBorder: "#7ecf9e",
    iconBg: "rgba(39, 102, 71, 0.92)",
    iconActiveBorder: "#9ff0bf",
    iconActiveBg: "rgba(49, 126, 87, 0.96)",
  };
  const palette = kind === "passive" ? passiveTheme : theme ?? passiveTheme;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.abilityTile,
        {
          borderColor: selected ? palette.activeBorder : palette.border,
          backgroundColor: selected ? palette.activeBg : palette.bg,
        },
        selected ? styles.abilityTileActive : null,
      ]}
    >
      <View
        style={[
          styles.abilityIconFrame,
          {
            borderColor: selected ? palette.iconActiveBorder : palette.iconBorder,
            backgroundColor: selected ? palette.iconActiveBg : palette.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={26} color={palette.icon} />
      </View>
      <Text numberOfLines={1} style={styles.abilityTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.abilitySub}>{sub}</Text>
      {selected ? <View style={styles.selectedPip} /> : null}
    </Pressable>
  );
};

export const ClassScreen = ({
  character,
  classes,
  onChooseWarriorPath,
}: ClassScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  const [selectedPathNodeId, setSelectedPathNodeId] = useState<AbilityId | null>(null);

  const combat = getCharacterCombatStats(character);
  const activeClass = classes.find((classDef) => classDef.id === character.classId) ?? null;
  const activeBuffIds = (character.equippedBuffIds ?? []).filter((buffId) => isBuffActive(character, buffId, nowMs));
  const equippedTitles = (character.equippedTitleIds ?? []).map((titleId) => TITLE_BY_ID[titleId]).filter(Boolean);
  const unlockedSkills = getUnlockedActiveSkills(character);
  const unlockedPassives = getUnlockedPassiveAbilities(character);
  const equippedPassiveIds = new Set(character.equippedPassiveAbilityIds ?? []);
  const classAbility = getClassAbility(character);
  const skillResourceLabel = getSkillResourceLabel(character.classId);
  const abilityCooldown = getAbilityCooldownRemainingSeconds(character, classAbility.id, nowMs);
  const comboProfile = getAbilityComboProfile(character);
  const pathOptions = getAvailableWarriorPathChoices(character);

  const warriorNodes = useMemo(
    () =>
      character.classId === "warrior"
        ? WARRIOR_PATH_NODES.map((entry) => ({ ...entry, ability: ABILITY_BY_ID[entry.id] }))
        : [],
    [character.classId],
  );

  const selectedPathNode = useMemo(
    () => warriorNodes.find((entry) => entry.id === selectedPathNodeId) ?? warriorNodes[0],
    [selectedPathNodeId, warriorNodes],
  );

  const sharedNodes = warriorNodes.filter((entry) => entry.group === "shared");
  const knightNodes = warriorNodes.filter((entry) => entry.group === "knight");
  const berserkerNodes = warriorNodes.filter((entry) => entry.group === "berserker");
  const sharedTierOne = sharedNodes[0];
  const sharedTierTwo = sharedNodes[1];
  const sharedTierThree = sharedNodes[2];
  const knightTierOne = knightNodes[0];
  const knightTierTwo = knightNodes[1];
  const berserkerTierOne = berserkerNodes[0];
  const berserkerTierTwo = berserkerNodes[1];

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!uiNotice) {
      return;
    }
    const timeout = setTimeout(() => setUiNotice(null), 1800);
    return () => clearTimeout(timeout);
  }, [uiNotice]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="class" />
      <ScrollView contentContainerStyle={styles.page}>
        <ImageBackground source={HUD_ASSETS.decor.titlePlate} resizeMode="stretch" style={styles.titlePlate}>
          <Text style={styles.title}>Skill Forge</Text>
        </ImageBackground>

        <View style={styles.heroCard}>
          <LinearGradient
            colors={["rgba(123,87,41,0.94)", "rgba(56,42,78,0.96)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />
          <View style={styles.heroHeader}>
            <ImageBackground source={HUD_ASSETS.slots.legendary} style={styles.heroPortraitFrame} resizeMode="contain">
              <Image source={getAvatarSprite(character.avatarId, character.classId)} style={styles.heroPortrait} resizeMode="cover" />
            </ImageBackground>
            <View style={styles.heroMeta}>
              <Text style={styles.heroName}>{activeClass?.name ?? "Unknown"}</Text>
              <Text style={styles.heroSub}>Level {character.progression.level} • {activeClass?.statFocus ?? "Core"}</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <MetricChip icon="sword" value={`DMG ${combat.damage}`} />
            <MetricChip icon="star-four-points" value={`CRIT ${combat.critChance}%`} />
            <MetricChip icon="run-fast" value={`SPD ${combat.speed}`} />
            <MetricChip icon="shield-check" value={`Q+${combat.questSuccessBonus}%`} />
          </View>

          <View style={styles.metricRow}>
            <View style={styles.resourceChip}>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color="#89c4ff" />
              <Text style={styles.resourceText}>{skillResourceLabel} {character.focus}/{character.focusCap}</Text>
            </View>
            <MetricChip icon="timer-sand" value={abilityCooldown > 0 ? `${abilityCooldown}s` : "Ready"} />
            <MetricChip icon="lightning-bolt" value={`Combo ${comboProfile.stacks}`} />
          </View>
        </View>

        {uiNotice ? (
          <View style={styles.noticeBar}>
            <MaterialCommunityIcons name="check-decagram" size={14} color="#e8ffcf" />
            <Text style={styles.noticeText}>{uiNotice}</Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Active Skills</Text>
          <View style={styles.tileGrid}>
            {unlockedSkills.map((skill) => (
              <AbilityTile
                key={skill.id}
                icon={skill.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                title={skill.name}
                sub={`Q+${skill.bonuses.questSuccessFlat ?? 0}% T+${skill.bonuses.towerSuccessFlat ?? 0}%`}
                selected={character.activeClassSkillId === skill.id}
                kind="skill"
                theme={SKILL_TILE_THEME_BY_ID[skill.id]}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Passive Slots (2)</Text>
          <View style={styles.tileGrid}>
            {unlockedPassives.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#c5b8cf" />
                <Text style={styles.emptyText}>Unlock passives by leveling.</Text>
              </View>
            ) : (
              unlockedPassives.map((passive) => (
                <AbilityTile
                  key={passive.id}
                  icon={passive.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  title={passive.name}
                  sub={`ATK +${passive.bonuses.damageFlat ?? 0} CRIT +${passive.bonuses.critFlat ?? 0}%`}
                  selected={equippedPassiveIds.has(passive.id)}
                  kind="passive"
                />
              ))
            )}
          </View>
        </View>

        {character.classId === "warrior" ? (
          <View style={styles.panel}>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionTitle}>Warrior Path Board</Text>
              <Text style={styles.sectionHint}>Tap an icon for details</Text>
            </View>
            <View style={styles.treeBoard}>
              {sharedTierOne ? (
                <View style={styles.treeTierCenter}>
                  <Pressable
                    onPress={() => setSelectedPathNodeId(sharedTierOne.id)}
                    style={[styles.pathIconWrap, character.progression.level < sharedTierOne.level ? styles.pathIconLocked : null]}
                  >
                    {selectedPathNode?.id === sharedTierOne.id ? <View style={styles.pathSelectedRing} /> : null}
                    <ImageBackground source={NODE_FRAME_BY_PATH.shared} resizeMode="contain" style={styles.pathIconFrame}>
                      <MaterialCommunityIcons
                        name={sharedTierOne.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={character.progression.level >= sharedTierOne.level ? PATH_COLORS.shared : "#9185a2"}
                      />
                    </ImageBackground>
                    <View style={styles.pathMetaRow}>
                      <Text style={styles.pathIconLabel}>Lv {sharedTierOne.level}</Text>
                      <Text style={styles.pathTypeTag}>{(sharedTierOne.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                    </View>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.treeVerticalConnector} />

              {sharedTierTwo ? (
                <View style={styles.treeTierCenter}>
                  <Pressable
                    onPress={() => setSelectedPathNodeId(sharedTierTwo.id)}
                    style={[styles.pathIconWrap, character.progression.level < sharedTierTwo.level ? styles.pathIconLocked : null]}
                  >
                    {selectedPathNode?.id === sharedTierTwo.id ? <View style={styles.pathSelectedRing} /> : null}
                    <ImageBackground source={NODE_FRAME_BY_PATH.shared} resizeMode="contain" style={styles.pathIconFrame}>
                      <MaterialCommunityIcons
                        name={sharedTierTwo.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={character.progression.level >= sharedTierTwo.level ? PATH_COLORS.shared : "#9185a2"}
                      />
                    </ImageBackground>
                    <View style={styles.pathMetaRow}>
                      <Text style={styles.pathIconLabel}>Lv {sharedTierTwo.level}</Text>
                      <Text style={styles.pathTypeTag}>{(sharedTierTwo.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                    </View>
                  </Pressable>
                </View>
              ) : null}

              {sharedTierThree ? (
                <>
                  <View style={styles.treeVerticalConnector} />
                  <View style={styles.treeTierCenter}>
                    <Pressable
                      onPress={() => setSelectedPathNodeId(sharedTierThree.id)}
                      style={[styles.pathIconWrap, character.progression.level < sharedTierThree.level ? styles.pathIconLocked : null]}
                    >
                      {selectedPathNode?.id === sharedTierThree.id ? <View style={styles.pathSelectedRing} /> : null}
                      <ImageBackground source={NODE_FRAME_BY_PATH.shared} resizeMode="contain" style={styles.pathIconFrame}>
                        <MaterialCommunityIcons
                          name={sharedTierThree.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={character.progression.level >= sharedTierThree.level ? PATH_COLORS.shared : "#9185a2"}
                        />
                      </ImageBackground>
                      <View style={styles.pathMetaRow}>
                        <Text style={styles.pathIconLabel}>Lv {sharedTierThree.level}</Text>
                        <Text style={styles.pathTypeTag}>{(sharedTierThree.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              ) : null}

              <View style={styles.treeSplitConnectorWrap}>
                <View style={styles.treeSplitStem} />
                <View style={styles.treeSplitBridge} />
                <View style={styles.treeSplitLeftDrop} />
                <View style={styles.treeSplitRightDrop} />
              </View>

              <View style={styles.treeTierBranch}>
                <View style={[styles.treeBranchCol, character.warriorPathChoice === "knight" ? styles.treeBranchChosenKnight : null]}>
                  <View style={styles.treeBranchHead}>
                    <Image source={HUD_ASSETS.badges.rank} style={styles.laneBadge} resizeMode="contain" />
                    <Text style={[styles.laneTitle, { color: PATH_COLORS.knight }]}>Knight Path</Text>
                  </View>
                  {knightTierOne ? (
                    <Pressable
                      onPress={() => setSelectedPathNodeId(knightTierOne.id)}
                      style={[
                        styles.pathIconWrap,
                        character.progression.level < knightTierOne.level ||
                        (character.warriorPathChoice && character.warriorPathChoice !== "knight")
                          ? styles.pathIconLocked
                          : null,
                      ]}
                    >
                      {selectedPathNode?.id === knightTierOne.id ? <View style={styles.pathSelectedRing} /> : null}
                      <ImageBackground source={NODE_FRAME_BY_PATH.knight} resizeMode="contain" style={styles.pathIconFrame}>
                        <MaterialCommunityIcons
                          name={knightTierOne.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={
                            character.warriorPathChoice && character.warriorPathChoice !== "knight"
                              ? "#9a8ea9"
                              : PATH_COLORS.knight
                          }
                        />
                      </ImageBackground>
                      <View style={styles.pathMetaRow}>
                        <Text style={styles.pathIconLabel}>Lv {knightTierOne.level}</Text>
                        <Text style={styles.pathTypeTag}>{(knightTierOne.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>

                <View style={[styles.treeBranchCol, character.warriorPathChoice === "berserker" ? styles.treeBranchChosenBerserker : null]}>
                  <View style={styles.treeBranchHead}>
                    <Image source={HUD_ASSETS.badges.stamp} style={styles.laneBadge} resizeMode="contain" />
                    <Text style={[styles.laneTitle, { color: PATH_COLORS.berserker }]}>Berserker Path</Text>
                  </View>
                  {berserkerTierOne ? (
                    <Pressable
                      onPress={() => setSelectedPathNodeId(berserkerTierOne.id)}
                      style={[
                        styles.pathIconWrap,
                        character.progression.level < berserkerTierOne.level ||
                        (character.warriorPathChoice && character.warriorPathChoice !== "berserker")
                          ? styles.pathIconLocked
                          : null,
                      ]}
                    >
                      {selectedPathNode?.id === berserkerTierOne.id ? <View style={styles.pathSelectedRing} /> : null}
                      <ImageBackground source={NODE_FRAME_BY_PATH.berserker} resizeMode="contain" style={styles.pathIconFrame}>
                        <MaterialCommunityIcons
                          name={berserkerTierOne.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={
                            character.warriorPathChoice && character.warriorPathChoice !== "berserker"
                              ? "#9a8ea9"
                              : PATH_COLORS.berserker
                          }
                        />
                      </ImageBackground>
                      <View style={styles.pathMetaRow}>
                        <Text style={styles.pathIconLabel}>Lv {berserkerTierOne.level}</Text>
                        <Text style={styles.pathTypeTag}>{(berserkerTierOne.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.treeDualVerticals}>
                <View style={styles.treeDualVerticalLine} />
                <View style={styles.treeDualVerticalLine} />
              </View>

              <View style={styles.treeTierBranch}>
                <View style={styles.treeBranchCol}>
                  {knightTierTwo ? (
                    <Pressable
                      onPress={() => setSelectedPathNodeId(knightTierTwo.id)}
                      style={[
                        styles.pathIconWrap,
                        character.progression.level < knightTierTwo.level ||
                        (character.warriorPathChoice && character.warriorPathChoice !== "knight")
                          ? styles.pathIconLocked
                          : null,
                      ]}
                    >
                      {selectedPathNode?.id === knightTierTwo.id ? <View style={styles.pathSelectedRing} /> : null}
                      <ImageBackground source={NODE_FRAME_BY_PATH.knight} resizeMode="contain" style={styles.pathIconFrame}>
                        <MaterialCommunityIcons
                          name={knightTierTwo.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={
                            character.warriorPathChoice && character.warriorPathChoice !== "knight"
                              ? "#9a8ea9"
                              : PATH_COLORS.knight
                          }
                        />
                      </ImageBackground>
                      <View style={styles.pathMetaRow}>
                        <Text style={styles.pathIconLabel}>Lv {knightTierTwo.level}</Text>
                        <Text style={styles.pathTypeTag}>{(knightTierTwo.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.treeBranchCol}>
                  {berserkerTierTwo ? (
                    <Pressable
                      onPress={() => setSelectedPathNodeId(berserkerTierTwo.id)}
                      style={[
                        styles.pathIconWrap,
                        character.progression.level < berserkerTierTwo.level ||
                        (character.warriorPathChoice && character.warriorPathChoice !== "berserker")
                          ? styles.pathIconLocked
                          : null,
                      ]}
                    >
                      {selectedPathNode?.id === berserkerTierTwo.id ? <View style={styles.pathSelectedRing} /> : null}
                      <ImageBackground source={NODE_FRAME_BY_PATH.berserker} resizeMode="contain" style={styles.pathIconFrame}>
                        <MaterialCommunityIcons
                          name={berserkerTierTwo.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={
                            character.warriorPathChoice && character.warriorPathChoice !== "berserker"
                              ? "#9a8ea9"
                              : PATH_COLORS.berserker
                          }
                        />
                      </ImageBackground>
                      <View style={styles.pathMetaRow}>
                        <Text style={styles.pathIconLabel}>Lv {berserkerTierTwo.level}</Text>
                        <Text style={styles.pathTypeTag}>{(berserkerTierTwo.ability.kind ?? "skill") === "skill" ? "S" : "P"}</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {!character.warriorPathChoice && pathOptions.length > 1 ? (
                <View style={styles.treeChoiceRow}>
                  <Pressable
                    onPress={() => {
                      const result = onChooseWarriorPath("knight");
                      setUiNotice(result.reason ?? "Knight path selected.");
                    }}
                    style={[styles.pickButton, styles.pickButtonKnight]}
                  >
                    <Text style={styles.pickButtonText}>Choose Knight</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const result = onChooseWarriorPath("berserker");
                      setUiNotice(result.reason ?? "Berserker path selected.");
                    }}
                    style={[styles.pickButton, styles.pickButtonBerserker]}
                  >
                    <Text style={styles.pickButtonText}>Choose Berserker</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {selectedPathNode ? (
              <View style={styles.nodeInfoStrip}>
                <MaterialCommunityIcons
                  name={selectedPathNode.ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={16}
                  color={PATH_COLORS[selectedPathNode.group]}
                />
                <Text style={styles.nodeInfoTitle}>{selectedPathNode.ability.name}</Text>
                <Text style={[styles.nodeInfoMeta, { color: PATH_COLORS[selectedPathNode.group] }]}>
                  {PATH_LABEL[selectedPathNode.group]} • Lv {selectedPathNode.level}
                </Text>
              </View>
            ) : null}
            {!character.warriorPathChoice ? (
              <View style={styles.pathNoticeRow}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#dfc897" />
                <Text style={styles.pathNoticeText}>
                  These are path drills. Final Knight/Berserker specialization unlocks at Level 15 through NPC guidance.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Loadout Effects</Text>
          <View style={styles.metricRow}>
            <MetricChip icon="sword-cross" value={`Passive ATK +${combat.passiveAbilityBonuses.damageFlat}`} />
            <MetricChip icon="target" value={`Passive CRIT +${combat.passiveAbilityBonuses.critFlat}%`} />
            <MetricChip icon="run-fast" value={`Passive SPD +${combat.passiveAbilityBonuses.speedFlat}`} />
          </View>
          <View style={styles.metricRow}>
            <MetricChip icon="flash" value={`Combo ATK +${combat.comboBonuses.damageFlat}`} />
            <MetricChip icon="sword" value={`Combo CRIT +${combat.comboBonuses.critFlat}%`} />
            <MetricChip icon="rocket-launch" value={`Combo SPD +${combat.comboBonuses.speedFlat}`} />
          </View>

          <View style={styles.chipRack}>
            <View style={styles.tagChip}>
              <MaterialCommunityIcons name={classAbility.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={13} color="#ffd786" />
              <Text style={styles.tagText}>{classAbility.name}</Text>
            </View>
            {equippedTitles.map((title) => (
              <View key={`title-${title.id}`} style={styles.tagChip}>
                <MaterialCommunityIcons
                  name={(title.icon || "medal-outline") as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={13}
                  color="#ffd786"
                />
                <Text style={styles.tagText}>{title.name}</Text>
              </View>
            ))}
            {activeBuffIds.map((buffId) => (
              <View key={`buff-${buffId}`} style={styles.tagChip}>
                <GameItemIcon itemId={buffId} size={13} />
                <Text style={styles.tagText}>
                  {Math.floor(getBuffRemainingSeconds(character, buffId, nowMs) / 60)}:
                  {(getBuffRemainingSeconds(character, buffId, nowMs) % 60).toString().padStart(2, "0")}
                </Text>
              </View>
            ))}
          </View>
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
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 10,
  },
  titlePlate: {
    height: 54,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff0ce",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#9a7846",
    overflow: "hidden",
    backgroundColor: "rgba(34,26,46,0.95)",
    padding: 10,
    gap: 8,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroPortraitFrame: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPortrait: {
    width: 44,
    height: 44,
    borderRadius: 999,
  },
  heroMeta: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    color: "#ffefca",
    fontSize: 18,
    fontWeight: "900",
  },
  heroSub: {
    color: "#d8cbb0",
    fontSize: 11,
    fontWeight: "700",
  },
  noticeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8ccf70",
    backgroundColor: "rgba(31, 73, 34, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noticeText: {
    color: "#ecffd2",
    fontSize: 11,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8a6c3f",
    backgroundColor: "rgba(36, 28, 49, 0.96)",
    padding: 10,
    gap: 8,
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#ffe6b4",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHint: {
    color: "#d4c7e2",
    fontSize: 10,
    fontWeight: "700",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  abilityTile: {
    width: "48.8%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#715a34",
    backgroundColor: "rgba(69, 48, 25, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    gap: 3,
    position: "relative",
    minHeight: 102,
  },
  abilityTileActive: {
    shadowColor: "#f2c16d",
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  abilityIconFrame: {
    width: 46,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  abilityTitle: {
    color: "#fff0cf",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    width: "100%",
  },
  abilitySub: {
    color: "#d8dbee",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  selectedPip: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#8df6af",
  },
  emptyCard: {
    width: "100%",
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6d6277",
    backgroundColor: "rgba(55,45,67,0.92)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  emptyText: {
    color: "#c7b9d3",
    fontSize: 11,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metricChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#887245",
    backgroundColor: "rgba(58,43,26,0.94)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricChipText: {
    color: "#ffe8be",
    fontSize: 11,
    fontWeight: "800",
  },
  resourceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6ca6ff",
    backgroundColor: "rgba(24,45,91,0.92)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  resourceText: {
    color: "#d7e8ff",
    fontSize: 11,
    fontWeight: "800",
  },
  treeBoard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7d6540",
    backgroundColor: "rgba(52, 40, 23, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 2,
  },
  treeTierCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  treeVerticalConnector: {
    alignSelf: "center",
    width: 2,
    height: 14,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeSplitConnectorWrap: {
    alignSelf: "center",
    width: "76%",
    height: 18,
    position: "relative",
  },
  treeSplitStem: {
    position: "absolute",
    left: "50%",
    marginLeft: -1,
    top: 0,
    width: 2,
    height: 7,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeSplitBridge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 7,
    height: 2,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeSplitLeftDrop: {
    position: "absolute",
    left: 0,
    top: 7,
    width: 2,
    height: 11,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeSplitRightDrop: {
    position: "absolute",
    right: 0,
    top: 7,
    width: 2,
    height: 11,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeTierBranch: {
    flexDirection: "row",
    gap: 8,
  },
  treeBranchCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#715b37",
    backgroundColor: "rgba(62, 47, 30, 0.68)",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  treeBranchChosenKnight: {
    borderColor: "#79f0bd",
    backgroundColor: "rgba(27, 88, 60, 0.2)",
  },
  treeBranchChosenBerserker: {
    borderColor: "#ff8f93",
    backgroundColor: "rgba(113, 39, 45, 0.2)",
  },
  treeBranchHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  treeDualVerticals: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "24%",
    height: 14,
    marginTop: -1,
  },
  treeDualVerticalLine: {
    width: 2,
    height: 14,
    backgroundColor: "rgba(206, 169, 103, 0.6)",
  },
  treeChoiceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  pathIconWrap: {
    alignItems: "center",
    gap: 2,
    position: "relative",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  pathSelectedRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ffd27a",
    top: -2,
    opacity: 0.95,
  },
  pathIconFrame: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pathMetaRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  pathIconLabel: {
    color: "#ded0e9",
    fontSize: 10,
    fontWeight: "800",
  },
  pathTypeTag: {
    color: "#f9e8bf",
    fontSize: 9,
    fontWeight: "900",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#8f7547",
    backgroundColor: "rgba(65,48,24,0.95)",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pathIconLocked: {
    opacity: 0.45,
  },
  laneBadge: {
    width: 14,
    height: 14,
  },
  laneTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pickButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickButtonKnight: {
    borderColor: "#7ff1bb",
    backgroundColor: "rgba(25, 88, 58, 0.92)",
  },
  pickButtonBerserker: {
    borderColor: "#ff9a9b",
    backgroundColor: "rgba(117, 35, 41, 0.92)",
  },
  pickButtonText: {
    color: "#fff1cd",
    fontSize: 11,
    fontWeight: "900",
  },
  nodeInfoStrip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8b7041",
    backgroundColor: "rgba(54,40,23,0.93)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  nodeInfoTitle: {
    color: "#fff0c9",
    fontSize: 12,
    fontWeight: "900",
    flex: 1,
  },
  nodeInfoMeta: {
    fontSize: 10,
    fontWeight: "800",
  },
  pathNoticeRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#877046",
    backgroundColor: "rgba(63, 49, 29, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pathNoticeText: {
    flex: 1,
    color: "#e7d5b0",
    fontSize: 10,
    fontWeight: "700",
  },
  chipRack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#82663d",
    backgroundColor: "rgba(66, 49, 30, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tagText: {
    color: "#ffe9c2",
    fontSize: 10,
    fontWeight: "800",
  },
});
