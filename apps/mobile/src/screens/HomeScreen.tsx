import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { HealthMeter } from "../components/HealthMeter";
import { IconTooltip } from "../components/IconTooltip";
import { ProgressBar } from "../components/ProgressBar";
import { StatGlyphBars } from "../components/StatGlyphBars";
import { StaminaMeter } from "../components/StaminaMeter";
import { ABILITY_BY_ID } from "../data/abilities";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { TITLE_BY_ID } from "../data/titles";
import { TITLE_ICON_ART } from "../data/titleVisuals";
import { CURRENCY_SPRITES, QUEST_TYPE_SPRITE, getAvatarSprite } from "../data/uiSprites";
import { getBuffAccent } from "../lib/itemVisuals";
import {
  getPendingAbilityBonuses,
  getPendingMatchedSkillCombos,
  SkillPairCombo,
  getAbilityCooldownRemainingSeconds,
  getClassAbility,
  getSkillResourceLabel,
  getUnlockedActiveSkills,
  getUnlockedPassiveAbilities,
  isAbilityReady,
} from "../lib/abilities";
import { getBuffRemainingSeconds, getBuffSlotLimit, getEquippedBuffItems, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats, getScaledCoreAttributes } from "../lib/combat";
import { getTitleSlotLimit } from "../lib/titles";
import { BaseClassDefinition, CharacterState, DailyTask, HelpfulNpcAlly } from "../types/game";
import { colors } from "../theme/colors";

interface HomeScreenProps {
  character: CharacterState;
  classes: BaseClassDefinition[];
  dailies: DailyTask[];
  completedQuestCount: number;
  guildMasterName: string;
  helpfulAllies: HelpfulNpcAlly[];
  onUnequipWeapon: () => { ok: boolean; reason?: string };
  onUnequipBuff: (itemId: string) => { ok: boolean; reason?: string };
  onActivateClassAbility: (abilityId?: string) => { ok: boolean; reason?: string };
  onDeactivateClassAbility: (abilityId?: string) => { ok: boolean; reason?: string };
  onSetActiveClassSkill: (abilityId: string) => { ok: boolean; reason?: string };
  onTogglePassiveAbility: (abilityId: string) => { ok: boolean; reason?: string };
}

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const titleRarityThemeMap = {
  common: { border: "#9f8f74", bg: "rgba(84, 70, 48, 0.36)", text: "#dbc9a8" },
  rare: { border: "#ff78c9", bg: "rgba(117, 40, 88, 0.42)", text: "#ffd1eb" },
  epic: { border: "#9a6de0", bg: "rgba(94, 64, 145, 0.37)", text: "#d7b2ff" },
  legendary: { border: "#cb8e44", bg: "rgba(126, 76, 28, 0.42)", text: "#ffd08c" },
} as const;

const SKILL_THEME_BY_ID: Record<
  string,
  {
    border: string;
    bg: string;
    activeBorder: string;
    activeBg: string;
    icon: string;
    label: string;
    iconBorder: string;
    iconBg: string;
    iconActiveBorder: string;
    iconActiveBg: string;
    state: string;
  }
> = {
  "ability-warrior-iron-will": {
    border: "#e3b36d",
    bg: "rgba(104, 67, 28, 0.93)",
    activeBorder: "#ffd07d",
    activeBg: "rgba(129, 84, 31, 0.95)",
    icon: "#ffd78b",
    label: "#ffd6a2",
    iconBorder: "#d8a15e",
    iconBg: "rgba(106, 67, 28, 0.9)",
    iconActiveBorder: "#ffd07d",
    iconActiveBg: "rgba(137, 88, 33, 0.96)",
    state: "#ffdca5",
  },
  "ability-warrior-bulwark-oath": {
    border: "#79d4ff",
    bg: "rgba(26, 61, 98, 0.93)",
    activeBorder: "#a7e7ff",
    activeBg: "rgba(27, 84, 133, 0.95)",
    icon: "#9fe4ff",
    label: "#aedfff",
    iconBorder: "#63bce8",
    iconBg: "rgba(30, 74, 116, 0.9)",
    iconActiveBorder: "#9fe4ff",
    iconActiveBg: "rgba(33, 98, 151, 0.96)",
    state: "#a9e8ff",
  },
  "ability-warrior-bloodrush": {
    border: "#ff8f93",
    bg: "rgba(102, 32, 44, 0.92)",
    activeBorder: "#ffb2b5",
    activeBg: "rgba(130, 38, 53, 0.95)",
    icon: "#ffb5b8",
    label: "#ffc4c7",
    iconBorder: "#ef8088",
    iconBg: "rgba(111, 34, 48, 0.9)",
    iconActiveBorder: "#ffb4b8",
    iconActiveBg: "rgba(143, 42, 60, 0.96)",
    state: "#ffc0c4",
  },
  "ability-warrior-steel-rhythm": {
    border: "#b9a4ff",
    bg: "rgba(60, 42, 108, 0.92)",
    activeBorder: "#d0c2ff",
    activeBg: "rgba(81, 56, 139, 0.95)",
    icon: "#d6c9ff",
    label: "#dcccff",
    iconBorder: "#a78de7",
    iconBg: "rgba(74, 53, 126, 0.9)",
    iconActiveBorder: "#d0c2ff",
    iconActiveBg: "rgba(92, 64, 156, 0.96)",
    state: "#dccfff",
  },
};

const getAffinityTitle = (affinity: number): string => {
  if (affinity >= 35) return "Aetherbound Grace";
  if (affinity <= -35) return "Abyssworn Oath";
  return "Veilwalker Balance";
};

const getAffinityTheme = (affinity: number): { accent: string; glow: string; label: string } => {
  if (affinity >= 15) {
    return { accent: "#79d9ff", glow: "rgba(121, 217, 255, 0.34)", label: "#a6ebff" };
  }
  if (affinity <= -15) {
    return { accent: "#ff8f98", glow: "rgba(255, 143, 152, 0.34)", label: "#ffb4bb" };
  }
  return { accent: "#e8c77a", glow: "rgba(232, 199, 122, 0.28)", label: "#f2dca8" };
};

