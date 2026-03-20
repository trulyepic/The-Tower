import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  getEquippedPassiveBattleBonuses,
  getLiveBattleSkillProfile,
  getPassiveBattleProfile,
  getUnlockedActiveSkills,
  getUnlockedPassiveAbilities,
} from "../lib/abilities";
import { getAbilityArtSource, getAbilityKindAccent } from "../lib/abilityVisuals";
import { getBuffRemainingSeconds, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { AbilityId, BaseClassDefinition, CharacterState, ClassAbilityDefinition, WarriorPathChoice } from "../types/game";
import { colors } from "../theme/colors";

interface ClassScreenProps {
  character: CharacterState;
  classes: BaseClassDefinition[];
  onChooseWarriorPath: (path: WarriorPathChoice) => { ok: boolean; reason?: string };
  onSetActiveClassSkill: (abilityId: AbilityId) => { ok: boolean; reason?: string };
  onTogglePassiveAbility: (abilityId: AbilityId) => { ok: boolean; reason?: string };
}

type WarriorPathNode = {
  id: AbilityId;
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

const SECTION_TONES = {
  skill: {
    border: "#8f7548",
    background: "rgba(71, 50, 25, 0.88)",
    icon: "#ffd9a0",
  },
  passive: {
    border: "#5f9474",
    background: "rgba(31, 74, 54, 0.88)",
    icon: "#baf3ce",
  },
} as const;

const getAbilityBattleSummary = (ability: ClassAbilityDefinition): string => {
  if ((ability.kind ?? "skill") === "passive") {
    const profile = getPassiveBattleProfile(ability.id);
    if (profile) {
      const parts: string[] = [];
      if (profile.guardBonusFlat > 0) {
        parts.push(`Guard +${profile.guardBonusFlat}`);
      }
      if (profile.attackConsistencyFlat > 0) {
        parts.push(`Steady +${profile.attackConsistencyFlat}`);
      }
      if (profile.statusSeverityReductionFlat > 0) {
        parts.push(`Severity -${profile.statusSeverityReductionFlat}`);
      }
      if (profile.counterBonusDamageFlat > 0) {
        parts.push(`Counter +${profile.counterBonusDamageFlat}`);
      }
      if (profile.woundedTargetDamageFlat > 0) {
        parts.push(`Vs Wounded +${profile.woundedTargetDamageFlat}`);
      }
      if (profile.postCritTempoFlat > 0 || profile.postKillTempoFlat > 0) {
        parts.push("Tempo Feed");
      }
      return parts.join(" • ");
    }
    return "Battle passive";
  }

  const liveProfile = getLiveBattleSkillProfile(ability.id);
  if (liveProfile) {
    const highlights: string[] = [`${liveProfile.cooldownSeconds}s CD`];
    if (liveProfile.mitigationFlat > 0) {
      highlights.push(`Guard +${liveProfile.mitigationFlat}`);
    }
    if (liveProfile.attackBonus > 0) {
      highlights.push(`ATK +${liveProfile.attackBonus}`);
    }
    if (liveProfile.critBonus > 0) {
      highlights.push(`CRIT +${liveProfile.critBonus}%`);
    }
    if (liveProfile.speedBonus > 0) {
      highlights.push(`SPD +${liveProfile.speedBonus}`);
    }
    if (liveProfile.initiativeBonus > 0) {
      highlights.push(`Init +${liveProfile.initiativeBonus}`);
    }
    if (liveProfile.counterBonusDamageFlat > 0) {
      highlights.push(`Counter +${liveProfile.counterBonusDamageFlat}`);
    }
    if (liveProfile.woundedTargetDamageFlat > 0) {
      highlights.push(`Vs Wounded +${liveProfile.woundedTargetDamageFlat}`);
    }
    return highlights.join(" • ");
  }

  return `${ability.cooldownSeconds}s CD`;
};

const getAbilityBattleDetail = (ability: ClassAbilityDefinition): string => {
  if ((ability.kind ?? "skill") === "passive") {
    const profile = getPassiveBattleProfile(ability.id);
    if (profile) {
      return profile.detail;
    }
    return "Passive effect applied whenever it is equipped.";
  }

  const liveProfile = getLiveBattleSkillProfile(ability.id);
  if (liveProfile) {
    return liveProfile.effectDetail;
  }
  return ability.description;
};

const getAbilityRoleLabel = (ability: ClassAbilityDefinition): string => {
  if ((ability.kind ?? "skill") === "passive") {
    return ability.pathGroup === "shared" ? "Shared Passive" : `${capitalize(ability.pathGroup ?? "shared")} Passive`;
  }
  return ability.pathGroup === "shared" ? "Shared Skill" : `${capitalize(ability.pathGroup ?? "shared")} Skill`;
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const MetricChip = ({ icon, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; value: string }) => (
  <View style={styles.metricChip}>
    <MaterialCommunityIcons name={icon} size={13} color="#ffdca1" />
    <Text style={styles.metricChipText}>{value}</Text>
  </View>
);

const AbilityIconGlyph = ({
  abilityId,
  iconName,
  size,
  color,
  imageStyle,
}: {
  abilityId: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  size: number;
  color: string;
  imageStyle?: object;
}) => {
  const artSource = getAbilityArtSource(abilityId);
  return artSource ? (
    <Image
      source={artSource}
      style={[{ width: Math.round(size * 1.6), height: Math.round(size * 1.6) }, imageStyle]}
      resizeMode="contain"
    />
  ) : (
    <MaterialCommunityIcons name={iconName} size={size} color={color} />
  );
};

const SectionHeader = ({ title, hint }: { title: string; hint?: string }) => (
  <View style={styles.sectionHeadRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
  </View>
);

const LoadoutCard = ({
  ability,
  selected,
  equipped,
  locked,
  mode,
  onPress,
}: {
  ability: ClassAbilityDefinition;
  selected?: boolean;
  equipped?: boolean;
  locked?: boolean;
  mode: "skill" | "passive";
  onPress?: () => void;
}) => {
  const tone = SECTION_TONES[mode];
  const accent = getAbilityKindAccent(ability);
  const iconBorderColor = accent.border ?? tone.border;
  const iconColor = accent.icon ?? tone.icon;
  const iconBackground = accent.background ?? "rgba(29, 22, 39, 0.92)";
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      style={[
        styles.loadoutCard,
        { borderColor: tone.border, backgroundColor: tone.background },
        selected ? styles.loadoutCardSelected : null,
        equipped ? styles.loadoutCardEquipped : null,
        locked ? styles.loadoutCardLocked : null,
      ]}
    >
      <View style={[styles.loadoutIconFrame, { borderColor: iconBorderColor, backgroundColor: iconBackground }]}>
        <AbilityIconGlyph
          abilityId={ability.id}
          iconName={ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={28}
          color={iconColor}
        />
      </View>
      <View style={styles.loadoutCardBody}>
        <View style={styles.loadoutCardTopRow}>
          <Text style={styles.loadoutCardTitle}>{ability.name}</Text>
          <Text style={styles.loadoutRoleLabel}>{getAbilityRoleLabel(ability)}</Text>
        </View>
        <Text style={styles.loadoutCardSummary}>{getAbilityBattleSummary(ability)}</Text>
        <Text style={styles.loadoutCardDetail}>{getAbilityBattleDetail(ability)}</Text>
      </View>
      <View style={styles.loadoutStateCol}>
        {selected ? <Text style={styles.loadoutStateActive}>Active</Text> : null}
        {equipped ? <Text style={styles.loadoutStateEquipped}>Equipped</Text> : null}
        {locked ? <Text style={styles.loadoutStateLocked}>Locked</Text> : null}
      </View>
    </Pressable>
  );
};

const BranchNodeCard = ({
  ability,
  level,
  path,
  locked,
  unavailable,
  selected,
  note,
  onPress,
}: {
  ability: ClassAbilityDefinition;
  level: number;
  path: "shared" | WarriorPathChoice;
  locked: boolean;
  unavailable: boolean;
  selected?: boolean;
  note: string;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.branchNodeCard,
      { borderColor: PATH_COLORS[path] },
      locked ? styles.branchNodeLocked : null,
      unavailable ? styles.branchNodeUnavailable : null,
      selected ? styles.branchNodeSelected : null,
    ]}
  >
    <View style={styles.branchNodeTopRow}>
      <View style={[styles.branchNodeIconFrame, { borderColor: PATH_COLORS[path] }]}>
        <AbilityIconGlyph
          abilityId={ability.id}
          iconName={ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={unavailable ? "#9d92a8" : PATH_COLORS[path]}
        />
      </View>
      <View style={styles.branchNodeTextCol}>
        <Text style={styles.branchNodeTitle}>{ability.name}</Text>
        <Text style={styles.branchNodeLevel}>Branch Tier Lv {level}</Text>
      </View>
      <Text style={styles.branchNodeType}>{(ability.kind ?? "skill") === "skill" ? "SKILL" : "PASSIVE"}</Text>
    </View>
    <Text style={styles.branchNodeSummary}>{getAbilityBattleSummary(ability)}</Text>
    <Text style={styles.branchNodeDetail}>{getAbilityBattleDetail(ability)}</Text>
    <View style={styles.branchNodeFooter}>
      <Text style={styles.branchNodeNote}>{note}</Text>
    </View>
  </Pressable>
);

export const ClassScreen = ({
  character,
  classes,
  onChooseWarriorPath,
  onSetActiveClassSkill,
  onTogglePassiveAbility,
}: ClassScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  const [selectedPathNodeId, setSelectedPathNodeId] = useState<AbilityId | null>(null);

  const combat = getCharacterCombatStats(character);
  const passiveBattleBonuses = getEquippedPassiveBattleBonuses(character);
  const activeClass = classes.find((classDef) => classDef.id === character.classId) ?? null;
  const activeBuffIds = (character.equippedBuffIds ?? []).filter((buffId) => isBuffActive(character, buffId, nowMs));
  const equippedTitles = (character.equippedTitleIds ?? []).map((titleId) => TITLE_BY_ID[titleId]).filter(Boolean);
  const unlockedSkills = getUnlockedActiveSkills(character);
  const unlockedPassives = getUnlockedPassiveAbilities(character);
  const equippedPassiveIds = new Set(character.equippedPassiveAbilityIds ?? []);
  const classAbility = getClassAbility(character);
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
    () => warriorNodes.find((entry) => entry.id === selectedPathNodeId) ?? warriorNodes.find((entry) => entry.group !== "shared") ?? null,
    [selectedPathNodeId, warriorNodes],
  );
  const selectedPathPreview = selectedPathNode?.group && selectedPathNode.group !== "shared" ? selectedPathNode.group : null;

  const sharedNodes = warriorNodes.filter((entry) => entry.group === "shared");
  const knightNodes = warriorNodes.filter((entry) => entry.group === "knight");
  const berserkerNodes = warriorNodes.filter((entry) => entry.group === "berserker");

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!uiNotice) {
      return;
    }
    const timeout = setTimeout(() => setUiNotice(null), 2200);
    return () => clearTimeout(timeout);
  }, [uiNotice]);

  const handleSetSkill = (abilityId: AbilityId) => {
    const result = onSetActiveClassSkill(abilityId);
    if (result.reason || !result.ok) {
      setUiNotice(result.reason ?? "Skill updated.");
    }
  };

  const handleTogglePassive = (abilityId: AbilityId) => {
    const result = onTogglePassiveAbility(abilityId);
    if (result.reason || !result.ok) {
      setUiNotice(result.reason ?? "Passive updated.");
    }
  };

  const handleChoosePath = () => {
    if (!selectedPathPreview) {
      setUiNotice("Select a branch node first.");
      return;
    }
    const result = onChooseWarriorPath(selectedPathPreview);
    setUiNotice(result.reason ?? `${capitalize(selectedPathPreview)} path locked.`);
  };

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
              <Text style={styles.heroBody}>
                Build your live battle loadout here: choose one active skill, equip up to two passives, and review what each kit does in turn-based combat.
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <MetricChip icon="heart-pulse" value={`HP ${character.healthCap}`} />
            <MetricChip icon="sword" value={`ATK ${combat.damage}`} />
            <MetricChip icon="star-four-points" value={`CRIT ${combat.critChance}%`} />
            <MetricChip icon="run-fast" value={`SPD ${combat.speed}`} />
          </View>
          <View style={styles.metricRow}>
            <MetricChip icon="timer-sand" value={abilityCooldown > 0 ? `${classAbility.name} CD ${abilityCooldown}s` : `${classAbility.name} Ready`} />
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
          <SectionHeader title="Battle Loadout" hint="Choose what you actually bring into combat" />
          <View style={styles.loadoutFocusCard}>
            <Text style={styles.loadoutFocusLabel}>Current Battle Skill</Text>
            <Text style={styles.loadoutFocusName}>{classAbility.name}</Text>
            <Text style={styles.loadoutFocusText}>{getAbilityBattleDetail(classAbility)}</Text>
          </View>
          <Text style={styles.groupTitle}>Active Skills</Text>
          <View style={styles.loadoutList}>
            {unlockedSkills.map((skill) => (
              <LoadoutCard
                key={skill.id}
                ability={skill}
                mode="skill"
                selected={character.activeClassSkillId === skill.id}
                onPress={() => handleSetSkill(skill.id)}
              />
            ))}
          </View>
          <Text style={styles.groupTitle}>Passive Abilities</Text>
          <View style={styles.loadoutList}>
            {unlockedPassives.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#c5b8cf" />
                <Text style={styles.emptyText}>No passives unlocked yet.</Text>
              </View>
            ) : (
              unlockedPassives.map((passive) => (
                <LoadoutCard
                  key={passive.id}
                  ability={passive}
                  mode="passive"
                  equipped={equippedPassiveIds.has(passive.id)}
                  onPress={() => handleTogglePassive(passive.id)}
                />
              ))
            )}
          </View>
        </View>

        {character.classId === "warrior" ? (
          <View style={styles.panel}>
            <SectionHeader title="Warrior Specialization Map" hint="Shared skills now • specialization later" />

            <View style={styles.treeSectionBlock}>
              <Text style={styles.treeSectionTitle}>Shared Warrior Skills</Text>
              <Text style={styles.treeSectionBody}>
                These are available to every Warrior. If a shared node is not greyed out, you can use or equip it immediately.
              </Text>
              <View style={styles.treeCardRow}>
                {sharedNodes.map((node) => {
                  const unlocked = character.progression.level >= node.level;
                  return (
                    <BranchNodeCard
                      key={node.id}
                      ability={node.ability}
                      level={node.level}
                      path="shared"
                      locked={!unlocked}
                      unavailable={false}
                      selected={selectedPathNode?.id === node.id}
                      note={unlocked ? ((node.ability.kind ?? "skill") === "skill" ? "Usable now" : "Equippable now") : `Unlocks at Level ${node.level}`}
                      onPress={() => setSelectedPathNodeId(node.id)}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.treeSectionBlock}>
              <Text style={styles.treeSectionTitle}>Specialization Branches</Text>
              <Text style={styles.treeSectionBody}>
                These are future specialization rewards. Both branches stay greyed out until Level 15. After you lock one path, its earlier branch skills unlock immediately if you already meet their level requirements.
              </Text>

              <View style={styles.branchColumns}>
                <View style={styles.branchColumn}>
                  <Text style={[styles.branchHeader, { color: PATH_COLORS.knight }]}>Knight Specialization</Text>
                  {knightNodes.map((node) => {
                    const chosenOtherPath = Boolean(character.warriorPathChoice && character.warriorPathChoice !== "knight");
                    const branchLocked = !character.warriorPathChoice;
                    const unlockedByChoice = character.warriorPathChoice === "knight" && character.progression.level >= node.level;
                    return (
                      <BranchNodeCard
                        key={node.id}
                        ability={node.ability}
                        level={node.level}
                        path="knight"
                        locked={!unlockedByChoice}
                        unavailable={chosenOtherPath || branchLocked}
                        selected={selectedPathNode?.id === node.id}
                        note={
                          character.warriorPathChoice === "knight"
                            ? character.progression.level >= node.level
                              ? ((node.ability.kind ?? "skill") === "skill" ? "Knight skill unlocked" : "Knight passive unlocked")
                              : `Unlocks at Level ${node.level}`
                            : chosenOtherPath
                              ? "Unavailable after choosing Berserker"
                              : "Specialization locked until Level 15"
                        }
                        onPress={() => setSelectedPathNodeId(node.id)}
                      />
                    );
                  })}
                </View>

                <View style={styles.branchColumn}>
                  <Text style={[styles.branchHeader, { color: PATH_COLORS.berserker }]}>Berserker Specialization</Text>
                  {berserkerNodes.map((node) => {
                    const chosenOtherPath = Boolean(character.warriorPathChoice && character.warriorPathChoice !== "berserker");
                    const branchLocked = !character.warriorPathChoice;
                    const unlockedByChoice = character.warriorPathChoice === "berserker" && character.progression.level >= node.level;
                    return (
                      <BranchNodeCard
                        key={node.id}
                        ability={node.ability}
                        level={node.level}
                        path="berserker"
                        locked={!unlockedByChoice}
                        unavailable={chosenOtherPath || branchLocked}
                        selected={selectedPathNode?.id === node.id}
                        note={
                          character.warriorPathChoice === "berserker"
                            ? character.progression.level >= node.level
                              ? ((node.ability.kind ?? "skill") === "skill" ? "Berserker skill unlocked" : "Berserker passive unlocked")
                              : `Unlocks at Level ${node.level}`
                            : chosenOtherPath
                              ? "Unavailable after choosing Knight"
                              : "Specialization locked until Level 15"
                        }
                        onPress={() => setSelectedPathNodeId(node.id)}
                      />
                    );
                  })}
                </View>
              </View>

              {!character.warriorPathChoice && pathOptions.length > 1 ? (
                <View style={styles.pathChoicePanel}>
                  <Text style={styles.pathChoiceTitle}>
                    {selectedPathPreview ? `Ready to lock ${capitalize(selectedPathPreview)}?` : "Choose A Specialization Preview"}
                  </Text>
                  <Text style={styles.pathChoiceSubtext}>
                    Previewing a node only shows details. Your specialization is not chosen until you press the lock button.
                  </Text>
                  <Pressable
                    onPress={handleChoosePath}
                    style={[
                      styles.lockPathButton,
                      selectedPathPreview === "berserker" ? styles.lockPathButtonBerserker : styles.lockPathButtonKnight,
                      !selectedPathPreview ? styles.lockPathButtonDisabled : null,
                    ]}
                    disabled={!selectedPathPreview}
                  >
                    <Text style={styles.lockPathButtonText}>
                      {selectedPathPreview ? `Lock ${capitalize(selectedPathPreview)} Path` : "Select Knight or Berserker Preview First"}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pathChoicePanel}>
                  <Text style={styles.pathChoiceTitle}>{character.warriorPathChoice ? `${capitalize(character.warriorPathChoice)} Path Locked` : "Specialization Locked"}</Text>
                  <Text style={styles.pathChoiceSubtext}>
                    {character.warriorPathChoice
                      ? `Your Warrior has committed to the ${capitalize(character.warriorPathChoice)} path.`
                      : `Reach Level 15 to choose either Knight or Berserker. Current Level ${character.progression.level}.`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.panel}>
          <SectionHeader title="Combat Readout" hint="What your current build is adding in battle" />
          <View style={styles.metricRow}>
            <MetricChip icon="sword-cross" value={`Passive ATK +${combat.passiveAbilityBonuses.damageFlat}`} />
            <MetricChip icon="target" value={`Passive CRIT +${combat.passiveAbilityBonuses.critFlat}%`} />
            <MetricChip icon="run-fast" value={`Passive SPD +${combat.passiveAbilityBonuses.speedFlat}`} />
          </View>
          <View style={styles.metricRow}>
            <MetricChip icon="shield-check-outline" value={`Guard +${passiveBattleBonuses.guardBonusFlat}`} />
            <MetricChip icon="flash-outline" value={`Counter +${passiveBattleBonuses.counterBonusDamageFlat}`} />
            <MetricChip icon="heart-half-full" value={`Vs Wounded +${passiveBattleBonuses.woundedTargetDamageFlat}`} />
          </View>
          <View style={styles.metricRow}>
            <MetricChip icon="flash" value={`Combo ATK +${combat.comboBonuses.damageFlat}`} />
            <MetricChip icon="sword" value={`Combo CRIT +${combat.comboBonuses.critFlat}%`} />
            <MetricChip icon="rocket-launch" value={`Combo SPD +${combat.comboBonuses.speedFlat}`} />
          </View>
          <View style={styles.chipRack}>
            <View style={styles.tagChip}>
              <AbilityIconGlyph
                abilityId={classAbility.id}
                iconName={classAbility.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={13}
                color="#ffd786"
              />
              <Text style={styles.tagText}>{classAbility.name}</Text>
            </View>
            {equippedTitles.map((title) => (
              <View key={`title-${title.id}`} style={styles.tagChip}>
                <MaterialCommunityIcons name={(title.icon || "medal-outline") as keyof typeof MaterialCommunityIcons.glyphMap} size={13} color="#ffd786" />
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
    maxWidth: 1180,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    color: "#fff0ce",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9a7846",
    overflow: "hidden",
    backgroundColor: "rgba(34,26,46,0.95)",
    padding: 12,
    gap: 10,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroPortraitFrame: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPortrait: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },
  heroMeta: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    color: "#ffefca",
    fontSize: 19,
    fontWeight: "900",
  },
  heroSub: {
    color: "#d8cbb0",
    fontSize: 11,
    fontWeight: "700",
  },
  heroBody: {
    color: "#efe2c1",
    fontSize: 11,
    lineHeight: 16,
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
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  noticeText: {
    color: "#ecffd2",
    fontSize: 11,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8a6c3f",
    backgroundColor: "rgba(36, 28, 49, 0.96)",
    padding: 12,
    gap: 10,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
    textAlign: "right",
    flexShrink: 1,
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
  loadoutFocusCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b7041",
    backgroundColor: "rgba(57, 42, 23, 0.95)",
    padding: 10,
    gap: 3,
  },
  loadoutFocusLabel: {
    color: "#d6c39c",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  loadoutFocusName: {
    color: "#fff1cf",
    fontSize: 14,
    fontWeight: "900",
  },
  loadoutFocusText: {
    color: "#e7dac0",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  groupTitle: {
    color: "#fff1c7",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  loadoutList: {
    gap: 8,
  },
  loadoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  loadoutCardSelected: {
    shadowColor: "#f2c16d",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  loadoutCardEquipped: {
    borderColor: "#90f1b5",
  },
  loadoutCardLocked: {
    opacity: 0.55,
  },
  loadoutIconFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29, 22, 39, 0.92)",
  },
  loadoutCardBody: {
    flex: 1,
    gap: 3,
  },
  loadoutCardTopRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  loadoutCardTitle: {
    color: "#fff0cf",
    fontSize: 13,
    fontWeight: "900",
  },
  loadoutRoleLabel: {
    color: "#dec89c",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  loadoutCardSummary: {
    color: "#ffe2b1",
    fontSize: 10,
    fontWeight: "800",
  },
  loadoutCardDetail: {
    color: "#dcd4ea",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  loadoutStateCol: {
    gap: 4,
    alignItems: "flex-end",
  },
  loadoutStateActive: {
    color: "#c9ffd9",
    fontSize: 10,
    fontWeight: "900",
  },
  loadoutStateEquipped: {
    color: "#baf4cb",
    fontSize: 10,
    fontWeight: "900",
  },
  loadoutStateLocked: {
    color: "#c6b8d0",
    fontSize: 10,
    fontWeight: "900",
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
  treeSectionBlock: {
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#7d6540",
    backgroundColor: "rgba(52, 40, 23, 0.75)",
    padding: 10,
  },
  treeSectionTitle: {
    color: "#fff0c6",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  treeSectionBody: {
    color: "#e3d4b8",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  treeCardRow: {
    gap: 8,
  },
  branchColumns: {
    flexDirection: "row",
    gap: 10,
  },
  branchColumn: {
    flex: 1,
    gap: 8,
  },
  branchHeader: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  branchNodeCard: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(34, 27, 43, 0.92)",
    padding: 10,
    gap: 6,
  },
  branchNodeLocked: {
    backgroundColor: "rgba(45, 37, 53, 0.92)",
  },
  branchNodeUnavailable: {
    opacity: 0.46,
  },
  branchNodeSelected: {
    shadowColor: "#ffd07f",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  branchNodeTopRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  branchNodeIconFrame: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(27, 22, 34, 0.95)",
  },
  branchNodeTextCol: {
    flex: 1,
    gap: 1,
  },
  branchNodeTitle: {
    color: "#fff0cf",
    fontSize: 13,
    fontWeight: "900",
  },
  branchNodeLevel: {
    color: "#dccca8",
    fontSize: 10,
    fontWeight: "800",
  },
  branchNodeType: {
    color: "#f3dfb8",
    fontSize: 9,
    fontWeight: "900",
  },
  branchNodeSummary: {
    color: "#ffe2b1",
    fontSize: 10,
    fontWeight: "800",
  },
  branchNodeDetail: {
    color: "#d7cce6",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  branchNodeFooter: {
    paddingTop: 2,
  },
  branchNodeNote: {
    color: "#e8d7b0",
    fontSize: 10,
    fontWeight: "800",
  },
  pathChoicePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b7041",
    backgroundColor: "rgba(55, 41, 24, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  pathChoiceTitle: {
    color: "#fff0cb",
    fontSize: 12,
    fontWeight: "900",
  },
  pathChoiceSubtext: {
    color: "#dccdae",
    fontSize: 11,
    lineHeight: 16,
  },
  lockPathButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  lockPathButtonKnight: {
    borderColor: "#7ff1bb",
    backgroundColor: "rgba(25, 88, 58, 0.92)",
  },
  lockPathButtonBerserker: {
    borderColor: "#ff9a9b",
    backgroundColor: "rgba(117, 35, 41, 0.92)",
  },
  lockPathButtonDisabled: {
    borderColor: "#746553",
    backgroundColor: "rgba(61, 50, 37, 0.92)",
  },
  lockPathButtonText: {
    color: "#fff1cd",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  chipRack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#856a3d",
    backgroundColor: "rgba(57, 42, 23, 0.95)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tagText: {
    color: "#f1dfbb",
    fontSize: 11,
    fontWeight: "800",
  },
});
