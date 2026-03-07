import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { IconTooltip } from "../components/IconTooltip";
import { ProgressBar } from "../components/ProgressBar";
import { GUILD_STORE_ITEMS } from "../data/guildStore";
import { ITEM_BY_ID } from "../data/items";
import { CURRENCY_SPRITES, QUEST_TYPE_SPRITE } from "../data/uiSprites";
import { getBuffRemainingSeconds, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import {
  ActiveQuestState,
  BaseClassId,
  CharacterState,
  ItemRarity,
  QuestDefinition,
  QuestOutcome,
  TowerFloorDefinition,
  TowerOutcome,
} from "../types/game";
import { colors } from "../theme/colors";

interface QuestsScreenProps {
  character: CharacterState;
  quests: QuestDefinition[];
  towerFloors: TowerFloorDefinition[];
  activeQuest: ActiveQuestState | null;
  lastQuestOutcome: QuestOutcome | null;
  lastTowerOutcome: TowerOutcome | null;
  getQuestSuccessChance: (questId: string) => number;
  getQuestAccess: (questId: string) => { allowed: boolean; reason?: string };
  getTowerSuccessChance: (floorNumber: number) => number;
  getTowerAccess: (floorNumber: number) => { allowed: boolean; reason?: string };
  buyGuildItem: (
    itemId: string,
    unitPrice: number,
    amount?: number,
    classRestriction?: BaseClassId,
  ) => { ok: boolean; reason?: string };
  onActivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onDeactivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onStartQuest: (questId: string) => { ok: boolean; reason?: string };
  onClaimQuest: () => { ok: boolean; reason?: string };
  onConquerTowerFloor: (floorNumber: number) => { ok: boolean; reason?: string };
}

type GuildTab = "board" | "store" | "tower";

const formatRemaining = (msRemaining: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const questTypeLabel: Record<QuestDefinition["type"], string> = {
  gather: "Gather",
  adventure: "Adventure",
  dungeon: "Dungeon",
};

const difficultyColor = (difficulty: number): string => {
  if (difficulty <= 2) return "#74e1a6";
  if (difficulty === 3) return "#ffc96f";
  if (difficulty === 4) return "#ff9b7f";
  return "#f7798a";
};

const rarityColorMap: Record<ItemRarity, string> = {
  common: "#b9ac92",
  rare: "#ff78c9",
  epic: "#c48dff",
  legendary: "#ffbf6a",
};

export const QuestsScreen = ({
  character,
  quests,
  towerFloors,
  activeQuest,
  lastQuestOutcome,
  lastTowerOutcome,
  getQuestSuccessChance,
  getQuestAccess,
  getTowerSuccessChance,
  getTowerAccess,
  buyGuildItem,
  onActivateBuff,
  onDeactivateBuff,
  onStartQuest,
  onClaimQuest,
  onConquerTowerFloor,
}: QuestsScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [isBuying, setIsBuying] = useState(false);
  const [lastPurchasedItemId, setLastPurchasedItemId] = useState<string | null>(null);
  const [lastPurchaseText, setLastPurchaseText] = useState("");
  const [questResultOpen, setQuestResultOpen] = useState(false);
  const [guildTab, setGuildTab] = useState<GuildTab>("board");

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (lastQuestOutcome) {
      setQuestResultOpen(true);
    }
  }, [lastQuestOutcome]);

  const activeQuestDef = useMemo(
    () => quests.find((quest) => quest.id === activeQuest?.questId) ?? null,
    [quests, activeQuest],
  );

  const isQuestReadyToClaim = Boolean(activeQuest && nowMs >= activeQuest.endsAtMs);
  const remainingMs = activeQuest ? Math.max(0, activeQuest.endsAtMs - nowMs) : 0;
  const activeDurationMs = activeQuest ? activeQuest.endsAtMs - activeQuest.startedAtMs : 0;
  const elapsedRatio = activeQuest
    ? Math.max(0, Math.min(1, (activeDurationMs - remainingMs) / Math.max(1, activeDurationMs)))
    : 0;

  const handleStartQuest = (questId: string) => {
    const result = onStartQuest(questId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? "Quest accepted. You're on the move." : result.reason ?? "Could not start quest.");
  };

  const handleClaimQuest = () => {
    const result = onClaimQuest();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Quest resolved." : "Could not claim quest."));
  };

  const handleBuy = (itemId: string, unitPrice: number, classRestriction?: BaseClassId) => {
    if (isBuying) {
      return;
    }
    setIsBuying(true);
    const result = buyGuildItem(itemId, unitPrice, 1, classRestriction);
    const itemName = ITEM_BY_ID[itemId]?.name ?? itemId;
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? `Purchase Complete: ${itemName} added to inventory.` : result.reason ?? "Could not purchase.");
    if (result.ok) {
      setLastPurchasedItemId(itemId);
      setLastPurchaseText(`Bought ${itemName} for ${unitPrice}g`);
      setTimeout(() => {
        setLastPurchasedItemId((current) => (current === itemId ? null : current));
      }, 2400);
    }
    setTimeout(() => setIsBuying(false), 450);
  };
  const handleConquerTowerFloor = (floorNumber: number) => {
    const result = onConquerTowerFloor(floorNumber);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Floor challenge completed." : "Could not challenge floor."));
  };
  const handleActivateBuff = (itemId: string) => {
    const result = onActivateBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? `Buff activated: ${ITEM_BY_ID[itemId]?.name ?? itemId}` : result.reason ?? "Could not activate buff.");
  };
  const handleDeactivateBuff = (itemId: string) => {
    const result = onDeactivateBuff(itemId);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? `Buff paused: ${ITEM_BY_ID[itemId]?.name ?? itemId}` : result.reason ?? "Could not deactivate buff.");
  };

  const weaponEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "weapon");
  const buffEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "buff");
  const materialEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "material");
  const nextFloorNumber = (character.towerProgress?.highestFloorCleared ?? 0) + 1;
  const currentTowerFloor = towerFloors.find((floor) => floor.floorNumber === nextFloorNumber) ?? null;
  const towerCompleted = nextFloorNumber > towerFloors.length;
  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : null;
  const equippedBuffIds = character.equippedBuffIds ?? [];
  const activeBuffIds = equippedBuffIds.filter((buffId) => isBuffActive(character, buffId, nowMs));
  const combat = getCharacterCombatStats(character);
  const weaponProficiency =
    equippedWeapon?.category === "weapon"
      ? character.progression.level >= (equippedWeapon.requiredLevel ?? 1)
        ? 100
        : 25
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop variant="guild" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.kicker}>Adventurer's Guild</Text>
        <View style={styles.titlePlate}>
          <Text style={styles.title}>Guild Hall</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setGuildTab("board")}
            style={[styles.guildTabWrap, guildTab === "board" ? styles.guildTabWrapActive : null]}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={16}
                color={guildTab === "board" ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[styles.guildTabText, guildTab === "board" ? styles.guildTabTextActive : null]}>
                Quest Board
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setGuildTab("store")}
            style={[styles.guildTabWrap, guildTab === "store" ? styles.guildTabWrapActive : null]}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={16}
                color={guildTab === "store" ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[styles.guildTabText, guildTab === "store" ? styles.guildTabTextActive : null]}>
                Store
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setGuildTab("tower")}
            style={[styles.guildTabWrap, guildTab === "tower" ? styles.guildTabWrapActive : null]}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="tower-fire"
                size={16}
                color={guildTab === "tower" ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[styles.guildTabText, guildTab === "tower" ? styles.guildTabTextActive : null]}>
                Tower
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.licenseRow}>
          <MaterialCommunityIcons name="badge-account-horizontal-outline" size={15} color={colors.gold} />
          <Text style={styles.licenseText}>
            Adventurer Rank: {character.adventurerRank} • Level {character.progression.level}
          </Text>
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

        {guildTab === "board" ? (
          <>
            <View style={styles.activeCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.12)", "rgba(100, 65, 155, 0.07)", "rgba(28, 20, 46, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.activeHeader}>
                <MaterialCommunityIcons name="timer-sand" size={18} color={colors.warning} />
                <Text style={styles.sectionTitle}>Active Quest</Text>
              </View>
              {activeQuest && activeQuestDef ? (
                <>
                  <Text style={styles.questTitle}>{activeQuestDef.title}</Text>
                  <Text style={styles.questMeta}>Remaining: {formatRemaining(remainingMs)}</Text>

                  <View style={styles.meterBlock}>
                    <View style={styles.meterLabelRow}>
                      <View style={styles.inlineLabel}>
                        <Text style={styles.meterLabel}>Timer</Text>
                        <IconTooltip text="Quest duration progress. Resolve when it reaches 100%." />
                      </View>
                      <Text style={styles.meterLabel}>{Math.round(elapsedRatio * 100)}%</Text>
                    </View>
                    <ProgressBar value={elapsedRatio * 100} max={100} />
                  </View>

                  <View style={styles.meterBlock}>
                    <View style={styles.meterLabelRow}>
                      <View style={styles.inlineLabel}>
                        <Text style={styles.meterLabel}>Success Chance</Text>
                        <IconTooltip text="Calculated at quest start from key item readiness, optional supply readiness, level match, and weapon performance." />
                      </View>
                      <Text style={styles.meterLabel}>{activeQuest.successChanceAtStart}%</Text>
                    </View>
                    <ProgressBar value={activeQuest.successChanceAtStart} max={100} />
                  </View>

                  <Pressable onPress={handleClaimQuest} disabled={!isQuestReadyToClaim} style={styles.actionWrap}>
                    <View style={[styles.claimButton, !isQuestReadyToClaim ? styles.actionDisabled : null]}>
                      <Text style={styles.claimText}>
                        {isQuestReadyToClaim ? "Resolve Quest" : "Quest In Progress"}
                      </Text>
                    </View>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.questMeta}>No active quest. Choose your next challenge below.</Text>
              )}
            </View>

            {quests.map((quest) => {
              const successChance = getQuestSuccessChance(quest.id);
              const access = getQuestAccess(quest.id);
              const blocked = !access.allowed;
              return (
                <View key={quest.id} style={styles.questCard}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(204, 149, 73, 0.09)", "rgba(93, 60, 147, 0.06)", "rgba(24, 17, 39, 0.02)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  />
                  <View style={styles.questHeader}>
                    <Image source={QUEST_TYPE_SPRITE[quest.type]} style={styles.questTypeSprite} resizeMode="contain" />
                    <IconTooltip text={`${questTypeLabel[quest.type]} quest type.`} />
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <View style={styles.typePill}>
                      <Text style={styles.typePillText}>{questTypeLabel[quest.type]}</Text>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.warning} />
                      <Text style={styles.rewardChipText}>{quest.durationSeconds}s</Text>
                      <IconTooltip text="Quest timer duration." />
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color="#ffd27d" />
                      <Text style={styles.rewardChipText}>{quest.staminaCost}</Text>
                      <IconTooltip text="Stamina cost to start this quest." />
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="signal" size={14} color={difficultyColor(quest.difficulty)} />
                      <Text style={styles.rewardChipText}>D{quest.difficulty}</Text>
                      <IconTooltip text="Difficulty tier. Higher tiers need better item readiness." />
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="badge-account-outline" size={14} color="#8ac3ff" />
                      <Text style={styles.rewardChipText}>{quest.rank}</Text>
                      <IconTooltip text="Minimum Adventurer Rank to access this quest." />
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="account-arrow-up-outline" size={14} color="#b5dc8b" />
                      <Text style={styles.rewardChipText}>Lv {quest.minLevel}</Text>
                      <IconTooltip text="Minimum player level to unlock this quest." />
                    </View>
                  </View>

                  <View style={styles.meterBlock}>
                    <View style={styles.meterLabelRow}>
                      <Text style={styles.meterLabel}>Success Chance</Text>
                      <Text style={styles.meterLabel}>{successChance}%</Text>
                    </View>
                    <ProgressBar value={successChance} max={100} />
                  </View>

                  <View style={styles.requirementsBlock}>
                    <Text style={styles.reqTitle}>Guaranteed Rewards</Text>
                    <View style={styles.chipsRow}>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="cash-multiple" size={14} color={colors.gold} />
                        <Text style={styles.rewardChipText}>+{quest.reward.gold}g</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="star-circle-outline" size={14} color="#8ac3ff" />
                        <Text style={styles.rewardChipText}>+{quest.reward.xp} XP</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="school-outline" size={14} color="#ffcf7a" />
                        <Text style={styles.rewardChipText}>+{quest.reward.masteryXp} Mastery</Text>
                      </View>
                    </View>
                  </View>

                  {quest.requiredItems.length > 0 ? (
                    <View style={styles.requirementsBlock}>
                      <Text style={styles.reqTitle}>Key Items</Text>
                      <View style={styles.requirementsRow}>
                        {quest.requiredItems.map((requirement) => {
                          const item = ITEM_BY_ID[requirement.itemId];
                          const owned = character.inventory[requirement.itemId] ?? 0;
                          const satisfied = owned >= requirement.needed;
                          return (
                            <View key={`${quest.id}-${requirement.itemId}`} style={styles.reqItem}>
                              <GameItemIcon itemId={requirement.itemId} size={14} />
                              <IconTooltip
                                text={`${item?.name ?? requirement.itemId}: ${owned}/${requirement.needed} owned. Key items heavily influence success.`}
                              />
                              <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                                {owned}/{requirement.needed}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.gatherHint}>No key items required. Great for steady farming.</Text>
                  )}

                  {quest.recommendedItems && quest.recommendedItems.length > 0 ? (
                    <View style={styles.requirementsBlock}>
                      <Text style={styles.reqTitle}>Optional Supplies</Text>
                      <View style={styles.requirementsRow}>
                        {quest.recommendedItems.map((requirement) => {
                          const item = ITEM_BY_ID[requirement.itemId];
                          const owned = character.inventory[requirement.itemId] ?? 0;
                          const satisfied = owned >= requirement.needed;
                          return (
                            <View key={`${quest.id}-optional-${requirement.itemId}`} style={styles.reqItem}>
                              <GameItemIcon itemId={requirement.itemId} size={14} />
                              <IconTooltip
                                text={`${item?.name ?? requirement.itemId}: ${owned}/${requirement.needed} owned. Optional supplies provide bonus success chance.`}
                              />
                              <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                                {owned}/{requirement.needed}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  {quest.itemRewards.length > 0 ? (
                    <View style={styles.requirementsBlock}>
                      <Text style={styles.reqTitle}>Possible Reward Drops</Text>
                      <View style={styles.requirementsRow}>
                        {quest.itemRewards.map((reward) => {
                          const rewardItem = ITEM_BY_ID[reward.itemId];
                          const rewardRarity = rewardItem?.rarity ?? "common";
                          return (
                            <View
                              key={`${quest.id}-reward-${reward.itemId}`}
                              style={[
                                styles.rewardItem,
                                { borderColor: rarityColorMap[rewardRarity] },
                              ]}
                            >
                              <GameItemIcon itemId={reward.itemId} size={14} />
                              <Text style={styles.rewardItemName} numberOfLines={1}>
                                {rewardItem?.name ?? reward.itemId}
                              </Text>
                              <View style={[styles.rewardGradePill, { borderColor: rarityColorMap[rewardRarity] }]}>
                                <Text style={[styles.rewardGradeText, { color: rarityColorMap[rewardRarity] }]}>
                                  {rewardRarity.toUpperCase()}
                                </Text>
                              </View>
                              <Text style={styles.rewardChanceText}>
                                {Math.round(reward.chance * 100)}%
                              </Text>
                              <IconTooltip
                                text={`${rewardItem?.name ?? reward.itemId} (${rewardRarity.toUpperCase()}) drop chance: ${Math.round(
                                  reward.chance * 100,
                                )}% • Amount: ${reward.amount}`}
                              />
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  {blocked ? (
                    <View style={styles.lockRow}>
                      <MaterialCommunityIcons name="lock-outline" size={14} color="#ff9b92" />
                      <Text style={styles.lockText}>{access.reason}</Text>
                    </View>
                  ) : null}

                  <Pressable disabled={Boolean(activeQuest) || blocked} onPress={() => handleStartQuest(quest.id)} style={styles.actionWrap}>
                    <View style={[styles.startButton, activeQuest || blocked ? styles.actionDisabled : null]}>
                      <Text style={styles.startText}>
                        {blocked ? "Locked" : activeQuest ? "On a Quest" : "Take This Quest"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </>
        ) : guildTab === "store" ? (
          <View style={styles.storeShell}>
            <View style={styles.storeIntro}>
              <Image source={CURRENCY_SPRITES.gold} style={styles.storeIntroSprite} resizeMode="contain" />
              <Text style={styles.storeIntroText}>Gold: {character.gold}</Text>
              <View style={styles.storeIntroTip}>
                <IconTooltip text="Store stocks materials and class weapons. Equipped class weapons boost quest success chance." />
              </View>
            </View>
            {lastPurchaseText ? (
              <View style={styles.purchaseEcho}>
                <MaterialCommunityIcons name="cart-check" size={16} color="#93efb7" />
                <Text style={styles.purchaseEchoText}>{lastPurchaseText}</Text>
              </View>
            ) : null}

            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Weapons</Text>
                <Text style={styles.storeSectionSub}>Guild armory stock</Text>
              </View>
              {weaponEntries.map((entry) => {
                const item = ITEM_BY_ID[entry.itemId];
                const owned = character.inventory[entry.itemId] ?? 0;
                const isClassLocked = Boolean(
                  entry.classRestriction && character.classId !== entry.classRestriction,
                );
                const isEquipped = character.equippedWeaponId === entry.itemId;
                const isWeapon = item?.category === "weapon";
                const isAlreadyOwnedWeapon = isWeapon && owned > 0;
                const isActionDisabled = isClassLocked || isAlreadyOwnedWeapon || isBuying;
                const rarity = item?.rarity ?? "common";
                const isLegendary = rarity === "legendary";
                const weaponScale =
                  character.progression.level >= (item?.requiredLevel ?? 1) ? 1 : 0.25;
                const baseWeaponAttack = item?.weaponStats?.attack ?? 0;
                const baseWeaponCrit = item?.weaponStats?.crit ?? 0;
                const baseWeaponSpeed = item?.weaponStats?.speed ?? 0;
                const weaponAttack = Math.round(baseWeaponAttack * weaponScale);
                const weaponCrit = Math.round(baseWeaponCrit * weaponScale);
                const weaponSpeed = Math.round(baseWeaponSpeed * weaponScale);

                return (
                  <View
                    key={`${entry.id}-weapon`}
                    style={[styles.offerCard, !isLegendary ? { borderColor: rarityColorMap[rarity] } : null]}
                  >
                    <LinearGradient
                      pointerEvents="none"
                      colors={["rgba(215, 159, 80, 0.12)", "rgba(103, 69, 159, 0.06)", "rgba(24, 17, 39, 0.02)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    <View
                      style={[
                        styles.offerVisualWrap,
                        !isLegendary ? { borderColor: rarityColorMap[rarity] } : null,
                        isLegendary ? styles.legendaryGlow : null,
                      ]}
                    >
                      {item?.image ? (
                        <Image
                          source={item.image}
                          style={[styles.offerImage, !isLegendary ? { borderColor: rarityColorMap[rarity] } : null]}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.offerIcon, !isLegendary ? { borderColor: rarityColorMap[rarity] } : null]}>
                          <MaterialCommunityIcons
                            name={(item?.icon ?? "package-variant-closed") as keyof typeof MaterialCommunityIcons.glyphMap}
                            size={18}
                            color="#ffe091"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.offerMain}>
                      <View style={styles.offerTitleRow}>
                        <Text style={styles.offerTitle}>{entry.label}</Text>
                        <View style={styles.storeTipWrap}>
                          <IconTooltip text={`${item?.name ?? entry.itemId}. ${entry.sellText}`} />
                        </View>
                      </View>
                      <View style={styles.offerBadgeRow}>
                        <View style={[styles.rarityPill, { borderColor: rarityColorMap[rarity] }]}>
                          <Text style={[styles.rarityText, { color: rarityColorMap[rarity] }]}>
                            {rarity.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.levelPill}>
                          <Text style={styles.levelPillText}>LV {item?.requiredLevel ?? 1}+</Text>
                        </View>
                        {entry.classRestriction ? (
                          <View style={styles.classPill}>
                            <Text style={styles.classPillText}>{entry.classRestriction.toUpperCase()}</Text>
                          </View>
                        ) : null}
                        {owned > 0 ? (
                          <View style={styles.ownedPill}>
                            <Text style={styles.ownedPillText}>OWNED x{owned}</Text>
                          </View>
                        ) : null}
                        {isEquipped ? (
                          <View style={styles.equippedPill}>
                            <Text style={styles.equippedPillText}>EQUIPPED</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.offerMeta} numberOfLines={1}>
                        {entry.sellText}
                      </Text>
                      {isWeapon ? (
                        <View style={styles.weaponStatRow}>
                          <View style={styles.weaponStatChip}>
                            <MaterialCommunityIcons name="sword-cross" size={13} color={colors.gold} />
                            <Text style={styles.weaponStatText}>ATK {baseWeaponAttack}</Text>
                            <Text style={styles.weaponStatApplied}>now +{weaponAttack}</Text>
                          </View>
                          <View style={styles.weaponStatChip}>
                            <MaterialCommunityIcons name="star-four-points-outline" size={13} color="#ff78c9" />
                            <Text style={styles.weaponStatText}>CRIT {baseWeaponCrit}%</Text>
                            <Text style={styles.weaponStatApplied}>now +{weaponCrit}%</Text>
                          </View>
                          <View style={styles.weaponStatChip}>
                            <MaterialCommunityIcons name="run-fast" size={13} color="#8de9a8" />
                            <Text style={styles.weaponStatText}>SPD {baseWeaponSpeed}</Text>
                            <Text style={styles.weaponStatApplied}>now +{weaponSpeed}</Text>
                          </View>
                          <IconTooltip
                            text={`Base stats are the weapon's full power. "now" shows what you currently get after proficiency scaling. If your level is below the requirement, you only receive 25% until you meet it.`}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {lastPurchasedItemId === entry.itemId ? (
                        <View style={styles.purchasedBadge}>
                          <Text style={styles.purchasedBadgeText}>PURCHASED</Text>
                        </View>
                      ) : null}
                      <Pressable onPress={() => handleBuy(entry.itemId, entry.unitPrice, entry.classRestriction)} style={styles.actionWrap} disabled={isActionDisabled}>
                        <View style={[styles.buyButton, isActionDisabled ? styles.actionDisabled : null]}>
                          <Text style={styles.buyText}>
                            {isClassLocked ? "Locked" : isAlreadyOwnedWeapon ? "Owned" : "Buy"}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Materials</Text>
                <Text style={styles.storeSectionSub}>Restock quest supplies</Text>
              </View>
              {materialEntries.map((entry) => {
                const item = ITEM_BY_ID[entry.itemId];
                const owned = character.inventory[entry.itemId] ?? 0;
                const rarity = item?.rarity ?? "common";
                const isLegendary = rarity === "legendary";
                return (
                  <View
                    key={`${entry.id}-mat`}
                    style={[
                      styles.offerCardMaterial,
                      { borderColor: rarityColorMap[rarity] },
                      isLegendary ? styles.legendaryGlow : null,
                    ]}
                  >
                    <LinearGradient
                      pointerEvents="none"
                      colors={["rgba(198, 142, 67, 0.09)", "rgba(88, 56, 141, 0.05)", "rgba(23, 16, 37, 0.02)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    {item?.image ? (
                      <Image source={item.image} style={styles.offerIconImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.offerIcon}>
                        <MaterialCommunityIcons
                          name={(item?.icon ?? "package-variant-closed") as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={18}
                          color="#ffe091"
                        />
                      </View>
                    )}
                    <View style={styles.offerMain}>
                      <View style={styles.offerTitleRow}>
                        <Text style={styles.offerTitle}>{entry.label}</Text>
                        <View style={styles.storeTipWrap}>
                          <IconTooltip text={`${item?.name ?? entry.itemId}. ${entry.sellText}`} />
                        </View>
                      </View>
                      <View style={styles.offerBadgeRow}>
                        <View style={[styles.rarityPill, { borderColor: rarityColorMap[rarity] }]}>
                          <Text style={[styles.rarityText, { color: rarityColorMap[rarity] }]}>
                            {rarity.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.ownedPill}>
                          <Text style={styles.ownedPillText}>OWNED x{owned}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {lastPurchasedItemId === entry.itemId ? (
                        <View style={styles.purchasedBadge}>
                          <Text style={styles.purchasedBadgeText}>PURCHASED</Text>
                        </View>
                      ) : null}
                      <Pressable
                        onPress={() => handleBuy(entry.itemId, entry.unitPrice, entry.classRestriction)}
                        style={styles.actionWrap}
                        disabled={isBuying}
                      >
                        <View style={[styles.buyButton, isBuying ? styles.actionDisabled : null]}>
                          <Text style={styles.buyText}>Buy</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Buffs</Text>
                <Text style={styles.storeSectionSub}>Enhancements for adventurer loadout</Text>
              </View>
              {buffEntries.map((entry) => {
                const item = ITEM_BY_ID[entry.itemId];
                const owned = character.inventory[entry.itemId] ?? 0;
                const rarity = item?.rarity ?? "common";
                const isLegendary = rarity === "legendary";
                const isActionDisabled = owned > 0 || isBuying;

                return (
                  <View
                    key={`${entry.id}-buff`}
                    style={[
                      styles.offerCardMaterial,
                      { borderColor: rarityColorMap[rarity] },
                      isLegendary ? styles.legendaryGlow : null,
                    ]}
                  >
                    <LinearGradient
                      pointerEvents="none"
                      colors={["rgba(198, 142, 67, 0.09)", "rgba(88, 56, 141, 0.05)", "rgba(23, 16, 37, 0.02)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    <GameItemIcon itemId={entry.itemId} size={22} />
                    <View style={styles.offerMain}>
                      <View style={styles.offerTitleRow}>
                        <Text style={styles.offerTitle}>{entry.label}</Text>
                        <View style={styles.storeTipWrap}>
                          <IconTooltip text={`${entry.sellText}`} />
                        </View>
                      </View>
                      <View style={styles.offerBadgeRow}>
                        <View style={[styles.rarityPill, { borderColor: rarityColorMap[rarity] }]}>
                          <Text style={[styles.rarityText, { color: rarityColorMap[rarity] }]}>
                            {rarity.toUpperCase()}
                          </Text>
                        </View>
                        {owned > 0 ? (
                          <View style={styles.ownedPill}>
                            <Text style={styles.ownedPillText}>OWNED x{owned}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.weaponStatApplied}>
                        DMG +{item?.buffStats?.damageFlat ?? 0} • CRIT +{item?.buffStats?.critFlat ?? 0}% • SPD +{item?.buffStats?.speedFlat ?? 0} • QUEST +{item?.buffStats?.questSuccessFlat ?? 0}%
                      </Text>
                      <Text style={styles.weaponStatApplied}>
                        Duration {Math.floor((item?.buffDurationSeconds ?? 0) / 60)}m {(item?.buffDurationSeconds ?? 0) % 60}s
                      </Text>
                    </View>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {lastPurchasedItemId === entry.itemId ? (
                        <View style={styles.purchasedBadge}>
                          <Text style={styles.purchasedBadgeText}>PURCHASED</Text>
                        </View>
                      ) : null}
                      <Pressable
                        onPress={() => handleBuy(entry.itemId, entry.unitPrice, entry.classRestriction)}
                        style={styles.actionWrap}
                        disabled={isActionDisabled}
                      >
                        <View style={[styles.buyButton, isActionDisabled ? styles.actionDisabled : null]}>
                          <Text style={styles.buyText}>{owned > 0 ? "Owned" : "Buy"}</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.storeShell}>
            <View style={styles.towerProgressCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(215, 158, 79, 0.11)", "rgba(103, 67, 157, 0.06)", "rgba(26, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.towerProgressHead}>
                <Text style={styles.storeSectionTitle}>Tower Climb</Text>
                <Text style={styles.storeSectionSub}>
                  Cleared: {character.towerProgress?.highestFloorCleared ?? 0}/{towerFloors.length}
                </Text>
              </View>
              <View style={styles.chipsRow}>
                <View style={styles.rewardChip}>
                  <MaterialCommunityIcons name="stairs" size={14} color="#ffd27d" />
                  <Text style={styles.rewardChipText}>{towerFloors.length} Floors</Text>
                </View>
                <View style={styles.rewardChip}>
                  <MaterialCommunityIcons name="sword-cross" size={14} color="#ffd27d" />
                  <Text style={styles.rewardChipText}>Clear Waves</Text>
                </View>
                <View style={styles.rewardChip}>
                  <MaterialCommunityIcons name="crown-outline" size={14} color="#ffdb88" />
                  <Text style={styles.rewardChipText}>Defeat Boss</Text>
                </View>
              </View>
            </View>

            <View style={styles.towerProgressCard}>
              <Text style={styles.reqTitle}>Buff Activation</Text>
              {equippedBuffIds.length === 0 ? (
                <Text style={styles.questMeta}>No buffs equipped. Equip buffs in Inventory first.</Text>
              ) : (
                <View style={styles.requirementsRow}>
                  {equippedBuffIds.map((buffId) => {
                    const buff = ITEM_BY_ID[buffId];
                    if (!buff) {
                      return null;
                    }
                    const active = isBuffActive(character, buffId, nowMs);
                    const remaining = getBuffRemainingSeconds(character, buffId, nowMs);
                    return (
                      <View key={`tower-buff-${buffId}`} style={[styles.buffTowerCard, active ? styles.buffTowerCardActive : null]}>
                        <View style={styles.buffTowerHead}>
                          <GameItemIcon itemId={buffId} size={16} />
                          <Text style={styles.buffTowerName} numberOfLines={1}>{buff.name}</Text>
                        </View>
                        <Text style={styles.buffTowerMeta}>
                          {active
                            ? `Active ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                            : remaining > 0
                              ? `Paused ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
                              : "Ready"}
                        </Text>
                        <Pressable
                          onPress={() => (active ? handleDeactivateBuff(buffId) : handleActivateBuff(buffId))}
                          style={styles.actionWrap}
                        >
                          <View style={[styles.buyButton, active ? styles.pauseBuffButton : null]}>
                            <Text style={styles.buyText}>{active ? "Deactivate" : remaining > 0 ? "Resume" : "Activate"}</Text>
                          </View>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.towerProgressCard}>
              <Text style={styles.reqTitle}>Active Buff Effects</Text>
              {activeBuffIds.length === 0 ? (
                <Text style={styles.questMeta}>No active buffs. Activate buffs above before tower attempts.</Text>
              ) : (
                <>
                  <View style={styles.requirementsRow}>
                    {activeBuffIds.map((buffId) => (
                      <View key={`tower-active-${buffId}`} style={styles.rewardChip}>
                        <GameItemIcon itemId={buffId} size={14} />
                        <Text style={styles.rewardChipText}>{ITEM_BY_ID[buffId]?.name ?? buffId}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chipsRow}>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="sword-cross" size={14} color="#ffd27d" />
                      <Text style={styles.rewardChipText}>DMG +{combat.buffBonuses.damageFlat}</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#ff78c9" />
                      <Text style={styles.rewardChipText}>CRIT +{combat.buffBonuses.critFlat}%</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="run-fast" size={14} color="#8de9a8" />
                      <Text style={styles.rewardChipText}>SPD +{combat.buffBonuses.speedFlat}</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="target-account" size={14} color="#8ec8ff" />
                      <Text style={styles.rewardChipText}>SUCCESS +{combat.buffBonuses.questSuccessFlat}%</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.towerProgressCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(201, 145, 69, 0.1)", "rgba(91, 59, 147, 0.06)", "rgba(24, 17, 39, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <Text style={styles.reqTitle}>Weapon Proficiency</Text>
              {equippedWeapon && equippedWeapon.category === "weapon" ? (
                <View style={styles.chipsRow}>
                  <View style={styles.rewardChip}>
                    <GameItemIcon itemId={equippedWeapon.id} size={14} />
                    <Text style={styles.rewardChipText}>{equippedWeapon.name}</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="account-arrow-up-outline" size={14} color="#8ec8ff" />
                    <Text style={styles.rewardChipText}>Req Lv {equippedWeapon.requiredLevel ?? 1}+</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons
                      name={weaponProficiency < 100 ? "alert-circle-outline" : "check-decagram"}
                      size={14}
                      color={weaponProficiency < 100 ? "#ffb48f" : "#8de9a8"}
                    />
                    <Text style={styles.rewardChipText}>{weaponProficiency}% Proficiency</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.questMeta}>No weapon equipped. Proficiency bonuses are inactive.</Text>
              )}
            </View>

            {towerCompleted ? (
              <View style={styles.towerProgressCard}>
                <Text style={styles.outcomeTitle}>Tower Conquered</Text>
                <Text style={styles.questMeta}>All currently available floors are cleared.</Text>
              </View>
            ) : currentTowerFloor ? (
              (() => {
                const successChance = getTowerSuccessChance(currentTowerFloor.floorNumber);
                const access = getTowerAccess(currentTowerFloor.floorNumber);
                const blocked = !access.allowed;

                return (
                  <View style={styles.towerProgressCard}>
                    <View style={styles.towerFloorHead}>
                      <Text style={styles.questTitle}>Floor {currentTowerFloor.floorNumber}: {currentTowerFloor.title}</Text>
                      <View style={styles.typePill}>
                        <Text style={styles.typePillText}>Lv {currentTowerFloor.minLevel}+</Text>
                      </View>
                    </View>

                    <View style={styles.chipsRow}>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="lightning-bolt" size={14} color="#ffd27d" />
                        <Text style={styles.rewardChipText}>{currentTowerFloor.staminaCost}</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="sword-cross" size={14} color="#ffd27d" />
                        <Text style={styles.rewardChipText}>{currentTowerFloor.normalEnemies.length} mobs</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="skull-outline" size={14} color="#ffb48f" />
                        <Text style={styles.rewardChipText}>{currentTowerFloor.subBosses.length} sub-boss</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="crown-outline" size={14} color="#ffdb88" />
                        <Text style={styles.rewardChipText}>{currentTowerFloor.mainBosses.length} boss</Text>
                      </View>
                    </View>

                    <View style={styles.meterBlock}>
                      <View style={styles.meterLabelRow}>
                        <Text style={styles.meterLabel}>Conquest Chance</Text>
                        <Text style={styles.meterLabel}>{successChance}%</Text>
                      </View>
                      <ProgressBar value={successChance} max={100} />
                    </View>

                    <Text style={styles.reqTitle}>Required Supplies</Text>
                    <View style={styles.requirementsRow}>
                      {currentTowerFloor.requiredItems.map((requirement) => {
                        const item = ITEM_BY_ID[requirement.itemId];
                        const owned = character.inventory[requirement.itemId] ?? 0;
                        const satisfied = owned >= requirement.needed;
                        return (
                          <View key={`${currentTowerFloor.id}-${requirement.itemId}`} style={styles.reqItem}>
                            <GameItemIcon itemId={requirement.itemId} size={14} />
                            <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                              {item?.name ?? requirement.itemId} {owned}/{requirement.needed}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <Text style={styles.reqTitle}>Enemy Waves</Text>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <MaterialCommunityIcons name="sword-cross" size={14} color="#ffd27d" />
                        <Text style={styles.reqTitle}>Normal</Text>
                      </View>
                      <View style={styles.requirementsRow}>
                        {currentTowerFloor.normalEnemies.map((enemy) => (
                          <View key={`${currentTowerFloor.id}-normal-${enemy}`} style={styles.reqItem}>
                            <MaterialCommunityIcons name="sword" size={12} color="#ffd27d" />
                            <Text style={styles.reqText}>{enemy}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <MaterialCommunityIcons name="skull-outline" size={14} color="#ffb48f" />
                        <Text style={styles.reqTitle}>Sub-Boss</Text>
                      </View>
                      <View style={styles.requirementsRow}>
                        {currentTowerFloor.subBosses.map((enemy) => (
                          <View key={`${currentTowerFloor.id}-sub-${enemy}`} style={styles.reqItem}>
                            <MaterialCommunityIcons name="skull" size={12} color="#ffb48f" />
                            <Text style={styles.reqText}>{enemy}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <MaterialCommunityIcons name="crown-outline" size={14} color="#ffdb88" />
                        <Text style={styles.reqTitle}>Main Boss</Text>
                      </View>
                      <View style={styles.requirementsRow}>
                        {currentTowerFloor.mainBosses.map((enemy) => (
                          <View key={`${currentTowerFloor.id}-boss-${enemy}`} style={styles.reqItem}>
                            <MaterialCommunityIcons name="crown" size={12} color="#ffdb88" />
                            <Text style={styles.reqText}>{enemy}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {blocked ? (
                      <View style={styles.lockRow}>
                        <MaterialCommunityIcons name="lock-outline" size={14} color="#ff9b92" />
                        <Text style={styles.lockText}>{access.reason}</Text>
                      </View>
                    ) : null}

                    <Pressable
                      onPress={() => handleConquerTowerFloor(currentTowerFloor.floorNumber)}
                      style={styles.actionWrap}
                      disabled={blocked}
                    >
                      <View style={[styles.startButton, blocked ? styles.actionDisabled : null]}>
                        <Text style={styles.startText}>{blocked ? "Locked" : "Conquer Floor"}</Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })()
            ) : null}

            {lastTowerOutcome ? (
              <View style={styles.outcomeCard}>
                <Text style={[styles.outcomeTitle, lastTowerOutcome.success ? styles.ok : styles.fail]}>
                  Floor {lastTowerOutcome.floorNumber} • {lastTowerOutcome.success ? "Conquered" : "Failed"}
                </Text>
                <Text style={styles.outcomeText}>{lastTowerOutcome.summary}</Text>
              </View>
            ) : null}
          </View>
        )}

      </ScrollView>
      {lastQuestOutcome ? (
        <Modal visible={questResultOpen} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.13)", "rgba(96, 64, 154, 0.08)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <Text style={[styles.resultTitle, lastQuestOutcome.success ? styles.ok : styles.fail]}>
                {lastQuestOutcome.success ? "Quest Cleared" : "Quest Failed"}
              </Text>
              <Text style={styles.resultChance}>Final Success Chance: {lastQuestOutcome.successChance}%</Text>
              <Text style={styles.outcomeText}>{lastQuestOutcome.summary}</Text>

              {lastQuestOutcome.rewards ? (
                <View style={styles.resultRewardsWrap}>
                  <Text style={styles.reqTitle}>
                    {lastQuestOutcome.rewards.consolation ? "Consolation Rewards" : "Rewards Earned"}
                  </Text>
                  <View style={styles.resultRewardGrid}>
                    <View style={styles.resultRewardCard}>
                      <Image source={CURRENCY_SPRITES.gold} style={styles.resultRewardSprite} resizeMode="contain" />
                      <Text style={styles.resultRewardLabel}>Gold Received</Text>
                      <Text style={styles.resultRewardValue}>+{lastQuestOutcome.rewards.gold}g</Text>
                    </View>
                    <View style={styles.resultRewardCard}>
                      <MaterialCommunityIcons name="star-circle-outline" size={14} color="#8ac3ff" />
                      <Text style={styles.resultRewardLabel}>XP Gained</Text>
                      <Text style={styles.resultRewardValue}>+{lastQuestOutcome.rewards.xp}</Text>
                    </View>
                    <View style={styles.resultRewardCard}>
                      <MaterialCommunityIcons name="school-outline" size={14} color="#ffcf7a" />
                      <Text style={styles.resultRewardLabel}>Mastery XP</Text>
                      <Text style={styles.resultRewardValue}>+{lastQuestOutcome.rewards.masteryXp}</Text>
                    </View>
                  </View>
                  {lastQuestOutcome.rewards.itemDrops.length > 0 ? (
                    <View style={styles.requirementsBlock}>
                      <Text style={styles.reqTitle}>Item Drops</Text>
                      <View style={styles.requirementsRow}>
                        {lastQuestOutcome.rewards.itemDrops.map((drop) => (
                          <View key={`drop-${drop.itemId}`} style={styles.resultDropCard}>
                            <GameItemIcon itemId={drop.itemId} size={20} />
                            <Text style={styles.resultDropName} numberOfLines={1}>
                              {ITEM_BY_ID[drop.itemId]?.name ?? drop.itemId}
                            </Text>
                            <Text style={styles.resultDropAmount}>
                              x{drop.amount}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Pressable onPress={() => setQuestResultOpen(false)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
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
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(70, 48, 23, 0.9)",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  guildTabWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7e6438",
    backgroundColor: "rgba(38, 28, 46, 0.95)",
  },
  guildTabWrapActive: {
    borderColor: "#d2a85a",
    backgroundColor: "rgba(74, 52, 24, 0.94)",
  },
  licenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    backgroundColor: "rgba(37, 28, 44, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  licenseText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  guildTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  guildTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  guildTabTextActive: {
    color: colors.textPrimary,
  },
  activeCard: {
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 14,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  questCard: {
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8d6f40",
    padding: 12,
    gap: 7,
    overflow: "hidden",
    position: "relative",
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  questTypeSprite: {
    width: 20,
    height: 20,
  },
  typePill: {
    marginLeft: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    backgroundColor: "rgba(70, 52, 24, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typePillText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  questTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  questMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(47, 35, 22, 0.9)",
    borderWidth: 1,
    borderColor: "#8d6f40",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rewardChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  meterBlock: {
    gap: 4,
  },
  meterLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meterLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  inlineLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requirementsBlock: {
    gap: 4,
    marginTop: 1,
  },
  reqTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  requirementsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  waveBlock: {
    gap: 5,
  },
  waveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reqItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7f643a",
    backgroundColor: "rgba(47, 35, 22, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(48, 36, 24, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  rewardItemName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 120,
  },
  rewardGradePill: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(13, 19, 38, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rewardGradeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  rewardChanceText: {
    color: "#d8c49f",
    fontSize: 10,
    fontWeight: "800",
  },
  reqText: {
    fontSize: 11,
    fontWeight: "700",
  },
  reqOk: {
    color: "#7de5a6",
  },
  reqMiss: {
    color: "#ff9b92",
  },
  gatherHint: {
    color: colors.accent,
    fontSize: 12,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9a5262",
    backgroundColor: "rgba(96, 44, 59, 0.62)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  lockText: {
    color: "#ffd0d4",
    fontSize: 12,
    fontWeight: "700",
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 8, 16, 0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  resultModal: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(35, 26, 49, 0.98)",
    padding: 14,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  resultChance: {
    color: "#d7c39f",
    fontSize: 12,
    fontWeight: "700",
  },
  resultRewardsWrap: {
    gap: 7,
    marginTop: 1,
  },
  resultRewardGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  resultRewardCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(51, 37, 20, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  resultRewardSprite: {
    width: 18,
    height: 18,
  },
  resultRewardLabel: {
    color: "#d9c8a9",
    fontSize: 10,
    fontWeight: "700",
  },
  resultRewardValue: {
    color: "#ffecc2",
    fontSize: 13,
    fontWeight: "900",
  },
  resultDropCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8d7243",
    backgroundColor: "rgba(48, 35, 21, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: "48%",
    flex: 1,
  },
  resultDropName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  resultDropAmount: {
    color: "#ffdf9e",
    fontSize: 11,
    fontWeight: "800",
  },
  outcomeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    backgroundColor: "rgba(43, 31, 54, 0.94)",
    padding: 10,
    gap: 4,
  },
  outcomeTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  outcomeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  ok: {
    color: "#7de5a6",
  },
  fail: {
    color: "#ff9b92",
  },
  claimButton: {
    marginTop: 2,
    minHeight: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
  },
  claimText: {
    color: "#fff2d2",
    fontSize: 14,
    fontWeight: "700",
  },
  actionWrap: {
    alignSelf: "stretch",
  },
  startButton: {
    marginTop: 3,
    minHeight: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
  },
  startText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.45,
  },
  storeShell: {
    gap: 12,
  },
  storeIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b6f3f",
    backgroundColor: "rgba(43, 31, 54, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  storeIntroText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  storeIntroSprite: {
    width: 18,
    height: 18,
  },
  storeIntroTip: {
    marginLeft: "auto",
  },
  purchaseEcho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4e9a72",
    backgroundColor: "rgba(21, 74, 48, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  purchaseEchoText: {
    color: "#e6ffe8",
    fontSize: 12,
    fontWeight: "700",
  },
  storeSection: {
    gap: 8,
  },
  storeSectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  towerProgressCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8b6f3f",
    backgroundColor: "rgba(36, 28, 46, 0.95)",
    padding: 10,
    gap: 7,
    overflow: "hidden",
    position: "relative",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  towerProgressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  towerFloorHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buffTowerCard: {
    minWidth: 132,
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#8d7244",
    backgroundColor: "rgba(48, 35, 22, 0.9)",
    padding: 8,
    gap: 6,
  },
  buffTowerCardActive: {
    borderColor: "#63c99a",
    backgroundColor: "rgba(24, 74, 50, 0.86)",
    shadowColor: "#6ee0ad",
    shadowOpacity: 0.45,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  buffTowerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buffTowerName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },
  buffTowerMeta: {
    color: "#d9c6a0",
    fontSize: 10,
    fontWeight: "700",
  },
  storeSectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  storeSectionSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#86683b",
    backgroundColor: "rgba(38, 28, 46, 0.97)",
    padding: 10,
    overflow: "hidden",
    position: "relative",
  },
  offerCardMaterial: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#86683b",
    backgroundColor: "rgba(38, 28, 46, 0.97)",
    padding: 10,
    overflow: "hidden",
    position: "relative",
  },
  offerImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a4814c",
    backgroundColor: "rgba(31, 23, 41, 0.94)",
  },
  offerVisualWrap: {
    borderRadius: 12,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#8f7040",
    padding: 2,
  },
  legendaryGlow: {
    shadowColor: "#ffd67a",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    backgroundColor: "rgba(255, 214, 122, 0.28)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 231, 170, 0.98)",
    padding: 3,
  },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#a4814c",
    backgroundColor: "rgba(31, 23, 41, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  offerIconImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a4814c",
    backgroundColor: "rgba(31, 23, 41, 0.94)",
  },
  offerMain: {
    flex: 1,
    gap: 3,
  },
  offerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  offerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  rarityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "rgba(7, 15, 35, 0.62)",
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  classPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9a7a45",
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "rgba(66, 49, 25, 0.84)",
  },
  levelPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b68e4f",
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "rgba(77, 56, 27, 0.88)",
  },
  levelPillText: {
    color: "#ffe6b9",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  classPillText: {
    color: "#f2dfb8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  offerTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
  offerMeta: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  weaponStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
    marginTop: 3,
  },
  weaponStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(59, 41, 20, 0.88)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  weaponStatText: {
    color: "#ffeac0",
    fontSize: 10,
    fontWeight: "800",
  },
  weaponStatApplied: {
    color: "#c7b089",
    fontSize: 9,
    fontWeight: "700",
  },
  ownedPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4f9f7f",
    backgroundColor: "rgba(26, 85, 63, 0.62)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ownedPillText: {
    color: "#a8e9bf",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  equippedPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b28a4b",
    backgroundColor: "rgba(78, 57, 29, 0.72)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  equippedPillText: {
    color: "#ffecc5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  offerAction: {
    alignItems: "flex-end",
    gap: 6,
  },
  purchasedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#66b98a",
    backgroundColor: "rgba(19, 81, 54, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  purchasedBadgeText: {
    color: "#b8ffd1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  storeTipWrap: {
    marginRight: 6,
  },
  storePrice: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
  },
  buyButton: {
    minWidth: 54,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(92, 64, 25, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pauseBuffButton: {
    borderColor: "#8edcb0",
    backgroundColor: "rgba(27, 95, 64, 0.92)",
  },
  buyText: {
    color: "#fff2d2",
    fontSize: 12,
    fontWeight: "800",
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
});