export const HomeScreen = ({
  character,
  classes,
  dailies,
  completedQuestCount,
  guildMasterName,
  helpfulAllies,
  onUnequipWeapon,
  onUnequipBuff,
  onActivateClassAbility,
  onDeactivateClassAbility,
  onSetActiveClassSkill,
  onTogglePassiveAbility,
}: HomeScreenProps) => {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [showStaminaStatusBox, setShowStaminaStatusBox] = useState(true);
  const [skillPanelOpen, setSkillPanelOpen] = useState(false);
  const [abilityPanelState, setAbilityPanelState] = useState<{ abilityId: string; kind: "skill" | "passive" } | null>(
    null,
  );
  const [comboInfoPanel, setComboInfoPanel] = useState<SkillPairCombo | null>(null);
  const [levelDetailsOpen, setLevelDetailsOpen] = useState(false);
  const [weaponDetailsOpen, setWeaponDetailsOpen] = useState(false);
  const activeClass = classes.find((classDef) => classDef.id === character.classId) ?? null;
  const stats = getScaledCoreAttributes(character);
  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const combat = getCharacterCombatStats(character);
  const pendingAbilityBonuses = getPendingAbilityBonuses(character);
  const pageNowMs = Date.now();
  const classAbility = getClassAbility(character);
  const pendingAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  const pendingComboCards = getPendingMatchedSkillCombos(character);
  const unlockedSkills = getUnlockedActiveSkills(character);
  const unlockedPassives = getUnlockedPassiveAbilities(character);
  const equippedPassiveIds = new Set(character.equippedPassiveAbilityIds ?? []);
  const skillResourceLabel = getSkillResourceLabel(character.classId);
  const skillActive = pendingAbilityIds.includes(classAbility.id);
  const weaponBonusAttack = combat.effectiveWeaponAttack;
  const weaponBonusCrit = combat.effectiveWeaponCrit;
  const weaponBonusSpeed = combat.effectiveWeaponSpeed;
  const questSuccessTotal =
    pendingAbilityBonuses.questSuccessFlat +
    combat.passiveAbilityBonuses.questSuccessFlat +
    combat.comboBonuses.questSuccessFlat +
    combat.buffBonuses.questSuccessFlat +
    combat.titleBonuses.questSuccessFlat;
  const towerSuccessTotal =
    pendingAbilityBonuses.towerSuccessFlat +
    combat.passiveAbilityBonuses.towerSuccessFlat +
    combat.comboBonuses.towerSuccessFlat;
  const powerScore = combat.damage + combat.speed + combat.critChance;
  const nowMs = Date.now();
  const regenRemainingSeconds =
    character.stamina >= character.staminaCap
      ? 0
      : Math.ceil(
          Math.max(0, STAMINA_REGEN_INTERVAL_MS - (nowMs - character.staminaLastTickAtMs)) / 1000,
        );
  const regenMinutes = Math.floor(regenRemainingSeconds / 60);
  const regenSeconds = regenRemainingSeconds % 60;
  const buffSlotLimit = getBuffSlotLimit(character.adventurerRank);
  const equippedBuffs = getEquippedBuffItems(character);
  const activeBuffs = equippedBuffs.filter((buff) => isBuffActive(character, buff.id, pageNowMs));
  const titleSlotLimit = getTitleSlotLimit(character.progression.level);
  const equippedTitles = (character.equippedTitleIds ?? []).map((titleId) => TITLE_BY_ID[titleId]).filter(Boolean);
  const panelAbility = abilityPanelState ? ABILITY_BY_ID[abilityPanelState.abilityId] : classAbility;
  const panelKind = abilityPanelState?.kind ?? "skill";
  const panelIsCurrentSkill = panelKind === "skill" && panelAbility.id === classAbility.id;
  const panelSkillPrimed = panelKind === "skill" && pendingAbilityIds.includes(panelAbility.id);
  const panelPassiveEquipped = panelKind === "passive" && equippedPassiveIds.has(panelAbility.id);
  const panelSkillCooldownSec = getAbilityCooldownRemainingSeconds(character, panelAbility.id, pageNowMs);
  const panelSkillReady =
    panelKind === "skill" && isAbilityReady(character, panelAbility.id, pageNowMs) && !pendingAbilityIds.includes(panelAbility.id);
  const licenseId = `${character.classId.toUpperCase()}-${character.classSequence
    .toString()
    .padStart(2, "0")}-${character.name.toUpperCase().slice(0, 3).padEnd(3, "X")}`;
  const affinityScore = Math.max(-100, Math.min(100, character.affinity ?? 0));
  const affinityTitle = getAffinityTitle(affinityScore);
  const affinityTheme = getAffinityTheme(affinityScore);
  const affinityMarkerLeft = `${((affinityScore + 100) / 200) * 100}%` as `${number}%`;
  const levelXpPercent = Math.round(
    (character.progression.xpInLevel / Math.max(1, character.progression.xpToNextLevel)) * 100,
  );
  const masteryXpPercent = Math.round(
    (character.progression.masteryXpInLevel / Math.max(1, character.progression.masteryXpToNextLevel)) * 100,
  );

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleUnequip = () => {
    const result = onUnequipWeapon();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Weapon unequipped." : result.reason ?? "Could not unequip weapon.");
  };

  const handleUnequipBuff = (itemId: string) => {
    const result = onUnequipBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(
      result.ok
        ? `Sigil removed: ${ITEM_BY_ID[itemId]?.name ?? itemId}`
        : result.reason ?? "Could not unequip sigil.",
    );
  };

  const handleActivateAbility = (abilityId?: string) => {
    const result = onActivateClassAbility(abilityId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Ability primed." : "Could not activate ability."));
  };
  const handleSetActiveSkill = (abilityId: string) => {
    const result = onSetActiveClassSkill(abilityId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Active skill changed." : "Could not change active skill."));
  };
  const handleTogglePassive = (abilityId: string) => {
    const result = onTogglePassiveAbility(abilityId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Passive loadout updated." : "Could not update passive."));
  };
  const handleDeactivateAbility = (abilityId?: string) => {
    const result = onDeactivateClassAbility(abilityId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Skill deactivated." : "Could not deactivate skill."));
  };
  const openSkillPanel = (abilityId?: string) => {
    if (abilityId && abilityId !== classAbility.id) {
      setAbilityPanelState({ abilityId, kind: "skill" });
      return;
    }
    setAbilityPanelState(null);
    setSkillPanelOpen(true);
  };
  const openPassivePanel = (abilityId: string) => {
    setSkillPanelOpen(false);
    setAbilityPanelState({ abilityId, kind: "passive" });
  };
  const closeAbilityPanels = () => {
    setSkillPanelOpen(false);
    setAbilityPanelState(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="camp" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.kicker}>Ranger's Camp</Text>
        {notice ? (
          <View style={[styles.noticeBanner, noticeTone === "ok" ? styles.noticeBannerOk : styles.noticeBannerErr]}>
            <MaterialCommunityIcons
              name={noticeTone === "ok" ? "check-circle-outline" : "alert-circle-outline"}
              size={15}
              color={noticeTone === "ok" ? "#93efb7" : "#ffc5c5"}
            />
            <Text style={styles.noticeBannerText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(120, 84, 36, 0.16)", "rgba(84, 53, 130, 0.08)", "rgba(20, 14, 38, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.licenseCard}>
            <View pointerEvents="none" style={styles.licenseSecurityLayer}>
              <ImageBackground source={HUD_ASSETS.badges.stamp} style={styles.licenseWatermark} resizeMode="contain">
                <MaterialCommunityIcons name="shield-crown-outline" size={30} color="rgba(242, 212, 150, 0.23)" />
              </ImageBackground>
              <View style={styles.licensePatternArcOne} />
              <View style={styles.licensePatternArcTwo} />
              <View style={styles.licensePatternGrid} />
            </View>
            <View style={styles.licenseTopBar}>
              <View>
                <Text style={styles.licenseTopKicker}>Adventurers Guild</Text>
                <Text style={styles.licenseTopTitle}>Adventurer License</Text>
              </View>
              <ImageBackground source={HUD_ASSETS.badges.rank} style={styles.rankSeal} resizeMode="contain">
                <Text style={styles.rankSealLabel}>Rank</Text>
                <Text style={styles.rankSealValue}>{character.adventurerRank}</Text>
              </ImageBackground>
            </View>

            <View style={styles.licenseBody}>
              <View style={styles.avatar}>
                <Image
                  source={getAvatarSprite(character.avatarId, character.classId)}
                  style={styles.avatarPortrait}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroName}>{character.name}</Text>
                <Text style={styles.heroClass}>Class: {activeClass?.name ?? "Unknown Class"}</Text>
                <Text style={styles.heroJobs}>
                  {activeClass?.advancedJobOptions.join(" / ") ?? "Unknown"} Path
                </Text>
                <Text style={styles.licenseIdText}>ID {licenseId}</Text>
              </View>
              <View style={styles.licenseRightBadges}>
                <Pressable onPress={() => setLevelDetailsOpen(true)} style={styles.licenseLevelBadge}>
                  <Text style={styles.licenseLevelBadgeLabel}>Level</Text>
                  <Text style={styles.licenseLevelBadgeValue}>{character.progression.level}</Text>
                  <View style={styles.levelMiniTrack}>
                    <View style={[styles.levelMiniFill, { width: `${Math.max(3, Math.min(100, levelXpPercent))}%` }]} />
                  </View>
                </Pressable>
                <View style={styles.licenseFloorBadge}>
                <View style={styles.licenseFloorBadgeHead}>
                  <MaterialCommunityIcons name="stairs" size={11} color="#ffe1a1" />
                    <Text style={styles.licenseFloorBadgeLabel}>Floor</Text>
                  </View>
                  <Text style={styles.licenseFloorBadgeValue}>{character.towerProgress?.highestFloorCleared ?? 0}</Text>
                </View>
              </View>
            </View>
            <View style={styles.licenseLoadoutGrid}>
              <View style={styles.licenseLoadoutPanelFull}>
                <View style={styles.licenseSectionHead}>
                  <Text style={styles.licenseSectionTitle}>Weapon</Text>
                  <View style={styles.licenseWeaponMetaRow}>
                    {equippedWeapon ? (
                      <View style={styles.licenseWeaponGradePill}>
                        <Text style={styles.licenseWeaponGradeText}>{equippedWeapon.rarity.toUpperCase()}</Text>
                      </View>
                    ) : null}
                    {equippedWeapon ? (
                      <Text style={styles.licenseSectionMeta}>Lv {equippedWeapon.requiredLevel ?? 1}+</Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  disabled={!equippedWeapon}
                  onPress={() => setWeaponDetailsOpen(true)}
                  style={[styles.mainWeaponCard, styles.licenseWeaponCard]}
                >
                  <View style={styles.mainWeaponIconWrap}>
                    {equippedWeapon ? <GameItemIcon itemId={equippedWeapon.id} size={42} /> : <View style={styles.emptyWeaponSlotLarge} />}
                  </View>
                  <View style={styles.mainWeaponText}>
                    <Text
                      style={styles.mainWeaponName}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                    >
                      {equippedWeapon ? equippedWeapon.name : "No Weapon Equipped"}
                    </Text>
                    <Text style={styles.mainWeaponMeta}>
                      {equippedWeapon
                        ? `${combat.weaponProficiencyPercent}% proficiency`
                        : "Visit Guild Store to buy one"}
                    </Text>
                    {equippedWeapon ? (
                      <View style={styles.weaponBonusRow}>
                        <View style={styles.weaponBonusChip}>
                          <GameItemIcon itemId="weapon-warrior-training-blade" size={12} />
                          <Text style={styles.weaponBonusText}>+{weaponBonusAttack} ATK</Text>
                        </View>
                        <View style={styles.weaponBonusChip}>
                          <GameItemIcon itemId="buff-arcane-sigil" size={12} />
                          <Text style={styles.weaponBonusText}>+{weaponBonusCrit}% CRIT</Text>
                        </View>
                        <View style={styles.weaponBonusChip}>
                          <GameItemIcon itemId="buff-gale-feather" size={12} />
                          <Text style={styles.weaponBonusText}>+{weaponBonusSpeed} SPD</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                  {equippedWeapon ? (
                    <Pressable onPress={handleUnequip} style={styles.unequipWrap}>
                      <View style={styles.unequipButton}>
                        <MaterialCommunityIcons name="sword-cross" size={14} color="#fff1cf" />
                        <MaterialCommunityIcons
                          name="close"
                          size={11}
                          color="#fff1cf"
                          style={styles.unequipOverlayIcon}
                        />
                      </View>
                    </Pressable>
                  ) : null}
                </Pressable>
              </View>
            </View>

            <View style={styles.buffSlotHeader}>
              <Text style={styles.buffSlotTitle}>Sigil Slots</Text>
              <Text style={styles.buffSlotMeta}>
                {equippedBuffs.length}/{buffSlotLimit} equipped
              </Text>
            </View>
            <View style={styles.licenseSigilRow}>
              {Array.from({ length: buffSlotLimit }).map((_, index) => {
                const buff = equippedBuffs[index];
                const active = buff ? isBuffActive(character, buff.id, pageNowMs) : false;
                const buffAccent = buff ? getBuffAccent(buff.id) : null;
                const remaining = buff ? getBuffRemainingSeconds(character, buff.id, pageNowMs) : 0;
                return (
                  <Pressable
                    key={`buff-slot-${index}`}
                    style={[
                      styles.licenseSigilSlot,
                      buffAccent ? { backgroundColor: buffAccent.softBg } : null,
                      active ? styles.licenseSigilSlotActive : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.licenseSigilIconShell,
                        buffAccent ? { borderColor: buffAccent.border } : null,
                        active ? styles.licenseSigilIconShellActive : null,
                      ]}
                    >
                      {buff ? (
                        <GameItemIcon itemId={buff.id} size={26} />
                      ) : (
                        <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#a58961" />
                      )}
                    </View>
                    {buff ? (
                      <>
                        <View
                          style={[
                            styles.licenseSigilGradeBadge,
                            buffAccent ? { borderColor: buffAccent.border, backgroundColor: buffAccent.softBg } : null,
                          ]}
                        >
                          <Text style={[styles.licenseSigilGradeText, buffAccent ? { color: buffAccent.border } : null]}>
                            {buff.rarity.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.licenseSigilTimerText}>
                          {active
                            ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                            : remaining > 0
                              ? `P ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                              : ""}
                        </Text>
                        {active ? (
                          <MaterialCommunityIcons name="check-decagram" size={12} color="#86efb0" style={styles.licenseSigilActiveMark} />
                        ) : null}
                        <Pressable onPress={() => handleUnequipBuff(buff.id)} style={styles.licenseSigilRemoveButton}>
                          <MaterialCommunityIcons name="close" size={10} color="#ffe8bf" />
                        </Pressable>
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.buffSlotHeader}>
              <Text style={styles.buffSlotTitle}>Title Slots</Text>
              <Text style={styles.buffSlotMeta}>
                {equippedTitles.length}/{titleSlotLimit} equipped
              </Text>
            </View>
            <View style={styles.buffSlotRow}>
              {Array.from({ length: titleSlotLimit }).map((_, index) => {
                const title = equippedTitles[index];
                const rarityTheme = title ? titleRarityThemeMap[title.rarity] : null;
                return (
                  <View
                    key={`title-slot-${index}`}
                    style={[
                      styles.buffSlotCard,
                      rarityTheme ? { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg } : null,
                      title?.rarity === "legendary" ? styles.titleSlotLegendary : null,
                    ]}
                  >
                    <View style={styles.buffSlotIconWrap}>
                      {title ? (
                        <ImageBackground
                          source={HUD_ASSETS.slots[title.rarity]}
                          style={styles.titleIconFrame}
                          resizeMode="contain"
                        >
                          <Image source={TITLE_ICON_ART[title.id]} style={styles.titleIconImage} resizeMode="contain" />
                        </ImageBackground>
                      ) : (
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={18}
                          color="#a58961"
                        />
                      )}
                    </View>
                    <View style={styles.buffSlotTextBlock}>
                      <Text style={styles.buffSlotText} numberOfLines={1}>
                        {title ? title.name : "Empty Title Slot"}
                      </Text>
                      {title ? (
                        <View
                          style={[
                            styles.buffSlotGradePill,
                            rarityTheme ? { borderColor: rarityTheme.border, backgroundColor: rarityTheme.bg } : null,
                          ]}
                        >
                          <Text style={[styles.buffSlotGradeText, rarityTheme ? { color: rarityTheme.text } : null]}>
                            {title.rarity.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <HealthMeter
              current={character.health}
              max={character.healthCap}
              compact
              bare
              containerStyle={styles.licenseHealthMeter}
            />
            <StaminaMeter
              current={character.stamina}
              max={character.staminaCap}
              icon={CURRENCY_SPRITES.stamina}
              compact
              bare
              containerStyle={styles.licenseHealthMeter}
            />
            <View style={styles.licenseStatsRow}>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.common} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <Image source={CURRENCY_SPRITES.gold} style={styles.licenseAssetIcon} resizeMode="contain" />
                </ImageBackground>
                <View style={styles.licenseStatTextWrap}>
                  <Text style={styles.licenseStatValue}>{character.gold}</Text>
                  <Text style={styles.licenseStatLabel}>Gold</Text>
                </View>
                <IconTooltip text="Main guild currency used in the store." />
              </View>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.rare} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <MaterialCommunityIcons name="target" size={16} color="#9fd2ff" />
                </ImageBackground>
                <View style={styles.licenseStatTextWrap}>
                  <Text style={styles.licenseStatValue}>{character.focus}/{character.focusCap}</Text>
                  <Text style={styles.licenseStatLabel}>Focus</Text>
                </View>
                <IconTooltip text="Shared skill resource pool. Core attribute Resolve increases your Focus cap." />
              </View>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.rare} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#8ac3ff" />
                </ImageBackground>
                <View style={styles.licenseStatTextWrap}>
                  <Text style={styles.licenseStatValue}>{completedQuestCount}</Text>
                  <Text style={styles.licenseStatLabel}>Quests Cleared</Text>
                </View>
                <IconTooltip text="Total number of quests you have successfully completed." />
              </View>
            </View>
            <View style={styles.affinityWrap}>
              <View style={styles.affinityHead}>
                <View style={styles.affinityTitleWrap}>
                  <MaterialCommunityIcons name="scale-balance" size={16} color="#e9c57d" />
                  <Text style={styles.affinityTitle}>Affinity</Text>
                </View>
                <Text style={[styles.affinityState, { color: affinityTheme.label }]}>{affinityTitle}</Text>
              </View>
              <View style={styles.affinityTrackLabels}>
                <Text style={styles.affinityLeft}>Abyssworn (Evil)</Text>
                <Text style={styles.affinityCenter}>Veilwalker (Neutral)</Text>
                <Text style={styles.affinityRight}>Aetherbound (Good)</Text>
              </View>
              <View style={styles.affinityTrack}>
                <View style={styles.affinityTrackNeutralLine} />
                <View
                  style={[
                    styles.affinityMarker,
                    {
                      left: affinityMarkerLeft,
                      borderColor: affinityTheme.accent,
                      backgroundColor: affinityTheme.glow,
                    },
                  ]}
                />
              </View>
              <View style={styles.affinityScoreRow}>
                <Text style={styles.affinityScoreText}>Affinity Score: {affinityScore > 0 ? `+${affinityScore}` : affinityScore}</Text>
                <IconTooltip text="Starts neutral. Quest, NPC, and tower choices will push you toward Aetherbound or Abyssworn paths." />
              </View>
            </View>
            <Text style={styles.abilitySlotHeader}>Skills</Text>
            <View style={styles.abilityMiniGrid}>
              <Pressable
                onPress={() => openSkillPanel()}
                style={[
                  styles.skillMiniBadge,
                  styles.skillMiniBadgeGridItem,
                  styles.licenseSkillMiniBadge,
                  skillActive ? styles.skillMiniBadgeActive : null,
                ]}
              >
                <View style={styles.skillMiniLeft}>
                  <View
                    style={[
                      styles.abilityIconWrap,
                      styles.licenseSkillIconWrap,
                      {
                        borderColor: "transparent",
                        backgroundColor: "transparent",
                      },
                      skillActive ? styles.abilityIconWrapActive : null,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={classAbility.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={22}
                      color={SKILL_THEME_BY_ID[classAbility.id]?.icon ?? "#83e9ff"}
                    />
                  </View>
                  <View>
                    <Text style={styles.skillMiniName}>{classAbility.name}</Text>
                  </View>
                </View>
              </Pressable>
              {unlockedSkills
                .filter((ability) => ability.id !== classAbility.id)
                .map((ability) => {
                  const abilityActive = pendingAbilityIds.includes(ability.id);
                  const abilityCooldownSec = getAbilityCooldownRemainingSeconds(character, ability.id, pageNowMs);
                  return (
                  <Pressable
                    key={`extra-skill-${ability.id}`}
                    onPress={() => openSkillPanel(ability.id)}
                    style={[
                      styles.skillMiniBadge,
                      styles.skillMiniBadgeGridItem,
                      styles.licenseSkillMiniBadge,
                      abilityActive ? styles.skillMiniBadgeActive : null,
                    ]}
                  >
                    <View style={styles.skillMiniLeft}>
                      <View
                        style={[
                          styles.abilityIconWrap,
                          styles.licenseSkillIconWrap,
                          {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                          },
                          abilityActive ? styles.abilityIconWrapActive : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={20}
                          color={SKILL_THEME_BY_ID[ability.id]?.icon ?? "#9edbff"}
                        />
                      </View>
                      <View>
                        <Text style={styles.skillMiniName}>{ability.name}</Text>
                      </View>
                    </View>
                  </Pressable>
                  );
                })}
              {pendingComboCards.map((combo) => (
                <Pressable
                  key={`combo-card-${combo.label}`}
                  onPress={() => setComboInfoPanel(combo)}
                  style={[styles.skillMiniBadge, styles.skillMiniBadgeGridItem, styles.comboMiniBadge]}
                >
                  <View style={styles.skillMiniLeft}>
                    <View style={[styles.abilityIconWrap, styles.comboIconWrap]}>
                      <MaterialCommunityIcons name="source-merge" size={20} color="#d8ffd8" />
                    </View>
                    <View>
                      <Text style={[styles.skillMiniLabel, styles.comboMiniLabel]}>Combo Result</Text>
                      <Text style={styles.skillMiniName}>{combo.label}</Text>
                    </View>
                  </View>
                  <View style={styles.skillMiniRight}>
                    <Text style={styles.skillMiniMetaSmall}>Tap For Details</Text>
                    <Text style={[styles.skillMiniState, styles.comboMiniState]}>ACTIVE</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Text style={styles.abilitySlotHeader}>Passives</Text>
            <View style={styles.abilityMiniGrid}>
            {unlockedPassives.map((ability) => {
              const equipped = equippedPassiveIds.has(ability.id);
              return (
                <Pressable
                  key={`passive-slot-${ability.id}`}
                  onPress={() => openPassivePanel(ability.id)}
                  style={[styles.skillMiniBadge, styles.skillMiniBadgeGridItem, equipped ? styles.passiveMiniBadgeActive : null]}
                >
                  <View style={styles.skillMiniLeft}>
                    <View style={[styles.abilityIconWrap, equipped ? styles.passiveIconWrapActive : null]}>
                      <MaterialCommunityIcons
                        name={ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={equipped ? "#d3ffd0" : "#a8c8f7"}
                      />
                    </View>
                    <View>
                      <Text style={styles.skillMiniLabel}>Passive Ability</Text>
                      <Text style={styles.skillMiniName}>{ability.name}</Text>
                    </View>
                  </View>
                  <View style={styles.skillMiniRight}>
                    <Text style={styles.skillMiniMeta}>{equipped ? "EQUIPPED" : "NOT EQUIPPED"}</Text>
                  </View>
                </Pressable>
              );
            })}
            </View>

            <View style={styles.staminaToggleRow}>
              <Pressable
                onPress={() => setShowStaminaStatusBox((current) => !current)}
                style={styles.staminaToggleButton}
              >
                <Text style={styles.staminaToggleText}>
                  {showStaminaStatusBox ? "Hide Stamina Status" : "Show Stamina Status"}
                </Text>
              </Pressable>
            </View>
            {showStaminaStatusBox ? (
              <View style={styles.staminaRegenRow}>
                <MaterialCommunityIcons name="alert-octagon-outline" size={16} color="#ffe1a7" />
                <Text style={styles.staminaRegenText}>
                  {character.stamina >= character.staminaCap
                    ? "Stamina full (20/20). Regen resumes after spending stamina."
                    : `Stamina +1 in ${regenMinutes}:${regenSeconds.toString().padStart(2, "0")} (every 5m)`}
                </Text>
                <IconTooltip text="Passive stamina recovery: +1 every 5 minutes until you reach the cap." />
              </View>
            ) : null}
            <View style={styles.licenseAuthBar}>
              <Text style={styles.licenseAuthLine}>Authenticated by Guildmaster {guildMasterName}</Text>
              <View style={styles.licenseSignatureWrap}>
                <Text style={styles.licenseSignatureText}>E. Voss</Text>
                <Text style={styles.licenseSignatureHint}>Guildmaster Sign</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(138, 98, 41, 0.11)", "rgba(115, 68, 175, 0.08)", "rgba(30, 21, 46, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.statHead}>
              <Text style={styles.statHeadTitle}>Combat Profile</Text>
              <View style={styles.powerPill}>
                <MaterialCommunityIcons name="star-shooting" size={14} color="#ffd786" />
                <Text style={styles.powerPillText}>Power {powerScore}</Text>
              </View>
            </View>

            <View style={styles.combatStatRow}>
              <View style={styles.combatMetricCard}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="sword-cross" size={16} color={colors.gold} />
                  <Text style={styles.combatMetricLabel}>Damage</Text>
                </View>
                <Text style={styles.combatMetricValue}>{combat.damage}</Text>
                <Text style={styles.combatMetricBonus}>
                  WPN +{weaponBonusAttack} | SKILL +{pendingAbilityBonuses.damageFlat} | PASSIVE +{combat.passiveAbilityBonuses.damageFlat} | COMBO +{combat.comboBonuses.damageFlat} | SIGIL +{combat.buffBonuses.damageFlat} | TITLE +{combat.titleBonuses.damageFlat}
                </Text>
              </View>
              <View style={styles.combatMetricCard}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#ff78c9" />
                  <Text style={styles.combatMetricLabel}>Critical</Text>
                </View>
                <Text style={styles.combatMetricValue}>{combat.critChance}%</Text>
                <Text style={styles.combatMetricBonus}>
                  WPN +{weaponBonusCrit}% | SKILL +{pendingAbilityBonuses.critFlat}% | PASSIVE +{combat.passiveAbilityBonuses.critFlat}% | COMBO +{combat.comboBonuses.critFlat}% | SIGIL +{combat.buffBonuses.critFlat}% | TITLE +{combat.titleBonuses.critFlat}%
                </Text>
              </View>
              <View style={styles.combatMetricCard}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="run-fast" size={16} color="#8de9a8" />
                  <Text style={styles.combatMetricLabel}>Speed</Text>
                </View>
                <Text style={styles.combatMetricValue}>{combat.speed}</Text>
                <Text style={styles.combatMetricBonus}>
                  WPN +{weaponBonusSpeed} | SKILL +{pendingAbilityBonuses.speedFlat} | PASSIVE +{combat.passiveAbilityBonuses.speedFlat} | COMBO +{combat.comboBonuses.speedFlat} | SIGIL +{combat.buffBonuses.speedFlat} | TITLE +{combat.titleBonuses.speedFlat}
                </Text>
              </View>
            </View>
            <View style={styles.combatStatRow}>
              <View style={styles.combatMetricCardWide}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="percent-circle-outline" size={16} color="#9be7ff" />
                  <Text style={styles.combatMetricLabel}>Success Effects</Text>
                </View>
                <Text style={styles.combatMetricValue}>Quest +{questSuccessTotal}% | Tower +{towerSuccessTotal}%</Text>
                <Text style={styles.combatMetricBonus}>
                  Quest: SKILL +{pendingAbilityBonuses.questSuccessFlat}% | PASSIVE +{combat.passiveAbilityBonuses.questSuccessFlat}% | COMBO +{combat.comboBonuses.questSuccessFlat}% | SIGIL +{combat.buffBonuses.questSuccessFlat}% | TITLE +{combat.titleBonuses.questSuccessFlat}%
                </Text>
                <Text style={styles.combatMetricBonus}>
                  Tower: SKILL +{pendingAbilityBonuses.towerSuccessFlat}% | PASSIVE +{combat.passiveAbilityBonuses.towerSuccessFlat}% | COMBO +{combat.comboBonuses.towerSuccessFlat}%
                </Text>
              </View>
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Active Sigil Effects</Text>
                <IconTooltip text="Only active sigils affect combat and tower success." />
              </View>
              {activeBuffs.length > 0 ? (
                <View style={styles.weaponImpactChips}>
                  {activeBuffs.map((buff) => (
                    <View key={`active-buff-${buff.id}`} style={styles.weaponImpactChip}>
                      <GameItemIcon itemId={buff.id} size={13} />
                      <Text style={styles.weaponImpactText}>
                        {Math.floor(getBuffRemainingSeconds(character, buff.id, pageNowMs) / 60)}:
                        {(getBuffRemainingSeconds(character, buff.id, pageNowMs) % 60).toString().padStart(2, "0")}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.weaponImpactEmpty}>No active sigils</Text>
              )}
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Title Effects</Text>
                <IconTooltip text="Bonuses from currently equipped titles. These bonuses are always active while equipped." />
              </View>
              {equippedTitles.length > 0 ? (
                <View style={styles.weaponImpactChips}>
                  {equippedTitles.map((title) => (
                    <View key={`equipped-title-${title.id}`} style={styles.weaponImpactChip}>
                      <MaterialCommunityIcons
                        name={(title.icon || "medal-outline") as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={13}
                        color="#ffd786"
                      />
                      <Text style={styles.weaponImpactText}>
                        {title.name}: +{title.bonuses.damageFlat ?? 0} ATK / +{title.bonuses.critFlat ?? 0}% CRIT / +{title.bonuses.speedFlat ?? 0} SPD / +{title.bonuses.questSuccessFlat ?? 0}% QST
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.weaponImpactEmpty}>No equipped titles</Text>
              )}
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Weapon Impact</Text>
                <IconTooltip text="How much your currently equipped weapon is boosting combat stats." />
              </View>
            <View style={styles.weaponImpactChips}>
              <View style={styles.weaponImpactChip}>
                  <GameItemIcon itemId="weapon-warrior-training-blade" size={12} />
                  <Text style={styles.weaponImpactText}>+{weaponBonusAttack}</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <GameItemIcon itemId="buff-arcane-sigil" size={12} />
                  <Text style={styles.weaponImpactText}>+{weaponBonusCrit}%</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <GameItemIcon itemId="buff-gale-feather" size={12} />
                  <Text style={styles.weaponImpactText}>+{weaponBonusSpeed}</Text>
                </View>
              </View>
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Quest Success Sources</Text>
                <IconTooltip text="What contributes to quest/tower success modifier bonuses from active effects." />
              </View>
              <View style={styles.weaponImpactChips}>
                <View style={styles.weaponImpactChip}>
                  <GameItemIcon itemId="ward-charm" size={12} />
                  <Text style={styles.weaponImpactText}>SIGIL +{combat.buffBonuses.questSuccessFlat}%</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <Image source={HUD_ASSETS.badges.rank} style={styles.weaponImpactBadgeIcon} resizeMode="contain" />
                  <Text style={styles.weaponImpactText}>TITLE +{combat.titleBonuses.questSuccessFlat}%</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <GameItemIcon itemId="tower-crest-fragment" size={12} />
                  <Text style={styles.weaponImpactText}>TOTAL +{combat.questSuccessBonus}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.attributeHead}>
              <Text style={styles.attributeHeadTitle}>Core Attributes</Text>
            </View>
            <StatGlyphBars stats={stats} classId={character.classId} compact />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daily Board</Text>
        {dailies.map((daily) => (
          <View key={daily.id} style={styles.dailyCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(214, 161, 82, 0.1)", "rgba(106, 70, 165, 0.06)", "rgba(28, 20, 45, 0.01)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <Image source={QUEST_TYPE_SPRITE.gather} style={styles.dailyIconSprite} resizeMode="contain" />
            <View style={styles.dailyTextWrap}>
              <Text style={styles.dailyTitle}>{daily.title}</Text>
              <Text style={styles.dailyMeta}>
                Progress {daily.progress}/{daily.target} | Reward {daily.rewardLabel}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Helpful NPC Allies</Text>
        {helpfulAllies.length === 0 ? (
          <View style={styles.dailyCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(214, 161, 82, 0.1)", "rgba(106, 70, 165, 0.06)", "rgba(28, 20, 45, 0.01)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <Text style={styles.dailyMeta}>No allied NPCs yet. Special quest chains can recruit allies.</Text>
          </View>
        ) : (
          helpfulAllies.map((ally) => (
            <View key={ally.id} style={styles.allyCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 96, 112, 0.24)", "rgba(128, 83, 201, 0.14)", "rgba(28, 20, 45, 0.04)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.allySpecialBadge}>
                <Text style={styles.allySpecialBadgeText}>ALLY • SPECIAL</Text>
              </View>
              <View style={styles.allyHeadRow}>
                <View style={styles.allyAvatarWrap}>
                  <Image
                    source={ally.avatarOverride ?? getAvatarSprite(ally.avatarId, ally.classId)}
                    style={styles.allyAvatarImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.allyTextWrap}>
                  <Text style={styles.allyName}>{ally.name}</Text>
                  <Text style={styles.allyTitle}>{ally.title}</Text>
                </View>
                <View style={styles.allyLevelPill}>
                  <Text style={styles.allyLevelLabel}>Level</Text>
                  <Text style={styles.allyLevelValue}>{ally.level}</Text>
                </View>
              </View>
              <View style={styles.weaponImpactRow}>
                <View style={styles.weaponImpactChip}>
                  <MaterialCommunityIcons name="progress-star" size={13} color="#ffd786" />
                  <Text style={styles.weaponImpactText}>Growth Rate: +5 levels per 1 player level</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <MaterialCommunityIcons name="tower-fire" size={13} color="#ffc88f" />
                  <Text style={styles.weaponImpactText}>{ally.skillName}: {ally.skillSummary}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <Modal
        visible={levelDetailsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setLevelDetailsOpen(false)}
      >
        <View style={styles.skillModalBackdrop}>
          <View style={styles.skillModalCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255, 207, 113, 0.2)", "rgba(161, 98, 241, 0.15)", "rgba(24, 16, 37, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.abilityBanner}>
              <View style={styles.abilityBannerLeft}>
                <MaterialCommunityIcons name="badge-account-horizontal-outline" size={14} color="#ffe0a4" />
                <Text style={styles.abilityBannerText}>Progression Details</Text>
              </View>
              <Pressable onPress={() => setLevelDetailsOpen(false)}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
              </Pressable>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Level {character.progression.level} | {character.progression.xpInLevel}/{character.progression.xpToNextLevel} XP
              </Text>
            </View>
            <ProgressBar value={character.progression.xpInLevel} max={character.progression.xpToNextLevel} variant="xp" />

            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Mastery {character.progression.masteryLevel} | {character.progression.masteryXpInLevel}/
                {character.progression.masteryXpToNextLevel}
              </Text>
            </View>
            <ProgressBar
              value={character.progression.masteryXpInLevel}
              max={character.progression.masteryXpToNextLevel}
              variant="mastery"
            />
            <Text style={styles.abilityStatusText}>
              Level drives core attributes and combat growth. Mastery drives class-path progression and future unlocks.
            </Text>
          </View>
        </View>
      </Modal>
      <Modal
        visible={weaponDetailsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setWeaponDetailsOpen(false)}
      >
        <View style={styles.skillModalBackdrop}>
          <View style={styles.skillModalCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255, 207, 113, 0.2)", "rgba(161, 98, 241, 0.15)", "rgba(24, 16, 37, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            {equippedWeapon ? (
              <>
                <View style={styles.abilityBanner}>
                  <View style={styles.abilityBannerLeft}>
                    <MaterialCommunityIcons name="sword-cross" size={14} color="#ffe0a4" />
                    <Text style={styles.abilityBannerText}>Weapon Record</Text>
                  </View>
                  <Pressable onPress={() => setWeaponDetailsOpen(false)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
                  </Pressable>
                </View>
                <View style={styles.weaponDialogHead}>
                  <Text style={styles.weaponDialogTitle}>{equippedWeapon.name}</Text>
                  <View style={styles.weaponDialogGradePill}>
                    <Text style={styles.weaponDialogGradeText}>{equippedWeapon.rarity.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.weaponDialogHero}>
                  <View style={styles.weaponDialogArtFrame}>
                    {equippedWeapon.image ? (
                      <Image source={equippedWeapon.image} style={styles.weaponDialogArt} resizeMode="contain" />
                    ) : (
                      <GameItemIcon itemId={equippedWeapon.id} size={72} />
                    )}
                  </View>
                  <View style={styles.weaponDialogMetaCol}>
                    <Text style={styles.weaponDialogMeta}>Required Level {equippedWeapon.requiredLevel ?? 1}</Text>
                    <Text style={styles.weaponDialogMeta}>Proficiency {combat.weaponProficiencyPercent}%</Text>
                    {equippedWeapon.description ? (
                      <Text style={styles.weaponDialogDesc}>{equippedWeapon.description}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.weaponDialogStatsRow}>
                  <View style={styles.weaponDialogStatCard}>
                    <MaterialCommunityIcons name="sword-cross" size={16} color="#ffd786" />
                    <Text style={styles.weaponDialogStatLabel}>Attack</Text>
                    <Text style={styles.weaponDialogStatValue}>+{equippedWeapon.weaponStats?.attack ?? 0}</Text>
                  </View>
                  <View style={styles.weaponDialogStatCard}>
                    <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#ff78c9" />
                    <Text style={styles.weaponDialogStatLabel}>Critical</Text>
                    <Text style={styles.weaponDialogStatValue}>+{equippedWeapon.weaponStats?.crit ?? 0}%</Text>
                  </View>
                  <View style={styles.weaponDialogStatCard}>
                    <MaterialCommunityIcons name="run-fast" size={16} color="#8de9a8" />
                    <Text style={styles.weaponDialogStatLabel}>Speed</Text>
                    <Text style={styles.weaponDialogStatValue}>+{equippedWeapon.weaponStats?.speed ?? 0}</Text>
                  </View>
                </View>
                {equippedWeapon.lore ? (
                  <View style={styles.weaponLorePanel}>
                    <Text style={styles.weaponLoreTitle}>Lore</Text>
                    <Text style={styles.weaponLoreText}>{equippedWeapon.lore}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <Modal
        visible={skillPanelOpen || Boolean(abilityPanelState)}
        animationType="fade"
        transparent
        onRequestClose={closeAbilityPanels}
      >
        <View style={styles.skillModalBackdrop}>
          <View style={styles.skillModalCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255, 207, 113, 0.2)", "rgba(161, 98, 241, 0.15)", "rgba(24, 16, 37, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.abilityBanner}>
              <View style={styles.abilityBannerLeft}>
                <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#ffe0a4" />
                <Text style={styles.abilityBannerText}>{panelKind === "passive" ? "Passive Ability" : "Class Skill"}</Text>
              </View>
              <Pressable onPress={closeAbilityPanels}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
              </Pressable>
            </View>
            <View style={styles.abilityHead}>
              <View style={styles.abilityHeadLeft}>
                <View style={[styles.abilityIconWrap, panelKind === "skill" && panelIsCurrentSkill && skillActive ? styles.abilityIconWrapActive : null]}>
                  <MaterialCommunityIcons
                    name={panelAbility.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color="#ffd895"
                  />
                </View>
                <Text style={styles.abilityTitle}>{panelAbility.name}</Text>
              </View>
            </View>
            <Text style={styles.abilityDesc}>{panelAbility.description}</Text>
            <View style={styles.abilityInfoRow}>
              <Text style={[styles.abilityInfoText, styles.abilityInfoCost]}>⚡ {skillResourceLabel} Cost {panelAbility.focusCost}</Text>
              <Text style={[styles.abilityInfoText, styles.abilityInfoCooldown]}>⏱ CD {panelAbility.cooldownSeconds}s</Text>
              <Text style={[styles.abilityInfoText, styles.abilityInfoBoost]}>
                🎯 +{panelAbility.bonuses.questSuccessFlat ?? 0}% Quest / 🗼 +{panelAbility.bonuses.towerSuccessFlat ?? 0}% Tower
              </Text>
            </View>
            {panelKind === "passive" ? (
              <View style={styles.abilityStatusRow}>
                <Text style={styles.abilityStatusText}>
                  {panelPassiveEquipped ? "Passive is equipped." : "Passive is not equipped."}
                </Text>
                <Pressable
                  onPress={() => handleTogglePassive(panelAbility.id)}
                  style={[styles.abilityButtonSecondary, panelPassiveEquipped ? styles.abilityPassiveButtonOn : null]}
                >
                  <Text style={styles.abilityButtonText}>{panelPassiveEquipped ? "Unequip" : "Equip"}</Text>
                </Pressable>
              </View>
            ) : panelSkillPrimed ? (
              <View style={styles.abilityStatusRow}>
                <Text style={styles.abilityStatusText}>Primed and active. Remove it to refund Focus.</Text>
                <Pressable
                  onPress={() => handleDeactivateAbility(panelAbility.id)}
                  style={[styles.abilityButtonSecondary, styles.abilityPassiveButtonOn]}
                >
                  <Text style={styles.abilityButtonText}>Deactivate</Text>
                </Pressable>
              </View>
            ) : !panelIsCurrentSkill ? (
              <View style={styles.abilityStatusRow}>
                <Text style={styles.abilityStatusText}>Set this as your active class skill to use it in battle.</Text>
                <Pressable onPress={() => handleSetActiveSkill(panelAbility.id)} style={styles.abilityButtonSecondary}>
                  <Text style={styles.abilityButtonText}>Set Active</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.abilityStatusRow}>
                  <Text style={styles.abilityStatusText}>
                    {skillActive
                      ? "Primed: will be consumed on your next quest/tower attempt."
                      : panelSkillCooldownSec > 0
                        ? `Cooldown: ${panelSkillCooldownSec}s`
                        : "Ready"}
                  </Text>
                  <Pressable
                    onPress={() => handleActivateAbility(panelAbility.id)}
                    disabled={!panelSkillReady || character.focus < panelAbility.focusCost}
                    style={[
                      styles.abilityButton,
                      !panelSkillReady || character.focus < panelAbility.focusCost ? styles.abilityButtonDisabled : null,
                    ]}
                  >
                    <Text style={styles.abilityButtonText}>Activate Skill</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(comboInfoPanel)}
        animationType="fade"
        transparent
        onRequestClose={() => setComboInfoPanel(null)}
      >
        <View style={styles.skillModalBackdrop}>
          <View style={styles.skillModalCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(159, 240, 191, 0.22)", "rgba(71, 144, 104, 0.16)", "rgba(24, 16, 37, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.abilityBanner}>
              <View style={[styles.abilityBannerLeft, styles.comboBannerLeft]}>
                <MaterialCommunityIcons name="source-merge" size={14} color="#d8ffd8" />
                <Text style={styles.abilityBannerText}>Combo Card</Text>
              </View>
              <Pressable onPress={() => setComboInfoPanel(null)}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#e4ffd9" />
              </Pressable>
            </View>
            {comboInfoPanel ? (
              <>
                <View style={styles.abilityHead}>
                  <View style={styles.abilityHeadLeft}>
                    <View style={[styles.abilityIconWrap, styles.comboIconWrap]}>
                      <MaterialCommunityIcons name="source-merge" size={24} color="#d8ffd8" />
                    </View>
                    <Text style={styles.abilityTitle}>{comboInfoPanel.label}</Text>
                  </View>
                </View>
                <Text style={styles.abilityDesc}>
                  This combo card is auto-generated from your primed skill pairing and cannot be edited directly.
                </Text>
                <View style={styles.abilityInfoRow}>
                  <Text style={[styles.abilityInfoText, styles.comboInfoText]}>
                    Quest/Tower skill scaling +{Math.round(comboInfoPanel.questTowerScale * 100)}%
                  </Text>
                  <Text style={[styles.abilityInfoText, styles.comboInfoText]}>
                    Combat skill scaling +{Math.round(comboInfoPanel.combatScale * 100)}%
                  </Text>
                  <Text style={[styles.abilityInfoText, styles.comboInfoText]}>
                    Flat: +{comboInfoPanel.flatQuest}% Quest, +{comboInfoPanel.flatTower}% Tower, +{comboInfoPanel.flatDamage} DMG, +{comboInfoPanel.flatCrit}% CRIT, +{comboInfoPanel.flatSpeed} SPD
                  </Text>
                </View>
                <Text style={styles.abilityStatusText}>
                  Combo benefits are applied in Combat Profile, quest success, and tower resolution calculations.
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  noticeBannerOk: {
    borderColor: "#4e9a72",
    backgroundColor: "rgba(21, 74, 48, 0.8)",
  },
  noticeBannerErr: {
    borderColor: "#a15b67",
    backgroundColor: "rgba(84, 33, 46, 0.84)",
  },
  noticeBannerText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "rgba(33, 23, 52, 0.96)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    gap: 10,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  licenseCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(46, 31, 66, 0.97)",
    padding: 12,
    gap: 11,
    overflow: "hidden",
    position: "relative",
  },
  licenseSecurityLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  licenseWatermark: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 220,
    height: 220,
    marginLeft: -110,
    marginTop: -110,
    opacity: 0.2,
    alignItems: "center",
    justifyContent: "center",
  },
  licensePatternArcOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(234, 199, 132, 0.16)",
    top: -114,
    right: -82,
  },
  licensePatternArcTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(103, 205, 255, 0.16)",
    bottom: -66,
    left: -40,
  },
  licensePatternGrid: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(247, 227, 180, 0.06)",
  },
  licenseTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  licenseTopKicker: {
    color: "#e2c485",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  licenseTopTitle: {
    color: "#fff0ca",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 1,
  },
  rankSeal: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  rankSealLabel: {
    color: "#f8e2af",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rankSealValue: {
    color: "#ffe8b5",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
  },
  licenseBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 13,
    backgroundColor: "rgba(26, 20, 35, 0.95)",
    borderWidth: 1,
    borderColor: "#9a7b48",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPortrait: {
    width: "100%",
    height: "100%",
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    color: "#ffe9bf",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 21,
  },
  heroClass: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  heroJobs: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  licenseIdText: {
    color: "#c9b286",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  licenseStamp: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  licenseRightBadges: {
    alignItems: "center",
    gap: 4,
  },
  licenseLevelBadge: {
    minWidth: 52,
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b89a62",
    backgroundColor: "rgba(66, 49, 27, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  licenseLevelBadgeLabel: {
    color: "#f0ddb2",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  licenseLevelBadgeValue: {
    color: "#ffe9be",
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "900",
  },
  levelMiniTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(246, 214, 148, 0.45)",
    backgroundColor: "rgba(61, 43, 22, 0.92)",
    overflow: "hidden",
  },
  levelMiniFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#f1c978",
  },
  licenseFloorBadge: {
    minWidth: 52,
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8ab5d8",
    backgroundColor: "rgba(32, 54, 83, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  licenseFloorBadgeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  licenseFloorBadgeLabel: {
    color: "#c9e4ff",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  licenseFloorBadgeValue: {
    color: "#e6f4ff",
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "900",
  },
  licenseStatsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  licenseHealthMeter: {
    marginBottom: 4,
  },
  licenseAuthBar: {
    marginTop: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  licenseAuthLine: {
    flex: 1,
    color: "rgba(221, 228, 241, 0.62)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  licenseAuthTextWrap: {
    flex: 1,
    gap: 1,
  },
  licenseAuthLabel: {
    color: "rgba(223, 228, 239, 0.7)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  licenseAuthValue: {
    color: "rgba(242, 246, 255, 0.9)",
    fontSize: 11,
    fontWeight: "800",
  },
  licenseSignatureWrap: {
    alignItems: "flex-end",
    minWidth: 74,
  },
  licenseSignatureText: {
    color: "rgba(225, 232, 248, 0.64)",
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 14,
  },
  licenseSignatureHint: {
    marginTop: 1,
    color: "rgba(186, 194, 212, 0.52)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  licenseLoadoutGrid: {
    marginTop: 2,
    gap: 4,
  },
  licenseLoadoutPanel: {
    flex: 1,
    minWidth: 230,
    gap: 6,
  },
  licenseLoadoutPanelFull: {
    width: "100%",
    gap: 4,
  },
  licenseSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  licenseWeaponMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  licenseSectionTitle: {
    color: "#f6e2b7",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  licenseSectionMeta: {
    color: "#ceb68b",
    fontSize: 10,
    fontWeight: "700",
  },
  licenseWeaponGradePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d48d43",
    backgroundColor: "rgba(107, 63, 19, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  licenseWeaponGradeText: {
    color: "#ffd89a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  licenseWeaponCard: {
    minHeight: 88,
  },
  licenseSigilRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  licenseSigilSlot: {
    width: 58,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
    position: "relative",
  },
  licenseSigilSlotActive: {
    shadowColor: "#b68bff",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  licenseSigilIconShell: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(159, 127, 75, 0.34)",
    backgroundColor: "rgba(28, 20, 39, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  licenseSigilIconShellActive: {
    shadowColor: "#b68bff",
    shadowOpacity: 0.36,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  licenseSigilGradeBadge: {
    position: "absolute",
    right: 2,
    top: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#af8a4e",
    backgroundColor: "rgba(63, 46, 23, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  licenseSigilGradeText: {
    color: "#f8dfaa",
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 9,
  },
  licenseSigilTimerText: {
    color: "#f5d59a",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    minHeight: 11,
  },
  licenseSigilActiveMark: {
    position: "absolute",
    left: 2,
    bottom: 16,
  },
  licenseSigilRemoveButton: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c89b54",
    backgroundColor: "rgba(87, 59, 23, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  licenseSigilColumn: {
    gap: 6,
  },
  licenseSigilCard: {
    minHeight: 58,
  },
  staminaRegenRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#85673c",
    backgroundColor: "rgba(51, 36, 20, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  staminaRegenText: {
    flex: 1,
    color: "#eddcbc",
    fontSize: 11,
    fontWeight: "700",
  },
  staminaToggleRow: {
    alignItems: "flex-start",
    marginTop: 4,
  },
  staminaToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9d7a48",
    backgroundColor: "rgba(65, 46, 23, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  staminaToggleText: {
    color: "#f7deb0",
    fontSize: 10,
    fontWeight: "800",
  },
  licenseStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a48251",
    backgroundColor: "rgba(63, 45, 26, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
    minWidth: 98,
  },
  licenseStatIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  licenseAssetIcon: {
    width: 18,
    height: 18,
  },
  emptyWeaponSlot: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(130, 160, 220, 0.5)",
    backgroundColor: "rgba(7, 15, 34, 0.55)",
  },
  licenseStatValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 100,
  },
  licenseStatTextWrap: {
    flex: 1,
    gap: 1,
  },
  licenseStatLabel: {
    color: "#cdb88f",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  affinityWrap: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#997542",
    backgroundColor: "rgba(51, 37, 22, 0.94)",
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 5,
  },
  affinityHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  affinityTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  affinityTitle: {
    color: "#f4deb2",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  affinityState: {
    color: "#f1d59b",
    fontSize: 11,
    fontWeight: "800",
  },
  affinityTrackLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  affinityLeft: {
    color: "#ff9b9f",
    fontSize: 9,
    fontWeight: "700",
  },
  affinityCenter: {
    color: "#d6c59d",
    fontSize: 9,
    fontWeight: "700",
  },
  affinityRight: {
    color: "#9de6ff",
    fontSize: 9,
    fontWeight: "700",
  },
  affinityTrack: {
    position: "relative",
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8e6b3d",
    backgroundColor: "rgba(34, 24, 15, 0.95)",
    overflow: "hidden",
  },
  affinityTrackNeutralLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(216, 196, 146, 0.55)",
  },
  affinityMarker: {
    position: "absolute",
    top: 1,
    marginLeft: -8,
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    shadowColor: "#f4d9a8",
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  affinityScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },
  affinityScoreText: {
    color: "#e9d5ac",
    fontSize: 10,
    fontWeight: "700",
  },
  equipmentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(36, 27, 47, 0.95)",
    padding: 10,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  equipmentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  equipmentTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  equipmentRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  mainWeaponCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(58, 43, 23, 0.94)",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 84,
  },
  mainWeaponIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#aa8650",
    backgroundColor: "rgba(28, 20, 39, 0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainWeaponText: {
    flex: 1,
    gap: 3,
    paddingRight: 2,
  },
  mainWeaponName: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  mainWeaponMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  weaponBonusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 3,
  },
  weaponBonusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a48550",
    backgroundColor: "rgba(33, 24, 44, 0.82)",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  weaponBonusText: {
    color: "#f8e9c9",
    fontSize: 10,
    fontWeight: "800",
  },
  unequipWrap: {
    marginLeft: 1,
    alignSelf: "flex-start",
  },
  unequipButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6a65f",
    backgroundColor: "rgba(85, 58, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unequipOverlayIcon: {
    position: "absolute",
    right: 3,
    top: 3,
    backgroundColor: "rgba(45, 24, 18, 0.95)",
    borderRadius: 999,
  },
  buffSlotHeader: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buffSlotTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  buffSlotMeta: {
    color: "#cdb88f",
    fontSize: 10,
    fontWeight: "700",
  },
  buffSlotRow: {
    marginTop: 5,
    gap: 6,
  },
  buffSlotCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(44, 32, 56, 0.93)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  buffSlotCardActive: {
    shadowColor: "#b68bff",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  buffSlotIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#9f7f4b",
    backgroundColor: "rgba(28, 20, 39, 0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleIconFrame: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  titleIconImage: {
    width: 18,
    height: 18,
  },
  buffSlotText: {
    color: "#e7d7b8",
    fontSize: 11,
    fontWeight: "700",
  },
  buffSlotTextBlock: {
    flex: 1,
    gap: 2,
  },
  buffSlotGradePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#af8a4e",
    backgroundColor: "rgba(63, 46, 23, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  buffSlotGradeText: {
    color: "#f8dfaa",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  buffSlotTimer: {
    color: "#f5d59a",
    fontSize: 10,
    fontWeight: "800",
  },
  buffRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c89b54",
    backgroundColor: "rgba(87, 59, 23, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSlotLegendary: {
    shadowColor: "#ffd287",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  emptyWeaponSlotLarge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(130, 160, 220, 0.5)",
    backgroundColor: "rgba(7, 15, 34, 0.55)",
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
    paddingRight: 6,
  },
  statCard: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(35, 26, 48, 0.95)",
    padding: 10,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statHeadTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  powerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b38c4f",
    backgroundColor: "rgba(72, 50, 22, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  powerPillText: {
    color: "#ffe9be",
    fontSize: 11,
    fontWeight: "900",
  },
  combatStatRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 7,
  },
  combatMetricCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(56, 41, 23, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  combatMetricCardWide: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6e8ea7",
    backgroundColor: "rgba(21, 34, 54, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 1,
  },
  combatMetricTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  combatMetricLabel: {
    color: "#e7d4af",
    fontSize: 10,
    fontWeight: "700",
  },
  combatMetricValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  combatMetricBonus: {
    color: "#f6d18d",
    fontSize: 10,
    fontWeight: "700",
  },
  weaponImpactRow: {
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 33, 58, 0.93)",
    padding: 8,
    gap: 6,
  },
  weaponImpactLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weaponImpactTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  weaponImpactChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  weaponImpactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9d7c46",
    backgroundColor: "rgba(58, 42, 20, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weaponImpactBadgeIcon: {
    width: 14,
    height: 14,
  },
  weaponImpactText: {
    color: "#ffe8bd",
    fontSize: 11,
    fontWeight: "800",
  },
  weaponImpactEmpty: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  abilityCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bf9351",
    backgroundColor: "rgba(50, 31, 61, 0.84)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
    overflow: "hidden",
    position: "relative",
  },
  abilityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  abilityBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bf9251",
    backgroundColor: "rgba(113, 74, 27, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comboBannerLeft: {
    borderColor: "#9aaaba",
    backgroundColor: "rgba(67, 79, 93, 0.94)",
  },
  abilityBannerText: {
    color: "#ffe5b9",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  weaponDialogHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  weaponDialogTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  weaponDialogGradePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d48d43",
    backgroundColor: "rgba(107, 63, 19, 0.92)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  weaponDialogGradeText: {
    color: "#ffd89a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  weaponDialogHero: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  weaponDialogArtFrame: {
    width: 104,
    height: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#a9854d",
    backgroundColor: "rgba(34, 24, 48, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  weaponDialogArt: {
    width: 86,
    height: 86,
  },
  weaponDialogMetaCol: {
    flex: 1,
    gap: 4,
  },
  weaponDialogMeta: {
    color: "#ecd8b2",
    fontSize: 11,
    fontWeight: "800",
  },
  weaponDialogDesc: {
    color: "#d7c3a0",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  weaponDialogStatsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  weaponDialogStatCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#977442",
    backgroundColor: "rgba(58, 41, 23, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
    alignItems: "center",
  },
  weaponDialogStatLabel: {
    color: "#e7d4af",
    fontSize: 10,
    fontWeight: "700",
  },
  weaponDialogStatValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  weaponLorePanel: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 33, 58, 0.93)",
    padding: 10,
    gap: 6,
  },
  weaponLoreTitle: {
    color: "#ffe5b9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  weaponLoreText: {
    color: "#e8d7bb",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  abilityHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  abilityHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  abilityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b5864b",
    backgroundColor: "rgba(95, 60, 24, 0.86)",
    alignItems: "center",
    justifyContent: "center",
  },
  abilityIconWrapActive: {
    shadowColor: "#f4ce8f",
    shadowOpacity: 0.42,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  skillMiniBadge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#58b4ff",
    backgroundColor: "rgba(26, 47, 90, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  skillMiniBadgeGridItem: {
    width: "48.5%",
    minHeight: 62,
  },
  licenseSkillMiniBadge: {
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 2,
    paddingVertical: 4,
    minHeight: 40,
  },
  licenseSkillIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 0,
  },
  skillMiniBadgeActive: {
    shadowColor: "#f4ce8f",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  passiveMiniBadgeActive: {
    borderColor: "#8de9ab",
    backgroundColor: "rgba(23, 78, 55, 0.94)",
  },
  comboMiniBadge: {
    borderColor: "#8da0ad",
    backgroundColor: "rgba(52, 62, 74, 0.94)",
  },
  comboIconWrap: {
    borderColor: "#a4b6c4",
    backgroundColor: "rgba(71, 82, 97, 0.95)",
  },
  comboMiniLabel: {
    color: "#d2dce5",
  },
  comboMiniState: {
    color: "#e0e8ee",
    textShadowColor: "rgba(173, 188, 202, 0.5)",
  },
  ironWillBadge: {
    borderColor: "#e3b36d",
    backgroundColor: "rgba(104, 67, 28, 0.93)",
  },
  passiveIconWrapActive: {
    borderColor: "#8de9ab",
    backgroundColor: "rgba(35, 106, 71, 0.94)",
  },
  abilitySlotHeader: {
    color: "#afcff0",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  abilityMiniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillMiniLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  skillMiniRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 28,
  },
  skillMiniLabel: {
    color: "#9fdaff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  skillMiniName: {
    color: "#d9f2ff",
    fontSize: 13,
    fontWeight: "900",
  },
  skillMiniMeta: {
    color: "#b8f1ff",
    fontSize: 11,
    fontWeight: "800",
  },
  skillMiniMetaSmall: {
    color: "#cfe6ff",
    fontSize: 9,
    fontWeight: "700",
  },
  skillMiniState: {
    color: "#91f6ff",
    fontSize: 10,
    fontWeight: "900",
    textShadowColor: "rgba(141, 235, 255, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  skillMiniStateIdle: {
    color: "#aebcd3",
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
  skillMiniStateCooldown: {
    color: "#ffd487",
    textShadowColor: "rgba(255, 205, 128, 0.5)",
    textShadowRadius: 4,
  },
  skillModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 9, 15, 0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  skillModalCard: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#58adff",
    backgroundColor: "rgba(22, 40, 72, 0.98)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  abilityTitle: {
    color: "#d8f1ff",
    fontSize: 14,
    fontWeight: "900",
  },
  abilityMeta: {
    color: "#daf4ff",
    fontSize: 11,
    fontWeight: "800",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#53abf8",
    backgroundColor: "rgba(27, 75, 133, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  abilityDesc: {
    color: "#b7dcff",
    fontSize: 11,
    lineHeight: 15,
  },
  abilityInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  abilityInfoText: {
    color: "#d5efff",
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4c9ef4",
    backgroundColor: "rgba(19, 62, 112, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comboInfoText: {
    color: "#e4ecf2",
    borderColor: "#9db0be",
    backgroundColor: "rgba(67, 79, 93, 0.9)",
  },
  abilityInfoCost: {
    borderColor: "#6adfff",
    backgroundColor: "rgba(20, 95, 130, 0.78)",
  },
  abilityInfoCooldown: {
    borderColor: "#7da7ff",
    backgroundColor: "rgba(40, 69, 133, 0.84)",
  },
  abilityInfoBoost: {
    borderColor: "#a88cff",
    backgroundColor: "rgba(65, 51, 135, 0.82)",
  },
  abilityStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  abilityStatusText: {
    flex: 1,
    color: "#cbe8ff",
    fontSize: 11,
    fontWeight: "700",
  },
  abilityButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6cdbff",
    backgroundColor: "rgba(16, 98, 133, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  abilityButtonSecondary: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9f8aff",
    backgroundColor: "rgba(52, 55, 130, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  abilityPassiveButtonOn: {
    borderColor: "#88e5aa",
    backgroundColor: "rgba(34, 97, 66, 0.95)",
  },
  abilityButtonDisabled: {
    borderColor: "#7f6a45",
    backgroundColor: "rgba(63, 50, 34, 0.86)",
  },
  abilityButtonText: {
    color: "#eff9ff",
    fontSize: 11,
    fontWeight: "900",
  },
  attributeHead: {
    marginTop: 1,
  },
  attributeHeadTitle: {
    color: "#dbc59e",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  dailyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(35, 26, 48, 0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 12,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  dailyIconSprite: {
    width: 20,
    height: 20,
  },
  dailyTextWrap: {
    flex: 1,
  },
  dailyTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  dailyMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  allyCard: {
    backgroundColor: "rgba(35, 26, 48, 0.95)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#d26f7a",
    padding: 12,
    gap: 8,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#d66b77",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 7,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  allySpecialBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffc5cc",
    backgroundColor: "rgba(166, 45, 66, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  allySpecialBadgeText: {
    color: "#fff0f2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  allyHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  allyAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9a7b48",
    backgroundColor: "rgba(26, 20, 35, 0.95)",
    overflow: "hidden",
  },
  allyAvatarImage: {
    width: "100%",
    height: "100%",
  },
  allyTextWrap: {
    flex: 1,
    gap: 2,
  },
  allyName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  allyTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  allyLevelPill: {
    minWidth: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d5ab65",
    backgroundColor: "rgba(77, 52, 22, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 1,
  },
  allyLevelLabel: {
    color: "#f0ddb7",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  allyLevelValue: {
    color: "#ffe9be",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
  },
});
