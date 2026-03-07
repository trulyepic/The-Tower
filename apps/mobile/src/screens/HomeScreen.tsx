import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { IconTooltip } from "../components/IconTooltip";
import { ProgressBar } from "../components/ProgressBar";
import { StatGlyphBars } from "../components/StatGlyphBars";
import { CLASS_VISUALS } from "../data/classVisuals";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { CURRENCY_SPRITES, getAvatarSprite } from "../data/uiSprites";
import { getBuffRemainingSeconds, getBuffSlotLimit, getEquippedBuffItems, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { BaseClassDefinition, CharacterState, DailyTask } from "../types/game";
import { colors } from "../theme/colors";

interface HomeScreenProps {
  character: CharacterState;
  classes: BaseClassDefinition[];
  dailies: DailyTask[];
  completedQuestCount: number;
  onUnequipWeapon: () => { ok: boolean; reason?: string };
  onUnequipBuff: (itemId: string) => { ok: boolean; reason?: string };
}

const STAMINA_REGEN_INTERVAL_MS = 5 * 60 * 1000;

export const HomeScreen = ({
  character,
  classes,
  dailies,
  completedQuestCount,
  onUnequipWeapon,
  onUnequipBuff,
}: HomeScreenProps) => {
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const activeClass = classes.find((classDef) => classDef.id === character.classId) ?? null;
  const stats = CLASS_VISUALS[character.classId].stats;
  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : undefined;
  const combat = getCharacterCombatStats(character);
  const weaponBonusAttack = combat.effectiveWeaponAttack;
  const weaponBonusCrit = combat.effectiveWeaponCrit;
  const weaponBonusSpeed = combat.effectiveWeaponSpeed;
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
  const pageNowMs = Date.now();
  const buffSlotLimit = getBuffSlotLimit(character.adventurerRank);
  const equippedBuffs = getEquippedBuffItems(character);
  const activeBuffs = equippedBuffs.filter((buff) => isBuffActive(character, buff.id, pageNowMs));
  const licenseId = `${character.classId.toUpperCase()}-${character.progression.level
    .toString()
    .padStart(2, "0")}-${character.name.toUpperCase().slice(0, 3).padEnd(3, "X")}`;

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(""), 2200);
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
        ? `Buff removed: ${ITEM_BY_ID[itemId]?.name ?? itemId}`
        : result.reason ?? "Could not unequip buff.",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="camp" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.kicker}>Ranger's Camp</Text>
        <View style={styles.titlePlate}>
          <Image source={HUD_ASSETS.decor.titlePlate} style={styles.titlePlateImage} resizeMode="stretch" />
          <Text style={styles.title}>{character.name}</Text>
        </View>
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
                <Text style={styles.heroClass}>{activeClass?.name ?? "Unknown Class"}</Text>
                <Text style={styles.heroJobs}>
                  {activeClass?.advancedJobOptions.join(" / ") ?? "Unknown"} Path
                </Text>
                <Text style={styles.licenseIdText}>ID {licenseId}</Text>
              </View>
              <ImageBackground source={HUD_ASSETS.badges.stamp} style={styles.licenseStamp} resizeMode="contain">
                <MaterialCommunityIcons name="shield-star" size={24} color={colors.gold} />
              </ImageBackground>
            </View>

            <View style={styles.licenseStatsRow}>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.common} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <MaterialCommunityIcons name="lightning-bolt" size={16} color="#ffd27d" />
                </ImageBackground>
                <Text style={styles.licenseStatValue}>{character.stamina}/{character.staminaCap}</Text>
              </View>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.common} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <Image source={CURRENCY_SPRITES.gold} style={styles.licenseAssetIcon} resizeMode="contain" />
                </ImageBackground>
                <Text style={styles.licenseStatValue}>{character.gold}</Text>
              </View>
              <View style={styles.licenseStat}>
                <ImageBackground source={HUD_ASSETS.slots.rare} style={styles.licenseStatIconWrap} resizeMode="contain">
                  <GameItemIcon itemId="torch" size={16} />
                </ImageBackground>
                <Text style={styles.licenseStatValue}>{completedQuestCount}</Text>
              </View>
            </View>
            <View style={styles.staminaRegenRow}>
              <MaterialCommunityIcons name="timelapse" size={13} color="#d6b074" />
              <Text style={styles.staminaRegenText}>
                {character.stamina >= character.staminaCap
                  ? "Stamina full (20/20). Regen resumes after spending stamina."
                  : `Stamina +1 in ${regenMinutes}:${regenSeconds.toString().padStart(2, "0")} (every 5m)`}
              </Text>
              <IconTooltip text="Passive stamina recovery: +1 every 5 minutes until you reach the cap." />
            </View>
          </View>

          <View style={styles.equipmentCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(223, 166, 80, 0.11)", "rgba(99, 63, 153, 0.06)", "rgba(33, 22, 49, 0.01)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.equipmentTitleRow}>
              <Text style={styles.equipmentTitle}>Equipped Loadout</Text>
              <IconTooltip text="Current gear applied to your adventurer." />
            </View>
            <View style={styles.equipmentRow}>
              <View style={styles.mainWeaponCard}>
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
                      ? `Lv ${equippedWeapon.requiredLevel ?? 1}+ • ${combat.weaponProficiencyPercent}% proficiency`
                      : "Visit Guild Store to buy one"}
                  </Text>
                  {equippedWeapon ? (
                    <View style={styles.weaponBonusRow}>
                      <View style={styles.weaponBonusChip}>
                        <MaterialCommunityIcons name="sword-cross" size={13} color={colors.gold} />
                        <Text style={styles.weaponBonusText}>+{weaponBonusAttack} ATK</Text>
                      </View>
                      <View style={styles.weaponBonusChip}>
                        <MaterialCommunityIcons name="star-four-points-outline" size={13} color="#ff78c9" />
                        <Text style={styles.weaponBonusText}>+{weaponBonusCrit}% CRIT</Text>
                      </View>
                      <View style={styles.weaponBonusChip}>
                        <MaterialCommunityIcons name="run-fast" size={13} color="#8de9a8" />
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
              </View>
            </View>
            <View style={styles.buffSlotHeader}>
              <Text style={styles.buffSlotTitle}>Buff Slots</Text>
              <Text style={styles.buffSlotMeta}>
                {equippedBuffs.length}/{buffSlotLimit} equipped
              </Text>
            </View>
            <View style={styles.buffSlotRow}>
              {Array.from({ length: buffSlotLimit }).map((_, index) => {
                const buff = equippedBuffs[index];
                const active = buff ? isBuffActive(character, buff.id, pageNowMs) : false;
                return (
                  <View key={`buff-slot-${index}`} style={[styles.buffSlotCard, active ? styles.buffSlotCardActive : null]}>
                    <View style={styles.buffSlotIconWrap}>
                      {buff ? (
                        <GameItemIcon itemId={buff.id} size={19} />
                      ) : (
                        <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#a58961" />
                      )}
                    </View>
                    <View style={styles.buffSlotTextBlock}>
                      <Text style={styles.buffSlotText} numberOfLines={1}>
                        {buff ? buff.name : "Empty Buff Slot"}
                      </Text>
                      {buff ? (
                        <View style={styles.buffSlotGradePill}>
                          <Text style={styles.buffSlotGradeText}>{buff.rarity.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                    {buff ? (
                      <Text style={styles.buffSlotTimer}>
                        {(() => {
                          const remaining = getBuffRemainingSeconds(character, buff.id, pageNowMs);
                          if (active) {
                            return `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`;
                          }
                          return remaining > 0
                            ? `Paused ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                            : "Inactive";
                        })()}
                      </Text>
                    ) : null}
                    {active ? (
                      <MaterialCommunityIcons name="check-decagram" size={13} color="#86efb0" />
                    ) : null}
                    {buff ? (
                      <Pressable onPress={() => handleUnequipBuff(buff.id)} style={styles.buffRemoveButton}>
                        <MaterialCommunityIcons name="close" size={11} color="#ffe8bf" />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              Level {character.progression.level} | {character.progression.xpInLevel}/
              {character.progression.xpToNextLevel} XP
            </Text>
            <IconTooltip text="Fill this bar to gain character levels and core stat growth." />
          </View>
          <ProgressBar
            value={character.progression.xpInLevel}
            max={character.progression.xpToNextLevel}
            variant="xp"
          />

          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              Mastery {character.progression.masteryLevel} | {character.progression.masteryXpInLevel}/
              {character.progression.masteryXpToNextLevel}
            </Text>
            <IconTooltip text="Class-specific progression that unlocks advanced jobs and perks." />
          </View>
          <ProgressBar
            value={character.progression.masteryXpInLevel}
            max={character.progression.masteryXpToNextLevel}
            variant="mastery"
          />

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
                <Text style={styles.combatMetricBonus}>WPN +{weaponBonusAttack} | BUFF +{combat.buffBonuses.damageFlat}</Text>
              </View>
              <View style={styles.combatMetricCard}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#ff78c9" />
                  <Text style={styles.combatMetricLabel}>Critical</Text>
                </View>
                <Text style={styles.combatMetricValue}>{combat.critChance}%</Text>
                <Text style={styles.combatMetricBonus}>WPN +{weaponBonusCrit}% | BUFF +{combat.buffBonuses.critFlat}%</Text>
              </View>
              <View style={styles.combatMetricCard}>
                <View style={styles.combatMetricTop}>
                  <MaterialCommunityIcons name="run-fast" size={16} color="#8de9a8" />
                  <Text style={styles.combatMetricLabel}>Speed</Text>
                </View>
                <Text style={styles.combatMetricValue}>{combat.speed}</Text>
                <Text style={styles.combatMetricBonus}>WPN +{weaponBonusSpeed} | BUFF +{combat.buffBonuses.speedFlat}</Text>
              </View>
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Active Buff Effects</Text>
                <IconTooltip text="Only active buffs affect combat and tower success." />
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
                <Text style={styles.weaponImpactEmpty}>No active buffs</Text>
              )}
            </View>

            <View style={styles.weaponImpactRow}>
              <View style={styles.weaponImpactLabelWrap}>
                <Text style={styles.weaponImpactTitle}>Weapon Impact</Text>
                <IconTooltip text="How much your currently equipped weapon is boosting combat stats." />
              </View>
              <View style={styles.weaponImpactChips}>
                <View style={styles.weaponImpactChip}>
                  <MaterialCommunityIcons name="sword-cross" size={13} color={colors.gold} />
                  <Text style={styles.weaponImpactText}>+{weaponBonusAttack}</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <MaterialCommunityIcons name="star-four-points-outline" size={13} color="#ff78c9" />
                  <Text style={styles.weaponImpactText}>+{weaponBonusCrit}%</Text>
                </View>
                <View style={styles.weaponImpactChip}>
                  <MaterialCommunityIcons name="run-fast" size={13} color="#8de9a8" />
                  <Text style={styles.weaponImpactText}>+{weaponBonusSpeed}</Text>
                </View>
              </View>
            </View>

            <View style={styles.attributeHead}>
              <Text style={styles.attributeHeadTitle}>Core Attributes</Text>
            </View>
            <StatGlyphBars stats={stats} compact />
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
            <MaterialCommunityIcons name="file-document-outline" size={19} color={colors.accent} />
            <View style={styles.dailyTextWrap}>
              <Text style={styles.dailyTitle}>{daily.title}</Text>
              <Text style={styles.dailyMeta}>
                Progress {daily.progress}/{daily.target} | Reward {daily.rewardLabel}
              </Text>
            </View>
          </View>
        ))}
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
    fontSize: 34,
    lineHeight: 37,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(6, 12, 30, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titlePlate: {
    minHeight: 72,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    position: "relative",
  },
  titlePlateImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    gap: 10,
    overflow: "hidden",
    position: "relative",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  licenseCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(40, 30, 52, 0.97)",
    padding: 12,
    gap: 11,
  },
  licenseTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  licenseTopKicker: {
    color: "#ccb78e",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  licenseTopTitle: {
    color: colors.textPrimary,
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
  heroClass: {
    color: colors.textPrimary,
    fontSize: 18,
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
  licenseStatsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
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
  licenseStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#907243",
    backgroundColor: "rgba(54, 40, 24, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    maxWidth: 150,
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
    borderColor: "#62c898",
    backgroundColor: "rgba(20, 77, 53, 0.84)",
    shadowColor: "#6de2ae",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
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
});
