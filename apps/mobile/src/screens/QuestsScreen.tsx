import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, ImageSourcePropType, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { HealthMeter } from "../components/HealthMeter";
import { IconTooltip } from "../components/IconTooltip";
import { ProgressBar } from "../components/ProgressBar";
import { StaminaMeter } from "../components/StaminaMeter";
import { GUILD_STORE_ITEMS } from "../data/guildStore";
import { CRAFT_RECIPES } from "../data/crafting";
import { FLOOR_INTEL } from "../data/floorIntel";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { GUILD_CORE_NPCS, getExaminerForRank, GuildNpcProfile } from "../data/guildPersonnel";
import { QUEST_BACKGROUND_ART } from "../data/questVisuals";
import { getMaxRankForLevel } from "../data/rankProgression";
import { TITLES, TITLE_BY_ID } from "../data/titles";
import { TITLE_ICON_ART } from "../data/titleVisuals";
import { CURRENCY_SPRITES, QUEST_TYPE_SPRITE, getAvatarSprite } from "../data/uiSprites";
import { ABILITY_BY_ID } from "../data/abilities";
import { FLOOR_CLEAR_STORY, FLOOR_ENTRY_LORE } from "../data/floorStory";
import {
  getEquippedPassiveBattleBonuses,
  getLiveBattleSkillProfile,
  getPendingAbilityBonuses,
  getPendingAbilityComboSummary,
  getPassiveBattleProfile,
  getUnlockedActiveSkills,
} from "../lib/abilities";
import type { LiveBattleSkillProfile } from "../lib/abilities";
import { isBuffActive } from "../lib/buffs";
import { isChoiceAllowedByAffinity } from "../lib/affinity";
import { s3AssetWithFallback } from "../lib/assetSource";
import { getAbilityAccent, getAbilityArtSource, getAbilityKindAccent } from "../lib/abilityVisuals";
import { getCharacterCombatStats } from "../lib/combat";
import { calculateTowerMechanicPressure } from "../services/gameService";
import {
  ActiveQuestState,
  AbilityId,
  AdventurerRank,
  BaseClassId,
  CharacterState,
  ClimberEntry,
  FloorEncounterEventDefinition,
  FloorIntelDefinition,
  ItemId,
  ItemRarity,
  QuestDefinition,
  QuestOutcome,
  RankUpOutcome,
  RankUpTrialDefinition,
  RescueNpcStatus,
  StoryState,
  StoryNpcProfile,
  TowerBattlePosition,
  TowerFloorDefinition,
  TowerEnemyUnit,
  TowerLiveBattleDirective,
  TowerOutcome,
  TowerWaveOutcome,
} from "../types/game";
import { colors } from "../theme/colors";

interface QuestsScreenProps {
  character: CharacterState;
  quests: QuestDefinition[];
  towerFloors: TowerFloorDefinition[];
  activeQuest: ActiveQuestState | null;
  lastQuestOutcome: QuestOutcome | null;
  lastTowerOutcome: TowerOutcome | null;
  lastRankUpOutcome: RankUpOutcome | null;
  completedQuestCount: number;
  getQuestSuccessChance: (questId: string, committedItems?: Record<ItemId, number>) => number;
  getQuestAccess: (questId: string) => { allowed: boolean; reason?: string };
  getTowerSuccessChance: (floorNumber: number, committedItems?: Record<ItemId, number>) => number;
  getTowerAccess: (floorNumber: number) => { allowed: boolean; reason?: string };
  getNextRankTrial: () => RankUpTrialDefinition | null;
  getRankTrialAccess: () => { allowed: boolean; reason?: string };
  getRankTrialSuccessChance: (committedItems?: Record<ItemId, number>) => number;
  buyGuildItem: (
    itemId: string,
    unitPrice: number,
    amount?: number,
    classRestriction?: BaseClassId,
  ) => { ok: boolean; reason?: string };
  sellGuildItem: (itemId: string, unitPrice: number, amount?: number) => { ok: boolean; reason?: string };
  onCraftRecipe: (recipeId: string) => { ok: boolean; reason?: string };
  onAppraiseItem: (itemId: ItemId) => { ok: boolean; reason?: string };
  onBuyFloorIntel: (floorNumber: number, price: number) => { ok: boolean; reason?: string };
  requestGuildMageRecovery: () => { ok: boolean; reason?: string };
  onActivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onDeactivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onUseQuestRushItem: (itemId?: ItemId) => { ok: boolean; reason?: string };
  onStartQuest: (questId: string, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  onClaimQuest: (forcedSuccess?: boolean, summaryOverride?: string) => { ok: boolean; reason?: string };
  onResolveLyraQuestChoice: (choice: "returned" | "kept" | "reported") => { ok: boolean; reason?: string };
  onResolveTowerWave: (
    floorNumber: number,
    wave: TowerWaveKey,
    committedItems?: Record<ItemId, number>,
    liveBattle?: TowerLiveBattleDirective,
  ) => { ok: boolean; reason?: string; outcome?: TowerWaveOutcome };
  onFinalizeTowerFloor: (floorNumber: number) => { ok: boolean; reason?: string };
  onAttemptRankUp: (committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  storyState: StoryState;
  onRecordNpcInteraction: (npcId: string, dispositionDelta?: number, interactionDelta?: number) => void;
  rescueNpcStatus: RescueNpcStatus;
  npcUnreadCount: number;
  onNpcTabOpened: () => void;
  onRespondRescueNpcRequest: (accept: boolean) => { ok: boolean; reason?: string; status?: RescueNpcStatus };
  onRespondThornRunnerIntroduction: (
    choice: "steady" | "mercenary",
  ) => { ok: boolean; reason?: string; choice?: "steady" | "mercenary" };
  onAcknowledgeThornRunnerFollowup: () => { ok: boolean; reason?: string };
  onAcknowledgeThornRunnerCorridorReport: () => { ok: boolean; reason?: string };
  onAcknowledgeThornRunnerDeepLaneWarning: () => { ok: boolean; reason?: string };
  onAcknowledgeThornRunnerFloorTwoAftermath: () => { ok: boolean; reason?: string };
  climberLeaderboard: Array<ClimberEntry & { isPlayer?: boolean; rank: number }>;
  activeFloorEncounter:
    | { encounter: FloorEncounterEventDefinition; attemptNumber: number; decision?: "accepted" | "declined" }
    | null;
  onRespondFloorEncounter: (floorNumber: number, encounterId: string, accept: boolean) => { ok: boolean; reason?: string };
  onRespondTowerConditionalEncounter: (
    encounterId: string,
    accept: boolean,
    contactStyle?: "rescued" | "disciplined",
  ) => { ok: boolean; reason?: string };
  encounteredNpcProfiles: StoryNpcProfile[];
  towerStatusEffects: NonNullable<TowerWaveOutcome["statusEffects"]>;
  towerPreparedItemIds: ItemId[];
  onTowerModeChange: (active: boolean) => void;
}

type GuildTab = "board" | "store" | "tower" | "npc" | "rank" | "leaderboard";
type StoreSubTab = "shop" | "workshop" | "intel";

type BoardRankFilter = "all" | AdventurerRank;
type BoardTypeFilter = "all" | QuestDefinition["type"];
type TowerRunStage = "entrance" | "briefing" | "waves";
type TowerWaveKey = "normal" | "subBoss" | "boss";
type LiveBattleTelegraph = {
  id: string;
  enemyId: string;
  enemyName: string;
  mechanic: string;
  recommendedItemId?: ItemId | null;
  suggestedPosition?: TowerBattlePosition;
  suggestedSkillClass?: BaseClassId | null;
  suggestedBrace?: boolean;
};
type LiveBattleStatusFx = {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: "good" | "bad" | "neutral";
  detail?: string;
  expiresAtMs?: number;
  stacks?: number;
};
type LiveTowerBattleSession = {
  source: "tower" | "quest";
  floorNumber: number;
  wave: TowerWaveKey;
  questId?: string;
  encounterTitle?: string;
  encounterSummary?: string;
  enemies: TowerEnemyUnit[];
  committedItems: Record<ItemId, number>;
  telegraphs: LiveBattleTelegraph[];
  activeIndex: number;
  position: TowerBattlePosition;
  braceUsed: boolean;
  skillUsed: boolean;
  responses: TowerLiveBattleDirective["responses"];
  turnOwner: "player" | "enemy";
  playerTurnsRemaining: number;
  enemyTurnsRemaining: number;
  playerStats: {
    damage: number;
    critChance: number;
    speed: number;
  };
  enemyStatsById: Record<string, { damage: number; critChance: number; speed: number; role: TowerEnemyUnit["role"] }>;
  playerHp: number;
  enemyHpById: Record<string, number>;
  playerStatusFx: LiveBattleStatusFx[];
  enemyStatusFxById: Record<string, LiveBattleStatusFx[]>;
  effectClockElapsedMs: number;
  effectClockStartedAtMs: number | null;
  initiativeHistory: Array<"player" | "enemy">;
  turnLog: string[];
  skillCooldownEndsAtMsById: Partial<Record<AbilityId, number>>;
  queuedEnemyIndex?: number | null;
  lastPlayerDamage?: number;
  lastEnemyDamage?: number;
  lastCrit?: boolean;
};
type TowerWaveReport = {
  wave: TowerWaveKey;
  title: string;
  countered: number;
  triggered: number;
  lines: string[];
  statusEffects?: NonNullable<TowerWaveOutcome["statusEffects"]>;
};

const RANK_ORDER: AdventurerRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];
const USE_SHARED_TOWER_WAVE_LAYOUT: boolean = true;
const hasReachedRank = (current: AdventurerRank, required?: AdventurerRank) =>
  !required || RANK_ORDER.indexOf(current) >= RANK_ORDER.indexOf(required);

const getVisibleQuestRanks = (rank: AdventurerRank): AdventurerRank[] => {
  const index = RANK_ORDER.indexOf(rank);
  if (index <= 0) {
    return ["F", "E"];
  }
  if (index >= RANK_ORDER.length - 1) {
    return [RANK_ORDER[index - 1], RANK_ORDER[index]];
  }
  return [RANK_ORDER[index - 1], RANK_ORDER[index], RANK_ORDER[index + 1]];
};

const getItemRarityAccent = (itemId: ItemId): { border: string; background: string; glow: string } => {
  const rarity = ITEM_BY_ID[itemId]?.rarity ?? "common";
  if (rarity === "legendary") {
    return { border: "#ffcb78", background: "rgba(120, 66, 12, 0.96)", glow: "#ffbf59" };
  }
  if (rarity === "epic") {
    return { border: "#d7a7ff", background: "rgba(79, 42, 116, 0.96)", glow: "#c58dff" };
  }
  if (rarity === "rare") {
    return { border: "#8fd6ff", background: "rgba(28, 74, 112, 0.96)", glow: "#72cbff" };
  }
  return { border: "#cfb280", background: "rgba(86, 63, 31, 0.96)", glow: "#d8bd8b" };
};

const formatRemaining = (msRemaining: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatRemainingDetailed = (msRemaining: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
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

const BRAN_STORE_DIALOG_LINES = [
  "Need supplies for your next climb? I can open the guild stockbook.",
  "You look understocked. Weapons, tonics, and rope are all in the ledger.",
  "Planning a push? Better buy before the tower takes your last potion.",
  "If you're going up, don't go empty-handed. I can open the store now.",
  "I've got what you need. Say the word and I'll bring up the inventory.",
  "Back again? Good. Survivors are the ones who prepare.",
  "You keep visiting this desk. That means you know preparation matters.",
  "If you're browsing, browse fast. My time and your life are both limited.",
  "Another check-in? Fine. Buy something useful this time.",
  "We're not running a museum here. Need gear or not?",
  "You've asked enough. Open the store or step aside.",
  "Last warning, adventurer. Stock up now or don't come back complaining.",
];

const EXAMINER_READY_DIALOG_LINES = [
  "Your records are in order. Your promotion trial is ready to begin.",
  "You meet the standards. I can authorize your rank trial now.",
  "You have the clears and level. The promotion desk is open.",
  "Requirements confirmed. Step forward when you are ready.",
  "You're qualified. Decide now: trial or delay.",
  "Good preparation. This is the right time to challenge promotion.",
  "You've earned this attempt. I can open your trial file.",
  "Solid progress. You're cleared for evaluation.",
  "You've met the gate. Don't lose momentum now.",
  "Qualified. If your resolve is real, prove it in the trial.",
  "Everything checks out. Promotion attempt is available.",
  "No objections from this office. Your move, adventurer.",
];

const EXAMINER_NOT_READY_DIALOG_LINES = [
  "You're not qualified yet. Complete your requirements and return.",
  "Insufficient progress. Come back when your record is complete.",
  "The office cannot authorize your trial at this time.",
  "Not yet. Finish what's required, then report again.",
  "Still short on qualifications. Return after proper preparation.",
  "Again? My answer hasn't changed. You're not ready.",
  "You're repeating the same request without meeting the gate.",
  "I will not waive standards. Return when you qualify.",
  "This is becoming a pattern. Complete your requirements first.",
  "Enough delays and excuses. Meet the conditions, then speak.",
  "You are wasting office time. Qualify before requesting again.",
  "Final reminder: no qualification, no trial. Dismissed.",
];

const EXAMINER_NO_TRIAL_DIALOG_LINES = [
  "No promotion trial is currently available for your rank.",
  "The board has no active advancement file for you right now.",
  "No further assessment is posted at this time.",
  "Your rank progression is paused until new directives arrive.",
  "There is no current trial order for this stage.",
  "No eligible trial in the ledger. Check back later.",
  "The office has no active promotion docket for you.",
  "Nothing to authorize right now.",
  "No pending rank challenge is available.",
  "Trial queue is empty for your profile.",
];

const pickEscalatingDialog = (lines: string[], interactionCount: number): string => {
  if (!lines.length) {
    return "";
  }
  const tierSize = Math.max(1, Math.floor(lines.length / 3));
  const tier = Math.min(2, Math.floor(Math.max(0, interactionCount - 1) / 3));
  const start = tier * tierSize;
  const end = tier === 2 ? lines.length : Math.min(lines.length, start + tierSize);
  const idx = start + Math.floor(Math.random() * Math.max(1, end - start));
  return lines[idx] ?? lines[0];
};

const TOWER_ENEMY_ROLE_ART: Record<TowerEnemyUnit["role"], ImageSourcePropType> = {
  normal: s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_10.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_10.png")),
  subBoss: s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_05.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_05.png")),
  boss: s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_07.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_07.png")),
};

const TOWER_ENEMY_ART: Partial<Record<string, ImageSourcePropType>> = {
  "f1-ash-rat": s3AssetWithFallback("game/tower/enemies/ash-rat-v3.png", require("../../assets/game/tower/enemies/ash-rat-v3.png")),
  "f1-gate-sentinel": s3AssetWithFallback("game/tower/enemies/gate-sentinel-v2.png", require("../../assets/game/tower/enemies/gate-sentinel-v2.png")),
  "f1-warden-of-sparks": s3AssetWithFallback("game/tower/enemies/warden-of-sparks-v3.png", require("../../assets/game/tower/enemies/warden-of-sparks-v3.png")),
};

const TOWER_ENEMY_ART_BY_NAME: Partial<Record<string, ImageSourcePropType>> = {
  "ash rat": s3AssetWithFallback("game/tower/enemies/ash-rat-v3.png", require("../../assets/game/tower/enemies/ash-rat-v3.png")),
  "dust crawler": s3AssetWithFallback("game/tower/enemies/dust-crawler-v2.png", require("../../assets/game/tower/enemies/dust-crawler-v2.png")),
};

const RESCUE_REQUEST_NPC_PROFILE: GuildNpcProfile = {
  id: "npc-aldric-vale",
  name: "Aldric Vale",
  title: "Desperate Father",
  role: "Rescue Petition",
  level: 5,
  avatarId: "warrior-3",
  classId: "warrior",
  sequenceId: 12,
  department: "story",
  licenseLabel: "Special Request License",
  authBody: "Guild Council • Distress Registry",
  signature: "A. Vale",
  avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00062.png", require("../../assets/game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00062.png")),
};
const WARRIOR_PATH_GUIDE_NPC_PROFILE: GuildNpcProfile = {
  id: "npc-path-guide-iris",
  name: "Instructor Iris",
  title: "Warpath Instructor",
  role: "Knight/Berserker Specialization Guide",
  level: 15,
  avatarId: "warrior-1",
  classId: "warrior",
  sequenceId: 13,
  department: "story",
  licenseLabel: "Path Guide License",
  authBody: "Guild War College • Path Council",
  signature: "I. Vale",
  avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00031.png", require("../../assets/game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00031.png")),
};
const SPECIAL_RESCUE_QUEST_ID = "quest-aldric-child-rescue";
const SPECIAL_NPC_QUEST_IDS = new Set([
  "quest-aldric-child-rescue",
  "quest-lyra-ember-maps",
  "quest-tamsin-snagline-recovery",
]);
const QUEST_BOARD_PREVIEW_IDS = new Set([
  "quest-cinder-vulture-cull",
  "quest-lamp-reliquary-descent",
  "hunt-leviathor-coiling-deep",
]);
const POSITION_LABELS: Record<TowerBattlePosition, string> = {
  front: "Front",
  mid: "Mid",
  rear: "Rear",
};
const getEnemyPositioningProfile = (enemy?: TowerEnemyUnit | null) => enemy?.positioning ?? null;
const getEnemyAdvantagePositions = (enemy?: TowerEnemyUnit | null) => getEnemyPositioningProfile(enemy)?.advantagePositions ?? [];
const getEnemyBlockedPositions = (enemy?: TowerEnemyUnit | null) => getEnemyPositioningProfile(enemy)?.blockedPositions ?? [];
const getPositionAttackBonus = (enemy: TowerEnemyUnit | undefined, position: TowerBattlePosition) => {
  if (!enemy || !getEnemyAdvantagePositions(enemy).includes(position)) {
    return 0;
  }
  if (enemy.role === "boss") {
    return 16;
  }
  if (enemy.role === "subBoss") {
    return 12;
  }
  return 8;
};
const describePositionRead = (enemy: TowerEnemyUnit | undefined, position: TowerBattlePosition) => {
  if (!enemy) {
    return null;
  }
  if (getEnemyBlockedPositions(enemy).includes(position)) {
    return `${enemy.name} closes the ${POSITION_LABELS[position].toLowerCase()} lane and prevents that shift.`;
  }
  if (getEnemyAdvantagePositions(enemy).includes(position)) {
    return `${POSITION_LABELS[position]} lane reads cleanly against ${enemy.name}. Hits from there land harder.`;
  }
  return `${POSITION_LABELS[position]} lane is open, but it gives you no special edge against ${enemy.name}.`;
};
const getLiveBattleSuggestion = (mechanic: string): Omit<LiveBattleTelegraph, "id" | "enemyId" | "enemyName" | "mechanic"> => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("poison bite")) {
    return { recommendedItemId: "antitoxin-vial", suggestedPosition: "rear", suggestedSkillClass: "ranger" };
  }
  if (keyword.includes("pack rush")) {
    return { suggestedBrace: true, suggestedPosition: "front", suggestedSkillClass: "warrior" };
  }
  if (keyword.includes("burrow")) {
    return { recommendedItemId: "torch", suggestedPosition: "rear", suggestedSkillClass: "ranger" };
  }
  if (keyword.includes("bulwark")) {
    return { recommendedItemId: "lockpick", suggestedSkillClass: "mage", suggestedPosition: "front" };
  }
  if (keyword.includes("crushing sweep")) {
    return { recommendedItemId: "guard-tonic", suggestedBrace: true, suggestedSkillClass: "warrior" };
  }
  if (keyword.includes("overcharge")) {
    return { recommendedItemId: "grounding-tonic", suggestedPosition: "mid", suggestedSkillClass: "mage" };
  }
  if (keyword.includes("spark field")) {
    return { recommendedItemId: "ward-charm", suggestedPosition: "mid", suggestedSkillClass: "mage" };
  }
  return { suggestedPosition: "mid" };
};

const buildLiveBattleTelegraphs = (enemies: TowerEnemyUnit[], estimatedTurnDamage: number): LiveBattleTelegraph[] =>
  enemies.flatMap((enemy) => {
    const mechanics = enemy.mechanics?.length ? enemy.mechanics : ["Direct Clash: standard enemy pressure."];
    const turnsNeeded = Math.max(1, Math.ceil((enemy.health ?? 1) / Math.max(1, estimatedTurnDamage)));
    return Array.from({ length: turnsNeeded }, (_, index) => {
      const mechanic = mechanics[index % mechanics.length];
      const suggestion = getLiveBattleSuggestion(mechanic);
      return {
        id: `${enemy.id}-${index}-${mechanic.replace(/\s+/g, "-").toLowerCase()}`,
        enemyId: enemy.id,
        enemyName: enemy.name,
        mechanic,
        ...suggestion,
        suggestedPosition: suggestion.suggestedPosition ?? enemy.positioning?.advantagePositions?.[0] ?? "mid",
      };
    });
  });
const ALDRIC_SPECIAL_BATTLES = [
  {
    waveLabel: "Wave 1",
    enemyId: "bandit-cutthroat",
    enemyName: "Bandit Cutthroat",
    enemyRole: "normal",
    enemyLevel: 3,
    enemyHealth: 34,
    turnsToDefeat: 2,
    playerDamagePerTurn: 18,
    damageTaken: 6,
    avatarId: "ranger-4" as const,
    classId: "ranger" as const,
    events: [
      {
        mechanic: "Fast Entry",
        positive: true,
        icon: "sprint",
        resultText: "You break through the trail edge before the cutthroat can lock the lane down.",
      },
      {
        mechanic: "Knife Rush",
        positive: false,
        icon: "knife-military",
        resultText: "A quick slash lands as the bandit tries to stall the rescue push.",
      },
      {
        mechanic: "Counter Drop",
        positive: true,
        icon: "sword-cross",
        resultText: "The cutthroat folds under pressure and the first gap opens toward the camp.",
      },
    ],
  },
  {
    waveLabel: "Wave 1",
    enemyId: "bandit-bruiser",
    enemyName: "Bandit Bruiser",
    enemyRole: "normal",
    enemyLevel: 4,
    enemyHealth: 42,
    turnsToDefeat: 3,
    playerDamagePerTurn: 16,
    damageTaken: 8,
    avatarId: "warrior-4" as const,
    classId: "warrior" as const,
    events: [
      {
        mechanic: "Heavy Block",
        positive: false,
        icon: "shield-alert-outline",
        resultText: "The bruiser plants himself in the lane and forces the rescue to slow down.",
      },
      {
        mechanic: "Pressure Shift",
        positive: true,
        icon: "swap-horizontal-bold",
        resultText: "You turn his guard aside and keep the route from closing completely.",
      },
      {
        mechanic: "Line Broken",
        positive: true,
        icon: "hammer-break",
        resultText: "The bruiser goes down and the outer camp line finally breaks.",
      },
    ],
  },
  {
    waveLabel: "Wave 2",
    enemyId: "watchtrail-butcher",
    enemyName: "Watchtrail Butcher",
    enemyRole: "boss",
    enemyLevel: 5,
    enemyHealth: 78,
    turnsToDefeat: 4,
    playerDamagePerTurn: 20,
    damageTaken: 12,
    avatarId: "warrior-3" as const,
    classId: "warrior" as const,
    events: [
      {
        mechanic: "Hostage Delay",
        positive: false,
        icon: "timer-sand",
        resultText: "The Butcher drags the rescue window out and tries to force you into a bad trade.",
      },
      {
        mechanic: "Drive Through",
        positive: true,
        icon: "run-fast",
        resultText: "You force the fight inward before the camp can fully reset around him.",
      },
      {
        mechanic: "Butcher's Stand",
        positive: false,
        icon: "skull-scan-outline",
        resultText: "He bleeds time with brutal swings and keeps the rescue on the edge of collapse.",
      },
      {
        mechanic: "Final Break",
        positive: true,
        icon: "star-four-points-circle-outline",
        resultText: "The leader finally breaks under sustained pressure and the lane opens at the last moment.",
      },
    ],
  },
] as const;
const LIVE_QUEST_ENCOUNTERS: Record<
  string,
  {
    title: string;
    summary: string;
    enemies: TowerEnemyUnit[];
    successSummary: string;
    failureSummary: string;
  }
> = {
  "quest-cinder-vulture-cull": {
    title: "Live Contract: Cull the Cinder Vulture Brood",
    summary: "Ash-caked carrion birds are swarming the ridge. Break the brood line before they can pin the trail in burning feathers.",
    enemies: [
      {
        id: "quest-cinder-vulture-scout",
        name: "Cinder Vulture Scout",
        role: "normal",
        level: 16,
        health: 88,
        icon: "bird",
        description: "A fast ash-feeding predator that dives low to blind and bleed climbers on open stone.",
        lore: "Scouts wheel ahead of the flock and slash vision away with ember-dust before the heavier birds descend.",
        weaknessNotes: ["They fold faster under steady grounded pressure than burst swings."],
        mechanics: [
          "Ash Wing Buffet: cinder grit reduces your attack rhythm if you let it land.",
          "Hooked Dive: a tearing pass that punishes weak footing.",
        ],
      },
      {
        id: "quest-cinder-vulture-brood-matron",
        name: "Cinder Vulture Matron",
        role: "subBoss",
        level: 18,
        health: 128,
        icon: "bird",
        description: "The brood matron circles above the ridge and drops in only when the lesser birds have opened flesh.",
        lore: "Old guild notes say the matrons learned to nest around ember vents and now treat climbing parties like intruders in a sacred feeding ground.",
        weaknessNotes: ["Break her momentum before she can reset into another pass."],
        mechanics: [
          "Ember Dive: a burning plunge that punishes anyone who stays exposed.",
          "Shriek of the Brood: pressure howl that throws off follow-up strikes.",
          "Scorch Talons: heavy rake that can snowball if you surrender tempo.",
        ],
      },
    ],
    successSummary:
      "You cut the brood out of Ashwind Ridge and the guild marks the route passable again. The carcasses leave enough remnant feather and ashbone to prove the kill.",
    failureSummary:
      "The ridge turns against you under circling wings and ember grit. The brood holds the air lane, forcing the guild to post the contract again.",
  },
};
const GUILD_MAGE_NPC_ID = "npc-mage-seraphine";
const QUARTERMASTER_BRAN_NPC_ID = "npc-quartermaster-bran";

type NpcDisposition = {
  label: string;
  score: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  flavor: string;
};

export const QuestsScreen = ({
  character,
  quests,
  towerFloors,
  activeQuest,
  lastQuestOutcome,
  lastTowerOutcome,
  lastRankUpOutcome,
  completedQuestCount,
  getQuestSuccessChance,
  getQuestAccess,
  getTowerSuccessChance,
  getTowerAccess,
  getNextRankTrial,
  getRankTrialAccess,
  getRankTrialSuccessChance,
  buyGuildItem,
  sellGuildItem,
  onCraftRecipe,
  onAppraiseItem,
  onBuyFloorIntel,
  requestGuildMageRecovery,
  onActivateBuff,
  onDeactivateBuff,
  onUseQuestRushItem,
  onStartQuest,
  onClaimQuest,
  onResolveLyraQuestChoice,
  onResolveTowerWave,
  onFinalizeTowerFloor,
  onAttemptRankUp,
  storyState,
  onRecordNpcInteraction,
  rescueNpcStatus,
  npcUnreadCount,
  onNpcTabOpened,
  onRespondRescueNpcRequest,
  onRespondThornRunnerIntroduction,
  onAcknowledgeThornRunnerFollowup,
  onAcknowledgeThornRunnerCorridorReport,
  onAcknowledgeThornRunnerDeepLaneWarning,
  onAcknowledgeThornRunnerFloorTwoAftermath,
  climberLeaderboard,
  activeFloorEncounter,
  onRespondFloorEncounter,
  onRespondTowerConditionalEncounter,
  encounteredNpcProfiles,
  towerStatusEffects,
  towerPreparedItemIds,
  onTowerModeChange,
}: QuestsScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [questClockMs, setQuestClockMs] = useState(() => Date.now());
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [isBuying, setIsBuying] = useState(false);
  const affinityScore = character.affinity ?? 0;
  const aldricChoices = [
    { accept: false, label: "Refuse", alignment: "evil" as const },
    { accept: true, label: "Accept Request", alignment: "good" as const },
  ].filter((entry) => isChoiceAllowedByAffinity(affinityScore, entry.alignment));
  const tamsinChoices = [
    { id: "steady" as const, label: "I'll bring it back clean.", alignment: "good" as const },
    { id: "mercenary" as const, label: "Just mark the pay.", alignment: "evil" as const },
  ].filter((entry) => isChoiceAllowedByAffinity(affinityScore, entry.alignment));
  const lyraChoices = [
    {
      id: "returned" as const,
      title: "Return It Unopened",
      text: "Give Lyra the satchel intact and let restraint speak for you.",
      colors: ["rgba(82, 125, 94, 0.95)", "rgba(41, 73, 50, 0.95)"] as const,
      alignment: "good" as const,
    },
    {
      id: "kept" as const,
      title: "Study It In Secret",
      text: "Learn from the ember routes first, then decide what to reveal.",
      colors: ["rgba(68, 74, 120, 0.95)", "rgba(39, 44, 82, 0.95)"] as const,
      alignment: "neutral" as const,
    },
    {
      id: "reported" as const,
      title: "Report It To Guild Command",
      text: "Put the satchel in official hands and accept what that will mean.",
      colors: ["rgba(129, 63, 63, 0.95)", "rgba(87, 36, 36, 0.95)"] as const,
      alignment: "evil" as const,
    },
  ].filter((entry) => isChoiceAllowedByAffinity(affinityScore, entry.alignment));
  const [lastPurchasedItemId, setLastPurchasedItemId] = useState<string | null>(null);
  const [lastPurchaseText, setLastPurchaseText] = useState("");
  const [lastCraftedItemId, setLastCraftedItemId] = useState<ItemId | null>(null);
  const [questResultOpen, setQuestResultOpen] = useState(false);
  const [pendingQuestResultOpen, setPendingQuestResultOpen] = useState(false);
  const [towerEncounterOpen, setTowerEncounterOpen] = useState(false);
  const [pendingTowerEncounterOpen, setPendingTowerEncounterOpen] = useState(false);
  const [revealedTowerPhases, setRevealedTowerPhases] = useState(0);
  const [conditionalEncounterOpen, setConditionalEncounterOpen] = useState(false);
  const [conditionalEncounterResolved, setConditionalEncounterResolved] = useState(false);
  const [activeConditionalEncounter, setActiveConditionalEncounter] = useState<TowerWaveOutcome["conditionalEncounter"] | null>(null);
  const [guildTab, setGuildTab] = useState<GuildTab>("npc");
  const [storeSubTab, setStoreSubTab] = useState<StoreSubTab>("shop");
  const [selectedItemsByQuest, setSelectedItemsByQuest] = useState<Record<string, Record<ItemId, number>>>({});
  const [selectedItemsForRankTrial, setSelectedItemsForRankTrial] = useState<Record<ItemId, number>>({});
  const [selectedItemsForTower, setSelectedItemsForTower] = useState<Record<string, Record<ItemId, number>>>({});
  const [selectedTowerEnemy, setSelectedTowerEnemy] = useState<TowerEnemyUnit | null>(null);
  const [towerEnemyArtExpanded, setTowerEnemyArtExpanded] = useState(false);
  const [towerRunStageByFloor, setTowerRunStageByFloor] = useState<Record<number, TowerRunStage>>({});
  const [towerWaveProgressByFloor, setTowerWaveProgressByFloor] = useState<
    Record<number, Record<TowerWaveKey, "locked" | "available" | "cleared">>
  >({});
  const [towerWaveReportsByFloor, setTowerWaveReportsByFloor] = useState<
    Record<number, Partial<Record<TowerWaveKey, TowerWaveReport>>>
  >({});
  const [waveResolveModal, setWaveResolveModal] = useState<TowerWaveOutcome | null>(null);
  const [liveTowerBattle, setLiveTowerBattle] = useState<LiveTowerBattleSession | null>(null);
  const [enemyTurnMeter, setEnemyTurnMeter] = useState(0);
  const [enemyTurnAnimating, setEnemyTurnAnimating] = useState(false);
  const [battleEffectHint, setBattleEffectHint] = useState<string | null>(null);
  const [battleStatusHint, setBattleStatusHint] = useState<string | null>(null);
  const [towerCollapseAftermath, setTowerCollapseAftermath] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [effectHint, setEffectHint] = useState<{ title: string; detail?: string } | null>(null);
  const { width: viewportWidth } = useWindowDimensions();
  const useWideTowerScout = Platform.OS === "web" && viewportWidth >= 1080;
  const [floorLoreOpenFor, setFloorLoreOpenFor] = useState<number | null>(null);
  const [rescueDialogOpen, setRescueDialogOpen] = useState(false);
  const [aldricBattleOpen, setAldricBattleOpen] = useState(false);
  const [aldricBattleRevealCount, setAldricBattleRevealCount] = useState(0);
  const [aldricBattleAutoResolving, setAldricBattleAutoResolving] = useState(false);
  const [guildDialog, setGuildDialog] = useState<
    "bran-store" | "examiner-rank" | "tamsin-floor2" | "tamsin-followup" | "tamsin-corridor-report" | "tamsin-deep-warning" | "tamsin-floor2-aftermath" | null
  >(null);
  const [branSpeakCount, setBranSpeakCount] = useState(0);
  const [examinerSpeakCount, setExaminerSpeakCount] = useState(0);
  const [branDialogLine, setBranDialogLine] = useState(BRAN_STORE_DIALOG_LINES[0]);
  const [examinerDialogLine, setExaminerDialogLine] = useState(EXAMINER_NOT_READY_DIALOG_LINES[0]);
  const [infoPanel, setInfoPanel] = useState<{ title: string; body: string; rarity?: ItemRarity; itemId?: ItemId } | null>(null);
  const [infoArtExpanded, setInfoArtExpanded] = useState(false);
  const [boardRankFilter, setBoardRankFilter] = useState<BoardRankFilter>("all");
  const [boardTypeFilter, setBoardTypeFilter] = useState<BoardTypeFilter>("all");
  const [collapsedBoardSections, setCollapsedBoardSections] = useState<Record<string, boolean>>({});
  const lyraChoicePending =
    lastQuestOutcome?.questId === "quest-lyra-ember-maps" &&
    lastQuestOutcome.success &&
    storyState.lyraQuestResolution === "unresolved";
  const lyraDecisionOutstanding = storyState.lyraQuestResolution === "unresolved";

  const getTowerEnemyArt = (enemy: TowerEnemyUnit): ImageSourcePropType | undefined =>
    TOWER_ENEMY_ART[enemy.id] ?? TOWER_ENEMY_ART_BY_NAME[enemy.name.trim().toLowerCase()] ?? TOWER_ENEMY_ROLE_ART[enemy.role];
  const rescueNpcVisible =
    rescueNpcStatus === "available" ||
    rescueNpcStatus === "refused_once" ||
    rescueNpcStatus === "accepted" ||
    storyState.aldricQuestPath === "saved" ||
    storyState.aldricQuestPath === "too_late";
  const warriorPathGuideVisible =
    character.classId === "warrior" &&
    character.progression.level >= 15 &&
    !character.warriorPathChoice;
  const rankExaminerProfile = getExaminerForRank(character.adventurerRank);
  const npcProfiles = useMemo(
    () => {
      const profiles: GuildNpcProfile[] = [...GUILD_CORE_NPCS, rankExaminerProfile];
      if (warriorPathGuideVisible) {
        profiles.push(WARRIOR_PATH_GUIDE_NPC_PROFILE);
      }
      if (rescueNpcVisible) {
        profiles.push(RESCUE_REQUEST_NPC_PROFILE);
      }
      for (const encountered of encounteredNpcProfiles) {
        if (encountered.id === RESCUE_REQUEST_NPC_PROFILE.id && storyState.aldricQuestPath === "refused") {
          continue;
        }
        if (profiles.some((profile) => profile.id === encountered.id)) {
          continue;
        }
        profiles.push({
          id: encountered.id,
          name: encountered.name,
          title: encountered.title,
          role: encountered.role,
          level: encountered.level,
          avatarId: encountered.avatarId,
          classId: encountered.classId,
          sequenceId: encountered.sequenceId,
          department: "story",
          licenseLabel: encountered.licenseLabel,
          authBody: encountered.authBody,
          signature: encountered.signature,
          avatarOverride: encountered.avatarOverride,
        });
      }
      return profiles.sort((a, b) => a.sequenceId - b.sequenceId);
    },
    [rankExaminerProfile, rescueNpcVisible, warriorPathGuideVisible, encounteredNpcProfiles, storyState.aldricQuestPath],
  );

const getLiveEnemyCombatStats = (enemy: TowerEnemyUnit) => ({
  damage: Math.max(6, Math.round(enemy.level * 2 + (enemy.role === "boss" ? 10 : enemy.role === "subBoss" ? 6 : 2))),
  critChance: enemy.role === "boss" ? 20 : enemy.role === "subBoss" ? 14 : 8,
  speed: Math.max(5, Math.round(enemy.level * 1.9 + (enemy.role === "boss" ? 6 : enemy.role === "subBoss" ? 3 : 0))),
  role: enemy.role,
});

const getTurnBurst = (actorSpeed: number, opposingSpeed: number): number => {
  const speedGap = actorSpeed - opposingSpeed;
  if (actorSpeed >= opposingSpeed * 2.4 && speedGap >= 14) {
    return 3;
  }
  if (actorSpeed >= opposingSpeed * 1.7 && speedGap >= 8) {
    return 2;
  }
  return 1;
};
const buildInitiativePreview = (
  current: LiveTowerBattleSession,
  currentEnemyId: string | undefined,
  effectivePlayerSpeed?: number,
): Array<{ actor: "player" | "enemy"; key: string }> => {
  if (!currentEnemyId) {
    return [];
  }
  const enemyStats = current.enemyStatsById[currentEnemyId];
  if (!enemyStats) {
    return [];
  }
  const preview: Array<{ actor: "player" | "enemy"; key: string }> = [];
  let actor: "player" | "enemy" = current.turnOwner;
  const playerSpeed = effectivePlayerSpeed ?? current.playerStats.speed;
  let playerBurstRemaining =
    current.turnOwner === "player"
      ? Math.max(1, current.playerTurnsRemaining)
      : Math.max(1, getTurnBurst(playerSpeed, enemyStats.speed));
  let enemyBurstRemaining =
    current.turnOwner === "enemy"
      ? Math.max(1, current.enemyTurnsRemaining)
      : Math.max(1, getTurnBurst(enemyStats.speed, playerSpeed));
  for (let index = 0; index < 8; index += 1) {
    preview.push({ actor, key: `${actor}-${index}` });
    if (actor === "player") {
      playerBurstRemaining -= 1;
      if (playerBurstRemaining <= 0) {
        actor = "enemy";
        enemyBurstRemaining = Math.max(1, getTurnBurst(enemyStats.speed, playerSpeed));
        playerBurstRemaining = Math.max(1, getTurnBurst(playerSpeed, enemyStats.speed));
      }
    } else {
      enemyBurstRemaining -= 1;
      if (enemyBurstRemaining <= 0) {
        actor = "player";
        playerBurstRemaining = Math.max(1, getTurnBurst(playerSpeed, enemyStats.speed));
        enemyBurstRemaining = Math.max(1, getTurnBurst(enemyStats.speed, playerSpeed));
      } else {
        actor = "enemy";
      }
    }
  }
  return preview;
};
const getNextLiveTelegraphIndex = (session: LiveTowerBattleSession, startIndex: number): number => {
  if (session.telegraphs.length <= 0) {
    return 0;
  }
  for (let offset = 0; offset < session.telegraphs.length; offset += 1) {
    const candidate = (startIndex + offset) % session.telegraphs.length;
    const telegraph = session.telegraphs[candidate];
    if ((session.enemyHpById[telegraph.enemyId] ?? 0) > 0) {
      return candidate;
    }
  }
  return 0;
};
const getNextTelegraphIndexForEnemy = (session: LiveTowerBattleSession, enemyId: string, currentIndex: number): number => {
  if (session.telegraphs.length <= 0) {
    return 0;
  }
  for (let offset = 1; offset <= session.telegraphs.length; offset += 1) {
    const candidate = (currentIndex + offset) % session.telegraphs.length;
    if (session.telegraphs[candidate].enemyId === enemyId) {
      return candidate;
    }
  }
  return currentIndex;
};
const getMechanicStatusFx = (mechanic: string): LiveBattleStatusFx | null => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("poison")) {
    return { id: "poisoned", label: "Poisoned", icon: "biohazard", tone: "bad", detail: "Poison pressure is eating away at you.", stacks: 1 };
  }
  if (keyword.includes("spark") || keyword.includes("overcharge")) {
    return { id: "shocked", label: "Shocked", icon: "lightning-bolt", tone: "bad", detail: "Shock pressure is disrupting your next exchanges.", stacks: 1 };
  }
  if (keyword.includes("bulwark") || keyword.includes("block")) {
    return { id: "fortified", label: "Fortified", icon: "shield-lock-outline", tone: "neutral", detail: "This target is braced behind heavy protection." };
  }
  if (keyword.includes("rush") || keyword.includes("drive")) {
    return { id: "rushed", label: "Pressured", icon: "run-fast", tone: "bad", detail: "The enemy has you on the back foot.", stacks: 1 };
  }
  return null;
};
const getPlayerResponseStatusFx = (
  responseType: "attack" | "item" | "skill" | "move" | "brace" | "pass",
  success: boolean,
  critTriggered: boolean,
  skillId?: AbilityId | null,
): LiveBattleStatusFx[] => {
  const statuses: LiveBattleStatusFx[] = [];
  if (critTriggered) {
    statuses.push({ id: "staggered", label: "Staggered", icon: "flash-outline", tone: "bad", detail: "A heavy blow left this target reeling." });
  }
  return statuses;
};
const getStatusToneBadgeStyle = (tone: LiveBattleStatusFx["tone"]) =>
  tone === "good" ? styles.towerStatusIconBadgeGood : tone === "bad" ? styles.towerStatusIconBadgeBad : styles.towerStatusIconBadgeNeutral;
const addOrReplaceStatusFx = (list: LiveBattleStatusFx[], nextFx: LiveBattleStatusFx): LiveBattleStatusFx[] => {
  const filtered = list.filter((entry) => entry.id !== nextFx.id);
  return [...filtered, nextFx];
};
const addOrStackStatusFx = (list: LiveBattleStatusFx[], nextFx: LiveBattleStatusFx, maxStacks = 3): LiveBattleStatusFx[] => {
  const existing = list.find((entry) => entry.id === nextFx.id);
  if (!existing) {
    return [...list, { ...nextFx, stacks: nextFx.stacks ?? 1 }];
  }
  const nextStacks = Math.min(maxStacks, (existing.stacks ?? 1) + (nextFx.stacks ?? 1));
  return list.map((entry) =>
    entry.id === nextFx.id
      ? {
          ...entry,
          ...nextFx,
          stacks: nextStacks,
          expiresAtMs: nextFx.expiresAtMs ?? entry.expiresAtMs,
        }
      : entry,
  );
};
const pruneExpiredStatusFx = (list: LiveBattleStatusFx[], nowMs: number): LiveBattleStatusFx[] =>
  list.filter((entry) => !entry.expiresAtMs || entry.expiresAtMs > nowMs);
const getLiveBattleEffectClockMs = (session: LiveTowerBattleSession, wallNowMs: number): number =>
  session.effectClockElapsedMs +
  (session.turnOwner === "player" && session.effectClockStartedAtMs ? Math.max(0, wallNowMs - session.effectClockStartedAtMs) : 0);
const getNextBattleEffectClockState = (
  session: LiveTowerBattleSession,
  nextTurnOwner: "player" | "enemy",
  wallNowMs: number,
): Pick<LiveTowerBattleSession, "effectClockElapsedMs" | "effectClockStartedAtMs"> => {
  if (session.turnOwner === "player" && nextTurnOwner !== "player") {
    return {
      effectClockElapsedMs: getLiveBattleEffectClockMs(session, wallNowMs),
      effectClockStartedAtMs: null,
    };
  }
  if (session.turnOwner !== "player" && nextTurnOwner === "player") {
    return {
      effectClockElapsedMs: session.effectClockElapsedMs,
      effectClockStartedAtMs: wallNowMs,
    };
  }
  if (nextTurnOwner === "player" && session.effectClockStartedAtMs == null) {
    return {
      effectClockElapsedMs: session.effectClockElapsedMs,
      effectClockStartedAtMs: wallNowMs,
    };
  }
  return {
    effectClockElapsedMs: session.effectClockElapsedMs,
    effectClockStartedAtMs: session.effectClockStartedAtMs,
  };
};
const getStatusStacks = (list: LiveBattleStatusFx[], id: string): number => list.find((entry) => entry.id === id)?.stacks ?? 0;
const hasStatusFx = (list: LiveBattleStatusFx[], id: string): boolean => list.some((entry) => entry.id === id);
type BattleStatusChangeSet = {
  clearIds?: string[];
  replace?: LiveBattleStatusFx[];
  stack?: LiveBattleStatusFx[];
  nowMs?: number;
};
const applyBattleStatusChanges = (list: LiveBattleStatusFx[], changes: BattleStatusChangeSet): LiveBattleStatusFx[] => {
  let nextList = changes.nowMs ? pruneExpiredStatusFx(list, changes.nowMs) : [...list];
  if (changes.clearIds?.length) {
    nextList = nextList.filter((entry) => !changes.clearIds?.includes(entry.id));
  }
  for (const effect of changes.replace ?? []) {
    nextList = addOrReplaceStatusFx(nextList, effect);
  }
  for (const effect of changes.stack ?? []) {
    nextList = addOrStackStatusFx(nextList, effect);
  }
  return nextList;
};
const getPlayerBattleItemEffect = (
  itemId: ItemId,
): { heal?: number; addStatus?: LiveBattleStatusFx; clearStatusIds?: string[] } => {
  if (itemId === "healing-herb") {
    return { heal: 10 };
  }
  if (itemId === "health-potion") {
    return { heal: 35 };
  }
  if (itemId === "antitoxin-vial") {
    return { heal: 4, clearStatusIds: ["poisoned"] };
  }
  if (itemId === "guard-tonic") {
    return {
      addStatus: {
        id: "guarded",
        label: "Guarded",
        icon: "shield-check-outline",
        tone: "good",
        detail: "Guard Tonic hardens your guard for the next exchanges.",
        stacks: 1,
      },
    };
  }
  if (itemId === "grounding-tonic") {
    return {
      addStatus: {
        id: "grounded",
        label: "Grounded",
        icon: "lightning-bolt-circle",
        tone: "good",
        detail: "Grounding current steadies you against shock.",
        stacks: 1,
      },
    };
  }
  if (itemId === "ward-charm") {
    return {
      addStatus: {
        id: "warded",
        label: "Warded",
        icon: "shield-sun-outline",
        tone: "good",
        detail: "A ward veil dulls incoming arc pressure.",
        stacks: 1,
      },
    };
  }
  return {};
};
const formatStatusDetail = (effect: LiveBattleStatusFx, nowMs: number): string => {
  const stacks = effect.stacks ?? 1;
  const timerSuffix =
    effect.expiresAtMs && effect.expiresAtMs > nowMs ? ` ${formatRemainingDetailed(effect.expiresAtMs - nowMs)} remaining.` : "";
  switch (effect.id) {
    case "poisoned":
      return `Lose ${3 * stacks} HP at the start of your turns.${timerSuffix}`;
    case "shocked":
      return `Attack damage is reduced by ${2 * stacks}.${timerSuffix}`;
    case "rushed":
      return `Pressure lowers your attack damage by ${3 * stacks}.${timerSuffix}`;
    case "guarded":
      return `Incoming damage is reduced by ${4 * stacks} on enemy turns.${timerSuffix}`;
    case "iron-will":
      return `Iron Will is active. Incoming damage is reduced by 6 and turn control is steadier.${timerSuffix}`;
    case "steel-rhythm":
      return `Steel Rhythm is active. Speed is boosted by 3, follow-up strikes gain +3 damage, and counter windows hit harder.${timerSuffix}`;
    case "bulwark-oath":
      return `Bulwark Oath is active. Incoming damage is reduced by 10, heavy mechanics lose severity, and guarded answers can set up a counter.${timerSuffix}`;
    case "bloodrush":
      return `Bloodrush is active. Attack +10, crit +8%, and speed +3, but you take 3 more damage when the enemy punishes you.${timerSuffix}`;
    case "counter-ready":
      return `Your next attack gains +8 damage and a stronger follow-up window.${timerSuffix}`;
    case "frenzied":
      return `You took damage and fed the frenzy. Attack +4 and crit +3% while it lasts.${timerSuffix}`;
    case "scout-path":
      return `Scout Path is active. Speed is boosted by 4 and evasive mitigation improves.${timerSuffix}`;
    case "arcane-surge":
      return `Arcane Surge is active. Your attacks gain +9 damage and +6% crit.${timerSuffix}`;
    case "grounded":
      return `Shock pressure is reduced by 4 while Grounded holds.${timerSuffix}`;
    case "warded":
      return `Arc and field pressure are softened while the ward holds.${timerSuffix}`;
    case "fortified":
      return `This target is braced behind protection and harder to break cleanly.${timerSuffix}`;
    case "staggered":
      return `This target is reeling from a heavy hit.${timerSuffix}`;
    default:
      return effect.detail ?? effect.label;
  }
};
const PERSISTENT_WAVE_STATUS_IDS = new Set([
  "poisoned",
  "shocked",
  "rushed",
  "grounded",
  "warded",
  "iron-will",
  "steel-rhythm",
  "bulwark-oath",
  "bloodrush",
  "counter-ready",
  "frenzied",
  "scout-path",
  "arcane-surge",
]);
type BattleStatusSnapshot = ReturnType<typeof getBattleStatusSnapshot>;
const mapTowerStatusToLiveFx = (
  status: NonNullable<TowerWaveOutcome["statusEffects"]>[number],
): LiveBattleStatusFx => ({
  id: status.id,
  label: status.name,
  icon: status.icon as keyof typeof MaterialCommunityIcons.glyphMap,
  tone: status.tone,
  detail: status.detail,
  stacks: status.stacks,
  expiresAtMs: status.expiresAtMs,
});
const mapLiveFxToTowerStatus = (
  effect: LiveBattleStatusFx,
): NonNullable<TowerWaveOutcome["statusEffects"]>[number] => ({
  id: effect.id,
  name: effect.label,
  icon: effect.icon,
  tone: effect.tone,
  detail: effect.detail ?? effect.label,
  stacks: effect.stacks,
  expiresAtMs: effect.expiresAtMs,
});
const getPersistentWaveStatusFx = (
  list: LiveBattleStatusFx[],
  effectNowMs: number,
  wallNowMs: number,
): NonNullable<TowerWaveOutcome["statusEffects"]> =>
  pruneExpiredStatusFx(list, effectNowMs)
    .filter((effect) => PERSISTENT_WAVE_STATUS_IDS.has(effect.id))
    .map((effect) => ({
      ...mapLiveFxToTowerStatus(effect),
      expiresAtMs:
        effect.expiresAtMs && effect.expiresAtMs > effectNowMs
          ? wallNowMs + (effect.expiresAtMs - effectNowMs)
          : effect.expiresAtMs,
    }));
const getBattleStatusSnapshot = (list: LiveBattleStatusFx[]) => ({
  poisonStacks: getStatusStacks(list, "poisoned"),
  shockStacks: getStatusStacks(list, "shocked"),
  pressureStacks: getStatusStacks(list, "rushed"),
  guardedStacks: getStatusStacks(list, "guarded"),
  groundedStacks: getStatusStacks(list, "grounded"),
  wardedStacks: getStatusStacks(list, "warded"),
  counterReadyStacks: getStatusStacks(list, "counter-ready"),
  hasIronWill: list.some((entry) => entry.id === "iron-will"),
  hasSteelRhythm: list.some((entry) => entry.id === "steel-rhythm"),
  hasBulwarkOath: list.some((entry) => entry.id === "bulwark-oath"),
  hasBloodrush: list.some((entry) => entry.id === "bloodrush"),
  hasFrenzied: list.some((entry) => entry.id === "frenzied"),
  hasScoutPath: list.some((entry) => entry.id === "scout-path"),
  hasArcaneSurge: list.some((entry) => entry.id === "arcane-surge"),
});
const getLiveBattleSkillEffectProfile = (
  activeSkillEffectId: AbilityId | null,
  skillEffectEndsAtMs: number | null,
  skillId: AbilityId | null,
  nowMs: number,
) => {
  if (!activeSkillEffectId || !skillEffectEndsAtMs || skillEffectEndsAtMs <= nowMs || !skillId) {
    return null;
  }
  const skillProfile = getLiveBattleSkillProfile(skillId);
  return skillProfile?.effectId === activeSkillEffectId ? skillProfile : null;
};
const getActiveSkillProfilesFromStatuses = (
  playerStatusFx: LiveBattleStatusFx[],
  unlockedSkillIds: AbilityId[],
  nowMs: number,
): LiveBattleSkillProfile[] => {
  const activeStatusIds = new Set(
    pruneExpiredStatusFx(playerStatusFx, nowMs)
      .filter((effect) => !effect.expiresAtMs || effect.expiresAtMs > nowMs)
      .map((effect) => effect.id),
  );
  return unlockedSkillIds
    .map((skillId) => getLiveBattleSkillProfile(skillId))
    .filter((profile): profile is LiveBattleSkillProfile => Boolean(profile && activeStatusIds.has(profile.effectId)));
};
const getCombinedLiveSkillBonuses = (
  playerStatusFx: LiveBattleStatusFx[],
  unlockedSkillIds: AbilityId[],
  nowMs: number,
) =>
  getActiveSkillProfilesFromStatuses(playerStatusFx, unlockedSkillIds, nowMs).reduce(
    (sum, profile) => ({
      attackBonus: sum.attackBonus + profile.attackBonus,
      critBonus: sum.critBonus + profile.critBonus,
      speedBonus: sum.speedBonus + profile.speedBonus,
      mitigationFlat: sum.mitigationFlat + profile.mitigationFlat,
      initiativeBonus: sum.initiativeBonus + profile.initiativeBonus,
      guardBonusFlat: sum.guardBonusFlat + profile.guardBonusFlat,
      statusSeverityReductionFlat: sum.statusSeverityReductionFlat + profile.statusSeverityReductionFlat,
      counterBonusDamageFlat: sum.counterBonusDamageFlat + profile.counterBonusDamageFlat,
      woundedTargetDamageFlat: sum.woundedTargetDamageFlat + profile.woundedTargetDamageFlat,
      defensePenaltyFlat: sum.defensePenaltyFlat + profile.defensePenaltyFlat,
      activeLabels: [...sum.activeLabels, profile.effectLabel],
    }),
    {
      attackBonus: 0,
      critBonus: 0,
      speedBonus: 0,
      mitigationFlat: 0,
      initiativeBonus: 0,
      guardBonusFlat: 0,
      statusSeverityReductionFlat: 0,
      counterBonusDamageFlat: 0,
      woundedTargetDamageFlat: 0,
      defensePenaltyFlat: 0,
      activeLabels: [] as string[],
    },
  );
type CombinedLiveSkillBonuses = ReturnType<typeof getCombinedLiveSkillBonuses>;
const getCombatAbilityEffectSummary = (abilityId: AbilityId): string => {
  const ability = ABILITY_BY_ID[abilityId];
  if (!ability) {
    return "";
  }
  if ((ability.kind ?? "skill") === "passive") {
    const passiveCategory =
      ability.pathGroup === "knight"
        ? "Knight Passive"
        : ability.pathGroup === "berserker"
          ? "Berserker Passive"
          : "Shared Passive";
    const profile = getPassiveBattleProfile(abilityId);
    if (profile) {
      const effects: string[] = [];
      if (profile.guardBonusFlat > 0) {
        effects.push(`Guard +${profile.guardBonusFlat}`);
      }
      if (profile.attackConsistencyFlat > 0) {
        effects.push(`Steady +${profile.attackConsistencyFlat}`);
      }
      if (profile.statusSeverityReductionFlat > 0) {
        effects.push(`Severity -${profile.statusSeverityReductionFlat}`);
      }
      if (profile.counterBonusDamageFlat > 0) {
        effects.push(`Counter +${profile.counterBonusDamageFlat}`);
      }
      if (profile.woundedTargetDamageFlat > 0) {
        effects.push(`Vs Wounded +${profile.woundedTargetDamageFlat}`);
      }
      if (profile.postCritTempoFlat > 0 || profile.postKillTempoFlat > 0) {
        effects.push(`Tempo Feed`);
      }
      return `${passiveCategory} • ${effects.join(" • ") || "Combat support."}`;
    }
    return `${passiveCategory} • Combat support.`;
  }
  const liveProfile = getLiveBattleSkillProfile(abilityId);
  if (!liveProfile) {
    return `${ability.cooldownSeconds}s CD`;
  }
  const effects: string[] = [];
  if (liveProfile.mitigationFlat > 0) {
    effects.push(`Guard +${liveProfile.mitigationFlat}`);
  }
  if (liveProfile.attackBonus > 0) {
    effects.push(`ATK +${liveProfile.attackBonus}`);
  }
  if (liveProfile.critBonus > 0) {
    effects.push(`CRIT +${liveProfile.critBonus}%`);
  }
  if (liveProfile.speedBonus > 0) {
    effects.push(`SPD +${liveProfile.speedBonus}`);
  }
  if (liveProfile.initiativeBonus > 0) {
    effects.push(`Tempo +${liveProfile.initiativeBonus}`);
  }
  if (liveProfile.counterBonusDamageFlat > 0) {
    effects.push(`Counter +${liveProfile.counterBonusDamageFlat}`);
  }
  if (liveProfile.woundedTargetDamageFlat > 0) {
    effects.push(`Vs Wounded +${liveProfile.woundedTargetDamageFlat}`);
  }
  return `${ability.cooldownSeconds}s CD${effects.length ? ` • ${effects.join(" • ")}` : ""}`;
};
const getSkillCardMeta = (profile: LiveBattleSkillProfile | null): string => {
  if (!profile) {
    return "Combat skill";
  }
  if (profile.mitigationFlat > 0 && profile.attackBonus <= 0 && profile.critBonus <= 0) {
    return "Guard buff";
  }
  if (profile.speedBonus > 0 && profile.attackBonus <= 2 && profile.critBonus <= 2) {
    return "Tempo buff";
  }
  if (profile.attackBonus > 0 || profile.critBonus > 0) {
    return "Offense buff";
  }
  return "Self buff";
};
const getBasicSkillHint = (abilityId: AbilityId): string => {
  switch (abilityId) {
    case "ability-warrior-iron-will":
      return "Toughens you up for a short time and helps you hold the line.";
    case "ability-warrior-steel-rhythm":
      return "Locks your timing in so guarded turns flow into better follow-up pressure.";
    case "ability-warrior-bulwark-oath":
      return "Anchors you against heavy mechanics and sets up a safer counter window.";
    case "ability-warrior-bloodrush":
      return "Drives your offense faster and harder, but leaves you easier to punish.";
    case "ability-ranger-scout-path":
      return "Improves your movement and helps you stay ahead of enemy pressure.";
    case "ability-mage-arcane-surge":
      return "Empowers your next attacks so they hit harder.";
    default:
      return "A combat skill that buffs you for the next exchanges.";
  }
};
const getBattleSkillButtonTone = (abilityId: AbilityId): "defense" | "tempo" | "offense" | "arcane" => {
  switch (abilityId) {
    case "ability-warrior-iron-will":
    case "ability-warrior-bulwark-oath":
      return "defense";
    case "ability-ranger-scout-path":
    case "ability-warrior-steel-rhythm":
      return "tempo";
    case "ability-mage-arcane-surge":
      return "arcane";
    case "ability-warrior-bloodrush":
    default:
      return "offense";
  }
};
const getAbilityIdForBattleStatus = (statusId: string): AbilityId | null => {
  switch (statusId) {
    case "iron-will":
      return "ability-warrior-iron-will";
    case "steel-rhythm":
      return "ability-warrior-steel-rhythm";
    case "bulwark-oath":
      return "ability-warrior-bulwark-oath";
    case "bloodrush":
      return "ability-warrior-bloodrush";
    case "scout-path":
      return "ability-ranger-scout-path";
    case "arcane-surge":
      return "ability-mage-arcane-surge";
    default:
      return null;
  }
};
const describeBattleStatusChange = (effect: LiveBattleStatusFx, action: "gained" | "cleared"): string => {
  const label = effect.label || effect.id;
  if (action === "cleared") {
    return `${label} fades.`;
  }
  const stacks = effect.stacks ?? 1;
  return stacks > 1 ? `${label} intensifies to ${stacks} stacks.` : `${label} takes hold.`;
};
const applyStartOfTurnStatusEffects = (
  list: LiveBattleStatusFx[],
  nowMs: number,
): { nextStatusFx: LiveBattleStatusFx[]; hpLoss: number; logLines: string[]; snapshot: BattleStatusSnapshot } => {
  const nextStatusFx = applyBattleStatusChanges(list, { nowMs });
  const snapshot = getBattleStatusSnapshot(nextStatusFx);
  const hpLoss = snapshot.poisonStacks > 0 ? 3 * snapshot.poisonStacks : 0;
  const logLines = hpLoss > 0 ? [`Poison bites for ${hpLoss} damage before you act.`] : [];
  return { nextStatusFx, hpLoss, logLines, snapshot };
};
const applySelfTargetBattleItem = (
  itemId: ItemId,
  list: LiveBattleStatusFx[],
  currentHp: number,
  maxHp: number,
): { nextStatusFx: LiveBattleStatusFx[]; nextHp: number; logLine: string } => {
  const itemEffect = getPlayerBattleItemEffect(itemId);
  let nextStatusFx = [...list];
  let nextHp = currentHp;
  const clearedStatusLabels = (itemEffect.clearStatusIds ?? [])
    .filter((statusId) => hasStatusFx(nextStatusFx, statusId))
    .map((statusId) => nextStatusFx.find((entry) => entry.id === statusId)?.label ?? statusId);
  nextStatusFx = applyBattleStatusChanges(nextStatusFx, {
    clearIds: itemEffect.clearStatusIds,
    stack: itemEffect.addStatus ? [itemEffect.addStatus] : undefined,
  });
  if (itemEffect.heal) {
    nextHp = Math.min(maxHp, nextHp + itemEffect.heal);
  }
  if (itemId === "healing-herb") {
    return { nextStatusFx, nextHp, logLine: `You used Healing Herb on yourself and recovered ${Math.max(0, nextHp - currentHp)} HP.` };
  }
  if (itemId === "health-potion") {
    return { nextStatusFx, nextHp, logLine: `You used Health Potion on yourself and recovered ${Math.max(0, nextHp - currentHp)} HP.` };
  }
  if (itemId === "antitoxin-vial") {
    return {
      nextStatusFx,
      nextHp,
      logLine:
        clearedStatusLabels.length > 0
          ? `You used Antitoxin Vial on yourself and cleared ${clearedStatusLabels.join(", ")}.`
          : "You used Antitoxin Vial on yourself. No venom took hold.",
    };
  }
  if (itemId === "focus-tonic" || itemId === "mana-tonic") {
    return {
      nextStatusFx,
      nextHp,
      logLine: `You used ${ITEM_BY_ID[itemId]?.name ?? "the tonic"} on yourself, but it has no direct effect in tower battle.`,
    };
  }
  return { nextStatusFx, nextHp, logLine: `You used ${ITEM_BY_ID[itemId]?.name ?? "the item"} on yourself.` };
};
const calculatePlayerAttackAdjustment = (
  baseDamage: number,
  snapshot: BattleStatusSnapshot,
  passiveBonuses: ReturnType<typeof getEquippedPassiveBattleBonuses>,
): number => {
  let nextDamage = baseDamage;
  if (snapshot.pressureStacks > 0) {
    nextDamage = Math.max(0, nextDamage - Math.max(0, 3 * snapshot.pressureStacks - passiveBonuses.pressureResistFlat));
  }
  if (snapshot.shockStacks > 0) {
    nextDamage = Math.max(0, nextDamage - 2 * snapshot.shockStacks);
  }
  if (snapshot.hasFrenzied) {
    nextDamage += passiveBonuses.frenzyAttackBonusFlat;
  }
  nextDamage = Math.max(nextDamage, passiveBonuses.attackConsistencyFlat);
  return nextDamage;
};
const calculateIncomingEnemyDamage = ({
  baseDamage,
  severity,
  enemyCrit,
  responseSucceeded,
  speedMitigation,
  snapshot,
  activeSkillProfile,
  passiveBonuses,
}: {
  baseDamage: number;
  severity: number;
  enemyCrit: boolean;
  responseSucceeded: boolean;
  speedMitigation: number;
  snapshot: BattleStatusSnapshot;
  activeSkillProfile: CombinedLiveSkillBonuses;
  passiveBonuses: ReturnType<typeof getEquippedPassiveBattleBonuses>;
}): number => {
  const guarded = snapshot.guardedStacks > 0 || snapshot.hasIronWill;
  const evasive = snapshot.hasScoutPath;
  let incomingDamage = baseDamage;
  if (responseSucceeded) {
    incomingDamage = Math.max(
      0,
      incomingDamage -
        3 -
        speedMitigation -
        (guarded ? 4 + passiveBonuses.guardBonusFlat + activeSkillProfile.guardBonusFlat : 0) -
        (evasive ? 1 : 0) -
        (activeSkillProfile?.mitigationFlat ?? 0),
    );
  } else {
    incomingDamage = Math.max(
      1,
      incomingDamage +
        severity -
        speedMitigation -
        (guarded ? 2 + passiveBonuses.guardBonusFlat + activeSkillProfile.guardBonusFlat : 0) -
        (activeSkillProfile?.mitigationFlat ?? 0) +
        (activeSkillProfile?.defensePenaltyFlat ?? 0),
    );
  }
  if (enemyCrit) {
    incomingDamage = Math.round(incomingDamage * 1.45);
  }
  return incomingDamage;
};
const getMechanicSeverity = (mechanic: string): number => {
  const keyword = mechanic.toLowerCase();
  if (keyword.includes("overcharge") || keyword.includes("spark")) {
    return 4;
  }
  if (keyword.includes("sweep") || keyword.includes("bulwark")) {
    return 3;
  }
  return 2;
};
  const branProfile = GUILD_CORE_NPCS.find((npc) => npc.id === QUARTERMASTER_BRAN_NPC_ID) ?? null;
  const npcAttentionTargets = useMemo(() => {
    const targets: string[] = [];
    if (rescueNpcStatus === "available" || rescueNpcStatus === "refused_once") {
      targets.push(RESCUE_REQUEST_NPC_PROFILE.id);
    }
    if (storyState.thornRunnerQuestStatus === "available" && !storyState.thornRunnerIntroductionChoice) {
      targets.push("npc-tamsin-vale");
    }
    if (storyState.thornRunnerQuestStatus === "completed" && !storyState.thornRunnerFollowupReviewed) {
      targets.push("npc-tamsin-vale");
    }
    if (storyState.thornRunnerCorridorReportReady && !storyState.thornRunnerCorridorReportReviewed) {
      targets.push("npc-tamsin-vale");
    }
    if (storyState.thornRunnerDeepLaneWarningReady && !storyState.thornRunnerDeepLaneWarningReviewed) {
      targets.push("npc-tamsin-vale");
    }
    if (storyState.thornRunnerFloorTwoAftermathReady && !storyState.thornRunnerFloorTwoAftermathReviewed) {
      targets.push("npc-tamsin-vale");
    }
    return targets;
  }, [
    rescueNpcStatus,
    storyState.thornRunnerCorridorReportReady,
    storyState.thornRunnerCorridorReportReviewed,
    storyState.thornRunnerDeepLaneWarningReady,
    storyState.thornRunnerDeepLaneWarningReviewed,
    storyState.thornRunnerFloorTwoAftermathReady,
    storyState.thornRunnerFloorTwoAftermathReviewed,
    storyState.thornRunnerFollowupReviewed,
    storyState.thornRunnerIntroductionChoice,
    storyState.thornRunnerQuestStatus,
  ]);
  const npcAttentionCount = npcAttentionTargets.length;
  const showAldricWantedPlaceholder =
    storyState.aldricQuestPath === "refused" || storyState.aldricQuestPath === "too_late";
  const aldricRescueRemainingMs =
    storyState.rescueNpcStatus === "accepted" && storyState.aldricRescueDeadlineAtMs
      ? Math.max(0, storyState.aldricRescueDeadlineAtMs - questClockMs)
      : null;

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setQuestClockMs(Date.now()), 250);
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
    if (!lastQuestOutcome || !pendingQuestResultOpen) {
      return;
    }
    setQuestResultOpen(true);
    setPendingQuestResultOpen(false);
  }, [lastQuestOutcome, pendingQuestResultOpen]);
  useEffect(() => {
    const isAldricBattle = activeQuest?.questId === SPECIAL_RESCUE_QUEST_ID;
    if (!isAldricBattle) {
      setAldricBattleOpen(false);
      setAldricBattleRevealCount(0);
      setAldricBattleAutoResolving(false);
      return;
    }
    setAldricBattleOpen(true);
  }, [activeQuest?.questId]);
  useEffect(() => {
    if (!aldricBattleOpen || activeQuest?.questId !== SPECIAL_RESCUE_QUEST_ID || !activeQuest) {
      return;
    }
    const elapsedMs = Math.max(0, questClockMs - activeQuest.startedAtMs);
    const nextRevealCount = elapsedMs >= 5200 ? 2 : elapsedMs >= 1800 ? 1 : 0;
    if (nextRevealCount !== aldricBattleRevealCount) {
      setAldricBattleRevealCount(nextRevealCount);
    }
  }, [aldricBattleOpen, activeQuest, aldricBattleRevealCount, questClockMs]);
  useEffect(() => {
    if (
      !aldricBattleOpen ||
      !activeQuest ||
      activeQuest.questId !== SPECIAL_RESCUE_QUEST_ID ||
      questClockMs < activeQuest.endsAtMs ||
      aldricBattleAutoResolving
    ) {
      return;
    }
    setAldricBattleAutoResolving(true);
    handleClaimQuest();
  }, [aldricBattleOpen, activeQuest, questClockMs, aldricBattleAutoResolving]);
  useEffect(() => {
    if (!lastTowerOutcome || !pendingTowerEncounterOpen) {
      return;
    }
    setTowerEncounterOpen(true);
    setRevealedTowerPhases(0);
    setConditionalEncounterOpen(false);
    setConditionalEncounterResolved(false);
    setPendingTowerEncounterOpen(false);
  }, [lastTowerOutcome, pendingTowerEncounterOpen]);
  const conditionalEncounterPhaseIndex = useMemo(() => {
    const triggerPhase = lastTowerOutcome?.conditionalEncounter?.triggerPhase;
    if (!triggerPhase) {
      return -1;
    }
    if (triggerPhase === "normal") return 1;
    if (triggerPhase === "subBoss") return 2;
    return 3;
  }, [lastTowerOutcome?.conditionalEncounter?.triggerPhase]);
  useEffect(() => {
    if (!towerEncounterOpen || !lastTowerOutcome?.conditionalEncounter) {
      return;
    }
    if (conditionalEncounterResolved || conditionalEncounterOpen) {
      return;
    }
    if (conditionalEncounterPhaseIndex < 0) {
      return;
    }
    if (revealedTowerPhases >= conditionalEncounterPhaseIndex) {
      setConditionalEncounterOpen(true);
    }
  }, [
    towerEncounterOpen,
    lastTowerOutcome?.conditionalEncounter,
    conditionalEncounterResolved,
    conditionalEncounterOpen,
    revealedTowerPhases,
    conditionalEncounterPhaseIndex,
  ]);
  useEffect(() => {
    if (!towerEncounterOpen || !lastTowerOutcome?.phaseResults?.length) {
      return;
    }
    if (conditionalEncounterOpen && !conditionalEncounterResolved) {
      return;
    }
    if (revealedTowerPhases >= lastTowerOutcome.phaseResults.length) {
      return;
    }
    const timer = setTimeout(() => {
      setRevealedTowerPhases((current) => current + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [towerEncounterOpen, lastTowerOutcome, revealedTowerPhases, conditionalEncounterOpen, conditionalEncounterResolved]);

  const activeQuestDef = useMemo(
    () => quests.find((quest) => quest.id === activeQuest?.questId) ?? null,
    [quests, activeQuest],
  );
  const visibleRanks = useMemo(
    () => getVisibleQuestRanks(character.adventurerRank),
    [character.adventurerRank],
  );
  const boardVisibleQuests = useMemo(
    () =>
      quests
        .filter(
          (quest) =>
            quest.boardCategory === "hunt" ||
            visibleRanks.includes(quest.rank) ||
            (storyState.questBoardPreviewEnabled && QUEST_BOARD_PREVIEW_IDS.has(quest.id)),
        )
        .filter((quest) => (boardRankFilter === "all" ? true : quest.rank === boardRankFilter))
        .filter((quest) => (boardTypeFilter === "all" ? true : quest.type === boardTypeFilter))
        .sort((a, b) => {
          const rankDelta = RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
          if (rankDelta !== 0) {
            return rankDelta;
          }
          return a.minLevel - b.minLevel;
        }),
    [quests, visibleRanks, boardRankFilter, boardTypeFilter, storyState.questBoardPreviewEnabled],
  );
  const boardQuestSections = useMemo(() => {
    const urgent = boardVisibleQuests.filter((quest) => quest.id === SPECIAL_RESCUE_QUEST_ID);
    const storyContracts = boardVisibleQuests.filter(
      (quest) => SPECIAL_NPC_QUEST_IDS.has(quest.id) && quest.id !== SPECIAL_RESCUE_QUEST_ID,
    );
    const hunt = boardVisibleQuests.filter((quest) => quest.boardCategory === "hunt");
    const special = boardVisibleQuests.filter(
      (quest) =>
        !SPECIAL_NPC_QUEST_IDS.has(quest.id) &&
        quest.id !== SPECIAL_RESCUE_QUEST_ID &&
        quest.type === "dungeon" &&
        quest.boardCategory !== "hunt",
    );
    const jobs = boardVisibleQuests.filter(
      (quest) => !urgent.includes(quest) && !storyContracts.includes(quest) && !hunt.includes(quest) && !special.includes(quest),
    );
    return [
      {
        key: "urgent",
        title: "Urgent",
        subtitle: "Time-sensitive contracts with permanent consequences.",
        icon: "timer-alert-outline" as const,
        tone: "urgent" as const,
        quests: urgent,
      },
      {
        key: "story",
        title: "Story Contracts",
        subtitle: "Named requests tied to NPC threads and recurring consequences.",
        icon: "account-voice" as const,
        tone: "story" as const,
        quests: storyContracts,
      },
      {
        key: "jobs",
        title: "Jobs",
        subtitle: "Standard guild work for farming supplies, gold, and steady progress.",
        icon: "briefcase-outline" as const,
        tone: "jobs" as const,
        quests: jobs,
      },
      {
        key: "hunt",
        title: "Hunt",
        subtitle: "Named monster contracts and field pursuit kills.",
        icon: "paw-outline" as const,
        tone: "hunt" as const,
        quests: hunt,
      },
      {
        key: "special",
        title: "Special",
        subtitle: "Non-standard contracts and structured encounters.",
        icon: "star-four-points-circle-outline" as const,
        tone: "special" as const,
        quests: special,
      },
    ].filter((section) => section.quests.length > 0);
  }, [boardVisibleQuests]);
  const toggleBoardSection = (key: string) =>
    setCollapsedBoardSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  useEffect(() => {
    if (boardRankFilter !== "all" && !visibleRanks.includes(boardRankFilter)) {
      setBoardRankFilter("all");
    }
  }, [boardRankFilter, visibleRanks]);

  const isQuestReadyToClaim = Boolean(activeQuest && questClockMs >= activeQuest.endsAtMs);
  const remainingMs = activeQuest ? Math.max(0, activeQuest.endsAtMs - questClockMs) : 0;
  const activeDurationMs = activeQuest ? activeQuest.endsAtMs - activeQuest.startedAtMs : 0;
  const elapsedRatio = activeQuest
    ? Math.max(0, Math.min(1, (activeDurationMs - remainingMs) / Math.max(1, activeDurationMs)))
    : 0;
  const aldricBattleElapsedMs =
    activeQuest?.questId === SPECIAL_RESCUE_QUEST_ID ? Math.max(0, questClockMs - activeQuest.startedAtMs) : 0;
  const aldricBattleFlowRatio =
    activeQuest?.questId === SPECIAL_RESCUE_QUEST_ID
      ? Math.max(0, Math.min(1, aldricBattleElapsedMs / Math.max(1, activeDurationMs)))
      : 0;
  const aldricBattleStatusText =
    activeQuest?.questId !== SPECIAL_RESCUE_QUEST_ID
      ? ""
      : aldricBattleFlowRatio < 0.2
        ? "The rescue push breaks into the Watchtrail camp. Steel comes out before anyone can shout."
        : aldricBattleFlowRatio < 0.45
          ? "Aldric's rescue path hits the outer lackeys first. The lane is still open if you keep pressure on them."
          : aldricBattleFlowRatio < 0.75
            ? "The first wave buckles. The bandit leader is forcing the fight inward and trying to buy time."
            : aldricBattleFlowRatio < 1
            ? "The leader is under direct pressure. Every lost second still matters to the rescue."
            : "The encounter is settling into its final report.";
  const aldricBattleTotalSteps = ALDRIC_SPECIAL_BATTLES.reduce((sum, battle) => sum + 1 + battle.events.length, 0);
  const aldricBattleRevealStepCount = Math.min(
    aldricBattleTotalSteps,
    Math.max(0, Math.ceil(aldricBattleFlowRatio * aldricBattleTotalSteps)),
  );

  const handleStartQuest = (questId: string) => {
    const selectedItems = selectedItemsByQuest[questId] ?? {};
    const questDef = quests.find((quest) => quest.id === questId) ?? null;
    const result = onStartQuest(questId, selectedItems);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(
      result.ok
        ? questId === SPECIAL_RESCUE_QUEST_ID
          ? "Watchtrail rescue launched. Hold through the bandit waves."
          : questDef?.combatModel === "live"
            ? `${questDef.title} is now running in live combat mode.`
          : result.reason?.trim() || "Quest accepted."
        : result.reason ?? "Could not start quest.",
    );
    if (result.ok) {
      setSelectedItemsByQuest((current) => {
        const next = { ...current };
        delete next[questId];
        return next;
      });
      if (questDef?.combatModel === "live") {
        startLiveQuestBattle(questDef, selectedItems);
      }
    }
  };

  const getCommittedCount = (questId: string, itemId: ItemId): number =>
    selectedItemsByQuest[questId]?.[itemId] ?? 0;

  const adjustCommittedItem = (
    questId: string,
    itemId: ItemId,
    delta: number,
    maxAllowed: number,
    owned: number,
  ) => {
    setSelectedItemsByQuest((current) => {
      const questSelection = { ...(current[questId] ?? {}) };
      const currentAmount = questSelection[itemId] ?? 0;
      const nextAmount = Math.max(0, Math.min(maxAllowed, Math.min(owned, currentAmount + delta)));
      if (nextAmount <= 0) {
        delete questSelection[itemId];
      } else {
        questSelection[itemId] = nextAmount;
      }
      return {
        ...current,
        [questId]: questSelection,
      };
    });
  };

  const renderQuestBoardCard = (quest: QuestDefinition) => {
    const selectedItems = selectedItemsByQuest[quest.id] ?? {};
    const successChance = getQuestSuccessChance(quest.id, selectedItems);
    const access = getQuestAccess(quest.id);
    const blocked = !access.allowed;
    const isAcceptedAldricWindow = quest.id === SPECIAL_RESCUE_QUEST_ID && aldricRescueRemainingMs !== null;
    const questArt = QUEST_BACKGROUND_ART[quest.id];
    const isNpcQuest = SPECIAL_NPC_QUEST_IDS.has(quest.id);
    const isSpecialQuest = quest.id === SPECIAL_RESCUE_QUEST_ID;
    const isUrgentQuest = quest.id === SPECIAL_RESCUE_QUEST_ID;
    const isHuntQuest = quest.boardCategory === "hunt";
    const isRaidQuest = quest.combatModel === "raid";
    const titleTrails = TITLES.filter(
      (title) => title.unlockRequirement?.type === "quest_starts" && title.unlockRequirement.questId === quest.id,
    );
    return (
      <View
        key={quest.id}
        style={[
          styles.questCard,
          isNpcQuest ? styles.npcQuestCard : null,
          isSpecialQuest ? styles.specialQuestCard : null,
        ]}
      >
        {questArt ? (
          <ImageBackground source={questArt.backdrop} style={styles.questCardBackdropFull} resizeMode="cover">
            <LinearGradient
              pointerEvents="none"
              colors={questArt.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.questSceneOverlay}
            />
          </ImageBackground>
        ) : null}
        <LinearGradient
          pointerEvents="none"
          colors={
            isSpecialQuest
              ? ["rgba(234, 92, 96, 0.2)", "rgba(168, 80, 210, 0.12)", "rgba(29, 18, 44, 0.04)"]
              : isNpcQuest
                ? ["rgba(91, 162, 213, 0.18)", "rgba(136, 94, 188, 0.1)", "rgba(24, 17, 39, 0.02)"]
                : ["rgba(204, 149, 73, 0.09)", "rgba(93, 60, 147, 0.06)", "rgba(24, 17, 39, 0.02)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        />
        <View style={styles.questHeader}>
          <Image source={QUEST_TYPE_SPRITE[quest.type]} style={styles.questTypeSprite} resizeMode="contain" />
          <IconTooltip text={`${questTypeLabel[quest.type]} quest type.`} />
          <Text style={styles.questTitle}>{quest.title}</Text>
          {isSpecialQuest ? (
            <View style={styles.specialQuestBadge}>
              <Text style={styles.specialQuestBadgeText}>SPECIAL</Text>
            </View>
          ) : isRaidQuest ? (
            <View style={styles.specialQuestBadge}>
              <Text style={styles.specialQuestBadgeText}>{quest.raidLabel ?? "RAID"}</Text>
            </View>
          ) : isNpcQuest ? (
            <View style={styles.npcQuestBadge}>
              <MaterialCommunityIcons name="account-voice" size={12} color="#def3ff" />
              <Text style={styles.npcQuestBadgeText}>NPC REQUEST</Text>
            </View>
          ) : null}
          {isHuntQuest ? (
            <View style={styles.huntQuestBadge}>
              <MaterialCommunityIcons name="paw-outline" size={12} color="#d4f2ff" />
              <Text style={styles.huntQuestBadgeText}>HUNT</Text>
            </View>
          ) : null}
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{questTypeLabel[quest.type]}</Text>
          </View>
        </View>
        {quest.loreSummary ? <Text style={styles.questMeta}>{quest.loreSummary}</Text> : null}
        {quest.encounterStages?.length || quest.signatureMechanics?.length ? (
          <View style={styles.chipsRow}>
            {quest.encounterStages?.slice(0, 3).map((stage) => (
              <View key={`${quest.id}-stage-${stage}`} style={styles.rewardChip}>
                <MaterialCommunityIcons name="stairs" size={13} color="#ffd487" />
                <Text style={styles.rewardChipText}>{stage}</Text>
              </View>
            ))}
            {quest.signatureMechanics?.slice(0, 2).map((mechanic) => (
              <View key={`${quest.id}-mechanic-${mechanic}`} style={styles.rewardChip}>
                <MaterialCommunityIcons name="star-four-points-circle-outline" size={13} color="#9fe3ff" />
                <Text style={styles.rewardChipText}>{mechanic}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.chipsRow}>
          <View style={styles.rewardChip}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.warning} />
            <Text style={styles.rewardChipText}>
              {quest.id === SPECIAL_RESCUE_QUEST_ID
                ? isAcceptedAldricWindow
                  ? formatRemainingDetailed(aldricRescueRemainingMs ?? 0)
                  : formatRemainingDetailed(quest.durationSeconds * 1000)
                : `${quest.durationSeconds}s`}
            </Text>
            <IconTooltip text="Quest timer duration." />
          </View>
          <View style={styles.rewardChip}>
            <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#ffd487" />
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
        {isUrgentQuest ? (
          <>
            <View style={styles.questCriticalTimerMini}>
              <Text style={styles.questCriticalTimerMiniLabel}>{isAcceptedAldricWindow ? "Time Remaining" : "Time Limit"}</Text>
              <Text style={styles.questCriticalTimerMiniValue}>
                {isAcceptedAldricWindow
                  ? formatRemainingDetailed(aldricRescueRemainingMs ?? 0)
                  : formatRemainingDetailed(quest.durationSeconds * 1000)}
              </Text>
            </View>
            <View style={styles.questUrgencyBanner}>
              <MaterialCommunityIcons name="timer-alert-outline" size={16} color="#ffd6a2" />
              <Text style={styles.questUrgencyText}>
                Accepting this rescue starts a real timer. Being too late will permanently change Aldric's path.
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.questMeterBlock}>
          <View style={styles.meterLabelRow}>
            <Text style={styles.meterLabel}>Success Chance</Text>
            <Text style={styles.meterLabel}>{successChance}%</Text>
          </View>
          <ProgressBar value={successChance} max={100} variant="chance" />
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
          {titleTrails.map((title) => {
            const required = title.unlockRequirement?.requiredCount ?? 1;
            const progress = Math.min(required, character.titleProgressById?.[title.id] ?? 0);
            const progressPercent = Math.round((progress / Math.max(1, required)) * 100);
            const rarityColor = rarityColorMap[title.rarity];
            const isLegendary = title.rarity === "legendary";
            const isEarned = (character.ownedTitleIds ?? []).includes(title.id);
            return (
              <View
                key={`${quest.id}-title-${title.id}`}
                style={[
                  styles.titleRewardCard,
                  { borderColor: rarityColor },
                  isLegendary ? styles.titleRewardLegendary : null,
                ]}
              >
                <View style={[styles.titleRewardIconWrap, { borderColor: rarityColor }]}>
                  <Image source={TITLE_ICON_ART[title.id]} style={styles.titleRewardIcon} resizeMode="contain" />
                </View>
                <View style={styles.titleRewardTextWrap}>
                  <View style={styles.titleRewardTopRow}>
                    <Text style={styles.titleRewardLabel}>TITLE TRAIL</Text>
                    <View style={[styles.titleRewardGradePill, { borderColor: rarityColor }]}>
                      <Text style={[styles.titleRewardGradeText, { color: rarityColor }]}>
                        {title.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.titleRewardName}>{title.name}</Text>
                  <View style={styles.titleRewardStatusRow}>
                    <Text style={styles.titleRewardMeta}>Progress {progress}/{required}</Text>
                    {isEarned ? (
                      <View style={styles.titleEarnedPill}>
                        <MaterialCommunityIcons name="check-decagram" size={11} color="#9af3bf" />
                        <Text style={styles.titleEarnedText}>EARNED</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.titleRewardProgressTrack}>
                    <View
                      style={[
                        styles.titleRewardProgressFill,
                        { width: `${progressPercent}%`, backgroundColor: rarityColor },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {quest.requiredItems.length > 0 ? (
          <View style={styles.requirementsBlock}>
            <Text style={styles.reqTitle}>Key Items</Text>
            <View style={styles.requirementsRow}>
              {quest.requiredItems.map((requirement) => {
                const item = ITEM_BY_ID[requirement.itemId];
                const owned = character.inventory[requirement.itemId] ?? 0;
                const committed = getCommittedCount(quest.id, requirement.itemId);
                const satisfied = committed >= requirement.needed;
                return (
                  <View key={`${quest.id}-${requirement.itemId}`} style={styles.reqItem}>
                    <GameItemIcon itemId={requirement.itemId} size={14} />
                    <IconTooltip
                      text={`${item?.name ?? requirement.itemId}: commit items with +/-. Committed items are consumed when quest starts. Key items heavily influence success.`}
                    />
                    <Pressable
                      onPress={() => adjustCommittedItem(quest.id, requirement.itemId, -1, requirement.needed, owned)}
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperButtonText}>-</Text>
                    </Pressable>
                    <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                      {committed}/{requirement.needed}
                    </Text>
                    <Pressable
                      onPress={() => adjustCommittedItem(quest.id, requirement.itemId, 1, requirement.needed, owned)}
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </Pressable>
                    <Text style={styles.reqOwnedText}>Owned {owned}</Text>
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
                const committed = getCommittedCount(quest.id, requirement.itemId);
                const satisfied = committed >= requirement.needed;
                return (
                  <View key={`${quest.id}-optional-${requirement.itemId}`} style={styles.reqItem}>
                    <GameItemIcon itemId={requirement.itemId} size={14} />
                    <IconTooltip
                      text={`${item?.name ?? requirement.itemId}: commit optional supplies with +/-. Committed amount is consumed on quest start and provides bonus success chance.`}
                    />
                    <Pressable
                      onPress={() => adjustCommittedItem(quest.id, requirement.itemId, -1, requirement.needed, owned)}
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperButtonText}>-</Text>
                    </Pressable>
                    <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                      {committed}/{requirement.needed}
                    </Text>
                    <Pressable
                      onPress={() => adjustCommittedItem(quest.id, requirement.itemId, 1, requirement.needed, owned)}
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </Pressable>
                    <Text style={styles.reqOwnedText}>Owned {owned}</Text>
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
                  <Pressable
                    key={`${quest.id}-reward-${reward.itemId}`}
                    style={[
                      styles.rewardItem,
                      { borderColor: rarityColorMap[rewardRarity] },
                    ]}
                    onPress={() =>
                      showQuickInfo(
                        rewardItem?.name ?? reward.itemId,
                        `Grade: ${rewardRarity.toUpperCase()}\nDrop Chance: ${Math.round(reward.chance * 100)}%\nAmount: x${reward.amount}`,
                        rewardRarity,
                        reward.itemId,
                      )
                    }
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
                  </Pressable>
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

        <Pressable
          disabled={Boolean(activeQuest) || blocked || questHealthLocked || isDead}
          onPress={() => handleStartQuest(quest.id)}
          style={styles.actionWrap}
        >
          <View style={[styles.startButton, activeQuest || blocked || questHealthLocked || isDead ? styles.actionDisabled : null]}>
            <Text style={styles.startText}>
              {isDead
                ? "Being Fractured"
                : questHealthLocked
                  ? "Need 50% HP"
                  : blocked
                    ? "Locked"
                    : activeQuest
                      ? "On a Quest"
                      : quest.combatModel === "live"
                        ? "Launch Live Contract"
                        : "Take This Quest"}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  const handleClaimQuest = () => {
    const result = onClaimQuest();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Quest resolved." : "Could not claim quest."));
    if (result.ok) {
      setPendingQuestResultOpen(true);
    }
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
  const handleSell = (itemId: string, unitPrice: number, explicitSellValue?: number) => {
    if (isBuying) {
      return;
    }
    setIsBuying(true);
    const serviceUnitPrice = explicitSellValue ? explicitSellValue * 2 : unitPrice;
    const result = sellGuildItem(itemId, serviceUnitPrice, 1);
    const itemName = ITEM_BY_ID[itemId]?.name ?? itemId;
    const sellUnitPrice = explicitSellValue ?? Math.max(1, Math.floor(unitPrice * 0.5));
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? `Sold: ${itemName} for ${sellUnitPrice}g.` : result.reason ?? "Could not sell.");
    if (result.ok) {
      setLastPurchaseText(`Sold ${itemName} for ${sellUnitPrice}g`);
    }
    setTimeout(() => setIsBuying(false), 450);
  };
  const handleGuildMageRecovery = () => {
    onRecordNpcInteraction(GUILD_MAGE_NPC_ID, isDead ? 8 : 1);
    const result = requestGuildMageRecovery();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Guild mage recovery complete." : "Could not request guild mage recovery."));
  };
  const handleRescueNpcChoice = (accept: boolean) => {
    const result = onRespondRescueNpcRequest(accept);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Response recorded." : "Could not respond."));
    if (result.ok) {
      setRescueDialogOpen(false);
    }
  };
  const handleConquerTowerFloor = (floorNumber: number) => {
    const result = onFinalizeTowerFloor(floorNumber);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Floor finalized." : "Could not finalize floor."));
    if (result.ok) {
      setPendingTowerEncounterOpen(true);
      setTowerRunStageByFloor((current) => ({ ...current, [floorNumber]: "entrance" }));
      setTowerWaveProgressByFloor((current) => ({
        ...current,
        [floorNumber]: {
          normal: "available",
          subBoss: "locked",
          boss: "locked",
        },
      }));
      setTowerWaveReportsByFloor((current) => {
        const next = { ...current };
        delete next[floorNumber];
        return next;
      });
      const floorKey = `floor-${floorNumber}`;
      setSelectedItemsForTower((current) => {
        const next = { ...current };
        delete next[floorKey];
        return next;
      });
    }
  };
  const handleEnterTowerFloor = (floorNumber: number) => {
    setTowerRunStageByFloor((current) => ({ ...current, [floorNumber]: "briefing" }));
    setTowerWaveProgressByFloor((current) => ({
      ...current,
      [floorNumber]: {
        normal: "available",
        subBoss: "locked",
        boss: "locked",
      },
    }));
    setFloorLoreOpenFor(floorNumber);
  };
  const handleContinueFloorFromLore = (floorNumber: number) => {
    setFloorLoreOpenFor(null);
    setTowerRunStageByFloor((current) => ({ ...current, [floorNumber]: "waves" }));
  };
  const startLiveTowerBattle = (
    floorNumber: number,
    wave: TowerWaveKey,
    committedItems: Record<ItemId, number>,
    enemies: TowerEnemyUnit[],
  ) => {
    const pendingBonuses = getPendingAbilityBonuses(character);
    const combatStats = getCharacterCombatStats(character);
    const estimatedTurnDamage = Math.max(8, Math.round((combatStats.damage + pendingBonuses.damageFlat) * 0.28));
    const telegraphs = buildLiveBattleTelegraphs(enemies, estimatedTurnDamage);
    const enemyStatsById = Object.fromEntries(enemies.map((enemy) => [enemy.id, getLiveEnemyCombatStats(enemy)]));
    const firstEnemy = telegraphs[0] ? enemies.find((enemy) => enemy.id === telegraphs[0].enemyId) ?? enemies[0] : enemies[0];
    const firstEnemyStats = firstEnemy ? getLiveEnemyCombatStats(firstEnemy) : { damage: 6, critChance: 8, speed: 5, role: "normal" as const };
    const playerTurnFirst = combatStats.speed >= firstEnemyStats.speed;
    setLiveTowerBattle({
      source: "tower",
      floorNumber,
      wave,
      enemies,
      encounterTitle: `Live Clash: ${getWaveTitle(wave)}`,
      committedItems,
      telegraphs,
      activeIndex: 0,
      position: "mid",
      braceUsed: false,
      skillUsed: false,
      responses: [],
      turnOwner: playerTurnFirst ? "player" : "enemy",
      playerTurnsRemaining: playerTurnFirst ? getTurnBurst(combatStats.speed, firstEnemyStats.speed) : 0,
      enemyTurnsRemaining: playerTurnFirst ? 0 : getTurnBurst(firstEnemyStats.speed, combatStats.speed),
      playerStats: {
        damage: combatStats.damage + pendingBonuses.damageFlat,
        critChance: combatStats.critChance,
        speed: combatStats.speed,
      },
      enemyStatsById,
      playerHp: character.health,
      enemyHpById: Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy.health ?? 1])),
      playerStatusFx: towerStatusEffects.map(mapTowerStatusToLiveFx),
      enemyStatusFxById: Object.fromEntries(enemies.map((enemy) => [enemy.id, []])),
      effectClockElapsedMs: 0,
      effectClockStartedAtMs: playerTurnFirst ? Date.now() : null,
      initiativeHistory: [],
      skillCooldownEndsAtMsById: { ...(character.abilityCooldownsUntilMs ?? {}) },
      queuedEnemyIndex: null,
      turnLog: [
        playerTurnFirst
          ? "Steel rings out first. The enemy is in front of you and the opening is yours."
          : "The enemy lunges before you can settle your stance and steals the first move.",
      ],
    });
    setBattleEffectHint(null);
    setBattleStatusHint(null);
  };
  const startLiveQuestBattle = (quest: QuestDefinition, committedItems: Record<ItemId, number>) => {
    const encounter = LIVE_QUEST_ENCOUNTERS[quest.id];
    if (!encounter) {
      return false;
    }
    const pendingBonuses = getPendingAbilityBonuses(character);
    const combatStats = getCharacterCombatStats(character);
    const estimatedTurnDamage = Math.max(8, Math.round((combatStats.damage + pendingBonuses.damageFlat) * 0.28));
    const telegraphs = buildLiveBattleTelegraphs(encounter.enemies, estimatedTurnDamage);
    const enemyStatsById = Object.fromEntries(encounter.enemies.map((enemy) => [enemy.id, getLiveEnemyCombatStats(enemy)]));
    const firstEnemy =
      telegraphs[0] ? encounter.enemies.find((enemy) => enemy.id === telegraphs[0].enemyId) ?? encounter.enemies[0] : encounter.enemies[0];
    const firstEnemyStats = firstEnemy ? getLiveEnemyCombatStats(firstEnemy) : { damage: 6, critChance: 8, speed: 5, role: "normal" as const };
    const playerTurnFirst = combatStats.speed >= firstEnemyStats.speed;
    setLiveTowerBattle({
      source: "quest",
      floorNumber: 0,
      wave: "normal",
      questId: quest.id,
      encounterTitle: encounter.title,
      encounterSummary: encounter.summary,
      enemies: encounter.enemies,
      committedItems,
      telegraphs,
      activeIndex: 0,
      position: "mid",
      braceUsed: false,
      skillUsed: false,
      responses: [],
      turnOwner: playerTurnFirst ? "player" : "enemy",
      playerTurnsRemaining: playerTurnFirst ? getTurnBurst(combatStats.speed, firstEnemyStats.speed) : 0,
      enemyTurnsRemaining: playerTurnFirst ? 0 : getTurnBurst(firstEnemyStats.speed, combatStats.speed),
      playerStats: {
        damage: combatStats.damage + pendingBonuses.damageFlat,
        critChance: combatStats.critChance,
        speed: combatStats.speed,
      },
      enemyStatsById,
      playerHp: character.health,
      enemyHpById: Object.fromEntries(encounter.enemies.map((enemy) => [enemy.id, enemy.health ?? 1])),
      playerStatusFx: [],
      enemyStatusFxById: Object.fromEntries(encounter.enemies.map((enemy) => [enemy.id, []])),
      effectClockElapsedMs: 0,
      effectClockStartedAtMs: playerTurnFirst ? Date.now() : null,
      initiativeHistory: [],
      skillCooldownEndsAtMsById: { ...(character.abilityCooldownsUntilMs ?? {}) },
      queuedEnemyIndex: null,
      turnLog: [
        playerTurnFirst
          ? "The contract erupts into a live clash. You move first."
          : "The flock drops out of the smoke first and tears the opening move away from you.",
      ],
    });
    setBattleEffectHint(null);
    setBattleStatusHint(null);
    return true;
  };
  const recordLiveBattleResponse = (
    responseType: "attack" | "item" | "skill" | "move" | "brace" | "pass",
    responseId?: ItemId | string | TowerBattlePosition,
  ) => {
    setLiveTowerBattle((current) => {
      if (!current) {
        return current;
      }
      if (current.turnOwner !== "player" || current.queuedEnemyIndex != null) {
        return current;
      }
      const activeTelegraph = current.telegraphs[current.activeIndex];
      if (!activeTelegraph) {
        return current;
      }
      const currentEnemy = current.enemies.find((enemy) => enemy.id === activeTelegraph.enemyId);
      if (!currentEnemy) {
        return current;
      }
      if (responseType === "move" && responseId && getEnemyBlockedPositions(currentEnemy).includes(responseId as TowerBattlePosition)) {
        return current;
      }
      const wallNowMs = Date.now();
      const effectNowMs = getLiveBattleEffectClockMs(current, wallNowMs);
      const turnStatus = applyStartOfTurnStatusEffects(current.playerStatusFx, effectNowMs);
      let nextPlayerStatusFx = turnStatus.nextStatusFx;
      const passiveBattleBonuses = getEquippedPassiveBattleBonuses(character);
      const skillId = responseType === "skill" ? ((responseId as AbilityId | undefined) ?? null) : null;
      const currentSkillProfile = getLiveBattleSkillProfile(skillId);
      const activeSkillBonuses = getCombinedLiveSkillBonuses(nextPlayerStatusFx, unlockedBattleSkills.map((skill) => skill.id), effectNowMs);
      const skillIsCoolingDown =
        responseType === "skill" &&
        skillId != null &&
        (current.skillCooldownEndsAtMsById?.[skillId] ?? 0) > wallNowMs;
      if (responseType === "skill" && (!currentSkillProfile || skillIsCoolingDown)) {
        return current;
      }
      const success =
        (responseType === "item" && responseId === activeTelegraph.recommendedItemId) ||
        (responseType === "move" && responseId === activeTelegraph.suggestedPosition) ||
        (responseType === "skill" && activeTelegraph.suggestedSkillClass === character.classId) ||
        (responseType === "brace" && activeTelegraph.suggestedBrace === true);
      const critCycle = current.playerStats.critChance >= 45 ? 2 : current.playerStats.critChance >= 30 ? 3 : current.playerStats.critChance >= 15 ? 4 : 999;
      const nextTurnNumber = (current.responses?.length ?? 0) + 1;
      const skillAttackBonus = activeSkillBonuses.attackBonus;
      const skillCritBonus = activeSkillBonuses.critBonus;
      const effectiveCritChance = current.playerStats.critChance + skillCritBonus;
      const effectiveSpeed = current.playerStats.speed + activeSkillBonuses.speedBonus;
      const effectiveCritCycle = effectiveCritChance >= 45 ? 2 : effectiveCritChance >= 30 ? 3 : effectiveCritChance >= 15 ? 4 : 999;
      const critTriggered =
        responseType !== "brace" && responseType !== "skill" && responseType !== "pass" && effectiveCritCycle !== 999 && nextTurnNumber % effectiveCritCycle === 0;
      const speedDamageBonus = effectiveSpeed >= 18 ? 3 : effectiveSpeed >= 12 ? 1 : 0;
      const nextPlayerHp = Math.max(0, current.playerHp - turnStatus.hpLoss);
      let playerDamage = Math.max(0, Math.round(current.playerStats.damage * 0.24) + speedDamageBonus);
      playerDamage = calculatePlayerAttackAdjustment(playerDamage, turnStatus.snapshot, passiveBattleBonuses);
      const currentEnemyHp = current.enemyHpById[activeTelegraph.enemyId] ?? (currentEnemy.health ?? 1);
      const woundedTarget = currentEnemy.health > 0 && currentEnemyHp <= Math.ceil((currentEnemy.health ?? 1) * 0.5);
      const attackPosition = (responseType === "attack" ? current.position : undefined) as TowerBattlePosition | undefined;
      const positionAttackBonus = attackPosition ? getPositionAttackBonus(currentEnemy, attackPosition) : 0;
      if (responseType === "attack") {
        playerDamage += skillAttackBonus + positionAttackBonus;
      } else if (responseType === "skill") {
        playerDamage = 0;
      } else if (responseType === "item") {
        playerDamage = 0;
      } else if (responseType === "brace") {
        playerDamage = 0;
      } else if (responseType === "move") {
        playerDamage = 0;
      } else if (responseType === "pass") {
        playerDamage = 0;
      }
      if (!success && (responseType === "item" || responseType === "move")) {
        playerDamage = 0;
      }
      if (turnStatus.snapshot.counterReadyStacks > 0 && responseType === "attack") {
        playerDamage += passiveBattleBonuses.counterBonusDamageFlat + activeSkillBonuses.counterBonusDamageFlat + 4;
      }
      if (woundedTarget) {
        playerDamage += passiveBattleBonuses.woundedTargetDamageFlat + activeSkillBonuses.woundedTargetDamageFlat;
      }
      if (turnStatus.snapshot.hasFrenzied) {
        playerDamage += passiveBattleBonuses.frenzyAttackBonusFlat;
      }
      playerDamage = Math.max(0, playerDamage);
      if (critTriggered) {
        playerDamage = Math.round(playerDamage * 1.5);
      }
      const nextEnemyHp = Math.max(0, currentEnemyHp - playerDamage);
      const actionLabel =
        responseType === "attack"
          ? "Attack"
          : responseType === "skill"
            ? ABILITY_BY_ID[String(responseId ?? character.activeClassSkillId)]?.name ?? "Skill"
            : responseType === "item"
              ? ITEM_BY_ID[String(responseId)]?.name ?? "Item"
              : responseType === "move"
                ? `Shift ${String(responseId ?? current.position)}`
                : responseType === "brace"
                  ? "Guard"
                  : responseType === "pass"
                    ? "Pass"
                  : "Action";
      let resultLine = "";
      const nextEnemyHpById = {
        ...current.enemyHpById,
        [activeTelegraph.enemyId]: nextEnemyHp,
      };
      let nextEnemyStatusFxById = current.enemyStatusFxById;
      nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, {
        clearIds: ["guarded", ...(responseType === "attack" ? ["counter-ready"] : [])],
      });
      const nextSkillCooldownEndsAtMsById = { ...(current.skillCooldownEndsAtMsById ?? {}) };
      const statusLogLines: string[] = [];
      if (responseType === "skill" && currentSkillProfile) {
        const nextEffectEndsAtMs = effectNowMs + currentSkillProfile.durationSeconds * 1000;
        if (skillId) {
          nextSkillCooldownEndsAtMsById[skillId] = wallNowMs + currentSkillProfile.cooldownSeconds * 1000;
        }
        const skillFx: LiveBattleStatusFx = {
          id: currentSkillProfile.effectId,
          label: currentSkillProfile.effectLabel,
          detail: currentSkillProfile.effectDetail,
          icon: currentSkillProfile.effectIcon as keyof typeof MaterialCommunityIcons.glyphMap,
          tone: currentSkillProfile.effectTone,
          expiresAtMs: nextEffectEndsAtMs,
        };
        nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, { replace: [skillFx] });
        resultLine = `You activated ${actionLabel} on yourself. ${currentSkillProfile.effectLabel} is now active.`;
        statusLogLines.push(describeBattleStatusChange(skillFx, "gained"));
      } else if (responseType === "brace") {
        const guardFx: LiveBattleStatusFx = {
          id: "guarded",
          label: "Guarded",
          icon: "shield-check-outline",
          tone: "good",
          detail: "Guard is up. Incoming damage is reduced on enemy turns.",
          stacks: 1,
        };
        nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, { stack: [guardFx] });
        resultLine = "You raise your guard and brace for the next hit.";
        statusLogLines.push(describeBattleStatusChange(guardFx, "gained"));
      } else if (responseType === "move") {
        const targetPosition = (responseId as TowerBattlePosition | undefined) ?? current.position;
        resultLine = getEnemyAdvantagePositions(currentEnemy).includes(targetPosition)
          ? `You shift ${targetPosition} and line up the clean side of ${activeTelegraph.enemyName}. Hits from there will land harder.`
          : `You shift ${targetPosition} and reset your footing.`;
      } else if (responseType === "pass") {
        resultLine = `You yield the moment and let ${activeTelegraph.enemyName} commit first.`;
      } else if (responseType === "item" && responseId) {
        const itemId = responseId as ItemId;
        const itemOutcome = applySelfTargetBattleItem(itemId, nextPlayerStatusFx, nextPlayerHp, character.healthCap);
        nextPlayerStatusFx = itemOutcome.nextStatusFx;
        const updatedPlayerHp = itemOutcome.nextHp;
        resultLine = itemOutcome.logLine;
        const nextEnemyTurnsBase = current.enemyStatsById[activeTelegraph.enemyId];
        return (() => {
          const nextIndexLocal = getNextTelegraphIndexForEnemy(current, activeTelegraph.enemyId, current.activeIndex);
          const nextTurnLog = [...current.turnLog, ...turnStatus.logLines];
          nextTurnLog.push(resultLine);
          const addedStatuses = itemOutcome.nextStatusFx.filter(
            (effect) => !nextPlayerStatusFx.some((entry) => entry.id === effect.id),
          );
          for (const effect of addedStatuses) {
            nextTurnLog.push(describeBattleStatusChange(effect, "gained"));
          }
          const nextPlayerTurnsRemainingLocal = Math.max(0, current.playerTurnsRemaining - 1);
          const nextTurnOwnerLocal = nextPlayerTurnsRemainingLocal > 0 ? "player" : "enemy";
          const nextEffectClockState = getNextBattleEffectClockState(current, nextTurnOwnerLocal, wallNowMs);
          return {
            ...current,
            responses: [
              ...(current.responses ?? []),
              {
                telegraphId: activeTelegraph.id,
                enemyId: activeTelegraph.enemyId,
                mechanic: activeTelegraph.mechanic,
                responseType,
                responseId: itemId,
                success,
              },
            ],
            playerHp: updatedPlayerHp,
            playerStatusFx: nextPlayerStatusFx,
            enemyStatusFxById: nextEnemyStatusFxById,
            effectClockElapsedMs: nextEffectClockState.effectClockElapsedMs,
            effectClockStartedAtMs: nextEffectClockState.effectClockStartedAtMs,
            initiativeHistory: [...current.initiativeHistory, "player" as const].slice(-4),
            turnLog: nextTurnLog,
            skillCooldownEndsAtMsById: nextSkillCooldownEndsAtMsById,
            lastPlayerDamage: 0,
            lastEnemyDamage: 0,
            lastCrit: false,
            activeIndex: nextIndexLocal,
            turnOwner: nextTurnOwnerLocal,
            playerTurnsRemaining: nextPlayerTurnsRemainingLocal,
            enemyTurnsRemaining: nextPlayerTurnsRemainingLocal > 0 ? 0 : Math.max(1, getTurnBurst(nextEnemyTurnsBase.speed, effectiveSpeed + 3)),
          };
        })();
      } else {
        resultLine = `You used ${actionLabel} on ${activeTelegraph.enemyName} and dealt ${playerDamage} damage${critTriggered ? " (CRIT)" : ""}.`;
        if (responseType === "attack" && positionAttackBonus > 0) {
          resultLine += ` ${POSITION_LABELS[current.position]} lane gave you the clean angle for +${positionAttackBonus} damage.`;
        }
        if (turnStatus.snapshot.counterReadyStacks > 0 && responseType === "attack") {
          resultLine += " Counter window spent cleanly.";
        } else if (woundedTarget && playerDamage > 0) {
          resultLine += " The wounded target buckles faster once your blow lands cleanly.";
        }
      }
      for (const status of getPlayerResponseStatusFx(responseType, success, critTriggered, character.activeClassSkillId)) {
        if (status.tone === "good") {
          nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, { stack: [status] });
          statusLogLines.push(describeBattleStatusChange(status, "gained"));
        } else {
          nextEnemyStatusFxById = {
            ...nextEnemyStatusFxById,
            [activeTelegraph.enemyId]: applyBattleStatusChanges(nextEnemyStatusFxById[activeTelegraph.enemyId] ?? [], { stack: [status] }),
          };
          statusLogLines.push(`${activeTelegraph.enemyName}: ${describeBattleStatusChange(status, "gained")}`);
        }
      }
      const enemyStats = current.enemyStatsById[activeTelegraph.enemyId];
      let nextIndex = current.activeIndex;
      let nextTurnOwner: "player" | "enemy" = "enemy";
      let nextPlayerTurnsRemaining = Math.max(0, current.playerTurnsRemaining - 1);
      const initiativeBonus =
        responseType === "skill" && currentSkillProfile
          ? currentSkillProfile.initiativeBonus
          : responseType === "item"
            ? 3
            : responseType === "move"
              ? 1
              : 0;
      let nextEnemyTurnsRemaining = Math.max(1, getTurnBurst(enemyStats.speed, effectiveSpeed + initiativeBonus));
      const nextTurnLog = [...current.turnLog, ...turnStatus.logLines];
      nextTurnLog.push(resultLine);
      nextTurnLog.push(...statusLogLines);
      let bonusPlayerTurns = 0;
      if (critTriggered) {
        bonusPlayerTurns += passiveBattleBonuses.postCritTempoFlat;
      }
      let queuedEnemyIndex: number | null = null;
      if (nextEnemyHp <= 0) {
        const calculatedNextIndex = getNextLiveTelegraphIndex(
          {
            ...current,
            enemyHpById: nextEnemyHpById,
          },
          current.activeIndex + 1,
        );
        const allEnemiesDown = Object.values(nextEnemyHpById).every((hp) => hp <= 0);
        if (allEnemiesDown) {
          nextTurnOwner = "player";
          nextPlayerTurnsRemaining = 0;
          nextEnemyTurnsRemaining = 0;
          nextTurnLog.push(`${activeTelegraph.enemyName} crashes down. The path ahead opens for a heartbeat.`);
        } else {
          const nextEnemyId = current.telegraphs[calculatedNextIndex]?.enemyId ?? activeTelegraph.enemyId;
          const nextEnemyStats = current.enemyStatsById[nextEnemyId] ?? enemyStats;
          const playerFirst = effectiveSpeed >= nextEnemyStats.speed;
          queuedEnemyIndex = calculatedNextIndex;
          nextTurnOwner = "player";
          nextPlayerTurnsRemaining = playerFirst ? getTurnBurst(effectiveSpeed, nextEnemyStats.speed) + passiveBattleBonuses.postKillTempoFlat : 0;
          nextEnemyTurnsRemaining = 0;
          nextTurnLog.push(
            `${activeTelegraph.enemyName} drops where it stood. ${current.telegraphs[calculatedNextIndex]?.enemyName ?? "The next threat"} is already closing in.`,
          );
        }
      } else {
        nextIndex = getNextTelegraphIndexForEnemy(current, activeTelegraph.enemyId, current.activeIndex);
        nextPlayerTurnsRemaining += bonusPlayerTurns;
        if (nextPlayerTurnsRemaining > 0) {
          nextTurnOwner = "player";
          nextEnemyTurnsRemaining = 0;
          nextTurnLog.push(
            bonusPlayerTurns > 0
              ? "You keep pressing forward before the enemy can recover."
              : "You are still faster. The enemy has no time to answer yet.",
          );
        }
      }
      const nextEffectClockState = getNextBattleEffectClockState(current, nextTurnOwner, wallNowMs);
      return {
        ...current,
        responses: [
          ...(current.responses ?? []),
          {
            telegraphId: activeTelegraph.id,
            enemyId: activeTelegraph.enemyId,
            mechanic: activeTelegraph.mechanic,
            responseType,
            responseId: responseId as ItemId | string | TowerBattlePosition | undefined,
            success,
          },
        ],
        playerHp: nextPlayerHp,
        enemyHpById: nextEnemyHpById,
        playerStatusFx: nextPlayerStatusFx,
        enemyStatusFxById: nextEnemyStatusFxById,
        effectClockElapsedMs: nextEffectClockState.effectClockElapsedMs,
        effectClockStartedAtMs: nextEffectClockState.effectClockStartedAtMs,
        initiativeHistory: [...current.initiativeHistory, "player" as const].slice(-4),
        turnLog: nextTurnLog,
        skillCooldownEndsAtMsById: nextSkillCooldownEndsAtMsById,
        queuedEnemyIndex,
        lastPlayerDamage: playerDamage,
        lastEnemyDamage: 0,
        lastCrit: critTriggered,
        activeIndex: nextIndex,
        turnOwner: nextTurnOwner,
        playerTurnsRemaining:
          nextEnemyHp <= 0 || nextPlayerHp <= 0 || queuedEnemyIndex !== null
            ? nextPlayerTurnsRemaining
            : nextTurnOwner === "player"
              ? nextPlayerTurnsRemaining
              : Math.max(1, getTurnBurst(effectiveSpeed, enemyStats.speed)),
        enemyTurnsRemaining: nextEnemyTurnsRemaining,
      };
    });
  };
  const resolveEnemyTurn = () => {
    setLiveTowerBattle((current) => {
      if (!current || current.turnOwner !== "enemy") {
        return current;
      }
      const activeTelegraph = current.telegraphs[current.activeIndex];
      if (!activeTelegraph) {
        return current;
      }
      const currentEnemy = current.enemies.find((enemy) => enemy.id === activeTelegraph.enemyId);
      if (!currentEnemy) {
        return current;
      }
      const wallNowMs = Date.now();
      const effectNowMs = getLiveBattleEffectClockMs(current, wallNowMs);
      const nextPlayerStatusBase = applyBattleStatusChanges(current.playerStatusFx, { nowMs: effectNowMs });
      const activeSkillBonuses = getCombinedLiveSkillBonuses(
        nextPlayerStatusBase,
        unlockedBattleSkills.map((skill) => skill.id),
        effectNowMs,
      );
      const passiveBattleBonuses = getEquippedPassiveBattleBonuses(character);
      const playerStatusSnapshot = getBattleStatusSnapshot(nextPlayerStatusBase);
      const response = (current.responses ?? []).find((entry) => entry.telegraphId === activeTelegraph.id);
      const enemyStats = current.enemyStatsById[activeTelegraph.enemyId];
      const severity = Math.max(
        1,
        getMechanicSeverity(activeTelegraph.mechanic) -
          passiveBattleBonuses.statusSeverityReductionFlat -
          activeSkillBonuses.statusSeverityReductionFlat,
      );
      const enemyCritCycle = enemyStats.critChance >= 18 ? 3 : enemyStats.critChance >= 10 ? 4 : 999;
      const enemyTurnOrdinal = Math.max(1, getTurnBurst(enemyStats.speed, current.playerStats.speed) - current.enemyTurnsRemaining + 1);
      const enemyCrit = enemyCritCycle !== 999 && enemyTurnOrdinal % enemyCritCycle === 0;
      const effectivePlayerSpeed = current.playerStats.speed + activeSkillBonuses.speedBonus;
      const speedMitigation = effectivePlayerSpeed >= 18 ? 2 : effectivePlayerSpeed >= 12 ? 1 : 0;
      let incomingDamage = calculateIncomingEnemyDamage({
        baseDamage: Math.max(1, Math.round(enemyStats.damage * 0.72)),
        severity,
        enemyCrit,
        responseSucceeded: Boolean(response?.success),
        speedMitigation,
        snapshot: playerStatusSnapshot,
        activeSkillProfile: activeSkillBonuses,
        passiveBonuses: passiveBattleBonuses,
      });
      if ((activeTelegraph.mechanic.toLowerCase().includes("spark") || activeTelegraph.mechanic.toLowerCase().includes("overcharge")) && playerStatusSnapshot.groundedStacks > 0) {
        incomingDamage = Math.max(0, incomingDamage - 4 * playerStatusSnapshot.groundedStacks);
      }
      if ((activeTelegraph.mechanic.toLowerCase().includes("spark") || activeTelegraph.mechanic.toLowerCase().includes("field")) && playerStatusSnapshot.wardedStacks > 0) {
        incomingDamage = Math.max(0, incomingDamage - 3 * playerStatusSnapshot.wardedStacks);
      }
      const nextPlayerHp = Math.max(0, current.playerHp - incomingDamage);
      const appliedFx = !response?.success ? getMechanicStatusFx(activeTelegraph.mechanic) : null;
      let nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusBase, {
        clearIds: ["guarded"],
        stack: appliedFx ? [appliedFx] : undefined,
      });
      if (
        response?.responseType === "brace" &&
        response.success &&
        (playerStatusSnapshot.hasBulwarkOath || playerStatusSnapshot.hasSteelRhythm || passiveBattleBonuses.counterBonusDamageFlat > 0)
      ) {
        nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, {
          replace: [
            {
              id: "counter-ready",
              label: "Counter Ready",
              icon: "sword-cross",
              tone: "good",
              detail: "The enemy overcommitted. Your next attack will strike harder.",
              expiresAtMs: effectNowMs + 18000,
            },
          ],
        });
      }
      if (nextPlayerHp < current.playerHp && passiveBattleBonuses.frenzyDurationSeconds > 0) {
        nextPlayerStatusFx = applyBattleStatusChanges(nextPlayerStatusFx, {
          replace: [
            {
              id: "frenzied",
              label: "Frenzied",
              icon: "axe-battle",
              tone: "good",
              detail: "Pain sharpens the follow-up. Your attacks and crit pressure are temporarily higher.",
              expiresAtMs: effectNowMs + passiveBattleBonuses.frenzyDurationSeconds * 1000,
            },
          ],
        });
      }
      let nextEnemyTurnsRemaining = Math.max(0, current.enemyTurnsRemaining - 1);
      let nextTurnOwner: "player" | "enemy" = nextEnemyTurnsRemaining > 0 ? "enemy" : "player";
      const allEnemiesDown = Object.values(current.enemyHpById).every((hp) => hp <= 0);
      const allBattleLost = nextPlayerHp <= 0;
      let nextIndex =
        allEnemiesDown || allBattleLost
          ? current.activeIndex
          : getNextTelegraphIndexForEnemy(current, activeTelegraph.enemyId, current.activeIndex);
      const nextPlayerTurnsRemaining =
        allEnemiesDown || allBattleLost || nextTurnOwner !== "player" ? 0 : Math.max(1, getTurnBurst(effectivePlayerSpeed, enemyStats.speed));
      const enemyTurnLog = [
        `${currentEnemy.name} lashes out with ${activeTelegraph.mechanic.split(":")[0]} and hits you for ${incomingDamage}${enemyCrit ? " damage (CRIT)" : " damage"}.`,
      ];
      if (appliedFx) {
        enemyTurnLog.push(describeBattleStatusChange(appliedFx, "gained"));
      }
      if (
        response?.responseType === "brace" &&
        response.success &&
        (playerStatusSnapshot.hasBulwarkOath || playerStatusSnapshot.hasSteelRhythm || passiveBattleBonuses.counterBonusDamageFlat > 0)
      ) {
        enemyTurnLog.push("The blow slams into your guard, rebounds, and leaves the enemy wide open for a counter.");
      }
      if (nextPlayerHp < current.playerHp && passiveBattleBonuses.frenzyDurationSeconds > 0) {
        enemyTurnLog.push("Pain only drives you harder. Your battle frenzy rises instead of breaking.");
      }
      const finalTurnOwner = allEnemiesDown || allBattleLost ? "player" : nextTurnOwner;
      const nextEffectClockState = getNextBattleEffectClockState(current, finalTurnOwner, wallNowMs);
      return {
        ...current,
        playerHp: nextPlayerHp,
        playerStatusFx: nextPlayerStatusFx,
        turnLog: [...current.turnLog, ...enemyTurnLog],
        effectClockElapsedMs: nextEffectClockState.effectClockElapsedMs,
        effectClockStartedAtMs: nextEffectClockState.effectClockStartedAtMs,
        initiativeHistory: [...current.initiativeHistory, "enemy" as const].slice(-4),
        lastEnemyDamage: incomingDamage,
        lastPlayerDamage: 0,
        lastCrit: enemyCrit,
        turnOwner: finalTurnOwner,
        playerTurnsRemaining: nextPlayerTurnsRemaining,
        enemyTurnsRemaining: allEnemiesDown || allBattleLost ? 0 : nextTurnOwner === "enemy" ? nextEnemyTurnsRemaining : 0,
        activeIndex: nextIndex,
      };
    });
  };
  const advanceLiveBattleEnemy = () => {
    setLiveTowerBattle((current) => {
      if (!current || current.queuedEnemyIndex == null) {
        return current;
      }
      const nextEnemyId = current.telegraphs[current.queuedEnemyIndex]?.enemyId;
      const nextEnemyStats = nextEnemyId ? current.enemyStatsById[nextEnemyId] : null;
      const playerTurnFirst = nextEnemyStats ? current.playerStats.speed >= nextEnemyStats.speed : true;
      const nextTurnOwner: "player" | "enemy" = playerTurnFirst ? "player" : "enemy";
      const nextEffectClockState = getNextBattleEffectClockState(current, nextTurnOwner, Date.now());
      return {
        ...current,
        activeIndex: current.queuedEnemyIndex,
        queuedEnemyIndex: null,
        turnOwner: nextTurnOwner,
        effectClockElapsedMs: nextEffectClockState.effectClockElapsedMs,
        effectClockStartedAtMs: nextEffectClockState.effectClockStartedAtMs,
        playerTurnsRemaining: playerTurnFirst && nextEnemyStats ? Math.max(1, getTurnBurst(current.playerStats.speed, nextEnemyStats.speed)) : 0,
        enemyTurnsRemaining: !playerTurnFirst && nextEnemyStats ? Math.max(1, getTurnBurst(nextEnemyStats.speed, current.playerStats.speed)) : 0,
        turnLog: [
          ...current.turnLog,
          playerTurnFirst
            ? "You step over the fallen enemy and meet the next threat before it can set itself."
            : "Another enemy surges in while you are still recovering from the last exchange.",
        ],
      };
    });
  };
  const resolveLiveTowerBattle = () => {
    if (!liveTowerBattle) {
      return;
    }
    if (liveTowerBattle.source === "quest") {
      const questEncounter = liveTowerBattle.questId ? LIVE_QUEST_ENCOUNTERS[liveTowerBattle.questId] : undefined;
      const battleWon = Object.values(liveTowerBattle.enemyHpById).every((hp) => hp <= 0);
      const result = onClaimQuest(
        battleWon,
        battleWon ? questEncounter?.successSummary : questEncounter?.failureSummary,
      );
      setNoticeTone(result.ok ? "ok" : "error");
      setNotice(result.reason ?? (result.ok ? "Quest combat resolved." : "Quest combat could not be resolved."));
      if (result.ok) {
        setPendingQuestResultOpen(true);
      }
      setLiveTowerBattle(null);
      return;
    }
    const result = onResolveTowerWave(
      liveTowerBattle.floorNumber,
      liveTowerBattle.wave,
      liveTowerBattle.committedItems,
      {
        position: liveTowerBattle.position,
        braceUsed: liveTowerBattle.braceUsed,
        skillId: liveTowerBattle.skillUsed ? character.activeClassSkillId : null,
        itemIdsUsed: Object.values(liveTowerBattle.committedItems).some((amount) => amount > 0)
          ? Object.keys(liveTowerBattle.committedItems) as ItemId[]
          : [],
        responses: liveTowerBattle.responses,
        finalPlayerHp: liveTowerBattle.playerHp,
        finalEnemyHpById: liveTowerBattle.enemyHpById,
        battleLog: liveTowerBattle.turnLog,
        abilityCooldownsUntilMs: liveTowerBattle.skillCooldownEndsAtMsById,
        persistentStatusEffects: getPersistentWaveStatusFx(
          liveTowerBattle.playerStatusFx,
          getLiveBattleEffectClockMs(liveTowerBattle, Date.now()),
          Date.now(),
        ),
      },
    );
    if (!result.ok || !result.outcome) {
      setNoticeTone("error");
      setNotice(result.reason ?? "Wave resolution failed.");
      setLiveTowerBattle(null);
      return;
    }
    const outcome = result.outcome;
    const { countered, triggered, lines, success } = outcome;
    if (outcome.conditionalEncounter) {
      setActiveConditionalEncounter(outcome.conditionalEncounter);
      setConditionalEncounterResolved(false);
      setConditionalEncounterOpen(true);
    }
    setTowerWaveReportsByFloor((current) => ({
      ...current,
      [liveTowerBattle.floorNumber]: {
        ...(current[liveTowerBattle.floorNumber] ?? {}),
        [liveTowerBattle.wave]: {
          wave: liveTowerBattle.wave,
          title: getWaveTitle(liveTowerBattle.wave),
          countered,
          triggered,
          lines,
          statusEffects: outcome.statusEffects,
        },
      },
    }));
    setNoticeTone(success ? "ok" : "error");
    setNotice(result.reason ?? `${getWaveTitle(liveTowerBattle.wave)} resolved.`);
    if (outcome.collapsed && outcome.collapseMessage) {
      setTowerCollapseAftermath({
        title: `${getWaveTitle(liveTowerBattle.wave)} Collapse`,
        message: outcome.collapseMessage,
      });
    }
    if (success) {
      setTowerWaveProgressByFloor((current) => {
        const currentWaveState = current[liveTowerBattle.floorNumber] ?? {
          normal: "available",
          subBoss: "locked",
          boss: "locked",
        };
        if (currentWaveState[liveTowerBattle.wave] !== "available") {
          return current;
        }
        const nextWaveState = { ...currentWaveState, [liveTowerBattle.wave]: "cleared" as const };
        if (liveTowerBattle.wave === "normal") {
          nextWaveState.subBoss = "available";
        } else if (liveTowerBattle.wave === "subBoss") {
          nextWaveState.boss = "available";
        }
        return {
          ...current,
          [liveTowerBattle.floorNumber]: nextWaveState,
        };
      });
      const floorSelectionKey = `floor-${liveTowerBattle.floorNumber}`;
      const usedItemIds = new Set(Object.keys(liveTowerBattle.committedItems));
      if (usedItemIds.size > 0) {
        setSelectedItemsForTower((current) => {
          const floorItems = { ...(current[floorSelectionKey] ?? {}) };
          for (const itemId of usedItemIds) {
            delete floorItems[itemId as ItemId];
          }
          return {
            ...current,
            [floorSelectionKey]: floorItems,
          };
        });
      }
    }
    setLiveTowerBattle(null);
  };
  const letMechanicThrough = () => {
    if (!liveTowerBattle) {
      return;
    }
    const activeTelegraph = liveTowerBattle.telegraphs[liveTowerBattle.activeIndex];
    if (!activeTelegraph) {
      return;
    }
    setLiveTowerBattle((current) =>
      current
        ? (() => {
            const enemyStats = current.enemyStatsById[activeTelegraph.enemyId];
            return {
              ...current,
              responses: [
                ...(current.responses ?? []),
                {
                  telegraphId: activeTelegraph.id,
                  enemyId: activeTelegraph.enemyId,
                  mechanic: activeTelegraph.mechanic,
                  responseType: "brace",
                  responseId: "none",
                  success: false,
                },
              ],
              turnLog: [
                ...current.turnLog,
                `You hesitate for a breath. ${activeTelegraph.enemyName} sees the opening and moves.`,
              ],
              lastPlayerDamage: 0,
              lastEnemyDamage: 0,
              lastCrit: false,
              turnOwner: "enemy",
              playerTurnsRemaining: 0,
              enemyTurnsRemaining: getTurnBurst(enemyStats.speed, current.playerStats.speed),
            };
          })()
        : current,
    );
  };
  const playEnemyTurn = () => {
    if (!liveTowerBattle || liveTowerBattle.turnOwner !== "enemy" || enemyTurnAnimating) {
      return;
    }
    setEnemyTurnAnimating(true);
    setEnemyTurnMeter(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setEnemyTurnMeter(Math.min(100, progress));
      if (progress >= 100) {
        clearInterval(interval);
        resolveEnemyTurn();
        setEnemyTurnMeter(0);
        setEnemyTurnAnimating(false);
      }
    }, 70);
  };
  const handleConquerTowerWaveSection = (floorNumber: number, wave: TowerWaveKey) => {
    const floor = towerFloors.find((entry) => entry.floorNumber === floorNumber);
    if (!floor) {
      return;
    }
    const floorSelectionKey = `floor-${floorNumber}`;
    const enemies = getTowerEnemiesForFloor(floor);
    const waveCommittedItems = Object.fromEntries(
      towerPreparedItemIds.map((itemId) => [itemId, 1]),
    ) as Record<ItemId, number>;
    const waveEnemies = wave === "normal" ? enemies.normal : wave === "subBoss" ? enemies.subBoss : enemies.boss;
    const supportsLiveBattle = waveEnemies.length > 0;
    if (supportsLiveBattle) {
      startLiveTowerBattle(floorNumber, wave, waveCommittedItems, waveEnemies);
      return;
    }
    const result = onResolveTowerWave(floorNumber, wave, waveCommittedItems);
    if (!result.ok || !result.outcome) {
      setNoticeTone("error");
      setNotice(result.reason ?? "Wave resolution failed.");
      return;
    }
    const outcome = result.outcome;
    const { countered, triggered, lines, success } = outcome;
    setWaveResolveModal(outcome);
    if (outcome.conditionalEncounter) {
      setActiveConditionalEncounter(outcome.conditionalEncounter);
      setConditionalEncounterResolved(false);
      setConditionalEncounterOpen(true);
    }
    setTowerWaveReportsByFloor((current) => ({
      ...current,
      [floorNumber]: {
        ...(current[floorNumber] ?? {}),
        [wave]: {
          wave,
          title: getWaveTitle(wave),
          countered,
          triggered,
          lines,
          statusEffects: outcome.statusEffects,
        },
      },
    }));
    setNoticeTone(success ? "ok" : "error");
    setNotice(result.reason ?? `${getWaveTitle(wave)} resolved.`);
    if (!success) {
      return;
    }
    setTowerWaveProgressByFloor((current) => {
      const currentWaveState = current[floorNumber] ?? {
        normal: "available",
        subBoss: "locked",
        boss: "locked",
      };
      if (currentWaveState[wave] !== "available") {
        return current;
      }
      const nextWaveState = { ...currentWaveState, [wave]: "cleared" as const };
      if (wave === "normal") {
        nextWaveState.subBoss = "available";
      } else if (wave === "subBoss") {
        nextWaveState.boss = "available";
      }
      return {
        ...current,
        [floorNumber]: nextWaveState,
      };
    });
    const usedItemIds = new Set(Object.keys(waveCommittedItems));
    if (usedItemIds.size > 0) {
      setSelectedItemsForTower((current) => {
        const floorItems = { ...(current[floorSelectionKey] ?? {}) };
        for (const itemId of usedItemIds) {
          delete floorItems[itemId];
        }
        return {
          ...current,
          [floorSelectionKey]: floorItems,
        };
      });
    }
  };
  const handleFloorEncounterChoice = (accept: boolean) => {
    if (!activeFloorEncounter) {
      return;
    }
    const result = onRespondFloorEncounter(
      activeFloorEncounter.encounter.floorNumber,
      activeFloorEncounter.encounter.id,
      accept,
    );
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Encounter choice recorded." : "Could not resolve encounter."));
  };
  const handleConditionalEncounterChoice = (accept: boolean) => {
    const encounter = activeConditionalEncounter;
    if (!encounter) {
      return;
    }
    const result = onRespondTowerConditionalEncounter(encounter.id, accept, encounter.contactStyle);
    setConditionalEncounterResolved(true);
    setConditionalEncounterOpen(false);
    setActiveConditionalEncounter(null);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(
      result.reason
        ? `${accept ? encounter.acceptOutcome : encounter.declineOutcome} ${result.reason}`
        : accept
          ? encounter.acceptOutcome
          : encounter.declineOutcome,
    );
  };
  const handleAttemptRankUp = () => {
    const result = onAttemptRankUp(selectedItemsForRankTrial);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Rank trial resolved." : "Could not start rank trial."));
    if (result.ok) {
      setSelectedItemsForRankTrial({});
    }
  };
  const handleResolveLyraQuestChoice = (choice: "returned" | "kept" | "reported") => {
    const result = onResolveLyraQuestChoice(choice);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Lyra's request resolved." : "Could not resolve Lyra's request."));
    if (result.ok) {
      setQuestResultOpen(false);
    }
  };
  const openStoreDesk = () => {
    setGuildTab("store");
    setNoticeTone("ok");
    setNotice("Bran Kest: Supplies in stock. Buy what you need, and sell what you don't.");
  };
  const promptStoreVisit = () => {
    onRecordNpcInteraction(QUARTERMASTER_BRAN_NPC_ID, 6);
    setBranSpeakCount((prev) => {
      const next = prev + 1;
      setBranDialogLine(pickEscalatingDialog(BRAN_STORE_DIALOG_LINES, next));
      return next;
    });
    setGuildDialog("bran-store");
  };
  const handleBranDialogChoice = (openStore: boolean) => {
    onRecordNpcInteraction(QUARTERMASTER_BRAN_NPC_ID, openStore ? 4 : 1);
    setGuildDialog(null);
    if (openStore) {
      openStoreDesk();
      return;
    }
    setNoticeTone("ok");
    setNotice("Bran Kest: I'll keep the stock ready for your next run.");
  };
  const promptRankVisit = () => {
    onRecordNpcInteraction(rankExaminerProfile.id, rankUpAvailable ? 5 : -3);
    const trial = getNextRankTrial();
    const access = getRankTrialAccess();
    const ready = Boolean(trial && access.allowed);
    setExaminerSpeakCount((prev) => {
      const next = prev + 1;
      if (!trial) {
        setExaminerDialogLine(pickEscalatingDialog(EXAMINER_NO_TRIAL_DIALOG_LINES, next));
      } else if (ready) {
        setExaminerDialogLine(pickEscalatingDialog(EXAMINER_READY_DIALOG_LINES, next));
      } else {
        setExaminerDialogLine(pickEscalatingDialog(EXAMINER_NOT_READY_DIALOG_LINES, next));
      }
      return next;
    });
    setGuildDialog("examiner-rank");
  };
  const openRankDesk = () => {
    setGuildTab("rank");
    setNoticeTone("ok");
    setNotice(`Examiner ${rankExaminerProfile.name}: Present your trial prep and I'll authorize your promotion attempt.`);
  };
  const handleExaminerDialogChoice = (openDesk: boolean) => {
    onRecordNpcInteraction(rankExaminerProfile.id, openDesk ? 4 : 0);
    setGuildDialog(null);
    if (openDesk) {
      openRankDesk();
      return;
    }
    setNoticeTone("ok");
    setNotice(`Examiner ${rankExaminerProfile.name}: Return when your preparation is complete.`);
  };
  const promptTamsinVisit = () => {
    onRecordNpcInteraction("npc-tamsin-vale", 2, 0);
    setGuildDialog("tamsin-floor2");
  };
  const promptTamsinFollowup = () => {
    onRecordNpcInteraction("npc-tamsin-vale", 1, 0);
    setGuildDialog("tamsin-followup");
  };
  const promptTamsinCorridorReport = () => {
    onRecordNpcInteraction("npc-tamsin-vale", 2, 0);
    setGuildDialog("tamsin-corridor-report");
  };
  const promptTamsinDeepWarning = () => {
    onRecordNpcInteraction("npc-tamsin-vale", 2, 0);
    setGuildDialog("tamsin-deep-warning");
  };
  const promptTamsinFloorTwoAftermath = () => {
    onRecordNpcInteraction("npc-tamsin-vale", 3, 0);
    setGuildDialog("tamsin-floor2-aftermath");
  };
  const handleTamsinDialogChoice = (choice: "steady" | "mercenary") => {
    const result = onRespondThornRunnerIntroduction(choice);
    setGuildDialog(null);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Tamsin's route briefing recorded." : "Tamsin has nothing new to say."));
    if (result.ok) {
      setGuildTab("board");
    }
  };
  const handleTamsinFollowup = () => {
    const result = onAcknowledgeThornRunnerFollowup();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Tamsin's corridor notes recorded." : "Tamsin has nothing new to add."));
    if (result.ok) {
      setGuildDialog(null);
    }
  };
  const handleTamsinCorridorReport = () => {
    const result = onAcknowledgeThornRunnerCorridorReport();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Tamsin's first Thorn Corridor report was filed." : "Tamsin has nothing new to log."));
    if (result.ok) {
      setGuildDialog(null);
    }
  };
  const handleTamsinDeepWarning = () => {
    const result = onAcknowledgeThornRunnerDeepLaneWarning();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Tamsin's deeper corridor warning was logged." : "Tamsin has nothing new to log."));
    if (result.ok) {
      setGuildDialog(null);
    }
  };
  const handleTamsinFloorTwoAftermath = () => {
    const result = onAcknowledgeThornRunnerFloorTwoAftermath();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Tamsin closed the Thorn Corridor ledger." : "Tamsin has no new Floor 2 aftermath to record."));
    if (result.ok) {
      setGuildDialog(null);
    }
  };
  const returnToNpcHall = () => {
    setGuildTab("npc");
    setNoticeTone("ok");
    setNotice("Returned to NPC Hall.");
  };
  const showQuickInfo = (title: string, body: string, rarity?: ItemRarity, itemId?: ItemId) => {
    setNoticeTone("ok");
    setNotice(`${title}: ${body}`);
    setInfoPanel({ title, body, rarity, itemId });
  };
  const isItemAppraised = (itemId: ItemId) => (character.appraisedItemIds ?? []).includes(itemId);
  const getItemDisplayName = (itemId: ItemId) => {
    const item = ITEM_BY_ID[itemId];
    if (!item) {
      return itemId;
    }
    if (item.requiresAppraisal && !isItemAppraised(itemId)) {
      return "Unknown Remnant";
    }
    return item.name;
  };
  const getItemDisplayDescription = (itemId: ItemId) => {
    const item = ITEM_BY_ID[itemId];
    if (!item) {
      return "";
    }
    if (item.requiresAppraisal && !isItemAppraised(itemId)) {
      return "A rare floor remnant sealed behind guild appraisal. Bran can identify it properly.";
    }
    return item.description ?? "";
  };
  const getItemDisplayRarity = (itemId: ItemId): ItemRarity | undefined => {
    const item = ITEM_BY_ID[itemId];
    if (!item) {
      return undefined;
    }
    if (item.requiresAppraisal && !isItemAppraised(itemId)) {
      return undefined;
    }
    return item.rarity;
  };
  const getNpcDialogProfile = (npcId: string) =>
    npcProfiles.find((profile) => profile.id === npcId) ??
    encounteredNpcById.get(npcId) ??
    null;
  const hasFloorIntel = (floorNumber: number) => (character.purchasedFloorIntelNumbers ?? []).includes(floorNumber);
  const getTowerEnemyFloorNumber = (enemyId: string) => {
    const match = enemyId.match(/^f(\d+)-/i);
    return match ? Number(match[1]) : null;
  };
  const handleGuildTabPress = (nextTab: GuildTab) => {
    if (towerModeScreenActive && nextTab !== "tower") {
      setNoticeTone("error");
      setNotice("You are inside the tower. Only your inventory is accessible until the run ends.");
      return;
    }
    setGuildTab(nextTab);
  };
  const classifyWaveLine = (line: string): { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; tone: "good" | "bad" | "neutral" } => {
    const lower = line.toLowerCase();
    if (lower.includes("neutralized")) {
      return { icon: "shield-check-outline", color: "#8de9a8", tone: "good" };
    }
    if (lower.includes("connected") || lower.includes("hit with full effect")) {
      return { icon: "alert-octagon-outline", color: "#ff9ea9", tone: "bad" };
    }
    return { icon: "sword-cross", color: "#ffd58f", tone: "neutral" };
  };
  const getRecipeTheme = (recipeId: string) => {
    if (recipeId.includes("antitoxin")) {
      return {
        icon: "flask-empty-remove-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
        accent: "#8de9a8",
        panel: "#27533a",
        gradient: ["rgba(59, 117, 83, 0.2)", "rgba(37, 28, 51, 0.08)", "rgba(17, 14, 28, 0.02)"] as const,
      };
    }
    if (recipeId.includes("grounding")) {
      return {
        icon: "lightning-bolt-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
        accent: "#8ac3ff",
        panel: "#24486f",
        gradient: ["rgba(64, 118, 173, 0.2)", "rgba(35, 29, 58, 0.08)", "rgba(17, 14, 28, 0.02)"] as const,
      };
    }
    if (recipeId.includes("ward")) {
      return {
        icon: "shield-star-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
        accent: "#d9c17d",
        panel: "#6a5525",
        gradient: ["rgba(150, 119, 52, 0.2)", "rgba(42, 30, 57, 0.08)", "rgba(17, 14, 28, 0.02)"] as const,
      };
    }
    if (recipeId.includes("thorn")) {
      return {
        icon: "leaf" as keyof typeof MaterialCommunityIcons.glyphMap,
        accent: "#b8d97d",
        panel: "#486227",
        gradient: ["rgba(99, 131, 48, 0.2)", "rgba(35, 29, 48, 0.08)", "rgba(17, 14, 28, 0.02)"] as const,
      };
    }
    return {
      icon: "hammer-wrench" as keyof typeof MaterialCommunityIcons.glyphMap,
      accent: "#d7b072",
      panel: "#6f5224",
      gradient: ["rgba(198, 142, 67, 0.12)", "rgba(88, 56, 141, 0.05)", "rgba(23, 16, 37, 0.02)"] as const,
    };
  };

  const weaponEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "weapon");
  const buffEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "buff");
  const materialEntries = GUILD_STORE_ITEMS.filter((entry) => ITEM_BY_ID[entry.itemId]?.category === "material");
  const remnantEntries = Object.values(ITEM_BY_ID)
    .filter((item) => item.category === "material" && item.isRemnant && (character.inventory[item.id] ?? 0) > 0)
    .sort((left, right) => {
      const rarityOrder: Record<ItemRarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
      const rarityDelta = rarityOrder[left.rarity] - rarityOrder[right.rarity];
      if (rarityDelta !== 0) {
        return rarityDelta;
      }
      return left.name.localeCompare(right.name);
    });
  const nextFloorNumber = (character.towerProgress?.highestFloorCleared ?? 0) + 1;
  const currentTowerFloor = towerFloors.find((floor) => floor.floorNumber === nextFloorNumber) ?? null;
  const towerCompleted = nextFloorNumber > towerFloors.length;
  const currentTowerRunStage = currentTowerFloor ? towerRunStageByFloor[currentTowerFloor.floorNumber] ?? "entrance" : null;
  const towerModeActiveForFloor = currentTowerRunStage === "briefing" || currentTowerRunStage === "waves";
  const towerModeScreenActive = guildTab === "tower" && towerModeActiveForFloor;
  const hideTopTowerHealth = towerModeScreenActive;
  const showTopGuildHealth = !hideTopTowerHealth && guildTab !== "npc" && guildTab !== "leaderboard";
  const equippedWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : null;
  const equippedBuffIds = character.equippedBuffIds ?? [];
  const activeBuffIds = equippedBuffIds.filter((buffId) => isBuffActive(character, buffId, nowMs));
  const rankTrial = getNextRankTrial();
  const rankTrialAccess = getRankTrialAccess();
  const rankTrialChance = getRankTrialSuccessChance(selectedItemsForRankTrial);
  const rankUpAvailable = rankTrialAccess.allowed;
  const examinerReadyForTrial = Boolean(rankTrial && rankTrialAccess.allowed);
  const questHealthGate = Math.ceil(character.healthCap * 0.5);
  const isDead = character.health <= 1;
  const questHealthLocked = character.health > 1 && character.health < questHealthGate;
  const noviceReviveRemainingMs = Math.max(0, (character.noviceEmergencyReviveAvailableAtMs ?? 0) - nowMs);
  const noviceReviveLocked = character.progression.level <= 1 && noviceReviveRemainingMs > 0;
  const canRequestGuildMage = isDead && !noviceReviveLocked;
  const archmageUsesNoviceMercy = character.progression.level <= 1;
  const archmageRiteName = archmageUsesNoviceMercy ? "Mercy Thread" : "Veilweave Restoration";
  const archmageRiteEffectText = archmageUsesNoviceMercy ? "Restore 50% vitality" : "Restore full vitality";
  const archmageRiteCostText = archmageUsesNoviceMercy ? "No level toll" : "Level toll -1";
  const archmageCooldownText = archmageUsesNoviceMercy
    ? noviceReviveLocked
      ? `Thread sealed ${formatRemaining(noviceReviveRemainingMs)}`
      : "Thread open"
    : "Circle ready";
  const archmageRiteSummary = !isDead
    ? "Seraphine only answers when the Tower casts you out with a fractured being."
    : archmageUsesNoviceMercy
      ? noviceReviveLocked
        ? "Mercy Thread already caught you once. Its seal must reform before she can cast it again."
        : "Mercy Thread is ready. Seraphine will restore half your vitality without taking a level."
      : "Veilweave Restoration is ready. Seraphine will restore your full vitality and claim one level as the toll.";
  const archmageTooltipDetail = !isDead
    ? `${archmageRiteName} only awakens when the Tower casts you out and leaves your being fractured at 1 HP.`
    : archmageUsesNoviceMercy
      ? noviceReviveLocked
        ? `Mercy Thread is the beginner safeguard. It restores you to 50% HP, but the thread is sealed for ${formatRemaining(noviceReviveRemainingMs)} before it can be cast again.`
        : "Mercy Thread is the beginner safeguard. It restores you to 50% HP with no level toll."
      : "Veilweave Restoration restores your full vitality. The toll is one level, and all benefits tied to that lost level are surrendered.";
  const archmageVisibleStateText = archmageUsesNoviceMercy
    ? noviceReviveLocked
      ? archmageCooldownText
      : isDead
        ? archmageCooldownText
        : "Dormant"
    : isDead
      ? archmageCooldownText
      : "Dormant";
  const archmageActionText = canRequestGuildMage
    ? archmageUsesNoviceMercy
      ? "Invoke Mercy Thread"
      : "Invoke Veilweave Rite"
    : archmageUsesNoviceMercy && noviceReviveLocked
      ? archmageCooldownText
      : !isDead
        ? "Rite Dormant"
        : "Rite Sealed";
  const towerOutcomeFloor = lastTowerOutcome
    ? towerFloors.find((floor) => floor.floorNumber === lastTowerOutcome.floorNumber) ?? null
    : null;
  const towerClearStory = lastTowerOutcome?.success ? FLOOR_CLEAR_STORY[lastTowerOutcome.floorNumber] ?? null : null;
  const primedAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  const primedAbilities = primedAbilityIds
    .map((abilityId) => ABILITY_BY_ID[abilityId])
    .filter(Boolean);
  const pendingAbilityBonuses = getPendingAbilityBonuses(character);
  const pendingComboSummary = getPendingAbilityComboSummary(character);
  const topClimberEntries = climberLeaderboard.slice(0, 6);
  const playerBoardEntry = climberLeaderboard.find((entry) => entry.isPlayer);
  const floorEncounterDecision = activeFloorEncounter?.decision;
  const npcDispositionById = storyState.npcDispositionById ?? {};
  const npcInteractionCountById = storyState.npcInteractionCountById ?? {};

  useEffect(() => {
    onTowerModeChange(towerModeScreenActive);
  }, [onTowerModeChange, towerModeScreenActive]);

  useEffect(() => () => onTowerModeChange(false), [onTowerModeChange]);

  useEffect(() => {
    if (towerModeActiveForFloor && guildTab !== "tower") {
      setGuildTab("tower");
    }
  }, [towerModeActiveForFloor, guildTab]);

  useEffect(() => {
    if (!currentTowerFloor || !towerModeActiveForFloor || character.health > 1) {
      return;
    }
    setTowerRunStageByFloor((current) => ({
      ...current,
      [currentTowerFloor.floorNumber]: "entrance",
    }));
    setTowerWaveProgressByFloor((current) => ({
      ...current,
      [currentTowerFloor.floorNumber]: {
        normal: "available",
        subBoss: "locked",
        boss: "locked",
      },
    }));
    setTowerWaveReportsByFloor((current) => ({
      ...current,
      [currentTowerFloor.floorNumber]: {},
    }));
    setWaveResolveModal(null);
    setPendingTowerEncounterOpen(false);
    setTowerEncounterOpen(false);
    setConditionalEncounterOpen(false);
    setConditionalEncounterResolved(false);
    setGuildTab("npc");
  }, [character.health, currentTowerFloor, towerModeActiveForFloor]);
  const floorEncounterAccepted = floorEncounterDecision === "accepted";
  const encounteredNpcById = useMemo(
    () => new Map(encounteredNpcProfiles.map((profile) => [profile.id, profile] as const)),
    [encounteredNpcProfiles],
  );
  const unlockedBattleSkills = useMemo(() => getUnlockedActiveSkills(character), [character]);
  const getNpcFloorReached = (npc: GuildNpcProfile): number => {
    const encountered = encounteredNpcById.get(npc.id);
    if (encountered) {
      return encountered.floorReached;
    }
    if (npc.id === GUILD_MAGE_NPC_ID) {
      return 10;
    }
    return Math.max(1, Math.floor(npc.level / 3));
  };
  const weaponProficiency =
    equippedWeapon?.category === "weapon"
      ? character.progression.level >= (equippedWeapon.requiredLevel ?? 1)
        ? 100
        : 25
      : 0;
  const getNpcSummaryText = (npc: GuildNpcProfile): string => {
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
      if (storyState.aldricQuestPath === "saved") {
        return "Aldric's daughter lives. He now treats your climb as something worth guarding, and his loyalty to you is no longer in doubt.";
      }
      if (storyState.aldricQuestPath === "too_late") {
        return "Aldric knows you accepted the plea, but you arrived too late. He has begun walking a darker path, though he has not turned fully against you.";
      }
      if (storyState.aldricQuestPath === "refused") {
        return "Aldric left the guild hall after your refusal. The plea is over, but the consequence is not.";
      }
      return rescueNpcStatus === "accepted"
        ? "Aldric remains in the guild while the rescue operation is active."
        : "A father asks for your help rescuing his daughter from nearby bandits.";
    }
    if (npc.id === WARRIOR_PATH_GUIDE_NPC_PROFILE.id) {
      return "Your Level 15 specialization mentor is now available in the NPC Hall.";
    }
    if (npc.id === GUILD_MAGE_NPC_ID) {
      return archmageRiteSummary;
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID) {
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2) {
        return "Quartermaster Bran has started treating your requests like those of a climber expected to return from harsher floors. His store talk now carries a little more respect than caution.";
      }
      return "Quartermaster Bran manages the guild store. Buy gear, supplies, and sell materials through this desk.";
    }
    if (npc.id === "npc-tamsin-vale") {
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2 && !storyState.thornRunnerIntroductionChoice) {
        return "Tamsin has noticed that you cleared Floor 2: Thorn Corridor without taking her route help first. She wants a direct guild-side talk about what you saw and what kind of climber comes back from that floor cold.";
      }
      if (storyState.thornRunnerFloorTwoAftermathReady && !storyState.thornRunnerFloorTwoAftermathReviewed) {
        return "Tamsin wants to close out your first full clear of Floor 2: Thorn Corridor. The guild has started talking about what that clear means for your climb.";
      }
      if (storyState.thornRunnerFloorTwoAftermathReviewed) {
        return "Tamsin has closed the Floor 2: Thorn Corridor ledger on your first clear. In guild eyes, your climb no longer looks like beginner momentum dressed up as luck.";
      }
      if (storyState.thornRunnerDeepLaneWarningReady && !storyState.thornRunnerDeepLaneWarningReviewed) {
        return "Tamsin wants to brief you on what changed deeper in Floor 2: Thorn Corridor after the execution lane broke. She does not think the thing waiting below is just another thorn beast.";
      }
      if (storyState.thornRunnerDeepLaneWarningReviewed) {
        return "Tamsin has marked the deeper corridor warning in her ledger. She now treats the lower reaches of Floor 2: Thorn Corridor as the first sign that the Tower is starting to watch back.";
      }
      if (storyState.thornRunnerCorridorReportReady && !storyState.thornRunnerCorridorReportReviewed) {
        return "Tamsin wants your first report from inside Floor 2: Thorn Corridor before she opens more of her route ledger to the climb ahead.";
      }
      if (storyState.thornRunnerCorridorReportReviewed) {
        return "Tamsin has filed your first report from Floor 2: Thorn Corridor and opened more of her runner's ledger. She now treats your climb like one that can survive deliberate pressure.";
      }
      if (storyState.thornRunnerQuestStatus === "completed" && storyState.thornRunnerFollowupReviewed) {
        return "Tamsin has logged the recovered satchel and opened her notes on Floor 2: Thorn Corridor to you. Her corridor work now reads you as proven help.";
      }
      if (storyState.thornRunnerQuestStatus === "completed") {
        return "Tamsin has seen you bring corridor work back alive. Return once to review what the recovered satchel taught her about Floor 2: Thorn Corridor.";
      }
      if (storyState.thornRunnerIntroductionChoice === "steady") {
        return "Tamsin has posted her snagline recovery under your name. She expects you to treat Thorn Corridor like route work, not salvage gambling.";
      }
      if (storyState.thornRunnerIntroductionChoice === "mercenary") {
        return "Tamsin still posted the snagline recovery, but she now watches to see whether you chase the pay faster than the lane.";
      }
      return "A thorn-lane runner who has started watching your rise past Floor 1. She has work tied to Floor 2: Thorn Corridor if you can take it seriously.";
    }
    if (rankTrial && npc.id === rankExaminerProfile.id) {
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2) {
        return `Assigned examiner for ${rankTrial.fromRank} -> ${rankTrial.toRank} promotion trial. Your Floor 2 clear has also put your name on more than one formal guild ledger.`;
      }
      return `Assigned examiner for ${rankTrial.fromRank} -> ${rankTrial.toRank} promotion trial.`;
    }
    const encountered = encounteredNpcById.get(npc.id);
    if (encountered?.summary) {
      return encountered.summary;
    }
    return "Guild operations personnel. Additional interactions unlock as systems expand.";
  };
  const getNpcTypeChips = (npc: GuildNpcProfile): Array<{ icon: string; color: string; text: string; itemId?: ItemId }> => {
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
      if (storyState.aldricQuestPath === "saved") {
        return [
          { icon: "account-heart-outline", color: "#9ce8c2", text: "Loyal Ally" },
          { icon: "shield-check-outline", color: "#ffd48f", text: "Daughter Saved" },
          { icon: "sword-cross", color: "#a8d2ff", text: "Climb Support Expected" },
          { icon: "star-four-points-circle-outline", color: "#d0b4ff", text: "Ending Weight" },
        ];
      }
      if (storyState.aldricQuestPath === "too_late") {
        return [
          { icon: "timer-sand-empty", color: "#ffb18f", text: "Too Late" },
          { icon: "skull-outline", color: "#ff8d8d", text: "Daughter Lost" },
          { icon: "information-outline", color: "#a8d2ff", text: "Occasional Dark Intel" },
          { icon: "star-four-points-circle-outline", color: "#d0b4ff", text: "Ending Weight" },
        ];
      }
      return [
        { icon: "account-heart-outline", color: "#ffb8ac", text: "Request: Daughter Rescue" },
        { icon: "alert-octagon-outline", color: "#ffd48f", text: "Threat: Bandit Cell" },
        { icon: "sword-cross", color: "#a8d2ff", text: "Recommended: Lv 2+" },
        { icon: "script-text-outline", color: "#9ce8c2", text: rescueNpcStatus === "accepted" ? "Quest Unlocked" : "Awaiting Response" },
      ];
    }
    if (npc.id === WARRIOR_PATH_GUIDE_NPC_PROFILE.id) {
      return [
        { icon: "sword-cross", color: "#ffd48f", text: "Specialization: Knight / Berserker" },
        { icon: "account-school-outline", color: "#9ce8c2", text: "Mentor: Assigned" },
        { icon: "map-marker-path", color: "#a8d2ff", text: "Trial: Coming Soon" },
        { icon: "clock-outline", color: "#d0b4ff", text: "Status: Awaiting Implementation" },
      ];
    }
    if (npc.id === GUILD_MAGE_NPC_ID) {
      return [
        { icon: "star-four-points-circle-outline", color: "#d9b6ff", text: `Rite: ${archmageRiteName}` },
        { icon: noviceReviveLocked ? "timer-sand-empty" : "check-decagram-outline", color: "#a8d2ff", text: archmageVisibleStateText },
        {
          icon: "lifebuoy",
          color: "#ffc47d",
          text: archmageUsesNoviceMercy ? "Novice Safeguard" : "10th-Circle Rite",
        },
      ];
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID) {
      return [
        { icon: "storefront-outline", color: "#ffd48f", text: "Guild Store Access" },
        { icon: "sack", color: "#9ce8c2", text: "Buy / Sell Materials" },
        { icon: "sword-cross", color: "#a8d2ff", text: "Weapon Inventory" },
        {
          icon: (character.towerProgress?.highestFloorCleared ?? 0) >= 2 ? "medal-outline" : "flask-outline",
          color: (character.towerProgress?.highestFloorCleared ?? 0) >= 2 ? "#ffcf8d" : "#d0b4ff",
          text: (character.towerProgress?.highestFloorCleared ?? 0) >= 2 ? "Floor 2 Clear Recognized" : "Sigil & Potion Supply",
        },
      ];
    }
    if (npc.id === "npc-tamsin-vale") {
      return [
        { icon: "map-marker-path", color: "#9ce8c2", text: "Floor 2: Thorn Corridor" },
        { icon: "hook", color: "#ffd48f", text: "Snagline Recovery" },
        {
          icon: storyState.thornRunnerIntroductionChoice === "mercenary" ? "cash-multiple" : "shield-check-outline",
          color: storyState.thornRunnerIntroductionChoice === "mercenary" ? "#ffb59d" : "#a8d2ff",
          text:
            storyState.thornRunnerIntroductionChoice === "mercenary"
              ? "First Read: Coin First"
              : storyState.thornRunnerIntroductionChoice === "steady"
                ? "First Read: Steady Hands"
                : "Awaiting First Read",
        },
        {
          icon:
            storyState.thornRunnerFloorTwoAftermathReady
              ? "bookmark-check-outline"
              : storyState.thornRunnerFloorTwoAftermathReviewed
                ? "book-check-outline"
                : storyState.thornRunnerDeepLaneWarningReady
              ? "alert-rhombus-outline"
              : storyState.thornRunnerDeepLaneWarningReviewed
                ? "eye-circle-outline"
                : storyState.thornRunnerCorridorReportReady
              ? "script-text-outline"
              : storyState.thornRunnerCorridorReportReviewed
                ? "book-open-variant"
                : storyState.thornRunnerQuestStatus === "completed"
              ? storyState.thornRunnerFollowupReviewed
                ? "notebook-check-outline"
                : "book-clock-outline"
              : "script-text-outline",
          color:
            storyState.thornRunnerFloorTwoAftermathReady
              ? "#ffd48f"
              : storyState.thornRunnerFloorTwoAftermathReviewed
                ? "#9ce8c2"
                : storyState.thornRunnerDeepLaneWarningReady
              ? "#ffb59d"
              : storyState.thornRunnerDeepLaneWarningReviewed
                ? "#d9b6ff"
                : storyState.thornRunnerCorridorReportReady
              ? "#ffcf8d"
              : storyState.thornRunnerCorridorReportReviewed
                ? "#9ce8c2"
                : storyState.thornRunnerQuestStatus === "completed"
              ? storyState.thornRunnerFollowupReviewed
                ? "#9ce8c2"
                : "#ffd48f"
              : "#d0b4ff",
          text:
            storyState.thornRunnerFloorTwoAftermathReady
              ? "Floor 2 Aftermath Waiting"
              : storyState.thornRunnerFloorTwoAftermathReviewed
                ? "Floor 2 Ledger Closed"
                : storyState.thornRunnerDeepLaneWarningReady
              ? "Deep Corridor Warning"
              : storyState.thornRunnerDeepLaneWarningReviewed
                ? "Deeper Threat Logged"
                : storyState.thornRunnerCorridorReportReady
              ? "Corridor Report Waiting"
              : storyState.thornRunnerCorridorReportReviewed
                ? "Corridor Report Filed"
                : storyState.thornRunnerQuestStatus === "completed"
              ? storyState.thornRunnerFollowupReviewed
                ? "Thorn Notes Logged"
                : "Follow-Up Waiting"
              : "Board Contract Available",
        },
      ];
    }
    if (rankTrial && npc.id === rankExaminerProfile.id) {
      return [
        { icon: "shield-crown-outline", color: "#ffd48f", text: `Trial: ${rankTrial.fromRank} -> ${rankTrial.toRank}` },
        { icon: "sword-cross", color: "#a8d2ff", text: `Gate: Level ${rankTrial.minLevel}+` },
        { icon: "clipboard-check-outline", color: "#9ce8c2", text: `Quest Clears ${completedQuestCount}/${rankTrial.minQuestClears}` },
        { icon: "lightning-bolt-outline", color: "#d0b4ff", text: `Stamina Cost ${rankTrial.staminaCost}` },
      ];
    }
    return [
      { icon: "shield-crown-outline", color: "#ffd48f", text: "Guild Office Personnel" },
      { icon: "file-document-outline", color: "#9ce8c2", text: "Registry Operations" },
      { icon: "account-group-outline", color: "#a8d2ff", text: "Adventurer Services" },
      { icon: "clock-outline", color: "#d0b4ff", text: "More Interactions Soon" },
    ];
  };
  const getNpcDisposition = (npc: GuildNpcProfile): NpcDisposition => {
    if (npc.id === "tower-floor1-lyra-intercept") {
      if (!storyState.lyraMet) {
        return {
          label: "Unknown",
          score: 18,
          icon: "help-rhombus-outline",
          color: "#b9a8d9",
          flavor: "A shadow on the ash lanes. Her intent is not yet clear.",
        };
      }
      const trust = storyState.lyraTrust - storyState.lyraHelpDeclined;
      const score = npcDispositionById[npc.id] ?? (trust <= 0 ? 36 : trust <= 2 ? 58 : trust <= 4 ? 78 : 100);
      if (trust <= 0) {
        return {
          label: "Watching",
          score,
          icon: "eye-outline",
          color: "#d7c19b",
          flavor: "Lyra has taken notice, but she still keeps her distance.",
        };
      }
      if (trust <= 2) {
        return {
          label: "Open",
          score,
          icon: "map-marker-path",
          color: "#8fd1ff",
          flavor: "She is willing to leave signs for you, though not without caution.",
        };
      }
      if (trust <= 4) {
        return {
          label: "Trusted",
          score,
          icon: "shield-account-outline",
          color: "#8fe4b0",
          flavor: "Lyra now treats you as someone worth guiding through the ash.",
        };
      }
      return {
        label: "Oathbound",
        score,
        icon: "star-four-points-circle-outline",
        color: "#f1d295",
        flavor: "Her route marks are laid for you as if by vow.",
      };
    }
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
      if (storyState.aldricQuestPath === "saved") {
        return {
          label: "Oathbound",
          score: npcDispositionById[npc.id] ?? 92,
          icon: "shield-account-outline",
          color: "#8fe4b0",
          flavor: "Aldric now treats your climb as a vow he means to honor beside you.",
        };
      }
      if (storyState.aldricQuestPath === "too_late") {
        return {
          label: "Grieving",
          score: npcDispositionById[npc.id] ?? 34,
          icon: "weather-night",
          color: "#c9a6ff",
          flavor: "He does not deny that you tried, but grief has bent him toward darker answers.",
        };
      }
      if (storyState.aldricQuestPath === "refused") {
        return {
          label: "Ashbound",
          score: npcDispositionById[npc.id] ?? 12,
          icon: "emoticon-devil-outline",
          color: "#ff8d8d",
          flavor: "Aldric's plea ended in refusal, and what follows will not stay buried near Watchtrail.",
        };
      }
      const score = npcDispositionById[npc.id] ?? (rescueNpcStatus === "accepted" ? 72 : rescueNpcStatus === "refused_once" ? 28 : 40);
      if (rescueNpcStatus === "accepted") {
        return {
          label: "Hopeful",
          score,
          icon: "account-heart-outline",
          color: "#ffb7a7",
          flavor: "Aldric is clinging to your promise and watching for your return.",
        };
      }
      if (rescueNpcStatus === "refused_once") {
        return {
          label: "Desperate",
          score,
          icon: "alert-octagon-outline",
          color: "#ff9c8f",
          flavor: "He is shaken, but still hoping you will change your mind.",
        };
      }
      return {
        label: "Pleading",
        score,
        icon: "hand-extended-outline",
        color: "#ffd18f",
        flavor: "He has no leverage to offer you, only the weight of his plea.",
      };
    }
    if (npc.id === GUILD_MAGE_NPC_ID) {
      return {
        label: isDead ? "Attending" : "Reserved",
        score: isDead ? 68 : 48,
        icon: isDead ? "star-four-points-circle" : "book-lock-outline",
        color: isDead ? "#d8b4ff" : "#bca8dc",
        flavor: isDead
          ? "Seraphine has turned her attention to your fractured being."
          : "The Archmage keeps her distance until the Tower forces your need.",
      };
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID) {
      const interactions = npcInteractionCountById[npc.id] ?? 0;
      const score = npcDispositionById[npc.id] ?? Math.min(82, 42 + interactions * 8);
      return {
        label: interactions >= 4 ? "Familiar" : "Professional",
        score,
        icon: "storefront-outline",
        color: interactions >= 4 ? "#8fe4b0" : "#a8d2ff",
        flavor:
          interactions >= 4
            ? "Bran recognizes you as a regular and loosens his tone."
            : "Bran treats you as another adventurer to outfit and send out.",
      };
    }
    if (npc.id === "npc-tamsin-vale") {
      const choice = storyState.thornRunnerIntroductionChoice;
      const completed = storyState.thornRunnerQuestStatus === "completed";
      const score =
        npcDispositionById[npc.id] ??
        (completed ? 76 : choice === "steady" ? 66 : choice === "mercenary" ? 42 : 52);
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2 && !choice) {
        return {
          label: "Caught Up",
          score: Math.max(score, 64),
          icon: "stairs-up",
          color: "#ffcf8d",
          flavor: "You climbed past her route work and forced a later introduction. Tamsin is now reading you through what you survived, not through her first briefing.",
        };
      }
      if (completed) {
        return {
          label: "Proven",
          score,
          icon: "shield-check-outline",
          color: "#9ce8c2",
          flavor: "Tamsin now treats you as someone worth trusting with corridor work that comes back alive.",
        };
      }
      if (choice === "steady") {
        return {
          label: "Measured",
          score,
          icon: "map-marker-path",
          color: "#8fd8ff",
          flavor: "She sees you as careful enough to work a live thorn lane without feeding it your nerve.",
        };
      }
      if (choice === "mercenary") {
        return {
          label: "Wary",
          score,
          icon: "eye-outline",
          color: "#ffbc9a",
          flavor: "She posted the work, but she is still measuring whether you respect the lane or only the pay.",
        };
      }
      return {
        label: "Sizing You Up",
        score,
        icon: "compass-outline",
        color: "#d7c19b",
        flavor: "Tamsin watches for how you carry yourself before she decides what kind of runner you are.",
      };
    }
    if (rankTrial && npc.id === rankExaminerProfile.id) {
      const interactions = npcInteractionCountById[npc.id] ?? 0;
      const irritated = !rankUpAvailable && interactions >= 4;
      return {
        label: rankUpAvailable ? "Assessing" : irritated ? "Irritated" : "Formal",
        score: npcDispositionById[npc.id] ?? (rankUpAvailable ? 64 : irritated ? 24 : 40),
        icon: rankUpAvailable ? "clipboard-check-outline" : irritated ? "alert-circle-outline" : "scale-balance",
        color: rankUpAvailable ? "#9ce8c2" : irritated ? "#ff9ea9" : "#cfc3a7",
        flavor: rankUpAvailable
          ? "The examiner is prepared to judge your worth for advancement."
          : irritated
            ? "Your repeated interruptions are eroding the office's patience."
            : "The rank office keeps its distance until the record is complete.",
      };
    }
    if (npc.department === "command") {
    return {
      label: "Recognized",
      score: 62,
        icon: "shield-crown-outline",
        color: "#f0d08d",
        flavor: "Guild command knows your face, though not yet your full measure.",
      };
    }
    if (npc.department === "frontdesk") {
      return {
        label: "Familiar",
        score: 55,
        icon: "account-outline",
        color: "#8fd8ff",
        flavor: "The front desk knows your name and keeps your record close at hand.",
      };
    }
    return {
      label: "Neutral",
      score: 50,
      icon: "account-circle-outline",
      color: "#cdbb9c",
      flavor: "You are known, but no personal bond has formed yet.",
    };
  };
  const getNpcPassingRemark = (npc: GuildNpcProfile) => {
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
      if (rescueNpcStatus === "available" || rescueNpcStatus === "refused_once") {
        return {
          lines: [
            "\"If you're going near Watchtrail, don't let me keep begging twice.\"",
            "\"Every hour you stand here is another hour my girl stays in their hands.\"",
          ],
          icon: "message-alert-outline" as const,
          color: "#fff0d8",
          borderColor: "#ffbf8f",
          backgroundColor: "rgba(129, 61, 34, 0.96)",
        };
      }
      if (storyState.aldricQuestPath === "saved") {
        return {
          lines: [
            "\"You pulled my child out of the dark. I haven't forgotten what that cost.\"",
            "\"People say tower climber. I say the one who brought my daughter home alive.\"",
          ],
          icon: "message-check-outline" as const,
          color: "#eafff1",
          borderColor: "#93e3b1",
          backgroundColor: "rgba(27, 82, 54, 0.94)",
        };
      }
      if (storyState.aldricQuestPath === "too_late" || storyState.aldricQuestPath === "refused") {
        return {
          lines: [
            "\"Some losses don't stop talking just because the hall went quiet.\"",
            "\"The guild moves on fast. Grief doesn't.\"",
          ],
          icon: "message-text-outline" as const,
          color: "#f0dbff",
          borderColor: "#caa8ff",
          backgroundColor: "rgba(67, 43, 94, 0.96)",
        };
      }
    }
    if (npc.id === "npc-tamsin-vale") {
      if (storyState.thornRunnerFloorTwoAftermathReady && !storyState.thornRunnerFloorTwoAftermathReviewed) {
        return {
          lines: [
            "\"Floor 2 changed the way this hall says your name. Sit down and hear why.\"",
            "\"Don't spend the Floor 2 clear too quickly. The hall is still deciding what it means.\"",
          ],
          icon: "message-badge-outline" as const,
          color: "#fff1cf",
          borderColor: "#ffd08a",
          backgroundColor: "rgba(102, 72, 29, 0.95)",
        };
      }
      if (storyState.thornRunnerDeepLaneWarningReady && !storyState.thornRunnerDeepLaneWarningReviewed) {
        return {
          lines: [
            "\"The lower stretch isn't growing wild anymore. It's choosing where to hurt you.\"",
            "\"What waits deeper in Floor 2 has started moving like it's judging mistakes.\"",
          ],
          icon: "message-alert-outline" as const,
          color: "#fff0ed",
          borderColor: "#ffb69e",
          backgroundColor: "rgba(118, 52, 43, 0.96)",
        };
      }
      if (storyState.thornRunnerCorridorReportReady && !storyState.thornRunnerCorridorReportReviewed) {
        return {
          lines: [
            "\"Don't give me heroics. Give me what Floor 2: Thorn Corridor actually did to you.\"",
            "\"Save the brave version for the board. I want the true one.\"",
          ],
          icon: "message-text-outline" as const,
          color: "#fff1cf",
          borderColor: "#ffd48f",
          backgroundColor: "rgba(109, 78, 33, 0.95)",
        };
      }
      if (storyState.thornRunnerQuestStatus === "completed" && !storyState.thornRunnerFollowupReviewed) {
        return {
          lines: [
            "\"I pulled something useful out of that satchel. Read it before you walk in blind again.\"",
            "\"The satchel told me more than the contract did. Come hear it.\"",
          ],
          icon: "message-processing-outline" as const,
          color: "#fff1cf",
          borderColor: "#d4b67e",
          backgroundColor: "rgba(88, 65, 34, 0.95)",
        };
      }
      if (storyState.thornRunnerQuestStatus === "available" && !storyState.thornRunnerIntroductionChoice) {
        return {
          lines: [
            "\"If you step into Floor 2 cold, the corridor will teach you with your blood first.\"",
            "\"Floor 2 doesn't punish pride all at once. It bleeds it out of you slowly.\"",
          ],
          icon: "message-draw" as const,
          color: "#e7f7ff",
          borderColor: "#8fd8ff",
          backgroundColor: "rgba(30, 77, 103, 0.96)",
        };
      }
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2 && !storyState.thornRunnerIntroductionChoice) {
        return {
          lines: [
            "\"You cleared Floor 2 without my route marks? Fine. Then start talking.\"",
            "\"You skipped the briefing and came back alive anyway. That earns a different conversation.\"",
          ],
          icon: "message-question-outline" as const,
          color: "#fff0d2",
          borderColor: "#ffcf8d",
          backgroundColor: "rgba(102, 74, 26, 0.95)",
        };
      }
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID && (character.towerProgress?.highestFloorCleared ?? 0) >= 2) {
      return {
        lines: [
          "\"You're buying like someone planning to come back from harsher floors now.\"",
          "\"Floor 2 changes what I bother recommending to a climber.\"",
        ],
        icon: "message-outline" as const,
        color: "#fff0d2",
        borderColor: "#ffcf8d",
        backgroundColor: "rgba(99, 70, 28, 0.95)",
      };
    }
    if (rankTrial && npc.id === rankExaminerProfile.id) {
      if (rankUpAvailable) {
        return {
          lines: [
            `"Paper says you're eligible. Now show me the climb agrees."`,
            `"Eligibility is ink. Promotion is proof."`,
          ],
          icon: "message-check-outline" as const,
          color: "#eafff1",
          borderColor: "#9ce8c2",
          backgroundColor: "rgba(30, 86, 56, 0.95)",
        };
      }
      if ((character.towerProgress?.highestFloorCleared ?? 0) >= 2) {
        return {
          lines: [
            `"Floor 2 is on your record now. The office does notice when someone comes back from it."`,
            `"Deeper floors make cleaner evidence than promises do."`,
          ],
          icon: "message-badge-outline" as const,
          color: "#e8f4ff",
          borderColor: "#a8d2ff",
          backgroundColor: "rgba(34, 68, 102, 0.95)",
        };
      }
    }
    if (npc.id === GUILD_MAGE_NPC_ID && isDead) {
      return {
        lines: [
          "\"Come here before that fracture settles any deeper.\"",
          "\"Stand still. The Tower already took enough out of you.\"",
        ],
        icon: "message-flash-outline" as const,
        color: "#f6e4ff",
        borderColor: "#d9b6ff",
        backgroundColor: "rgba(79, 47, 109, 0.95)",
      };
    }
    if (npc.id === WARRIOR_PATH_GUIDE_NPC_PROFILE.id) {
      return {
        lines: [
          "\"Steel first. Names later. Your path lesson will come.\"",
          "\"A path chosen too early is usually just a mood with a weapon.\"",
        ],
        icon: "message-outline" as const,
        color: "#efe6ff",
        borderColor: "#d0b4ff",
        backgroundColor: "rgba(68, 53, 103, 0.95)",
      };
    }
    return null;
  };
  const getNpcPassingRemarkLine = (
    npc: GuildNpcProfile,
    remark: NonNullable<ReturnType<typeof getNpcPassingRemark>>,
  ) => {
    const lines = remark.lines;
    if (!lines.length) {
      return "";
    }
    const interactionSeed = npcInteractionCountById[npc.id] ?? 0;
    const dispositionSeed = storyState.npcDispositionById?.[npc.id] ?? 0;
    const towerSeed = character.towerProgress?.highestFloorCleared ?? 0;
    const timeSeed = Math.floor(nowMs / 12000);
    const index = Math.abs(interactionSeed + dispositionSeed + towerSeed + timeSeed) % lines.length;
    return lines[index];
  };
  const getQuestSourcesForItem = (itemId: ItemId): string[] =>
    quests
      .filter((quest) => quest.itemRewards.some((reward) => reward.itemId === itemId))
      .map((quest) => quest.title)
      .slice(0, 2);

  const getTowerEnemiesForFloor = (floor: TowerFloorDefinition): {
    normal: TowerEnemyUnit[];
    subBoss: TowerEnemyUnit[];
    boss: TowerEnemyUnit[];
  } => {
    if (floor.enemyRoster) {
      return {
        normal: floor.enemyRoster.normal,
        subBoss: floor.enemyRoster.subBoss,
        boss: floor.enemyRoster.boss,
      };
    }
    return {
      normal: floor.normalEnemies.map((name, index) => ({
        id: `${floor.id}-normal-${index}`,
        name,
        role: "normal",
        level: floor.minLevel,
        health: 40 + floor.minLevel * 6,
        icon: "sword",
        description: "Common hostile unit encountered on this floor.",
      })),
      subBoss: floor.subBosses.map((name, index) => ({
        id: `${floor.id}-sub-${index}`,
        name,
        role: "subBoss",
        level: floor.minLevel + 2,
        health: 110 + floor.minLevel * 10,
        icon: "skull-outline",
        description: "Elite hostile with elevated threat profile.",
      })),
      boss: floor.mainBosses.map((name, index) => ({
        id: `${floor.id}-boss-${index}`,
        name,
        role: "boss",
        level: floor.minLevel + 4,
        health: 170 + floor.minLevel * 12,
        icon: "crown-outline",
        description: "Floor commander. Defeat required for progression.",
      })),
    };
  };

  const getCounterItemIdFromMechanicText = (mechanic: string): ItemId | null => {
    const lower = mechanic.toLowerCase();
    const marker = lower.includes("counter with item:")
      ? "counter with item:"
      : lower.includes("counter with")
        ? "counter with"
        : lower.includes("counter supply:")
          ? "counter supply:"
          : null;
    if (!marker) {
      return null;
    }
    const markerIndex = lower.indexOf(marker);
    if (markerIndex < 0) {
      return null;
    }
    const counterTextRaw = mechanic.slice(markerIndex + marker.length).replace(/\./g, "").trim().toLowerCase();
    if (!counterTextRaw) {
      return null;
    }
    const match = Object.values(ITEM_BY_ID).find((item) => item.name.toLowerCase() === counterTextRaw);
    return match?.id ?? null;
  };

  const getWaveEnemies = (
    enemies: { normal: TowerEnemyUnit[]; subBoss: TowerEnemyUnit[]; boss: TowerEnemyUnit[] },
    wave: TowerWaveKey,
  ): TowerEnemyUnit[] => (wave === "normal" ? enemies.normal : wave === "subBoss" ? enemies.subBoss : enemies.boss);

  const getWaveTitle = (wave: TowerWaveKey): string =>
    wave === "normal" ? "Normal Wave" : wave === "subBoss" ? "Sub-Boss" : "Main Boss";

  const getRecommendedItemsByWave = (
    floor: TowerFloorDefinition,
    enemies: { normal: TowerEnemyUnit[]; subBoss: TowerEnemyUnit[]; boss: TowerEnemyUnit[] },
  ): Record<TowerWaveKey, Array<{ itemId: ItemId; needed: number }>> => {
    const usedByWave: Record<TowerWaveKey, Set<ItemId>> = {
      normal: new Set<ItemId>(),
      subBoss: new Set<ItemId>(),
      boss: new Set<ItemId>(),
    };
    const waveOrder: TowerWaveKey[] = ["normal", "subBoss", "boss"];
    for (const wave of waveOrder) {
      for (const enemy of getWaveEnemies(enemies, wave)) {
        for (const mechanic of enemy.mechanics ?? []) {
          const counterItemId = getCounterItemIdFromMechanicText(mechanic);
          if (counterItemId) {
            usedByWave[wave].add(counterItemId);
          }
        }
      }
    }
    const assigned = new Set<ItemId>();
    const out: Record<TowerWaveKey, Array<{ itemId: ItemId; needed: number }>> = {
      normal: [],
      subBoss: [],
      boss: [],
    };
    for (const wave of waveOrder) {
      for (const requirement of floor.recommendedItems) {
        if (usedByWave[wave].has(requirement.itemId) && !assigned.has(requirement.itemId)) {
          out[wave].push(requirement);
          assigned.add(requirement.itemId);
        }
      }
    }
    // Keep unlinked supplies useful by pushing remaining into normal wave prep.
    for (const requirement of floor.recommendedItems) {
      if (!assigned.has(requirement.itemId)) {
        out.normal.push(requirement);
      }
    }
    return out;
  };

  const getWaveDrops = (
    floor: TowerFloorDefinition,
    wave: TowerWaveKey,
  ): {
    guaranteed: Array<{ itemId: ItemId; amount: number }>;
      possible: Array<{ itemId: ItemId; amount: number; chance: number }>;
  } => {
    if (floor.floorNumber === 1) {
      if (wave === "normal") {
        return {
          guaranteed: [
            { itemId: "remnant-ash-rat-fang", amount: 1 },
            { itemId: "remnant-dust-crawler-shell", amount: 1 },
          ],
          possible: [
            { itemId: "remnant-ash-rat-hide", amount: 1, chance: 0.44 },
            { itemId: "ore-iron", amount: 2, chance: 0.68 },
            { itemId: "healing-herb", amount: 2, chance: 0.58 },
            { itemId: "health-potion", amount: 1, chance: 0.32 },
            { itemId: "rope", amount: 1, chance: 0.45 },
            { itemId: "torch", amount: 1, chance: 0.4 },
            { itemId: "antitoxin-vial", amount: 1, chance: 0.28 },
            { itemId: "guard-tonic", amount: 1, chance: 0.22 },
          ],
        };
      }
      if (wave === "subBoss") {
        return {
          guaranteed: [{ itemId: "remnant-sentinel-shard", amount: 1 }],
          possible: [],
        };
      }
      return {
        guaranteed: [{ itemId: "remnant-spark-core-fragment", amount: 1 }],
        possible: [
          { itemId: "weapon-warrior-training-blade", amount: 1, chance: 0.045 },
          { itemId: "weapon-ranger-training-spear", amount: 1, chance: 0.045 },
          { itemId: "weapon-mage-training-staff", amount: 1, chance: 0.045 },
        ],
      };
    }
    const guaranteed = (floor.guaranteedItemRewards ?? []).filter((drop) => {
      const key = drop.itemId.toLowerCase();
      if (wave === "normal") {
        return key.includes("ash-rat") || key.includes("dust-crawler");
      }
      if (wave === "subBoss") {
        return key.includes("sentinel");
      }
      return key.includes("warden");
    });
    const possible = (floor.bonusItemRewards ?? []).filter((drop) => {
      const item = ITEM_BY_ID[drop.itemId];
      if (!item) {
        return wave === "normal";
      }
      if (wave === "boss") {
        return item.category === "weapon" || item.rarity === "epic" || item.rarity === "legendary";
      }
      if (wave === "subBoss") {
        return item.rarity === "rare" || item.id.includes("ward") || item.id.includes("lockpick");
      }
      return item.rarity === "common" || item.id.includes("herb") || item.id.includes("rope") || item.id.includes("torch");
    });
    return { guaranteed, possible };
  };

  const adjustRankTrialItem = (
    itemId: ItemId,
    delta: number,
    maxAllowed: number,
    owned: number,
  ) => {
    setSelectedItemsForRankTrial((current) => {
      const currentAmount = current[itemId] ?? 0;
      const nextAmount = Math.max(0, Math.min(maxAllowed, Math.min(owned, currentAmount + delta)));
      if (nextAmount <= 0) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return {
        ...current,
        [itemId]: nextAmount,
      };
    });
  };

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
            onPress={() => {
              handleGuildTabPress("npc");
              onNpcTabOpened();
            }}
            style={[
              styles.guildTabWrap,
              guildTab === "npc" ? styles.guildTabWrapActive : null,
              towerModeScreenActive ? styles.actionDisabled : null,
            ]}
            disabled={towerModeScreenActive}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="account-star-outline"
                size={16}
                color={guildTab === "npc" ? colors.textPrimary : colors.textMuted}
              />
              <Text
                numberOfLines={2}
                allowFontScaling={false}
                style={[styles.guildTabText, guildTab === "npc" ? styles.guildTabTextActive : null]}
              >
                NPC
              </Text>
              {npcAttentionCount > 0 ? (
                <View style={styles.guildTabBadge}>
                  <Text style={styles.guildTabBadgeText}>{Math.min(9, npcAttentionCount)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleGuildTabPress("board")}
            style={[
              styles.guildTabWrap,
              guildTab === "board" ? styles.guildTabWrapActive : null,
              towerModeScreenActive ? styles.actionDisabled : null,
            ]}
            disabled={towerModeScreenActive}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={16}
                color={guildTab === "board" ? colors.textPrimary : colors.textMuted}
              />
              <Text
                numberOfLines={2}
                allowFontScaling={false}
                style={[styles.guildTabText, guildTab === "board" ? styles.guildTabTextActive : null]}
              >
                Quest{"\n"}Board
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleGuildTabPress("store")}
            style={[
              styles.guildTabWrap,
              guildTab === "store" ? styles.guildTabWrapActive : null,
              towerModeScreenActive ? styles.actionDisabled : null,
            ]}
            disabled={towerModeScreenActive}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={16}
                color={guildTab === "store" ? colors.textPrimary : colors.textMuted}
              />
              <Text
                numberOfLines={2}
                allowFontScaling={false}
                style={[styles.guildTabText, guildTab === "store" ? styles.guildTabTextActive : null]}
              >
                Store
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleGuildTabPress("tower")}
            style={[styles.guildTabWrap, guildTab === "tower" ? styles.guildTabWrapActive : null]}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="tower-fire"
                size={16}
                color={guildTab === "tower" ? colors.textPrimary : colors.textMuted}
              />
              <Text
                numberOfLines={2}
                allowFontScaling={false}
                style={[styles.guildTabText, guildTab === "tower" ? styles.guildTabTextActive : null]}
              >
                Tower
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleGuildTabPress("leaderboard")}
            style={[
              styles.guildTabWrap,
              guildTab === "leaderboard" ? styles.guildTabWrapActive : null,
              towerModeScreenActive ? styles.actionDisabled : null,
            ]}
            disabled={towerModeScreenActive}
          >
            <View style={styles.guildTab}>
              <MaterialCommunityIcons
                name="podium-gold"
                size={16}
                color={guildTab === "leaderboard" ? colors.textPrimary : colors.textMuted}
              />
              <Text
                numberOfLines={2}
                allowFontScaling={false}
                style={[styles.guildTabText, guildTab === "leaderboard" ? styles.guildTabTextActive : null]}
              >
                Leader{"\n"}Board
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.licenseRow}>
          <MaterialCommunityIcons name="badge-account-horizontal-outline" size={15} color={colors.gold} />
          <View style={styles.licenseStatPill}>
            <Text style={styles.licensePillLabel}>Rank</Text>
            <Text style={styles.licenseRankValue}>{character.adventurerRank}</Text>
          </View>
          <View style={[styles.licenseStatPill, styles.licenseLevelPill]}>
            <Text style={styles.licensePillLabel}>Level</Text>
            <Text style={styles.licenseLevelValue}>{character.progression.level}</Text>
          </View>
          <View style={styles.licenseFloorInline}>
            <MaterialCommunityIcons name="stairs" size={12} color="#d7ebff" />
            <Text style={styles.licenseFloorInlineLabel}>Floor</Text>
            <Text style={styles.licenseFloorInlineValue}>{character.towerProgress?.highestFloorCleared ?? 0}</Text>
          </View>
        </View>
        {showTopGuildHealth ? (
          <HealthMeter
            current={character.health}
            max={character.healthCap}
            meta="Combat Health • Keep this high for tower pushes"
            containerStyle={styles.guildTopHealthMeter}
          />
        ) : null}
        {rankUpAvailable ? (
          <Pressable
            onPress={() => {
              if (towerModeScreenActive) {
                setNoticeTone("error");
                setNotice("Promotion matters can wait. Finish the tower run first.");
                return;
              }
              handleGuildTabPress("npc");
              onNpcTabOpened();
            }}
            style={styles.rankUpAlertButton}
          >
            <MaterialCommunityIcons name="shield-crown" size={15} color="#ffe39f" />
            <Text style={styles.rankUpAlertText}>
              Rank Up Available: Speak with Examiner {rankExaminerProfile.name} ({rankTrial?.fromRank} {"->"} {rankTrial?.toRank})
            </Text>
          </Pressable>
        ) : null}
        {npcAttentionCount > 0 ? (
          <Pressable
            onPress={() => {
              if (towerModeScreenActive) {
                setNoticeTone("error");
                setNotice("A guild notice is waiting, but you are still inside the tower.");
                return;
              }
              handleGuildTabPress("npc");
              onNpcTabOpened();
            }}
            style={styles.storyAlertButton}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={15} color="#ffe8b2" />
            <Text style={styles.storyAlertText}>
              Guild Alert: {npcAttentionCount} {npcAttentionCount === 1 ? "NPC entry needs your attention" : "NPC entries need your attention"} in the hall.
            </Text>
          </Pressable>
        ) : null}
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
        {primedAbilities.length > 0 ? (
          <View style={styles.skillPrimeCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(235, 182, 98, 0.2)", "rgba(137, 87, 228, 0.16)", "rgba(26, 18, 40, 0.04)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.skillPrimeHead}>
              <View style={styles.skillPrimeTextWrap}>
                <Text style={styles.skillPrimeLabel}>{primedAbilities.length > 1 ? "Skills Primed" : "Skill Primed"}</Text>
                <View style={styles.skillPrimeAbilityList}>
                  {primedAbilities.map((ability) => (
                    <View key={`primed-name-${ability.id}`} style={styles.skillPrimeAbilityRow}>
                      <View style={styles.skillPrimeIconWrap}>
                        <MaterialCommunityIcons
                          name={ability.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={18}
                          color="#ffe2ad"
                        />
                      </View>
                      <Text style={styles.skillPrimeName}>{ability.name}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.skillPrimeMeta}>Will be consumed on your next quest or tower attempt.</Text>
              </View>
            </View>
            <View style={styles.skillPrimeBonusRow}>
              {pendingComboSummary.comboLabels.length > 0 ? (
                <View style={styles.skillPrimeBonusChip}>
                  <MaterialCommunityIcons name="link-variant" size={13} color="#ffdd9f" />
                  <Text style={styles.skillPrimeBonusText}>
                    Combo {pendingComboSummary.comboLabels.join(", ")} x
                    {pendingComboSummary.questTowerScale.toFixed(2)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.skillPrimeBonusChip}>
                <MaterialCommunityIcons name="bullseye-arrow" size={13} color="#ffdd9f" />
                <Text style={styles.skillPrimeBonusText}>Quest +{pendingAbilityBonuses.questSuccessFlat}%</Text>
              </View>
              <View style={styles.skillPrimeBonusChip}>
                <MaterialCommunityIcons name="tower-fire" size={13} color="#ffdd9f" />
                <Text style={styles.skillPrimeBonusText}>Tower +{pendingAbilityBonuses.towerSuccessFlat}%</Text>
              </View>
            </View>
          </View>
        ) : null}

        {guildTab === "store" || guildTab === "rank" ? (
          <View style={styles.deskNavCard}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(216, 161, 84, 0.16)", "rgba(98, 66, 152, 0.12)", "rgba(26, 18, 41, 0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <Text style={styles.storeSectionTitle}>Guild Personnel Channel</Text>
            <View style={styles.deskNavRow}>
              <Pressable onPress={promptStoreVisit} style={styles.deskNpcChip}>
                {branProfile ? (
                  <Image
                    source={branProfile.avatarOverride ?? getAvatarSprite(branProfile.avatarId, branProfile.classId)}
                    style={styles.deskNpcAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="storefront-outline" size={14} color="#ffd58f" />
                )}
                <Text style={styles.deskNpcChipText}>Bran • Store Desk</Text>
              </Pressable>
              <Pressable onPress={promptRankVisit} style={styles.deskNpcChip}>
                <Image
                  source={rankExaminerProfile.avatarOverride ?? getAvatarSprite(rankExaminerProfile.avatarId, rankExaminerProfile.classId)}
                  style={styles.deskNpcAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.deskNpcChipText}>Examiner • Rank Desk</Text>
              </Pressable>
            </View>
            <Pressable onPress={returnToNpcHall} style={styles.actionWrap}>
              <View style={styles.sellButton}>
                <Text style={styles.buyText}>Return To NPC Hall</Text>
              </View>
            </Pressable>
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
                  {activeQuestDef.id === SPECIAL_RESCUE_QUEST_ID ? (
                    <View style={styles.questCriticalTimerHero}>
                      <Text style={styles.questCriticalTimerLabel}>Aldric Rescue Window</Text>
                      <Text style={styles.questCriticalTimerValue}>{formatRemainingDetailed(remainingMs)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.questTitle}>{activeQuestDef.title}</Text>
                  <Text style={styles.questMeta}>Remaining: {formatRemaining(remainingMs)}</Text>
                  {activeQuestDef.id === SPECIAL_RESCUE_QUEST_ID ? (
                    <View style={styles.questUrgencyBanner}>
                      <MaterialCommunityIcons name="timer-alert-outline" size={16} color="#ffd6a2" />
                      <Text style={styles.questUrgencyText}>
                        Time-sensitive rescue. If this slips, Aldric's story turns darker.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.questMeterBlock}>
                    <View style={styles.meterLabelRow}>
                      <View style={styles.inlineLabel}>
                        <Text style={styles.meterLabel}>Timer</Text>
                        <IconTooltip text="Quest duration progress. Resolve when it reaches 100%." />
                      </View>
                      <Text style={styles.meterLabel}>{Math.round(elapsedRatio * 100)}%</Text>
                    </View>
                    <ProgressBar value={elapsedRatio * 100} max={100} variant="time" />
                  </View>
                  {activeQuestDef.id !== SPECIAL_RESCUE_QUEST_ID && !isQuestReadyToClaim ? (
                    <Pressable
                      onPress={() => {
                        const result = onUseQuestRushItem("quickthread-token");
                        setNoticeTone(result.ok ? "ok" : "error");
                        setNotice(result.reason ?? (result.ok ? "Quest timer reduced." : "Could not speed up the quest."));
                      }}
                      style={styles.actionWrap}
                    >
                      <View
                        style={[
                          styles.sellButton,
                          (character.inventory["quickthread-token"] ?? 0) <= 0 ? styles.actionDisabled : null,
                        ]}
                      >
                        <Text style={styles.buyText}>
                          Burn Quickthread Token {(character.inventory["quickthread-token"] ?? 0) > 0 ? `(${character.inventory["quickthread-token"] ?? 0})` : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ) : null}

                  <View style={styles.questMeterBlock}>
                    <View style={styles.meterLabelRow}>
                      <View style={styles.inlineLabel}>
                        <Text style={styles.meterLabel}>Success Chance</Text>
                        <IconTooltip text="Calculated at quest start from key item readiness, optional supply readiness, level match, and weapon performance." />
                      </View>
                      <Text style={styles.meterLabel}>{activeQuest.successChanceAtStart}%</Text>
                    </View>
                    <ProgressBar value={activeQuest.successChanceAtStart} max={100} variant="chance" />
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

            <View style={styles.boardNavCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 161, 83, 0.11)", "rgba(101, 67, 154, 0.07)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.boardNavHead}>
                <Text style={styles.reqTitle}>Quest Board Navigator</Text>
                <Text style={styles.boardNavMeta}>
                  Showing Ranks: {visibleRanks.join(", ")}
                </Text>
              </View>
              <Text style={styles.boardFilterLabel}>Filter By Rank</Text>
              <View style={styles.boardFilterRow}>
                <Pressable
                  onPress={() => setBoardRankFilter("all")}
                  style={[styles.boardFilterPill, boardRankFilter === "all" ? styles.boardFilterPillActive : null]}
                >
                  <Text style={[styles.boardFilterText, boardRankFilter === "all" ? styles.boardFilterTextActive : null]}>All</Text>
                </Pressable>
                {visibleRanks.map((rank) => (
                  <Pressable
                    key={`rank-filter-${rank}`}
                    onPress={() => setBoardRankFilter(rank)}
                    style={[styles.boardFilterPill, boardRankFilter === rank ? styles.boardFilterPillActive : null]}
                  >
                    <Text style={[styles.boardFilterText, boardRankFilter === rank ? styles.boardFilterTextActive : null]}>{rank}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.boardFilterLabel}>Filter By Type</Text>
              <View style={styles.boardFilterRow}>
                {(["all", "gather", "adventure", "dungeon"] as BoardTypeFilter[]).map((type) => (
                  <Pressable
                    key={`type-filter-${type}`}
                    onPress={() => setBoardTypeFilter(type)}
                    style={[styles.boardFilterPill, boardTypeFilter === type ? styles.boardFilterPillActive : null]}
                  >
                    <Text style={[styles.boardFilterText, boardTypeFilter === type ? styles.boardFilterTextActive : null]}>
                      {type === "all" ? "All" : questTypeLabel[type]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {questHealthLocked || isDead ? (
              <View style={styles.healthLockCard}>
                <View style={styles.healthLockHead}>
                  <MaterialCommunityIcons name="heart-broken-outline" size={16} color="#ff9aa5" />
                  <Text style={styles.healthLockTitle}>
                    {isDead
                      ? `Quest Lock: Being Fractured at HP ${character.health}/${character.healthCap}`
                      : `Quest Lock: HP ${character.health}/${character.healthCap} (need ${questHealthGate}+)`}
                  </Text>
                </View>
                <Text style={styles.questMeta}>
                  {isDead
                    ? "The tower's mercy leaves you barely standing. Visit the Archmage's license in NPC Hall to restore your being."
                    : "You cannot start quests below 50% HP. Buy/use Health Potion, sell items for gold, or visit Guild NPC."}
                </Text>
              </View>
            ) : null}

            {boardQuestSections.map((section) => (
              <View
                key={`board-section-${section.key}`}
                style={[
                  styles.boardSectionCard,
                  section.tone === "urgent"
                    ? styles.boardSectionCardUrgent
                  : section.tone === "story"
                    ? styles.boardSectionCardStory
                    : section.tone === "special"
                      ? styles.boardSectionCardSpecial
                      : section.tone === "hunt"
                        ? styles.boardSectionCardHunt
                    : null,
                ]}
              >
                <Pressable onPress={() => toggleBoardSection(section.key)} style={styles.boardSectionToggle}>
                  <View style={styles.boardSectionHead}>
                    <View style={styles.boardSectionTitleWrap}>
                      <MaterialCommunityIcons
                        name={section.icon}
                        size={16}
                        color={
                          section.tone === "urgent"
                            ? "#ffb3b8"
                            : section.tone === "story"
                              ? "#a9ddff"
                              : section.tone === "special"
                                ? "#e2b4ff"
                                : "#ffd48f"
                        }
                      />
                      <Text style={styles.boardSectionTitle}>{section.title}</Text>
                    </View>
                    <View style={styles.boardSectionControls}>
                      <View style={styles.boardSectionCountPill}>
                        <Text style={styles.boardSectionCountText}>{section.quests.length}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={collapsedBoardSections[section.key] ? "chevron-down" : "chevron-up"}
                        size={18}
                        color="#ecd8af"
                      />
                    </View>
                  </View>
                  <Text style={styles.boardSectionMeta}>{section.subtitle}</Text>
                </Pressable>
                {!collapsedBoardSections[section.key] ? (
                  <View style={styles.boardSectionList}>
                    {section.quests.map((quest) => renderQuestBoardCard(quest))}
                  </View>
                ) : null}
              </View>
            ))}
            {showAldricWantedPlaceholder ? (
              <View style={[styles.boardSectionCard, styles.boardSectionCardWanted]}>
                <View style={styles.boardSectionHead}>
                  <View style={styles.boardSectionTitleWrap}>
                    <MaterialCommunityIcons name="target-account" size={16} color="#ffb9a7" />
                    <Text style={styles.boardSectionTitle}>Wanted</Text>
                  </View>
                  <View style={styles.boardSectionCountPill}>
                    <Text style={styles.boardSectionCountText}>1</Text>
                  </View>
                </View>
                <Text style={styles.boardSectionMeta}>Future outlaw and consequence routes tied to named targets.</Text>
                <View style={[styles.questCard, styles.wantedPlaceholderCard]}>
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(145, 45, 48, 0.22)", "rgba(79, 23, 31, 0.14)", "rgba(21, 14, 24, 0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                />
                <View style={styles.questHeader}>
                  <MaterialCommunityIcons name="target-account" size={18} color="#ffb9a7" />
                  <Text style={styles.questTitle}>Wanted: The Watchtrail Butcher</Text>
                  <View style={styles.wantedQuestBadge}>
                    <Text style={styles.wantedQuestBadgeText}>PLACEHOLDER</Text>
                  </View>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>Wanted</Text>
                  </View>
                </View>
                <View style={styles.chipsRow}>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="knife-military" size={14} color="#ffb9a7" />
                    <Text style={styles.rewardChipText}>Bandit Leader</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="map-marker-path" size={14} color="#ffd487" />
                    <Text style={styles.rewardChipText}>Watchtrail Fringe</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#ff9c8f" />
                    <Text style={styles.rewardChipText}>Tied To Aldric</Text>
                  </View>
                </View>
                <Text style={styles.questMeta}>
                  A guild-side wanted notice is starting to form around the bandit leader behind the Watchtrail killing. Aldric's fall and this man's trail are now tied together.
                </Text>
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Known Details</Text>
                  <View style={styles.wantedDetailsList}>
                    <Text style={styles.wantedDetailText}>Alias: `The Watchtrail Butcher`</Text>
                    <Text style={styles.wantedDetailText}>Crime: abduction, assault, murder, and roadside predation</Text>
                    <Text style={styles.wantedDetailText}>Status: questline placeholder for Aldric's future dark-route encounters</Text>
                  </View>
                </View>
                <View style={[styles.startButton, styles.actionDisabled]}>
                  <Text style={styles.startText}>Wanted Route Not Yet Open</Text>
                </View>
                </View>
              </View>
            ) : null}
            {boardVisibleQuests.length === 0 && !showAldricWantedPlaceholder ? (
              <View style={styles.activeCard}>
                <Text style={styles.questMeta}>No quests match your current board filters.</Text>
              </View>
            ) : null}
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
            <View style={styles.storeSubtabRow}>
              <Pressable
                onPress={() => {
                  setStoreSubTab("shop");
                  setLastCraftedItemId(null);
                }}
                style={[styles.storeSubtabButton, storeSubTab === "shop" ? styles.storeSubtabButtonActive : null]}
              >
                <MaterialCommunityIcons name="storefront-outline" size={16} color={storeSubTab === "shop" ? "#f9e5bf" : "#bda77a"} />
                <Text style={[styles.storeSubtabText, storeSubTab === "shop" ? styles.storeSubtabTextActive : null]}>Shop</Text>
              </Pressable>
              <Pressable
                onPress={() => setStoreSubTab("workshop")}
                style={[styles.storeSubtabButton, storeSubTab === "workshop" ? styles.storeSubtabButtonActive : null]}
              >
                <MaterialCommunityIcons name="hammer-wrench" size={16} color={storeSubTab === "workshop" ? "#f9e5bf" : "#bda77a"} />
                <Text style={[styles.storeSubtabText, storeSubTab === "workshop" ? styles.storeSubtabTextActive : null]}>Workshop</Text>
              </Pressable>
              <Pressable
                onPress={() => setStoreSubTab("intel")}
                style={[styles.storeSubtabButton, storeSubTab === "intel" ? styles.storeSubtabButtonActive : null]}
              >
                <MaterialCommunityIcons name="book-search-outline" size={16} color={storeSubTab === "intel" ? "#f9e5bf" : "#bda77a"} />
                <Text style={[styles.storeSubtabText, storeSubTab === "intel" ? styles.storeSubtabTextActive : null]}>Intel</Text>
              </Pressable>
            </View>

            {storeSubTab === "shop" ? (
              <>
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
                    <Pressable
                      onPress={() =>
                        showQuickInfo(
                          item?.name ?? entry.label,
                          item?.description ?? entry.sellText,
                          rarity,
                          entry.itemId,
                        )
                      }
                      style={styles.offerInspectArea}
                    >
                      <View style={styles.offerVisualWrap}>
                        {item?.image ? (
                          <Image
                            source={item.image}
                            style={entry.itemId === "weapon-hidden-steward-edict" ? styles.offerWeaponArtHero : styles.offerWeaponArt}
                            resizeMode="contain"
                          />
                        ) : (
                          <GameItemIcon itemId={entry.itemId} size={entry.itemId === "weapon-hidden-steward-edict" ? 122 : 92} />
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
                            <Text style={[styles.rarityText, { color: rarityColorMap[rarity] }, rarity === "legendary" ? styles.legendaryTextGlow : null]}>
                              {rarity.toUpperCase()}
                            </Text>
                          </View>
                          {entry.itemId !== "weapon-hidden-steward-edict" ? (
                            <View style={styles.levelPill}>
                              <Text style={styles.levelPillText}>LV {item?.requiredLevel ?? 1}+</Text>
                            </View>
                          ) : null}
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
                        <Text style={styles.offerMeta} numberOfLines={2}>
                          {entry.sellText}
                        </Text>
                        {isWeapon ? (
                          <View style={styles.weaponStatRow}>
                            <View style={styles.weaponStatChip}>
                              <GameItemIcon itemId="weapon-warrior-training-blade" size={12} />
                              <Text style={styles.weaponStatText}>ATK {baseWeaponAttack}</Text>
                              <Text style={styles.weaponStatApplied}>now +{weaponAttack}</Text>
                            </View>
                            <View style={styles.weaponStatChip}>
                              <GameItemIcon itemId="buff-arcane-sigil" size={12} />
                              <Text style={styles.weaponStatText}>CRIT {baseWeaponCrit}%</Text>
                              <Text style={styles.weaponStatApplied}>now +{weaponCrit}%</Text>
                            </View>
                            <View style={styles.weaponStatChip}>
                              <GameItemIcon itemId="buff-gale-feather" size={12} />
                              <Text style={styles.weaponStatText}>SPD {baseWeaponSpeed}</Text>
                              <Text style={styles.weaponStatApplied}>now +{weaponSpeed}</Text>
                            </View>
                            <IconTooltip
                              text={`Base stats are the weapon's full power. "now" shows what you currently get after proficiency scaling. If your level is below the requirement, you only receive 25% until you meet it.`}
                            />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {entry.unitPrice > 0 ? (
                        <Text style={styles.storeSellPrice}>Sell {Math.max(1, Math.floor(entry.unitPrice * 0.5))}g</Text>
                      ) : null}
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
                      {entry.unitPrice > 0 && owned > 0 ? (
                        <Pressable onPress={() => handleSell(entry.itemId, entry.unitPrice)} style={styles.actionWrap} disabled={isBuying}>
                          <View style={[styles.sellButton, isBuying ? styles.actionDisabled : null]}>
                            <Text style={styles.buyText}>Sell 1</Text>
                          </View>
                        </Pressable>
                      ) : null}
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
                    <Pressable
                      onPress={() =>
                        showQuickInfo(
                          item?.name ?? entry.label,
                          item?.description ?? entry.sellText,
                          rarity,
                          entry.itemId,
                        )
                      }
                      style={styles.offerInspectArea}
                    >
                      <View style={styles.offerVisualWrap}>
                        <GameItemIcon itemId={entry.itemId} size={56} />
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
                          <View style={styles.ownedPill}>
                            <Text style={styles.ownedPillText}>OWNED x{owned}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {entry.unitPrice > 0 ? (
                        <Text style={styles.storeSellPrice}>Sell {Math.max(1, Math.floor(entry.unitPrice * 0.5))}g</Text>
                      ) : null}
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
                      {entry.unitPrice > 0 && owned > 0 ? (
                        <Pressable onPress={() => handleSell(entry.itemId, entry.unitPrice)} style={styles.actionWrap} disabled={isBuying}>
                          <View style={[styles.sellButton, isBuying ? styles.actionDisabled : null]}>
                            <Text style={styles.buyText}>Sell 1</Text>
                          </View>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
              </>
            ) : null}

            {storeSubTab === "workshop" ? (
              <>
            {lastCraftedItemId ? (
              <View style={styles.craftEchoCard}>
                <View style={styles.craftEchoHead}>
                  <MaterialCommunityIcons name="hammer-wrench" size={16} color="#ffd58f" />
                  <Text style={styles.craftEchoKicker}>Workshop Complete</Text>
                </View>
                <View style={styles.craftEchoBody}>
                  <View style={styles.craftEchoIconWrap}>
                    <GameItemIcon itemId={lastCraftedItemId} size={28} />
                  </View>
                  <View style={styles.craftEchoTextWrap}>
                    <Text style={styles.craftEchoTitle}>{ITEM_BY_ID[lastCraftedItemId]?.name ?? lastCraftedItemId}</Text>
                    <Text style={styles.craftEchoText}>Ingredients consumed. Item added to inventory.</Text>
                  </View>
                </View>
              </View>
            ) : null}
            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Workshop</Text>
                <Text style={styles.storeSectionSub}>Craft recipes, ingredients, and output in one place</Text>
              </View>
              {CRAFT_RECIPES.map((recipe) => {
                const outputItem = ITEM_BY_ID[recipe.output.itemId];
                const outputRarity = outputItem?.rarity ?? "common";
                const recipeUnlocked =
                  character.progression.level >= (recipe.unlockLevel ?? 1) &&
                  hasReachedRank(character.adventurerRank, recipe.unlockRank) &&
                  character.towerProgress.highestFloorCleared >= (recipe.unlockFloorCleared ?? 0);
                const canCraft = recipe.ingredients.every((ingredient) => (character.inventory[ingredient.itemId] ?? 0) >= ingredient.amount);
                const recipeTheme = getRecipeTheme(recipe.id);
                const unlockParts: string[] = [];
                if (recipe.unlockLevel && character.progression.level < recipe.unlockLevel) {
                  unlockParts.push(`Level ${recipe.unlockLevel}`);
                }
                if (recipe.unlockRank && !hasReachedRank(character.adventurerRank, recipe.unlockRank)) {
                  unlockParts.push(`Rank ${recipe.unlockRank}`);
                }
                if (recipe.unlockFloorCleared && character.towerProgress.highestFloorCleared < recipe.unlockFloorCleared) {
                  unlockParts.push(`Clear Floor ${recipe.unlockFloorCleared}`);
                }
                return (
                  <View
                    key={recipe.id}
                    style={[
                      styles.offerCardMaterial,
                      styles.recipeCard,
                      { borderColor: rarityColorMap[outputRarity] },
                    ]}
                  >
                    <LinearGradient
                      pointerEvents="none"
                      colors={recipeTheme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    <View style={styles.offerMain}>
                      <View style={styles.offerTitleRow}>
                        <Text style={styles.offerTitle}>{recipe.name}</Text>
                        <View style={styles.storeTipWrap}>
                          <IconTooltip text={recipe.description} />
                        </View>
                      </View>
                      <View style={styles.offerBadgeRow}>
                        {recipeUnlocked ? (
                          <View style={[styles.rarityPill, { borderColor: rarityColorMap[outputRarity] }]}>
                            <Text style={[styles.rarityText, { color: rarityColorMap[outputRarity] }]}>
                              {outputRarity.toUpperCase()}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.recipeLockedPill}>
                            <Text style={styles.recipeLockedPillText}>LOCKED</Text>
                          </View>
                        )}
                        <View style={[styles.recipeTypePill, { borderColor: recipeTheme.accent, backgroundColor: `${recipeTheme.panel}CC` }]}>
                          <MaterialCommunityIcons name={recipeTheme.icon} size={12} color={recipeTheme.accent} />
                        </View>
                        <View style={styles.ownedPill}>
                          <Text style={styles.ownedPillText}>OUTPUT x{recipe.output.amount}</Text>
                        </View>
                      </View>
                      <Text style={styles.offerLore}>{recipe.description}</Text>
                      {!recipeUnlocked ? (
                        <Text style={styles.recipeUnlockText}>Unlocks at {unlockParts.join(" • ")}</Text>
                      ) : null}
                      <View style={styles.recipeBlueprint}>
                        <MaterialCommunityIcons
                          pointerEvents="none"
                          name="star-four-points-circle-outline"
                          size={110}
                          color="rgba(240, 216, 168, 0.06)"
                          style={styles.recipeBlueprintSigil}
                        />
                        <View style={[styles.recipeOutputPanel, { backgroundColor: `${recipeTheme.panel}D9` }]}>
                          <Text style={styles.recipePanelLabel}>Crafts</Text>
                          <View style={styles.recipeOutputIconWrap}>
                            <GameItemIcon itemId={recipe.output.itemId} size={34} />
                          </View>
                          <Text style={styles.recipeOutputName}>{outputItem?.name ?? recipe.output.itemId}</Text>
                        </View>
                        <View style={styles.recipeArrowWrap}>
                          <MaterialCommunityIcons name="chevron-double-left" size={22} color="#d7b072" />
                        </View>
                        <View style={styles.recipeIngredientPanel}>
                          <Text style={styles.recipePanelLabel}>Requires</Text>
                          <View style={styles.recipeIngredientGrid}>
                            {recipe.ingredients.map((ingredient, index) => {
                              const owned = character.inventory[ingredient.itemId] ?? 0;
                              const ready = owned >= ingredient.amount;
                              return (
                                <Pressable
                                  key={`${recipe.id}-${ingredient.itemId}`}
                                  style={[
                                    styles.recipeIngredientTile,
                                    recipe.ingredients.length === 3 && index === 2 ? styles.recipeIngredientTileThird : null,
                                    ready ? styles.recipeIngredientTileReady : styles.recipeIngredientTileMissing,
                                    ready ? { backgroundColor: `${recipeTheme.panel}55` } : null,
                                  ]}
                                  onPress={() =>
                                    showQuickInfo(
                                      ITEM_BY_ID[ingredient.itemId]?.name ?? ingredient.itemId,
                                      `Owned ${owned}/${ingredient.amount}`,
                                      ITEM_BY_ID[ingredient.itemId]?.rarity,
                                      ingredient.itemId,
                                    )
                                  }
                                >
                                  <GameItemIcon itemId={ingredient.itemId} size={20} />
                                  <Text style={styles.recipeIngredientTileName} numberOfLines={1}>
                                    {ITEM_BY_ID[ingredient.itemId]?.name ?? ingredient.itemId}
                                  </Text>
                                  <Text style={styles.recipeIngredientTileCount}>{owned}/{ingredient.amount}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{canCraft ? "Ready" : "Missing"}</Text>
                      <Text style={styles.storeSellPrice}>{recipeUnlocked ? (outputItem?.name ?? recipe.output.itemId) : "Recipe Locked"}</Text>
                      <Pressable
                        onPress={() => {
                          const result = onCraftRecipe(recipe.id);
                          setNoticeTone(result.ok ? "ok" : "error");
                          setNotice(result.reason ?? (result.ok ? "Crafted." : "Could not craft."));
                          if (result.ok) {
                            setLastPurchaseText(`Crafted ${outputItem?.name ?? recipe.output.itemId}`);
                            setLastCraftedItemId(recipe.output.itemId);
                          }
                        }}
                        style={styles.actionWrap}
                        disabled={isBuying || !canCraft || !recipeUnlocked}
                      >
                        <View style={[styles.buyButton, isBuying || !canCraft || !recipeUnlocked ? styles.actionDisabled : null]}>
                          <Text style={styles.buyText}>{recipeUnlocked ? "Craft" : "Locked"}</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
              </>
            ) : null}
            {storeSubTab === "intel" ? (
              <View style={styles.storeSection}>
                <View style={styles.storeSectionHead}>
                  <Text style={styles.storeSectionTitle}>Intel Ledger</Text>
                  <Text style={styles.storeSectionSub}>Guild notes on weaknesses, drops, and hidden prep. Some ledgers can also be earned through favors and board work.</Text>
                </View>
                {FLOOR_INTEL.map((entry: FloorIntelDefinition) => {
                  const purchased = hasFloorIntel(entry.floorNumber);
                  return (
                    <View key={`intel-${entry.floorNumber}`} style={styles.offerCardMaterial}>
                      <LinearGradient
                        pointerEvents="none"
                        colors={["rgba(138, 168, 214, 0.12)", "rgba(88, 56, 141, 0.05)", "rgba(23, 16, 37, 0.02)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                      />
                      <View style={styles.offerMain}>
                        <View style={styles.offerTitleRow}>
                          <Text style={styles.offerTitle}>{entry.title}</Text>
                          <View style={styles.storeTipWrap}>
                            <IconTooltip text={entry.summary} />
                          </View>
                        </View>
                        <View style={styles.offerBadgeRow}>
                          <View style={styles.levelPill}>
                            <Text style={styles.levelPillText}>FLOOR {entry.floorNumber}</Text>
                          </View>
                          {purchased ? (
                            <View style={styles.ownedPill}>
                              <Text style={styles.ownedPillText}>OWNED</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.offerLore}>{entry.summary}</Text>
                        <View style={styles.intelRevealRow}>
                          {entry.reveals.map((line) => (
                            <View key={`${entry.floorNumber}-${line}`} style={styles.intelRevealChip}>
                              <Text style={styles.intelRevealChipText}>{line}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.offerAction}>
                        <Text style={styles.storePrice}>{purchased ? "Logged" : `${entry.price}g`}</Text>
                        <Text style={styles.storeSellPrice}>{purchased ? "Intel unlocked" : "Buy report"}</Text>
                        <Pressable
                          onPress={() => {
                            const result = onBuyFloorIntel(entry.floorNumber, entry.price);
                            setNoticeTone(result.ok ? "ok" : "error");
                            setNotice(result.reason ?? (result.ok ? "Intel purchased." : "Could not buy intel."));
                            if (result.ok) {
                              setLastPurchaseText(`Bought Floor ${entry.floorNumber} intel for ${entry.price}g`);
                            }
                          }}
                          style={styles.actionWrap}
                          disabled={isBuying || purchased}
                        >
                          <View style={[styles.buyButton, isBuying || purchased ? styles.actionDisabled : null]}>
                            <Text style={styles.buyText}>{purchased ? "Owned" : "Buy Intel"}</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Remnants</Text>
                <Text style={styles.storeSectionSub}>Bran buys standard remnants and appraises sealed finds</Text>
              </View>
              {remnantEntries.length === 0 ? (
                <View style={styles.storeEmptyCard}>
                  <Text style={styles.storeEmptyText}>No remnants to sell or appraise yet. Clear the tower and bring back what the floor leaves behind.</Text>
                </View>
              ) : (
                remnantEntries.map((item) => {
                  const owned = character.inventory[item.id] ?? 0;
                  const rarity = item.rarity;
                  const isLegendary = rarity === "legendary";
                  const sellValue = item.sellValue ?? 0;
                  const appraised = !item.requiresAppraisal || isItemAppraised(item.id);
                  const displayName = appraised ? item.name : "Unknown Remnant";
                  const displayDescription = appraised
                    ? item.description
                    : "A rare remnant still sealed by the Tower's afterglow. Bran can appraise it.";
                  return (
                    <View
                      key={`${item.id}-remnant`}
                      style={[
                        styles.offerCardMaterial,
                        { borderColor: rarityColorMap[rarity] },
                        item.requiresAppraisal && !appraised ? styles.appraisalGlow : null,
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
                      <Pressable
                        onPress={() => showQuickInfo(displayName, displayDescription || "Tower remnant.", appraised ? rarity : undefined, item.id)}
                        style={styles.offerInspectArea}
                      >
                        <View style={styles.offerVisualWrap}>
                          <GameItemIcon itemId={item.id} size={56} />
                        </View>
                        <View style={styles.offerMain}>
                          <View style={styles.offerTitleRow}>
                            <Text style={styles.offerTitle}>{displayName}</Text>
                            <View style={styles.storeTipWrap}>
                              <IconTooltip text={`${displayName}. ${displayDescription || "Tower remnant."}`} />
                            </View>
                          </View>
                          <View style={styles.offerBadgeRow}>
                            {appraised ? (
                              <View style={[styles.rarityPill, { borderColor: rarityColorMap[rarity] }]}>
                                <Text style={[styles.rarityText, { color: rarityColorMap[rarity] }]}>{rarity.toUpperCase()}</Text>
                              </View>
                            ) : (
                              <View style={styles.ownedPill}>
                                <Text style={styles.ownedPillText}>APPRAISE</Text>
                              </View>
                            )}
                            <View style={styles.ownedPill}>
                              <Text style={styles.ownedPillText}>OWNED x{owned}</Text>
                            </View>
                          </View>
                          <Text style={styles.offerLore}>{displayDescription}</Text>
                        </View>
                      </Pressable>
                      <View style={styles.offerAction}>
                        <Text style={styles.storePrice}>{item.requiresAppraisal ? (appraised ? "Appraised" : "Sealed") : "Sale Ready"}</Text>
                        <Text style={styles.storeSellPrice}>{item.requiresAppraisal && !appraised ? "Appraise with Bran" : `Sell ${sellValue}g`}</Text>
                        {!appraised ? (
                          <Pressable
                            onPress={() => {
                              const result = onAppraiseItem(item.id);
                              setNoticeTone(result.ok ? "ok" : "error");
                              setNotice(result.reason ?? (result.ok ? "Appraisal complete." : "Could not appraise."));
                            }}
                            style={styles.actionWrap}
                            disabled={isBuying}
                          >
                            <View style={[styles.buyButton, isBuying ? styles.actionDisabled : null]}>
                              <Text style={styles.buyText}>Appraise</Text>
                            </View>
                          </Pressable>
                        ) : (
                          <Pressable onPress={() => handleSell(item.id, 0, sellValue)} style={styles.actionWrap} disabled={isBuying || sellValue <= 0}>
                            <View style={[styles.sellButton, isBuying || sellValue <= 0 ? styles.actionDisabled : null]}>
                              <Text style={styles.buyText}>Sell 1</Text>
                            </View>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.storeSection}>
              <View style={styles.storeSectionHead}>
                <Text style={styles.storeSectionTitle}>Sigils</Text>
                <Text style={styles.storeSectionSub}>Equipable timed enhancements for adventurer loadout</Text>
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
                    <Pressable
                      onPress={() =>
                        showQuickInfo(
                          item?.name ?? entry.label,
                          item?.description ?? entry.sellText,
                          rarity,
                          entry.itemId,
                        )
                      }
                      style={styles.offerInspectArea}
                    >
                      <View style={styles.offerVisualWrap}>
                        <GameItemIcon itemId={entry.itemId} size={52} />
                      </View>
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
                    </Pressable>
                    <View style={styles.offerAction}>
                      <Text style={styles.storePrice}>{entry.unitPrice}g</Text>
                      {entry.unitPrice > 0 ? (
                        <Text style={styles.storeSellPrice}>Sell {Math.max(1, Math.floor(entry.unitPrice * 0.5))}g</Text>
                      ) : null}
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
                      {entry.unitPrice > 0 && owned > 0 ? (
                        <Pressable onPress={() => handleSell(entry.itemId, entry.unitPrice)} style={styles.actionWrap} disabled={isBuying}>
                          <View style={[styles.sellButton, isBuying ? styles.actionDisabled : null]}>
                            <Text style={styles.buyText}>Sell 1</Text>
                          </View>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : guildTab === "tower" ? (
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
                    <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#ffd487" />
                    <Text style={styles.rewardChipText}>Clear Waves</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="crown-outline" size={14} color="#ffdb88" />
                    <Text style={styles.rewardChipText}>Defeat Boss</Text>
                </View>
              </View>
            </View>

            {towerCompleted ? (
              <View style={styles.towerProgressCard}>
                <Text style={styles.outcomeTitle}>Tower Conquered</Text>
                <Text style={styles.questMeta}>All currently available floors are cleared.</Text>
              </View>
            ) : currentTowerFloor ? (
              (() => {
                const access = getTowerAccess(currentTowerFloor.floorNumber);
                const blocked = !access.allowed;
                const towerEnemies = getTowerEnemiesForFloor(currentTowerFloor);
                const towerRunStage = towerRunStageByFloor[currentTowerFloor.floorNumber] ?? "entrance";
                const towerStageIsWaves = (towerRunStageByFloor[currentTowerFloor.floorNumber] ?? "entrance") === "waves";
                const inWavesStage = towerStageIsWaves;
                const waveProgress = towerWaveProgressByFloor[currentTowerFloor.floorNumber] ?? {
                  normal: "available",
                  subBoss: "locked",
                  boss: "locked",
                };
                const activeWaveKey: TowerWaveKey =
                  waveProgress.normal === "available"
                    ? "normal"
                    : waveProgress.subBoss === "available"
                      ? "subBoss"
                      : waveProgress.boss === "available"
                        ? "boss"
                        : "boss";
                const subBossWaveUnlocked = waveProgress.subBoss !== "locked";
                const bossWaveUnlocked = waveProgress.boss !== "locked";
                const floorFinalEngageReady = waveProgress.boss === "cleared";
                const mechanicPressure = calculateTowerMechanicPressure(character, currentTowerFloor, {});
                const normalDrops = getWaveDrops(currentTowerFloor, "normal");
                const subBossDrops = getWaveDrops(currentTowerFloor, "subBoss");
                const bossDrops = getWaveDrops(currentTowerFloor, "boss");
                const floorIntelUnlocked = hasFloorIntel(currentTowerFloor.floorNumber) || character.towerProgress.highestFloorCleared >= currentTowerFloor.floorNumber;
                const floorLore = FLOOR_ENTRY_LORE[currentTowerFloor.floorNumber];
                const towerPreparedItemSet = new Set(towerPreparedItemIds);
                const scoutWaveConfigs: Array<{
                  key: TowerWaveKey;
                  label: string;
                  icon: ImageSourcePropType;
                  enemies: TowerEnemyUnit[];
                  drops: ReturnType<typeof getWaveDrops>;
                }> = [
                  {
                    key: "normal",
                    label: "Normal Wave",
                    icon: TOWER_ENEMY_ROLE_ART.normal,
                    enemies: towerEnemies.normal,
                    drops: normalDrops,
                  },
                  {
                    key: "subBoss",
                    label: "Sub-Boss",
                    icon: TOWER_ENEMY_ROLE_ART.subBoss,
                    enemies: towerEnemies.subBoss,
                    drops: subBossDrops,
                  },
                  {
                    key: "boss",
                    label: "Main Boss",
                    icon: TOWER_ENEMY_ROLE_ART.boss,
                    enemies: towerEnemies.boss,
                    drops: bossDrops,
                  },
                ];
                const waveReport = towerWaveReportsByFloor[currentTowerFloor.floorNumber] ?? {};
                const latestWaveReport = waveReport.boss ?? waveReport.subBoss ?? waveReport.normal ?? null;
                const towerEffectIcons: Array<
                  {
                    key: string;
                    label: string;
                    detail?: string;
                    tone: "good" | "bad" | "neutral";
                    count?: number;
                  } & (
                    | { kind: "item"; itemId: ItemId }
                    | { kind: "mc"; icon: keyof typeof MaterialCommunityIcons.glyphMap }
                    | { kind: "title"; source: ImageSourcePropType; fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap }
                  )
                > = [];
                if (character.equippedWeaponId && ITEM_BY_ID[character.equippedWeaponId]) {
                  towerEffectIcons.push({
                    key: `weapon-${character.equippedWeaponId}`,
                    label: ITEM_BY_ID[character.equippedWeaponId]?.name ?? "Equipped Weapon",
                    detail: `${weaponProficiency}% prof`,
                    kind: "item",
                    itemId: character.equippedWeaponId,
                    tone: "neutral",
                  });
                }
                for (const buffId of activeBuffIds) {
                  towerEffectIcons.push({
                    key: `buff-${buffId}`,
                    label: ITEM_BY_ID[buffId]?.name ?? "Active Buff",
                    detail: "Active",
                    kind: "item",
                    itemId: buffId,
                    tone: "good",
                  });
                }
                for (const passiveId of character.equippedPassiveAbilityIds ?? []) {
                  const passive = ABILITY_BY_ID[passiveId];
                  if (!passive) {
                    continue;
                  }
                  towerEffectIcons.push({
                    key: `passive-${passiveId}`,
                    label: passive.name,
                    kind: "mc",
                    icon: passive.icon as keyof typeof MaterialCommunityIcons.glyphMap,
                    tone: "good",
                  });
                }
                for (const titleId of character.equippedTitleIds ?? []) {
                  const art = TITLE_ICON_ART[titleId];
                  const title = TITLES.find((entry) => entry.id === titleId);
                  if (art) {
                    towerEffectIcons.push({
                      key: `title-${titleId}`,
                      label: title?.name ?? "Equipped Title",
                      kind: "title",
                      source: art,
                      fallbackIcon: (title?.icon as keyof typeof MaterialCommunityIcons.glyphMap) ?? "shield-crown-outline",
                      tone: title?.rarity === "legendary" ? "good" : "neutral",
                    });
                    continue;
                  }
                  towerEffectIcons.push({
                    key: `title-${titleId}`,
                    label: title?.name ?? "Equipped Title",
                    kind: "mc",
                    icon: (title?.icon as keyof typeof MaterialCommunityIcons.glyphMap) ?? "shield-crown-outline",
                    tone: title?.rarity === "legendary" ? "good" : "neutral",
                  });
                }
                for (const itemId of towerPreparedItemIds) {
                  const item = ITEM_BY_ID[itemId];
                  towerEffectIcons.push({
                    key: `prepared-${itemId}`,
                    label: item?.name ?? "Prepared Supply",
                    detail: "Prepared for the next exchange",
                    kind: "item",
                    itemId,
                    tone: "good",
                  });
                }
                for (const status of towerStatusEffects) {
                  towerEffectIcons.push({
                    key: `status-${status.id}`,
                    label: status.name,
                    detail: status.detail,
                    kind: "mc",
                    icon: status.icon as keyof typeof MaterialCommunityIcons.glyphMap,
                    tone: status.tone,
                  });
                }
                if (character.health <= 1) {
                  towerEffectIcons.push({
                    key: "downed",
                    label: "Being Fractured",
                    detail: `HP ${character.health}`,
                    kind: "mc",
                    icon: "skull-outline",
                    tone: "bad",
                  });
                }
                if (towerEffectIcons.length <= 0) {
                  
                }

                return (
                  <View style={styles.towerProgressCard}>
                    <View style={styles.towerFloorHead}>
                      <Text style={styles.questTitle}>Floor {currentTowerFloor.floorNumber}: {currentTowerFloor.title}</Text>
                      <View style={styles.towerFloorHeadMeta}>
                        <View style={styles.towerLevelPill}>
                          <Text style={styles.towerLevelPillText}>Lv {currentTowerFloor.minLevel}+</Text>
                        </View>
                        {currentTowerFloor.requiredRank ? (
                          <View style={[styles.towerLevelPill, styles.towerRankPill]}>
                            <Text style={styles.towerLevelPillText}>Rank {currentTowerFloor.requiredRank}+</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.towerStageRow}>
                      <View style={[styles.towerStagePill, towerRunStage !== "entrance" ? styles.towerStagePillDone : null]}>
                        <Text style={styles.towerStagePillText}>Entrance</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#baa07a" />
                      <View
                        style={[
                          styles.towerStagePill,
                          towerRunStage === "briefing" || towerStageIsWaves ? styles.towerStagePillDone : null,
                        ]}
                      >
                        <Text style={styles.towerStagePillText}>Lore</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#baa07a" />
                      <View style={[styles.towerStagePill, towerStageIsWaves ? styles.towerStagePillDone : null]}>
                        <Text style={styles.towerStagePillText}>Waves</Text>
                      </View>
                    </View>
                    {!blocked && towerRunStage === "entrance" ? (
                      <Pressable onPress={() => handleEnterTowerFloor(currentTowerFloor.floorNumber)} style={styles.actionWrap}>
                        <View style={styles.towerEntryButton}>
                          <View style={styles.towerPrimaryActionInner}>
                            <MaterialCommunityIcons name="gate-open" size={15} color="#ecfbff" />
                            <Text style={styles.towerPrimaryActionText}>
                              {currentTowerFloor.floorNumber === 1 ? "Enter Tower Entrance" : `Enter ${currentTowerFloor.title}`}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ) : null}
                    {!blocked && towerRunStage === "briefing" ? (
                      <Pressable onPress={() => setFloorLoreOpenFor(currentTowerFloor.floorNumber)} style={styles.actionWrap}>
                        <View style={styles.buyButton}>
                          <Text style={styles.buyText}>Review Floor Lore</Text>
                        </View>
                      </Pressable>
                    ) : null}
                    {!blocked && towerStageIsWaves ? (
                      <View style={styles.rewardChip}>
                        <MaterialCommunityIcons name="check-circle-outline" size={13} color="#8de9a8" />
                        <Text style={styles.rewardChipText}>Tower route opened. Resolve waves to continue.</Text>
                      </View>
                    ) : null}
                    {inWavesStage && !USE_SHARED_TOWER_WAVE_LAYOUT ? (
                      <View style={styles.towerCombatHudCard}>
                        <LinearGradient
                          pointerEvents="none"
                          colors={["rgba(223, 162, 82, 0.16)", "rgba(79, 56, 138, 0.2)", "rgba(23, 18, 39, 0.45)"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.cardGradient}
                        />
                        <View style={styles.towerHudHead}>
                          <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#ffe2a5" />
                          <Text style={styles.reqTitle}>Combat HUD</Text>
                          {latestWaveReport ? (
                            <View style={styles.towerHudWaveTag}>
                              <Text style={styles.towerHudWaveTagText}>{latestWaveReport?.title}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.towerStatusIconRow}>
                          {towerEffectIcons.map((entry) => (
                            <Pressable
                              key={`tower-effect-${entry.key}`}
                              onHoverIn={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                              onHoverOut={() => setEffectHint((current) => (current?.title === entry.label ? null : current))}
                              onPress={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                              style={[
                                styles.towerStatusIconBadge,
                                entry.tone === "good"
                                  ? styles.towerStatusIconBadgeGood
                                  : entry.tone === "bad"
                                    ? styles.towerStatusIconBadgeBad
                                    : styles.towerStatusIconBadgeNeutral,
                              ]}
                            >
                              {entry.kind === "item" ? (
                                <GameItemIcon itemId={entry.itemId} size={16} />
                              ) : entry.kind === "title" ? (
                                <Image source={entry.source} style={styles.towerStatusIconImage} resizeMode="cover" />
                              ) : (
                                <MaterialCommunityIcons
                                  name={entry.icon}
                                  size={14}
                                  color={entry.tone === "good" ? "#9effc4" : entry.tone === "bad" ? "#ffb1b1" : "#e8d3ac"}
                                />
                              )}
                              {entry.count && entry.count > 1 ? (
                                <View style={styles.towerStatusIconCountBadge}>
                                  <Text style={styles.towerStatusIconCountText}>{entry.count}</Text>
                                </View>
                              ) : null}
                            </Pressable>
                          ))}
                        </View>
                        {effectHint ? (
                          <Text style={styles.effectHintText}>
                            {effectHint?.title}
                            {effectHint?.detail ? ` • ${effectHint.detail}` : ""}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {activeFloorEncounter && activeFloorEncounter.encounter.floorNumber === currentTowerFloor.floorNumber ? (
                      <View style={styles.floorEncounterCard}>
                        <View style={styles.floorEncounterHead}>
                          <Image
                            source={getAvatarSprite(activeFloorEncounter.encounter.avatarId, activeFloorEncounter.encounter.classId)}
                            style={styles.floorEncounterAvatar}
                            resizeMode="cover"
                          />
                          <View style={styles.floorEncounterText}>
                            <Text style={styles.floorEncounterName}>{activeFloorEncounter.encounter.npcName}</Text>
                            <Text style={styles.floorEncounterMeta}>
                              {activeFloorEncounter.encounter.npcTitle} • Attempt {activeFloorEncounter.attemptNumber}
                            </Text>
                          </View>
                          <View style={styles.rewardChip}>
                            <MaterialCommunityIcons name="target-account" size={13} color="#ffe2a5" />
                            <Text style={styles.rewardChipText}>+{activeFloorEncounter.encounter.towerSuccessFlat}%</Text>
                          </View>
                        </View>
                        <Text style={styles.questMeta}>{activeFloorEncounter.encounter.line}</Text>
                        {floorEncounterDecision ? (
                          <View style={[styles.rewardChip, floorEncounterAccepted ? styles.eventAcceptedPill : styles.eventDeclinedPill]}>
                            <MaterialCommunityIcons
                              name={floorEncounterAccepted ? "check-circle-outline" : "close-circle-outline"}
                              size={13}
                              color={floorEncounterAccepted ? "#8de9a8" : "#ffb1b1"}
                            />
                            <Text style={styles.rewardChipText}>
                              {floorEncounterAccepted ? "Scout bonus active for this run" : "You declined this encounter"}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.floorEncounterActions}>
                            <Pressable onPress={() => handleFloorEncounterChoice(true)} style={styles.actionWrap}>
                              <View style={styles.buyButton}>
                                <Text style={styles.buyText}>Accept Help</Text>
                              </View>
                            </Pressable>
                            <Pressable onPress={() => handleFloorEncounterChoice(false)} style={styles.actionWrap}>
                              <View style={styles.sellButton}>
                                <Text style={styles.buyText}>Decline</Text>
                              </View>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ) : null}

                    {inWavesStage && !USE_SHARED_TOWER_WAVE_LAYOUT ? (
                      <>
                    <View style={styles.towerIconGrid}>
                      <Pressable
                        onPress={() => showQuickInfo("Stamina Cost", `${currentTowerFloor.staminaCost}`)}
                        style={styles.towerIconChip}
                      >
                        <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#ffd487" />
                      </Pressable>
                      <Pressable
                        onPress={() => showQuickInfo("Normal Enemies", `${towerEnemies.normal.length}`)}
                        style={styles.towerIconChip}
                      >
                        <Image source={TOWER_ENEMY_ROLE_ART.normal} style={styles.towerChipSprite} resizeMode="contain" />
                      </Pressable>
                      <Pressable
                        onPress={() => showQuickInfo("Sub-Bosses", `${towerEnemies.subBoss.length}`)}
                        style={styles.towerIconChip}
                      >
                        <Image source={TOWER_ENEMY_ROLE_ART.subBoss} style={styles.towerChipSprite} resizeMode="contain" />
                      </Pressable>
                      <Pressable
                        onPress={() => showQuickInfo("Main Bosses", `${towerEnemies.boss.length}`)}
                        style={styles.towerIconChip}
                      >
                        <Image source={TOWER_ENEMY_ROLE_ART.boss} style={styles.towerChipSprite} resizeMode="contain" />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          showQuickInfo(
                            "Mechanic Modifier",
                            `${mechanicPressure.successModifier > 0 ? "+" : ""}${mechanicPressure.successModifier}%`,
                          )
                        }
                        style={styles.towerIconChip}
                      >
                        <GameItemIcon itemId="ward-charm" size={18} />
                      </Pressable>
                    </View>
                    <Text style={styles.towerChipLegend}>Tap icons for details.</Text>

                    <Text style={styles.questMeta}>Wave sections now carry their own mechanics, lore reads, and drop pools.</Text>

                    <Text style={styles.reqTitle}>Enemy Waves</Text>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.normal} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Normal</Text>
                        <View style={[styles.towerPhaseResultPill, waveProgress.normal === "cleared" ? styles.towerPhaseResultOk : styles.towerPhaseResultSkipped]}>
                          <Text style={styles.towerPhaseResultText}>{waveProgress.normal === "cleared" ? "CLEARED" : "OPEN"}</Text>
                        </View>
                      </View>
                      {activeWaveKey === "normal" ? (
                        <View style={styles.waveHudCard}>
                          <HealthMeter current={character.health} max={character.healthCap} compact />
                          <StaminaMeter current={character.stamina} max={character.staminaCap} compact iconName="alert-octagon-outline" />
                          <View style={styles.waveHudIconRow}>
                            {towerEffectIcons.slice(0, 8).map((entry) => (
                              <Pressable
                                key={`wave-normal-effect-${entry.key}`}
                                onHoverIn={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                onHoverOut={() => setEffectHint((current) => (current?.title === entry.label ? null : current))}
                                onPress={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                style={[
                                  styles.waveHudIconBadge,
                                  entry.tone === "good"
                                    ? styles.towerStatusIconBadgeGood
                                    : entry.tone === "bad"
                                      ? styles.towerStatusIconBadgeBad
                                      : styles.towerStatusIconBadgeNeutral,
                                ]}
                              >
                                {entry.kind === "item" ? (
                                  <GameItemIcon itemId={entry.itemId} size={14} />
                                ) : entry.kind === "title" ? (
                                  <Image source={entry.source} style={styles.waveHudIconImage} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={entry.icon}
                                    size={12}
                                    color={entry.tone === "good" ? "#9effc4" : entry.tone === "bad" ? "#ffb1b1" : "#e8d3ac"}
                                  />
                                )}
                              </Pressable>
                            ))}
                          </View>
                          {effectHint ? (
                            <Text style={styles.effectHintText}>
                              {effectHint.title}
                              {effectHint.detail ? ` • ${effectHint.detail}` : ""}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      <View style={styles.enemyRosterRow}>
                        {towerEnemies.normal.map((enemy) => (
                          <Pressable key={enemy.id} style={styles.enemyCard} onPress={() => setSelectedTowerEnemy(enemy)}>
                            {getTowerEnemyArt(enemy) ? (
                              <Image source={getTowerEnemyArt(enemy)} style={styles.enemyPortrait} resizeMode="cover" />
                            ) : (
                              <MaterialCommunityIcons
                                name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                size={26}
                                color="#ffd487"
                              />
                            )}
                            <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
                            <Text style={styles.enemyLevel}>Lv {enemy.level}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={styles.waveSectionLabel}>Mechanic Preview</Text>
                      {(towerEnemies.normal.flatMap((enemy) => (enemy.mechanics ?? []).map((mechanic) => ({ enemy, mechanic })))).map(
                        ({ enemy, mechanic }, idx) => {
                          const counterItemId = getCounterItemIdFromMechanicText(mechanic);
                          const hasCounter = counterItemId ? towerPreparedItemSet.has(counterItemId) : false;
                          return (
                            <View key={`normal-mech-${enemy.id}-${idx}`} style={styles.reqItem}>
                              <MaterialCommunityIcons name={hasCounter ? "shield-check-outline" : "alert-circle-outline"} size={12} color={hasCounter ? "#95e6ac" : "#ffb1a2"} />
                              <Text style={styles.reqText}>
                                {enemy.name}: {mechanic.split(":")[0]}
                                {counterItemId ? ` (${hasCounter ? "counter ready" : "counter missing"})` : ""}
                              </Text>
                            </View>
                          );
                        },
                      )}
                      <Text style={styles.waveSectionLabel}>Normal Drop Pool</Text>
                      <View style={styles.towerDropGrid}>
                        {normalDrops.guaranteed.map((reward) => (
                          <Pressable
                                key={`normal-guaranteed-${reward.itemId}`}
                                style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Guaranteed • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                          >
                            <GameItemIcon itemId={reward.itemId} size={24} />
                            <View style={styles.towerDropQtyBadge}>
                              <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                            </View>
                          </Pressable>
                        ))}
                        {floorIntelUnlocked ? (
                          normalDrops.possible.map((reward) => (
                            <Pressable
                                  key={`normal-possible-${reward.itemId}`}
                                  style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                  onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Chance ${Math.round(reward.chance * 100)}% • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                            >
                              <GameItemIcon itemId={reward.itemId} size={24} />
                              <View style={styles.towerDropQtyBadge}>
                                <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                              </View>
                            </Pressable>
                          ))
                        ) : (
                          <Pressable style={styles.towerDropIconCard} onPress={() => showQuickInfo("Locked Drop Intel", "Buy this floor's intel from Bran to reveal additional drop possibilities.")}>
                            <MaterialCommunityIcons name="help-circle-outline" size={24} color="#d4b98c" />
                          </Pressable>
                        )}
                      </View>
                      {waveReport.normal ? (
                        <View style={styles.waveReportCard}>
                          <Text style={styles.waveReportTitle}>{waveReport.normal.title} Mechanics</Text>
                          <Text style={styles.waveReportMeta}>Countered {waveReport.normal.countered} • Triggered {waveReport.normal.triggered}</Text>
                          {waveReport.normal.lines.slice(0, 4).map((line, idx) => (
                            <View key={`wave-report-normal-${idx}`} style={styles.waveEventRow}>
                              <MaterialCommunityIcons
                                name={classifyWaveLine(line).icon}
                                size={12}
                                color={classifyWaveLine(line).color}
                              />
                              <Text style={styles.waveEventText}>{line}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <Pressable
                        onPress={() => handleConquerTowerWaveSection(currentTowerFloor.floorNumber, "normal")}
                        style={styles.actionWrap}
                        disabled={waveProgress.normal !== "available"}
                      >
                        <View
                          style={[
                            styles.towerWaveActionButton,
                            waveProgress.normal !== "available" ? styles.towerWaveActionButtonDisabled : null,
                          ]}
                        >
                          <View style={styles.towerPrimaryActionInner}>
                            <MaterialCommunityIcons name="sword-cross" size={15} color="#fff1dc" />
                            <Text style={styles.towerPrimaryActionText}>
                              {waveProgress.normal === "cleared" ? "Normal Wave Conquered" : "Conquer Normal Wave"}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.subBoss} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Sub-Boss</Text>
                        <View
                          style={[
                            styles.towerPhaseResultPill,
                            waveProgress.subBoss === "cleared"
                              ? styles.towerPhaseResultOk
                              : subBossWaveUnlocked
                                ? styles.towerPhaseResultSkipped
                                : styles.towerPhaseResultFail,
                          ]}
                        >
                          <Text style={styles.towerPhaseResultText}>
                            {waveProgress.subBoss === "cleared" ? "CLEARED" : subBossWaveUnlocked ? "OPEN" : "LOCKED"}
                          </Text>
                        </View>
                      </View>
                      {activeWaveKey === "subBoss" ? (
                        <View style={styles.waveHudCard}>
                          <HealthMeter current={character.health} max={character.healthCap} compact />
                          <StaminaMeter current={character.stamina} max={character.staminaCap} compact iconName="alert-octagon-outline" />
                          <View style={styles.waveHudIconRow}>
                            {towerEffectIcons.slice(0, 8).map((entry) => (
                              <Pressable
                                key={`wave-sub-effect-${entry.key}`}
                                onHoverIn={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                onHoverOut={() => setEffectHint((current) => (current?.title === entry.label ? null : current))}
                                onPress={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                style={[
                                  styles.waveHudIconBadge,
                                  entry.tone === "good"
                                    ? styles.towerStatusIconBadgeGood
                                    : entry.tone === "bad"
                                      ? styles.towerStatusIconBadgeBad
                                      : styles.towerStatusIconBadgeNeutral,
                                ]}
                              >
                                {entry.kind === "item" ? (
                                  <GameItemIcon itemId={entry.itemId} size={14} />
                                ) : entry.kind === "title" ? (
                                  <Image source={entry.source} style={styles.waveHudIconImage} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={entry.icon}
                                    size={12}
                                    color={entry.tone === "good" ? "#9effc4" : entry.tone === "bad" ? "#ffb1b1" : "#e8d3ac"}
                                  />
                                )}
                              </Pressable>
                            ))}
                          </View>
                          {effectHint ? (
                            <Text style={styles.effectHintText}>
                              {effectHint.title}
                              {effectHint.detail ? ` • ${effectHint.detail}` : ""}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {subBossWaveUnlocked ? (
                        <>
                          <View style={styles.enemyRosterRow}>
                            {towerEnemies.subBoss.map((enemy) => (
                              <Pressable key={enemy.id} style={styles.enemyCardElite} onPress={() => setSelectedTowerEnemy(enemy)}>
                                {getTowerEnemyArt(enemy) ? (
                                  <Image source={getTowerEnemyArt(enemy)} style={styles.enemyPortrait} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={26}
                                    color="#ffc29d"
                                  />
                                )}
                                <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
                                <Text style={styles.enemyLevel}>Lv {enemy.level}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <Text style={styles.waveSectionLabel}>Mechanic Preview</Text>
                          {(towerEnemies.subBoss.flatMap((enemy) => (enemy.mechanics ?? []).map((mechanic) => ({ enemy, mechanic })))).map(
                            ({ enemy, mechanic }, idx) => {
                              const counterItemId = getCounterItemIdFromMechanicText(mechanic);
                              const hasCounter = counterItemId ? towerPreparedItemSet.has(counterItemId) : false;
                              return (
                                <View key={`sub-mech-${enemy.id}-${idx}`} style={styles.reqItem}>
                                  <MaterialCommunityIcons name={hasCounter ? "shield-check-outline" : "alert-circle-outline"} size={12} color={hasCounter ? "#95e6ac" : "#ffb1a2"} />
                                  <Text style={styles.reqText}>
                                    {enemy.name}: {mechanic.split(":")[0]}
                                    {counterItemId ? ` (${hasCounter ? "counter ready" : "counter missing"})` : ""}
                                  </Text>
                                </View>
                              );
                            },
                          )}
                          <Text style={styles.waveSectionLabel}>Sub-Boss Drop Pool</Text>
                          <View style={styles.towerDropGrid}>
                            {subBossDrops.guaranteed.map((reward) => (
                              <Pressable
                                key={`sub-guaranteed-${reward.itemId}`}
                                style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Guaranteed • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                              >
                                <GameItemIcon itemId={reward.itemId} size={24} />
                                <View style={styles.towerDropQtyBadge}>
                                  <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                </View>
                              </Pressable>
                            ))}
                            {floorIntelUnlocked ? (
                              subBossDrops.possible.map((reward) => (
                                <Pressable
                                  key={`sub-possible-${reward.itemId}`}
                                  style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                  onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Chance ${Math.round(reward.chance * 100)}% • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                                >
                                  <GameItemIcon itemId={reward.itemId} size={24} />
                                  <View style={styles.towerDropQtyBadge}>
                                    <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                  </View>
                                </Pressable>
                              ))
                            ) : null}
                          </View>
                          {waveReport.subBoss ? (
                            <View style={styles.waveReportCard}>
                              <Text style={styles.waveReportTitle}>{waveReport.subBoss.title} Mechanics</Text>
                              <Text style={styles.waveReportMeta}>Countered {waveReport.subBoss.countered} • Triggered {waveReport.subBoss.triggered}</Text>
                              {waveReport.subBoss.lines.slice(0, 4).map((line, idx) => (
                                <View key={`wave-report-sub-${idx}`} style={styles.waveEventRow}>
                                  <MaterialCommunityIcons
                                    name={classifyWaveLine(line).icon}
                                    size={12}
                                    color={classifyWaveLine(line).color}
                                  />
                                  <Text style={styles.waveEventText}>{line}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        <Pressable
                          onPress={() => handleConquerTowerWaveSection(currentTowerFloor.floorNumber, "subBoss")}
                          style={styles.actionWrap}
                          disabled={waveProgress.subBoss !== "available"}
                        >
                          <View
                            style={[
                              styles.towerWaveActionButton,
                              waveProgress.subBoss !== "available" ? styles.towerWaveActionButtonDisabled : null,
                            ]}
                          >
                            <View style={styles.towerPrimaryActionInner}>
                              <MaterialCommunityIcons name="sword-cross" size={15} color="#fff1dc" />
                              <Text style={styles.towerPrimaryActionText}>
                                {waveProgress.subBoss === "cleared" ? "Sub-Boss Conquered" : "Conquer Sub-Boss"}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                        </>
                      ) : (
                        <View style={styles.lockRow}>
                          <MaterialCommunityIcons name="lock-outline" size={14} color="#ffb28f" />
                          <Text style={styles.lockText}>Conquer Normal Wave to unlock Sub-Boss.</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.boss} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Main Boss</Text>
                        <View
                          style={[
                            styles.towerPhaseResultPill,
                            waveProgress.boss === "cleared"
                              ? styles.towerPhaseResultOk
                              : bossWaveUnlocked
                                ? styles.towerPhaseResultSkipped
                                : styles.towerPhaseResultFail,
                          ]}
                        >
                          <Text style={styles.towerPhaseResultText}>
                            {waveProgress.boss === "cleared" ? "CLEARED" : bossWaveUnlocked ? "OPEN" : "LOCKED"}
                          </Text>
                        </View>
                      </View>
                      {activeWaveKey === "boss" ? (
                        <View style={styles.waveHudCard}>
                          <HealthMeter current={character.health} max={character.healthCap} compact />
                          <StaminaMeter current={character.stamina} max={character.staminaCap} compact iconName="alert-octagon-outline" />
                          <View style={styles.waveHudIconRow}>
                            {towerEffectIcons.slice(0, 8).map((entry) => (
                              <Pressable
                                key={`wave-boss-effect-${entry.key}`}
                                onHoverIn={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                onHoverOut={() => setEffectHint((current) => (current?.title === entry.label ? null : current))}
                                onPress={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                style={[
                                  styles.waveHudIconBadge,
                                  entry.tone === "good"
                                    ? styles.towerStatusIconBadgeGood
                                    : entry.tone === "bad"
                                      ? styles.towerStatusIconBadgeBad
                                      : styles.towerStatusIconBadgeNeutral,
                                ]}
                              >
                                {entry.kind === "item" ? (
                                  <GameItemIcon itemId={entry.itemId} size={14} />
                                ) : entry.kind === "title" ? (
                                  <Image source={entry.source} style={styles.waveHudIconImage} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={entry.icon}
                                    size={12}
                                    color={entry.tone === "good" ? "#9effc4" : entry.tone === "bad" ? "#ffb1b1" : "#e8d3ac"}
                                  />
                                )}
                              </Pressable>
                            ))}
                          </View>
                          {effectHint ? (
                            <Text style={styles.effectHintText}>
                              {effectHint.title}
                              {effectHint.detail ? ` • ${effectHint.detail}` : ""}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {bossWaveUnlocked ? (
                        <>
                          <View style={styles.enemyRosterRow}>
                            {towerEnemies.boss.map((enemy) => (
                              <Pressable key={enemy.id} style={styles.enemyCardBoss} onPress={() => setSelectedTowerEnemy(enemy)}>
                                {getTowerEnemyArt(enemy) ? (
                                  <Image source={getTowerEnemyArt(enemy)} style={styles.enemyPortrait} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={27}
                                    color="#ffe1a2"
                                  />
                                )}
                                <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
                                <Text style={styles.enemyLevel}>Lv {enemy.level}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <Text style={styles.waveSectionLabel}>Mechanic Preview</Text>
                          {(towerEnemies.boss.flatMap((enemy) => (enemy.mechanics ?? []).map((mechanic) => ({ enemy, mechanic })))).map(
                            ({ enemy, mechanic }, idx) => {
                              const counterItemId = getCounterItemIdFromMechanicText(mechanic);
                              const hasCounter = counterItemId ? towerPreparedItemSet.has(counterItemId) : false;
                              return (
                                <View key={`boss-mech-${enemy.id}-${idx}`} style={styles.reqItem}>
                                  <MaterialCommunityIcons name={hasCounter ? "shield-check-outline" : "alert-circle-outline"} size={12} color={hasCounter ? "#95e6ac" : "#ffb1a2"} />
                                  <Text style={styles.reqText}>
                                    {enemy.name}: {mechanic.split(":")[0]}
                                    {counterItemId ? ` (${hasCounter ? "counter ready" : "counter missing"})` : ""}
                                  </Text>
                                </View>
                              );
                            },
                          )}
                          <Text style={styles.waveSectionLabel}>Main Boss Drop Pool</Text>
                          <View style={styles.towerDropGrid}>
                            {bossDrops.guaranteed.map((reward) => (
                              <Pressable
                                key={`boss-guaranteed-${reward.itemId}`}
                                style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Guaranteed • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                              >
                                <GameItemIcon itemId={reward.itemId} size={24} />
                                <View style={styles.towerDropQtyBadge}>
                                  <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                </View>
                              </Pressable>
                            ))}
                            {floorIntelUnlocked ? (
                              bossDrops.possible.map((reward) => (
                                <Pressable
                                  key={`boss-possible-${reward.itemId}`}
                                  style={[styles.towerDropIconCard, ITEM_BY_ID[reward.itemId]?.requiresAppraisal && !isItemAppraised(reward.itemId) ? styles.appraisalGlowSmall : null]}
                                  onPress={() => showQuickInfo(getItemDisplayName(reward.itemId), `Chance ${Math.round(reward.chance * 100)}% • x${reward.amount}`, getItemDisplayRarity(reward.itemId), reward.itemId)}
                                >
                                  <GameItemIcon itemId={reward.itemId} size={24} />
                                  <View style={styles.towerDropQtyBadge}>
                                    <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                  </View>
                                </Pressable>
                              ))
                            ) : null}
                          </View>
                          {waveReport.boss ? (
                            <View style={styles.waveReportCard}>
                              <Text style={styles.waveReportTitle}>{waveReport.boss.title} Mechanics</Text>
                              <Text style={styles.waveReportMeta}>Countered {waveReport.boss.countered} • Triggered {waveReport.boss.triggered}</Text>
                              {waveReport.boss.lines.slice(0, 4).map((line, idx) => (
                                <View key={`wave-report-boss-${idx}`} style={styles.waveEventRow}>
                                  <MaterialCommunityIcons
                                    name={classifyWaveLine(line).icon}
                                    size={12}
                                    color={classifyWaveLine(line).color}
                                  />
                                  <Text style={styles.waveEventText}>{line}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        <Pressable
                          onPress={() => handleConquerTowerWaveSection(currentTowerFloor.floorNumber, "boss")}
                          style={styles.actionWrap}
                          disabled={waveProgress.boss !== "available"}
                        >
                          <View
                            style={[
                              styles.towerWaveActionButton,
                              waveProgress.boss !== "available" ? styles.towerWaveActionButtonDisabled : null,
                            ]}
                          >
                            <View style={styles.towerPrimaryActionInner}>
                              <MaterialCommunityIcons name="sword-cross" size={15} color="#fff1dc" />
                              <Text style={styles.towerPrimaryActionText}>
                                {waveProgress.boss === "cleared" ? "Main Boss Conquered" : "Conquer Main Boss"}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                        </>
                      ) : (
                        <View style={styles.lockRow}>
                          <MaterialCommunityIcons name="lock-outline" size={14} color="#ffb28f" />
                          <Text style={styles.lockText}>Conquer Sub-Boss to unlock Main Boss.</Text>
                        </View>
                      )}
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
                      disabled={blocked || !floorFinalEngageReady}
                    >
                      <View style={[styles.startButton, blocked || !floorFinalEngageReady ? styles.actionDisabled : null]}>
                        <Text style={styles.startText}>
                          {blocked ? (isDead ? "Being Fractured" : "Locked") : floorFinalEngageReady ? "Finalize Floor Conquest" : "Main Boss Not Cleared"}
                        </Text>
                      </View>
                    </Pressable>
                      </>
                    ) : (
                      <View style={styles.towerScoutWrap}>
                        <View style={styles.towerScoutHeroCard}>
                          <LinearGradient
                            pointerEvents="none"
                            colors={["rgba(213, 164, 84, 0.14)", "rgba(86, 59, 139, 0.12)", "rgba(22, 18, 38, 0.04)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                          />
                          <View style={styles.towerScoutHeroHead}>
                            <View>
                              <Text style={styles.towerScoutEyebrow}>Scout View</Text>
                              <Text style={styles.reqTitle}>Floor Briefing</Text>
                            </View>
                            <View style={styles.towerScoutStatePill}>
                              <Text style={styles.towerScoutStateText}>
                                {towerStageIsWaves ? "Wave Resolve" : towerRunStage === "briefing" ? "Lore Ready" : "Preparation"}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.questMeta}>
                            {floorLore?.body ??
                              "These are the guild's current notes on the floor. Better ledgers, prior clears, and trusted field reports reveal more."}
                          </Text>
                          <View style={styles.towerScoutStatsRow}>
                            <Pressable onPress={() => showQuickInfo("Stamina Cost", `${currentTowerFloor.staminaCost}`)} style={styles.towerScoutStatChip}>
                              <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#ffd487" />
                              <Text style={styles.towerScoutStatText}>{currentTowerFloor.staminaCost}</Text>
                            </Pressable>
                          </View>
                          {towerStageIsWaves ? (
                            <>
                              <View style={styles.waveResolveMeterWrap}>
                                <HealthMeter current={character.health} max={character.healthCap} compact />
                              </View>
                              <View style={styles.waveHudIconRow}>
                                {towerEffectIcons.slice(0, 8).map((entry) => (
                                  <Pressable
                                    key={`scout-wave-effect-${entry.key}`}
                                    onHoverIn={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                    onHoverOut={() => setEffectHint((current) => (current?.title === entry.label ? null : current))}
                                    onPress={() => setEffectHint({ title: entry.label, detail: entry.detail })}
                                    style={[
                                      styles.waveHudIconBadge,
                                      entry.tone === "good"
                                        ? styles.towerStatusIconBadgeGood
                                        : entry.tone === "bad"
                                          ? styles.towerStatusIconBadgeBad
                                          : styles.towerStatusIconBadgeNeutral,
                                    ]}
                                  >
                                    {entry.kind === "item" ? (
                                      <GameItemIcon itemId={entry.itemId} size={14} />
                                    ) : entry.kind === "title" ? (
                                      <Image source={entry.source} style={styles.waveHudIconImage} resizeMode="cover" />
                                    ) : (
                                      <MaterialCommunityIcons
                                        name={entry.icon}
                                        size={12}
                                        color={entry.tone === "good" ? "#9effc4" : entry.tone === "bad" ? "#ffb1b1" : "#e8d3ac"}
                                      />
                                    )}
                                  </Pressable>
                                ))}
                              </View>
                              {effectHint ? (
                                <Text style={styles.effectHintText}>
                                  {effectHint.title}
                                  {effectHint.detail ? ` • ${effectHint.detail}` : ""}
                                </Text>
                              ) : null}
                            </>
                          ) : null}
                        </View>

                        <View style={styles.towerScoutGrid}>
                          {scoutWaveConfigs.map((wave) => {
                            const waveStageState = waveProgress[wave.key];
                            const waveLocked =
                              waveStageState === "locked" ||
                              (blocked && towerStageIsWaves);
                            const waveAvailable = waveStageState === "available" && !blocked;
                            const waveCleared = waveStageState === "cleared";
                            const waveStateLabel = waveCleared ? "CLEARED" : waveAvailable ? "OPEN" : "LOCKED";
                            const waveLockText =
                              wave.key === "subBoss"
                                ? "Conquer Normal Wave to unlock Sub-Boss."
                                : wave.key === "boss"
                                  ? "Conquer Sub-Boss to unlock Main Boss."
                                  : blocked
                                    ? access.reason ?? "Tower route locked."
                                    : "";
                            return (
                            <View key={`scout-${wave.key}`} style={styles.towerScoutCard}>
                              <View style={styles.towerScoutCardHead}>
                                <View style={styles.towerScoutCardTitleWrap}>
                                  <Image source={wave.icon} style={styles.waveHeaderIcon} resizeMode="contain" />
                                  <Text style={styles.reqTitle}>{wave.label}</Text>
                                </View>
                                <View style={styles.towerScoutCardHeadRight}>
                                  <View style={styles.towerScoutCountPill}>
                                    <Text style={styles.towerScoutCountText}>{wave.enemies.length} foes</Text>
                                  </View>
                                  {towerStageIsWaves ? (
                                    <View
                                      style={[
                                        styles.towerPhaseResultPill,
                                        waveCleared
                                          ? styles.towerPhaseResultOk
                                          : waveAvailable
                                            ? styles.towerPhaseResultSkipped
                                            : styles.towerPhaseResultFail,
                                      ]}
                                    >
                                      <Text style={styles.towerPhaseResultText}>{waveStateLabel}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                              <View style={[styles.towerScoutCardBody, useWideTowerScout ? styles.towerScoutCardBodyWide : null]}>
                                <View style={[styles.towerScoutEnemyStage, useWideTowerScout ? styles.towerScoutEnemyStageWide : null]}>
                                  <Text style={styles.waveSectionLabel}>Enemy Preview</Text>
                                  <View style={[styles.enemyRosterRow, useWideTowerScout ? styles.enemyRosterRowScout : null]}>
                                    {wave.enemies.map((enemy) => (
                                      (() => {
                                        const enemyHpVisible = character.progression.level >= enemy.level;
                                        return (
                                      <Pressable
                                        key={`scout-enemy-${enemy.id}`}
                                        style={[
                                          styles.enemyCard,
                                          styles.enemyCardScout,
                                          useWideTowerScout ? styles.enemyCardScoutWide : null,
                                          wave.enemies.length === 1 ? styles.enemyCardScoutSolo : null,
                                          towerStageIsWaves && waveCleared ? styles.enemyCardScoutDefeated : null,
                                        ]}
                                        onPress={() => setSelectedTowerEnemy(enemy)}
                                      >
                                        {towerStageIsWaves && waveCleared ? (
                                          <View style={styles.enemyDefeatedOverlay}>
                                            <MaterialCommunityIcons name="close-thick" size={useWideTowerScout ? 52 : 34} color="rgba(255, 98, 98, 0.92)" />
                                          </View>
                                        ) : null}
                                        {getTowerEnemyArt(enemy) ? (
                                          <Image
                                            source={getTowerEnemyArt(enemy)}
                                            style={[
                                              styles.enemyPortrait,
                                              styles.enemyPortraitScout,
                                              useWideTowerScout ? styles.enemyPortraitScoutWide : null,
                                              wave.enemies.length === 1 ? styles.enemyPortraitScoutSolo : null,
                                              towerStageIsWaves && waveCleared ? styles.enemyPortraitDefeated : null,
                                            ]}
                                            resizeMode="contain"
                                          />
                                        ) : (
                                          <MaterialCommunityIcons
                                            name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                            size={useWideTowerScout ? 44 : 24}
                                            color="#ffd487"
                                          />
                                        )}
                                        <View style={[styles.enemyScoutCaption, useWideTowerScout ? styles.enemyScoutCaptionWide : null]}>
                                          <Text style={styles.enemyName} numberOfLines={wave.enemies.length === 1 ? 2 : 1}>{enemy.name}</Text>
                                          <Text style={styles.enemyLevel}>Lv {enemy.level}</Text>
                                        </View>
                                        {towerStageIsWaves ? (
                                          <View style={styles.enemyScoutHpWrap}>
                                            <View style={styles.enemyScoutHpHead}>
                                              <Text style={styles.enemyScoutHpLabel}>HP</Text>
                                              <Text style={styles.enemyScoutHpValue}>
                                                {enemyHpVisible ? (waveCleared ? `0/${enemy.health}` : `${enemy.health}/${enemy.health}`) : "???/???"}
                                              </Text>
                                            </View>
                                            <View style={styles.enemyScoutHpTrack}>
                                              <View
                                                style={[
                                                  styles.enemyScoutHpFill,
                                                  { width: waveCleared ? "0%" : "100%" },
                                                  waveCleared ? styles.enemyScoutHpFillEmpty : null,
                                                ]}
                                              />
                                            </View>
                                          </View>
                                        ) : null}
                                      </Pressable>
                                        );
                                      })()
                                    ))}
                                  </View>
                                </View>

                                <View style={[styles.towerScoutIntelStage, useWideTowerScout ? styles.towerScoutIntelStageWide : null]}>
                                  <Text style={styles.waveSectionLabel}>Possible Drops</Text>
                                  <View style={[styles.towerDropGrid, styles.towerScoutUtilityGrid, useWideTowerScout ? styles.towerScoutUtilityGridWide : null]}>
                                    {[...wave.drops.guaranteed, ...(floorIntelUnlocked ? wave.drops.possible : [])].map((reward) => {
                                      const isGuaranteed = wave.drops.guaranteed.includes(reward as (typeof wave.drops.guaranteed)[number]);
                                      const rewardLine = isGuaranteed
                                        ? `Guaranteed • x${reward.amount}`
                                        : `Chance ${Math.round((reward as (typeof wave.drops.possible)[number]).chance * 100)}% • x${reward.amount}`;
                                      return (
                                        <Pressable
                                          key={`scout-drop-${wave.key}-${reward.itemId}-${reward.amount}`}
                                          style={styles.towerDropIconCard}
                                          onPress={() =>
                                            showQuickInfo(
                                              ITEM_BY_ID[reward.itemId]?.name ?? reward.itemId,
                                              rewardLine,
                                              ITEM_BY_ID[reward.itemId]?.rarity ?? "common",
                                              reward.itemId,
                                            )
                                          }
                                        >
                                          <GameItemIcon itemId={reward.itemId} size={24} />
                                          <View style={styles.towerDropQtyBadge}>
                                            <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                          </View>
                                        </Pressable>
                                      );
                                    })}
                                    {!floorIntelUnlocked ? (
                                      <Pressable
                                        style={styles.towerDropIconCard}
                                        onPress={() => showQuickInfo("Locked Drop Intel", "Bran can sell documented drop notes for this floor in the Intel ledger.")}
                                      >
                                        <MaterialCommunityIcons name="help-circle-outline" size={24} color="#d4b98c" />
                                      </Pressable>
                                    ) : null}
                                  </View>
                                </View>
                              </View>
                              {towerStageIsWaves ? (
                                <>
                                  {waveReport[wave.key] ? (
                                    <View style={styles.waveReportCard}>
                                      <Text style={styles.waveReportTitle}>{waveReport[wave.key]?.title} Mechanics</Text>
                                      <Text style={styles.waveReportMeta}>
                                        Countered {waveReport[wave.key]?.countered} • Triggered {waveReport[wave.key]?.triggered}
                                      </Text>
                                      {waveReport[wave.key]?.lines.slice(0, 4).map((line, idx) => (
                                        <View key={`scout-wave-report-${wave.key}-${idx}`} style={styles.waveEventRow}>
                                          <MaterialCommunityIcons
                                            name={classifyWaveLine(line).icon}
                                            size={12}
                                            color={classifyWaveLine(line).color}
                                          />
                                          <Text style={styles.waveEventText}>{line}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  ) : null}
                                  {waveLocked && waveLockText ? (
                                    <View style={styles.lockRow}>
                                      <MaterialCommunityIcons name="lock-outline" size={14} color="#ffb28f" />
                                      <Text style={styles.lockText}>{waveLockText}</Text>
                                    </View>
                                  ) : null}
                                  <Pressable
                                    onPress={() => handleConquerTowerWaveSection(currentTowerFloor.floorNumber, wave.key)}
                                    style={styles.actionWrap}
                                    disabled={!waveAvailable}
                                  >
                                    <View
                                      style={[
                                        styles.towerWaveActionButton,
                                        !waveAvailable ? styles.towerWaveActionButtonDisabled : null,
                                      ]}
                                    >
                                      <View style={styles.towerPrimaryActionInner}>
                                        <MaterialCommunityIcons name="sword-cross" size={15} color="#fff1dc" />
                                        <Text style={styles.towerPrimaryActionText}>
                                        {waveCleared ? `${wave.label} Conquered` : `Conquer ${wave.label}`}
                                        </Text>
                                      </View>
                                    </View>
                                  </Pressable>
                                </>
                              ) : null}
                            </View>
                            );
                          })}
                        </View>

                        <View style={styles.towerScoutFootnote}>
                          <MaterialCommunityIcons name="book-open-variant" size={16} color="#f1d59a" />
                          <Text style={styles.questMeta}>
                            {towerStageIsWaves
                              ? "Guild intel is still in effect inside the run. Resolve the open wave with the loadout you prepared, and better intel will continue to reveal more."
                              : "Scout what the guild currently knows, then enter when your loadout feels right. Better intel reveals more of the floor before the run begins."}
                          </Text>
                        </View>
                        {towerStageIsWaves && blocked ? (
                          <View style={styles.lockRow}>
                            <MaterialCommunityIcons name="lock-outline" size={14} color="#ff9b92" />
                            <Text style={styles.lockText}>{access.reason}</Text>
                          </View>
                        ) : null}
                        {towerStageIsWaves ? (
                          <Pressable
                            onPress={() => handleConquerTowerFloor(currentTowerFloor.floorNumber)}
                            style={styles.actionWrap}
                            disabled={blocked || !floorFinalEngageReady}
                          >
                            <View style={[styles.startButton, blocked || !floorFinalEngageReady ? styles.actionDisabled : null]}>
                              <Text style={styles.startText}>
                                {blocked ? (isDead ? "Being Fractured" : "Locked") : floorFinalEngageReady ? "Finalize Floor Conquest" : "Main Boss Not Cleared"}
                              </Text>
                            </View>
                          </Pressable>
                        ) : null}
                      </View>
                    )}
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
                {typeof lastTowerOutcome.healthDelta === "number" ? (
                  <Text style={styles.outcomeText}>
                    Health {lastTowerOutcome.healthDelta > 0 ? "+" : ""}{lastTowerOutcome.healthDelta}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : guildTab === "leaderboard" ? (
          <View style={styles.storeShell}>
            <View style={styles.towerProgressCard}>
              <Text style={styles.storeSectionTitle}>Climber Leaderboard</Text>
              <Text style={styles.questMeta}>Live guild climbing board. Rival adventurers also advance through checkpoints.</Text>
            </View>
            <View style={styles.towerProgressCard}>
              <View style={styles.leaderboardList}>
                {topClimberEntries.map((entry) => (
                  <View
                    key={`leader-${entry.id}`}
                    style={[styles.leaderRow, entry.isPlayer ? styles.leaderRowPlayer : null]}
                  >
                    <Text style={styles.leaderRank}>#{entry.rank}</Text>
                    <Image source={getAvatarSprite(entry.avatarId, entry.classId)} style={styles.leaderAvatar} resizeMode="cover" />
                    <View style={styles.leaderText}>
                      <Text style={styles.leaderName} numberOfLines={1}>
                        {entry.isPlayer ? `${entry.name} (You)` : entry.name}
                      </Text>
                      <Text style={styles.leaderMeta} numberOfLines={1}>
                        Floor {entry.floor} • Lv {entry.level}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={entry.trend === "up" ? "trending-up" : entry.trend === "down" ? "trending-down" : "minus"}
                      size={14}
                      color={entry.trend === "up" ? "#8de9a8" : entry.trend === "down" ? "#ff9ea9" : "#d2c6a8"}
                    />
                  </View>
                ))}
              </View>
              {playerBoardEntry ? (
                <Text style={styles.questMeta}>Your standing: #{playerBoardEntry.rank}</Text>
              ) : null}
            </View>
          </View>
        ) : guildTab === "npc" ? (
          <View style={styles.storeShell}>
            {npcProfiles.map((npc) => (
              <View key={npc.id} style={styles.npcCard}>
                {(() => {
                  const disposition = getNpcDisposition(npc);
                  const needsAttention = npcAttentionTargets.includes(npc.id);
                  const passingRemark = getNpcPassingRemark(npc);
                  const passingRemarkLine = passingRemark ? getNpcPassingRemarkLine(npc, passingRemark) : "";
                  return (
                    <>
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(216, 161, 84, 0.13)", "rgba(98, 66, 152, 0.08)", "rgba(26, 18, 41, 0.02)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                />
                <View pointerEvents="none" style={styles.npcSecurityLayer}>
                  <ImageBackground source={HUD_ASSETS.badges.stamp} style={styles.npcWatermark} resizeMode="contain">
                    <MaterialCommunityIcons name="shield-crown-outline" size={30} color="rgba(242, 212, 150, 0.23)" />
                  </ImageBackground>
                  <View style={styles.npcPatternArcOne} />
                  <View style={styles.npcPatternArcTwo} />
                  <View style={styles.npcPatternGrid} />
                </View>
                <View style={styles.npcTopBar}>
                  <View>
                    <Text style={styles.licenseTopKicker}>Adventurers Guild</Text>
                    <Text style={styles.licenseTopTitle}>Adventurer License</Text>
                  </View>
                  <View style={styles.npcTopRightWrap}>
                    {needsAttention ? (
                      <View style={styles.npcAttentionPill}>
                        <MaterialCommunityIcons name="bell-ring-outline" size={12} color="#ffe8b2" />
                        <Text style={styles.npcAttentionPillText}>Attention</Text>
                      </View>
                    ) : null}
                    <ImageBackground source={HUD_ASSETS.badges.rank} style={styles.rankSeal} resizeMode="contain">
                      <Text style={styles.rankSealLabel}>Rank</Text>
                      <Text style={styles.rankSealValue}>{getMaxRankForLevel(npc.level)}</Text>
                    </ImageBackground>
                  </View>
                </View>
                {passingRemark ? (
                  <View
                    style={[
                      styles.npcSpeechBubble,
                      {
                        borderColor: passingRemark.borderColor,
                        backgroundColor: passingRemark.backgroundColor,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.npcSpeechBubbleTail,
                        {
                          backgroundColor: passingRemark.backgroundColor,
                          borderColor: passingRemark.borderColor,
                        },
                      ]}
                    />
                    <View style={styles.npcSpeechBubbleInner}>
                      <MaterialCommunityIcons name={passingRemark.icon} size={13} color={passingRemark.color} />
                      <Text style={[styles.npcSpeechBubbleText, { color: passingRemark.color }]}>{passingRemarkLine}</Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.npcBody}>
                  <View style={styles.npcAvatar}>
                    <Image
                      source={npc.avatarOverride ?? getAvatarSprite(npc.avatarId, npc.classId)}
                      style={styles.npcAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.npcTextWrap}>
                    <Text style={styles.heroName}>{npc.name}</Text>
                    <Text style={styles.heroClass}>Title: {npc.title}</Text>
                    <Text style={styles.heroJobs}>Role: {npc.role}</Text>
                    <Text style={styles.licenseIdText}>ID {String(npc.sequenceId).padStart(4, "0")}-N</Text>
                  </View>
                  <View style={styles.npcRightBadges}>
                    <View style={styles.npcLevelBadge}>
                      <Text style={styles.npcLevelBadgeLabel}>Level</Text>
                      <Text style={styles.npcLevelBadgeValue}>{npc.level}</Text>
                    </View>
                    <View style={styles.npcFloorBadge}>
                    <View style={styles.npcFloorBadgeHead}>
                      <MaterialCommunityIcons name="stairs" size={11} color="#ffe1a1" />
                        <Text style={styles.npcFloorBadgeLabel}>Floor</Text>
                      </View>
                      <Text style={styles.npcFloorBadgeValue}>{getNpcFloorReached(npc)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.npcAuthBar}>
                  <View style={styles.npcAuthTextWrap}>
                    <Text style={styles.npcAuthLabel}>Authenticated By</Text>
                    <Text style={styles.npcAuthValue}>{npc.authBody}</Text>
                  </View>
                  <View style={styles.npcSignatureWrap}>
                    <Text style={styles.npcSignatureText}>{npc.signature}</Text>
                    <Text style={styles.npcSignatureHint}>Council Sign</Text>
                  </View>
                </View>
                <View style={styles.npcDispositionCard}>
                  <View style={styles.npcDispositionHead}>
                    <View style={styles.npcDispositionHeadLeft}>
                      <MaterialCommunityIcons name={disposition.icon} size={15} color={disposition.color} />
                      <Text style={styles.npcDispositionLabel}>Disposition</Text>
                      <Text style={[styles.npcDispositionTier, { color: disposition.color }]}>{disposition.label}</Text>
                    </View>
                    <Pressable
                      onPress={() => showQuickInfo(`${npc.name} • Disposition`, disposition.flavor)}
                      style={styles.npcDispositionInfoButton}
                    >
                      <MaterialCommunityIcons name="information-outline" size={15} color="#ffe0af" />
                    </Pressable>
                  </View>
                  <View style={styles.npcDispositionTrack}>
                    <View style={[styles.npcDispositionFill, { width: `${disposition.score}%`, backgroundColor: disposition.color }]} />
                  </View>
                </View>
                <View style={styles.npcPillsRow}>
                  {getNpcTypeChips(npc).map((chip) => (
                    <View key={`${npc.id}-${chip.text}`} style={styles.npcInfoChip}>
                      {chip.itemId ? (
                        <GameItemIcon itemId={chip.itemId} size={12} />
                      ) : (
                        <MaterialCommunityIcons
                          name={chip.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={14}
                          color={chip.color}
                        />
                      )}
                      <Text style={styles.npcInfoChipText}>{chip.text}</Text>
                    </View>
                  ))}
                </View>
                {npc.id === GUILD_MAGE_NPC_ID ? (
                  <View style={styles.archmageRiteCard}>
                    <LinearGradient
                      pointerEvents="none"
                      colors={["rgba(210, 165, 255, 0.2)", "rgba(97, 77, 161, 0.16)", "rgba(21, 18, 41, 0.04)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    <View style={styles.archmageRiteHead}>
                      <View style={styles.archmageRiteIconWrap}>
                        <MaterialCommunityIcons
                          name={archmageUsesNoviceMercy ? "star-four-points-circle" : "auto-fix"}
                          size={24}
                          color={archmageUsesNoviceMercy ? "#f0caff" : "#ffdba0"}
                        />
                      </View>
                      <View style={styles.archmageRiteTextWrap}>
                        <Text style={styles.archmageRiteLabel}>Revival Rite</Text>
                        <Text style={styles.archmageRiteName}>{archmageRiteName}</Text>
                      </View>
                      <Pressable
                        onPress={() => showQuickInfo(archmageRiteName, archmageTooltipDetail)}
                        style={styles.archmageRiteInfoButton}
                      >
                        <MaterialCommunityIcons name="information-outline" size={17} color="#ffe0af" />
                      </Pressable>
                      <View style={[styles.archmageRiteStatePill, noviceReviveLocked ? styles.archmageRiteStatePillLocked : null]}>
                        <Text style={styles.archmageRiteStateText}>{archmageVisibleStateText}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.questMeta}>{getNpcSummaryText(npc)}</Text>
                {npc.id === RESCUE_REQUEST_NPC_PROFILE.id ? (
                  storyState.aldricQuestPath === "saved" ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Aldric Stands With You</Text>
                    </View>
                  ) : storyState.aldricQuestPath === "refused" ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Aldric Has Left The Hall</Text>
                    </View>
                  ) : rescueNpcStatus === "refused_once" ? (
                    <Pressable onPress={() => setRescueDialogOpen(true)} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Hear Aldric's Final Plea</Text>
                      </View>
                    </Pressable>
                  ) : storyState.aldricQuestPath === "too_late" ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>The Watchtrail Loss Remains</Text>
                    </View>
                  ) : rescueNpcStatus === "accepted" ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Quest Active In Board</Text>
                    </View>
                  ) : (
                    <Pressable onPress={() => setRescueDialogOpen(true)} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Talk To Aldric</Text>
                      </View>
                    </Pressable>
                  )
                ) : npc.id === WARRIOR_PATH_GUIDE_NPC_PROFILE.id ? (
                  <View style={[styles.sellButton, styles.actionDisabled]}>
                    <Text style={styles.buyText}>Specialization Questline Soon</Text>
                  </View>
                ) : rankTrial && npc.id === rankExaminerProfile.id ? (
                  <Pressable onPress={promptRankVisit} style={styles.actionWrap}>
                    <View style={styles.sellButton}>
                      <Text style={styles.buyText}>Speak: Open Promotion Desk</Text>
                    </View>
                  </Pressable>
                ) : npc.id === QUARTERMASTER_BRAN_NPC_ID ? (
                  <Pressable onPress={promptStoreVisit} style={styles.actionWrap}>
                    <View style={styles.sellButton}>
                      <Text style={styles.buyText}>Ask About Supplies</Text>
                    </View>
                  </Pressable>
                ) : npc.id === "npc-tamsin-vale" ? (
                  storyState.thornRunnerFloorTwoAftermathReady && !storyState.thornRunnerFloorTwoAftermathReviewed ? (
                    <Pressable onPress={promptTamsinFloorTwoAftermath} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Review Floor 2 Aftermath</Text>
                      </View>
                    </Pressable>
                  ) : storyState.thornRunnerDeepLaneWarningReady && !storyState.thornRunnerDeepLaneWarningReviewed ? (
                    <Pressable onPress={promptTamsinDeepWarning} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Review Deeper Corridor Warning</Text>
                      </View>
                    </Pressable>
                  ) : storyState.thornRunnerCorridorReportReady && !storyState.thornRunnerCorridorReportReviewed ? (
                    <Pressable onPress={promptTamsinCorridorReport} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Report Thorn Corridor</Text>
                      </View>
                    </Pressable>
                  ) : storyState.thornRunnerQuestStatus === "completed" && !storyState.thornRunnerFollowupReviewed ? (
                    <Pressable onPress={promptTamsinFollowup} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Review Thorn Notes</Text>
                      </View>
                    </Pressable>
                  ) : storyState.thornRunnerFloorTwoAftermathReviewed ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Floor 2 Aftermath Logged</Text>
                    </View>
                  ) : storyState.thornRunnerDeepLaneWarningReviewed ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Deeper Warning Logged</Text>
                    </View>
                  ) : storyState.thornRunnerCorridorReportReviewed ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Corridor Report Filed</Text>
                    </View>
                  ) : storyState.thornRunnerQuestStatus === "completed" ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Thorn Notes Recorded</Text>
                    </View>
                  ) : storyState.thornRunnerIntroductionChoice ? (
                    <View style={[styles.sellButton, styles.actionDisabled]}>
                      <Text style={styles.buyText}>Quest Active In Board</Text>
                    </View>
                  ) : (
                    <Pressable onPress={promptTamsinVisit} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>Hear The Thorn Briefing</Text>
                      </View>
                    </Pressable>
                  )
                ) : (
                  <Pressable
                    onPress={npc.id === GUILD_MAGE_NPC_ID ? handleGuildMageRecovery : undefined}
                    style={styles.actionWrap}
                    disabled={npc.id === GUILD_MAGE_NPC_ID ? !canRequestGuildMage : true}
                  >
                    <View
                      style={[
                        styles.sellButton,
                        npc.id === GUILD_MAGE_NPC_ID ? (!canRequestGuildMage ? styles.actionDisabled : null) : styles.actionDisabled,
                      ]}
                    >
                      <Text style={styles.buyText}>
                        {npc.id === GUILD_MAGE_NPC_ID ? archmageActionText : "No Active Interaction"}
                      </Text>
                    </View>
                  </Pressable>
                )}
                    </>
                  );
                })()}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.storeShell}>
            <View style={styles.towerProgressCard}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(216, 161, 84, 0.13)", "rgba(98, 66, 152, 0.08)", "rgba(26, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <Text style={styles.storeSectionTitle}>Rank Examiner Desk</Text>
              {rankTrial ? (
                <View style={styles.chipsRow}>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="account-tie" size={13} color="#ffd78f" />
                    <Text style={styles.rewardChipText}>Examiner: {rankExaminerProfile.name}</Text>
                  </View>
                  <View style={styles.rewardChip}>
                    <MaterialCommunityIcons name="office-building-cog-outline" size={13} color="#a8d2ff" />
                    <Text style={styles.rewardChipText}>Guild Rank Office</Text>
                  </View>
                </View>
              ) : null}
              {!rankTrial ? (
                <Text style={styles.questMeta}>Maximum rank reached. No further promotions available.</Text>
              ) : (
                <>
                  <View style={styles.chipsRow}>
                    <View style={styles.rewardChip}>
                      <GameItemIcon itemId="tower-crest-fragment" size={12} />
                      <Text style={styles.rewardChipText}>{rankTrial.fromRank} {"->"} {rankTrial.toRank}</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <GameItemIcon itemId="focus-tonic" size={12} />
                      <Text style={styles.rewardChipText}>Lv {rankTrial.minLevel}+</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <GameItemIcon itemId="remnant-sentinel-shard" size={12} />
                      <Text style={styles.rewardChipText}>Quests {completedQuestCount}/{rankTrial.minQuestClears}</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#ffd487" />
                      <Text style={styles.rewardChipText}>{rankTrial.staminaCost}</Text>
                    </View>
                  </View>
                  <View style={styles.questMeterBlock}>
                    <View style={styles.meterLabelRow}>
                      <Text style={styles.meterLabel}>Promotion Success Chance</Text>
                      <Text style={styles.meterLabel}>{rankTrialChance}%</Text>
                    </View>
                    <ProgressBar value={rankTrialChance} max={100} variant="chance" />
                  </View>
                </>
              )}
            </View>
            {rankTrial ? (
              <>
                {rankTrial.requiredItems.length > 0 ? (
                  <View style={styles.towerProgressCard}>
                    <Text style={styles.reqTitle}>Required Trial Gear</Text>
                    <View style={styles.requirementsRow}>
                      {rankTrial.requiredItems.map((requirement) => {
                        const item = ITEM_BY_ID[requirement.itemId];
                        const owned = character.inventory[requirement.itemId] ?? 0;
                        const committed = selectedItemsForRankTrial[requirement.itemId] ?? 0;
                        const satisfied = committed >= requirement.needed;
                        return (
                          <View key={`rank-required-${requirement.itemId}`} style={styles.reqItem}>
                            <GameItemIcon itemId={requirement.itemId} size={14} />
                            <Pressable
                              onPress={() => adjustRankTrialItem(requirement.itemId, -1, requirement.needed, owned)}
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperButtonText}>-</Text>
                            </Pressable>
                            <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                              {committed}/{requirement.needed}
                            </Text>
                            <Pressable
                              onPress={() => adjustRankTrialItem(requirement.itemId, 1, requirement.needed, owned)}
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperButtonText}>+</Text>
                            </Pressable>
                            <Text style={styles.reqOwnedText}>Owned {owned}</Text>
                            <IconTooltip text={`${item?.name ?? requirement.itemId} is a key trial requirement.`} />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                {rankTrial.recommendedItems && rankTrial.recommendedItems.length > 0 ? (
                  <View style={styles.towerProgressCard}>
                    <Text style={styles.reqTitle}>Optional Support</Text>
                    <View style={styles.requirementsRow}>
                      {rankTrial.recommendedItems.map((requirement) => {
                        const item = ITEM_BY_ID[requirement.itemId];
                        const owned = character.inventory[requirement.itemId] ?? 0;
                        const committed = selectedItemsForRankTrial[requirement.itemId] ?? 0;
                        const satisfied = committed >= requirement.needed;
                        return (
                          <View key={`rank-optional-${requirement.itemId}`} style={styles.reqItem}>
                            <GameItemIcon itemId={requirement.itemId} size={14} />
                            <Pressable
                              onPress={() => adjustRankTrialItem(requirement.itemId, -1, requirement.needed, owned)}
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperButtonText}>-</Text>
                            </Pressable>
                            <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                              {committed}/{requirement.needed}
                            </Text>
                            <Pressable
                              onPress={() => adjustRankTrialItem(requirement.itemId, 1, requirement.needed, owned)}
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperButtonText}>+</Text>
                            </Pressable>
                            <Text style={styles.reqOwnedText}>Owned {owned}</Text>
                            <IconTooltip text={`${item?.name ?? requirement.itemId} gives extra safety in trial attempts.`} />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                {!rankTrialAccess.allowed ? (
                  <View style={styles.lockRow}>
                    <MaterialCommunityIcons name="lock-outline" size={14} color="#ff9b92" />
                    <Text style={styles.lockText}>{rankTrialAccess.reason}</Text>
                  </View>
                ) : null}
                <Pressable onPress={handleAttemptRankUp} style={styles.actionWrap} disabled={!rankTrialAccess.allowed}>
                  <View style={[styles.startButton, !rankTrialAccess.allowed ? styles.actionDisabled : null]}>
                    <Text style={styles.startText}>Challenge Promotion Trial</Text>
                  </View>
                </Pressable>
                {lastRankUpOutcome ? (
                  <View style={styles.outcomeCard}>
                    <Text style={[styles.outcomeTitle, lastRankUpOutcome.success ? styles.ok : styles.fail]}>
                      Rank Trial {lastRankUpOutcome.success ? "Cleared" : "Failed"}
                    </Text>
                    <Text style={styles.outcomeText}>
                      {lastRankUpOutcome.fromRank} {"->"} {lastRankUpOutcome.toRank} • {lastRankUpOutcome.successChance}%
                    </Text>
                    <Text style={styles.outcomeText}>{lastRankUpOutcome.summary}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        )}

      </ScrollView>
      {lastTowerOutcome ? (
        <Modal visible={towerEncounterOpen} transparent animationType="fade" onRequestClose={() => setTowerEncounterOpen(false)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.13)", "rgba(96, 64, 154, 0.08)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.encounterHead}>
                <View style={styles.encounterHeadLeft}>
                  <MaterialCommunityIcons name="sword-cross" size={20} color="#ffd58f" />
                  <Text style={[styles.resultTitle, lastTowerOutcome.success ? styles.ok : styles.fail]}>
                    Floor {lastTowerOutcome.floorNumber} Encounter
                  </Text>
                </View>
                <View style={styles.encounterStatusPill}>
                  <Text style={styles.encounterStatusText}>
                    {lastTowerOutcome.success ? "VICTORY" : "DEFEAT"}
                  </Text>
                </View>
              </View>
              {conditionalEncounterOpen && lastTowerOutcome.conditionalEncounter ? (
                <View style={styles.conditionalEncounterCard}>
                  <View style={styles.floorEncounterHead}>
                    <Image
                      source={getAvatarSprite(
                        lastTowerOutcome.conditionalEncounter.avatarId,
                        lastTowerOutcome.conditionalEncounter.classId,
                      )}
                      style={styles.floorEncounterAvatar}
                      resizeMode="cover"
                    />
                    <View style={styles.floorEncounterText}>
                      <Text style={styles.floorEncounterName}>{lastTowerOutcome.conditionalEncounter.npcName}</Text>
                      <Text style={styles.floorEncounterMeta}>
                        {lastTowerOutcome.conditionalEncounter.npcTitle} • {
                          lastTowerOutcome.conditionalEncounter.npcName === "Tamsin Vale"
                            ? "Route Mark"
                            : lastTowerOutcome.conditionalEncounter.contactStyle === "disciplined"
                              ? "Disciplined Intercept"
                              : "Emergency Intercept"
                        }
                      </Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="pause-circle-outline" size={13} color="#ffe2a5" />
                      <Text style={styles.rewardChipText}>Progress Paused</Text>
                    </View>
                  </View>
                  <Text style={styles.questMeta}>{lastTowerOutcome.conditionalEncounter.message}</Text>
                  <View style={styles.floorEncounterActions}>
                    <Pressable onPress={() => handleConditionalEncounterChoice(true)} style={styles.actionWrap}>
                      <View style={styles.buyButton}>
                        <Text style={styles.buyText}>{lastTowerOutcome.conditionalEncounter.acceptLabel}</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => handleConditionalEncounterChoice(false)} style={styles.actionWrap}>
                      <View style={styles.sellButton}>
                        <Text style={styles.buyText}>{lastTowerOutcome.conditionalEncounter.declineLabel}</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <ScrollView
                style={styles.encounterScroll}
                contentContainerStyle={styles.encounterScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {lastTowerOutcome.success && towerClearStory ? (
                <View style={styles.floorClearHeroCard}>
                  <View style={styles.floorClearHeroHead}>
                    <View style={styles.floorClearHeroIcon}>
                      <MaterialCommunityIcons
                        name={towerClearStory.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={22}
                        color="#ffe1a0"
                      />
                    </View>
                    <View style={styles.floorClearHeroText}>
                      <Text style={styles.floorClearHeroLabel}>Floor Cleared</Text>
                      <Text style={styles.floorClearHeroTitle}>{towerClearStory.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.outcomeText}>{towerClearStory.body}</Text>
                  <View style={styles.floorClearStoryCard}>
                    <Text style={styles.floorClearStoryLabel}>Story Implication</Text>
                    <Text style={styles.questMeta}>{towerClearStory.implication}</Text>
                  </View>
                </View>
              ) : null}
              {lastTowerOutcome.success && towerOutcomeFloor ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Reward Summary</Text>
                  <View style={styles.chipsRow}>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="star-circle-outline" size={14} color="#8fb9ff" />
                      <Text style={styles.rewardChipText}>+{towerOutcomeFloor.reward.xp} XP</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="cash" size={14} color="#ffd58f" />
                      <Text style={styles.rewardChipText}>+{towerOutcomeFloor.reward.gold}g</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <MaterialCommunityIcons name="school-outline" size={14} color="#d7b2ff" />
                      <Text style={styles.rewardChipText}>+{towerOutcomeFloor.reward.masteryXp} Mastery</Text>
                    </View>
                  </View>
                  {(lastTowerOutcome.itemRewards?.length ?? 0) > 0 ? (
                    <View style={styles.floorDropBlock}>
                      <Text style={styles.floorDropLabel}>Drops Earned</Text>
                      <View style={styles.floorDropGrid}>
                        {lastTowerOutcome.itemRewards?.map((reward) => {
                          const item = ITEM_BY_ID[reward.itemId];
                          const accent = getItemRarityAccent(reward.itemId);
                          return (
                            <View
                              key={`tower-drop-${reward.itemId}-${reward.guaranteed ? "g" : "r"}`}
                              style={[
                                styles.floorDropCard,
                                { borderColor: accent.border, backgroundColor: accent.background, shadowColor: accent.glow },
                              ]}
                            >
                              <View style={styles.floorDropIconWrap}>
                                <GameItemIcon itemId={reward.itemId} size={28} />
                              </View>
                              <View style={styles.floorDropTextWrap}>
                                <Text style={styles.floorDropName}>{item?.name ?? reward.itemId}</Text>
                                <Text style={styles.floorDropMeta}>
                                  {reward.guaranteed ? "Guaranteed Drop" : "Bonus Drop"} • x{reward.amount}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                  {lastTowerOutcome.titleRewardId ? (
                    <View style={styles.titleRewardCard}>
                      <View style={styles.titleRewardIconWrap}>
                        <Image source={TITLE_ICON_ART[lastTowerOutcome.titleRewardId]} style={styles.titleRewardIcon} resizeMode="contain" />
                      </View>
                      <View style={styles.titleRewardTextWrap}>
                        <View style={styles.titleRewardTopRow}>
                          <Text style={styles.titleRewardLabel}>TITLE EARNED</Text>
                        </View>
                        <Text style={styles.titleRewardName}>
                          {TITLE_BY_ID[lastTowerOutcome.titleRewardId]?.name ?? lastTowerOutcome.titleRewardId}
                        </Text>
                        <Text style={styles.titleRewardMeta}>
                          {TITLE_BY_ID[lastTowerOutcome.titleRewardId]?.flavor ?? "Added to your title archive."}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {lastTowerOutcome.success && towerClearStory ? (
                <View style={styles.floorClearQuestCard}>
                  <View style={styles.floorClearQuestHead}>
                    <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color="#a8d2ff" />
                    <Text style={styles.reqTitle}>Main Quest Shift</Text>
                  </View>
                  <Text style={styles.floorClearQuestTitle}>{towerClearStory.mainQuestTitle}</Text>
                  <Text style={styles.questMeta}>{towerClearStory.mainQuestBody}</Text>
                </View>
              ) : null}
              <Text style={styles.resultChance}>Progression: Normal {"->"} Sub-Boss {"->"} Boss</Text>
              <View style={styles.encounterHealthCard}>
                <HealthMeter current={character.health} max={character.healthCap} title="Current HP" compact />
                {typeof lastTowerOutcome.healthDelta === "number" ? (
                  <View
                    style={[
                      styles.encounterDeltaPill,
                      lastTowerOutcome.healthDelta < 0 ? styles.encounterDeltaPillLoss : styles.encounterDeltaPillGain,
                    ]}
                  >
                    <Text style={styles.encounterDeltaText}>
                      {lastTowerOutcome.healthDelta > 0 ? "+" : ""}
                      {lastTowerOutcome.healthDelta} HP
                    </Text>
                  </View>
                ) : null}
              </View>
              {lastTowerOutcome.supplyUsage && lastTowerOutcome.supplyUsage.length > 0 ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Supply Loadout</Text>
                  <View style={styles.encounterSupplyRow}>
                    {lastTowerOutcome.supplyUsage
                      .filter((entry) => entry.committed > 0)
                      .map((entry) => (
                        <View key={`outcome-supply-${entry.itemId}`} style={styles.encounterSupplyChip}>
                          <GameItemIcon itemId={entry.itemId} size={14} />
                          <Text style={styles.encounterSupplyText}>
                            {entry.committed}/{entry.needed}
                          </Text>
                        </View>
                      ))}
                    {lastTowerOutcome.supplyUsage.every((entry) => entry.committed <= 0) ? (
                      <Text style={styles.questMeta}>No supplies committed.</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
              {lastTowerOutcome.encounterLog && lastTowerOutcome.encounterLog.length > 0 ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Battle Progression</Text>
                  <View style={styles.effectRow}>
                    {(
                      [
                        { phase: "normal", label: "Normal Wave", icon: "sword-cross", color: "#ffc28a" },
                        { phase: "subBoss", label: "Sub-Boss", icon: "skull-outline", color: "#ff9e94" },
                        { phase: "boss", label: "Main Boss", icon: "crown-outline", color: "#ffe08a" },
                      ] as const
                    ).map((phaseConfig, index) => {
                      const revealed = index < revealedTowerPhases;
                      const phaseResult = (lastTowerOutcome.phaseResults ?? []).find(
                        (entry) => entry.phase === phaseConfig.phase,
                      );
                      const wasAttempted = phaseResult ? phaseResult.attempted !== false : false;
                      if (!revealed || !wasAttempted) {
                        return null;
                      }
                      const phaseEntries = lastTowerOutcome.encounterLog?.filter(
                        (entry) => entry.phase === phaseConfig.phase,
                      ) ?? [];
                      if (phaseEntries.length <= 0) {
                        return null;
                      }
                      return (
                        <View
                          key={`phase-progress-${phaseConfig.phase}`}
                          style={[
                            styles.towerPhaseCard,
                            phaseConfig.phase === "normal"
                              ? styles.towerPhaseCardNormal
                              : phaseConfig.phase === "subBoss"
                                ? styles.towerPhaseCardSubBoss
                                : styles.towerPhaseCardBoss,
                          ]}
                        >
                          <View style={styles.towerPhaseHead}>
                            <MaterialCommunityIcons
                              name={phaseConfig.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                              size={16}
                              color={phaseConfig.color}
                            />
                            <Text style={styles.reqTitle}>{phaseConfig.label}</Text>
                            <View
                              style={[
                                styles.towerPhaseResultPill,
                                phaseResult?.success ? styles.towerPhaseResultOk : styles.towerPhaseResultFail,
                              ]}
                            >
                              <Text style={styles.towerPhaseResultText}>{phaseResult?.success ? "CLEARED" : "FAILED"}</Text>
                            </View>
                          </View>
                          {phaseEntries.map((entry, entryIndex) => {
                            const effectEnemyArt = entry.enemyId
                              ? getTowerEnemyArt({
                                  id: entry.enemyId,
                                  icon: entry.enemyIcon,
                                  role: entry.enemyRole ?? phaseConfig.phase,
                                  level: entry.enemyLevel ?? 1,
                                  name: entry.enemyName,
                                  health: entry.enemyHealth ?? 1,
                                  description: "",
                                })
                              : null;
                            return (
                            <View key={`effect-enemy-${phaseConfig.phase}-${entry.enemyName}-${entryIndex}`} style={styles.effectEnemyCard}>
                              <View style={styles.effectHead}>
                                {effectEnemyArt ? (
                                  <Image
                                    source={effectEnemyArt}
                                    style={styles.effectEnemyPortrait}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <MaterialCommunityIcons
                                    name={entry.enemyIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={15}
                                    color={phaseConfig.color}
                                  />
                                )}
                                <Text style={styles.effectEnemy} numberOfLines={1}>
                                  {entry.enemyName}
                                </Text>
                                <View style={[styles.towerPhaseResultPill, styles.towerPhaseResultOk]}>
                                  <Text style={styles.towerPhaseResultText}>ENGAGED</Text>
                                </View>
                              </View>
                              <View style={styles.effectBattleStatsRow}>
                                {typeof entry.enemyHealth === "number" ? (
                                  <View style={styles.effectBattleStatChip}>
                                    <MaterialCommunityIcons name="heart-pulse" size={12} color="#ffb3bc" />
                                    <Text style={styles.effectBattleStatText}>HP {entry.enemyHealth}</Text>
                                  </View>
                                ) : null}
                                {typeof entry.turnsToDefeat === "number" ? (
                                  <View style={styles.effectBattleStatChip}>
                                    <MaterialCommunityIcons name="timeline-clock-outline" size={12} color="#ffd58f" />
                                    <Text style={styles.effectBattleStatText}>{entry.turnsToDefeat} turns</Text>
                                  </View>
                                ) : null}
                                {typeof entry.damageTaken === "number" ? (
                                  <View style={styles.effectBattleStatChip}>
                                    <MaterialCommunityIcons name="sword-cross" size={12} color="#9ed7ff" />
                                    <Text style={styles.effectBattleStatText}>-{entry.damageTaken} HP</Text>
                                  </View>
                                ) : null}
                              </View>
                              {entry.events.map((event, eventIndex) => (
                                <View
                                  key={`effect-${phaseConfig.phase}-${entry.enemyName}-${event.mechanic}-${eventIndex}`}
                                  style={[
                                    styles.effectCard,
                                    event.positive ? styles.effectCardCountered : styles.effectCardTriggered,
                                  ]}
                                >
                                  <View style={styles.effectHead}>
                                    <View style={[styles.effectStepBadge, event.positive ? styles.effectStepBadgeGood : styles.effectStepBadgeBad]}>
                                      <Text style={styles.effectStepBadgeText}>{eventIndex + 1}</Text>
                                    </View>
                                    <MaterialCommunityIcons
                                      name={event.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                      size={15}
                                      color={phaseConfig.color}
                                    />
                                    <Text style={styles.effectMechanic} numberOfLines={2}>
                                      {event.mechanic.split(":")[0]}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.effectResultPill,
                                      event.positive ? styles.effectResultPillCountered : styles.effectResultPillTriggered,
                                    ]}
                                  >
                                  <Text style={styles.effectResultText}>{event.positive ? "POSITIVE" : "NEGATIVE"}</Text>
                                  </View>
                                  <Text style={styles.effectResultBody}>{event.resultText}</Text>
                                </View>
                              ))}
                            </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
              <View style={styles.requirementsBlock}>
                {(lastTowerOutcome.phaseResults ?? [])
                  .filter((phase, index) => index < revealedTowerPhases)
                  .filter((phase) => phase.attempted !== false)
                  .map((phase, index) => {
                    const phaseRole: TowerEnemyUnit["role"] =
                      phase.phase === "normal" ? "normal" : phase.phase === "subBoss" ? "subBoss" : "boss";
                    const phaseLabel =
                      phase.phase === "normal" ? "Normal Wave" : phase.phase === "subBoss" ? "Sub-Boss" : "Main Boss";
                    return (
                      <View key={`tower-phase-${phase.phase}-${index}`} style={styles.towerPhaseSummaryRow}>
                        <Image source={TOWER_ENEMY_ROLE_ART[phaseRole]} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.encounterSupplyText}>{phaseLabel}</Text>
                        <View style={[styles.towerPhaseResultPill, phase.success ? styles.towerPhaseResultOk : styles.towerPhaseResultFail]}>
                          <Text style={styles.towerPhaseResultText}>{phase.success ? "CLEARED" : "FAILED"}</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
              {towerOutcomeFloor?.enemyRoster ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Enemy Roster</Text>
                  <View style={styles.encounterSupplyRow}>
                    {[...towerOutcomeFloor.enemyRoster.normal, ...towerOutcomeFloor.enemyRoster.subBoss, ...towerOutcomeFloor.enemyRoster.boss].map(
                      (enemy) => (
                        <View key={`outcome-enemy-${enemy.id}`} style={styles.encounterEnemyChip}>
                          {getTowerEnemyArt(enemy) ? (
                            <Image source={getTowerEnemyArt(enemy)} style={styles.encounterEnemyThumb} resizeMode="cover" />
                          ) : (
                            <MaterialCommunityIcons
                              name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                              size={14}
                              color="#ffd08a"
                            />
                          )}
                          <Text style={styles.encounterSupplyText} numberOfLines={1}>
                            {enemy.name}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              ) : null}
              <Text style={styles.outcomeText}>{lastTowerOutcome.summary}</Text>
              </ScrollView>
              <Pressable
                onPress={() => setTowerEncounterOpen(false)}
                style={styles.actionWrap}
                disabled={conditionalEncounterOpen && !conditionalEncounterResolved}
              >
                <View style={[styles.claimButton, conditionalEncounterOpen && !conditionalEncounterResolved ? styles.actionDisabled : null]}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {infoPanel ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            setInfoArtExpanded(false);
            setInfoPanel(null);
          }}
        >
          <View style={styles.resultOverlay}>
            <View style={styles.infoModalCard}>
              {(() => {
                const displayTitle = infoPanel.itemId ? getItemDisplayName(infoPanel.itemId) : infoPanel.title;
                const displayRarity = infoPanel.itemId ? getItemDisplayRarity(infoPanel.itemId) : infoPanel.rarity;
                const displayDescription = infoPanel.itemId ? getItemDisplayDescription(infoPanel.itemId) : "";
                const needsAppraisal = infoPanel.itemId ? !!ITEM_BY_ID[infoPanel.itemId]?.requiresAppraisal && !isItemAppraised(infoPanel.itemId) : false;
                const detailLines = infoPanel.body
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);
                return (
                  <>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.13)", "rgba(96, 64, 154, 0.08)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.infoModalHead}>
                <View style={styles.infoModalHeadLeft}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#ffd58f" />
                  <Text style={styles.infoModalTitle}>{displayTitle}</Text>
                </View>
                {displayRarity && !needsAppraisal ? (
                  <View style={[styles.infoRarityPill, { borderColor: rarityColorMap[displayRarity] }]}>
                    <Text style={[styles.infoRarityText, { color: rarityColorMap[displayRarity] }]}>
                      {displayRarity.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    setInfoArtExpanded(false);
                    setInfoPanel(null);
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
                </Pressable>
              </View>
              {infoPanel.itemId ? (
                <View style={styles.infoItemShowcase}>
                  <Pressable
                    onPress={() => {
                      if (ITEM_BY_ID[infoPanel.itemId!]?.image) {
                        setInfoArtExpanded(true);
                      }
                    }}
                    style={[
                      styles.infoItemIconWrap,
                      displayRarity ? { borderColor: rarityColorMap[displayRarity] } : null,
                      needsAppraisal ? styles.appraisalGlow : null,
                    ]}
                  >
                    {ITEM_BY_ID[infoPanel.itemId]?.image ? (
                      <Image source={ITEM_BY_ID[infoPanel.itemId]?.image} style={styles.infoItemArt} resizeMode="contain" />
                    ) : (
                      <GameItemIcon itemId={infoPanel.itemId} size={82} />
                    )}
                  </Pressable>
                  {displayDescription ? (
                    <View style={styles.infoItemDescriptionCard}>
                      <Text style={styles.infoItemDescriptionTitle}>{needsAppraisal ? "Appraisal" : "Use"}</Text>
                      <Text style={styles.infoItemDescriptionText}>{displayDescription}</Text>
                    </View>
                  ) : null}
                  {detailLines.length ? (
                    <View style={styles.infoModalBodyWrap}>
                      {detailLines.map((line) => (
                        <View key={`${infoPanel.title}-${line}`} style={styles.infoModalRow}>
                          <Text style={styles.infoModalBody}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.infoModalBodyWrap}>
                  {detailLines.map((line) => {
                    const [rawLabel, ...rawValue] = line.split(":");
                    const hasValue = rawValue.length > 0;
                    const label = rawLabel.trim();
                    const value = rawValue.join(":").trim();
                    return (
                      <View key={`${infoPanel.title}-${line}`} style={styles.infoModalRow}>
                        {hasValue ? (
                          <>
                            <Text style={styles.infoModalLabel}>{label}</Text>
                            <Text style={styles.infoModalValue}>{value}</Text>
                          </>
                        ) : (
                          <Text style={styles.infoModalBody}>{line}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
                  </>
                );
              })()}
              <Pressable
                onPress={() => {
                  setInfoArtExpanded(false);
                  setInfoPanel(null);
                }}
                style={styles.actionWrap}
              >
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {infoArtExpanded && infoPanel?.itemId && ITEM_BY_ID[infoPanel.itemId]?.image ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setInfoArtExpanded(false)}>
          <Pressable style={styles.expandedArtOverlay} onPress={() => setInfoArtExpanded(false)}>
            {(() => {
              const expandedRarity = getItemDisplayRarity(infoPanel.itemId) ?? "common";
              return (
                <View style={styles.expandedArtCard}>
                  <Text style={styles.expandedArtTitle}>{getItemDisplayName(infoPanel.itemId)}</Text>
                  <View style={[styles.expandedArtRarityPill, { borderColor: rarityColorMap[expandedRarity] }]}>
                    <Text
                      style={[
                        styles.expandedArtRarityText,
                        { color: rarityColorMap[expandedRarity] },
                        expandedRarity === "legendary" ? styles.legendaryTextGlow : null,
                      ]}
                    >
                      {expandedRarity.toUpperCase()}
                    </Text>
                  </View>
                  <Image source={ITEM_BY_ID[infoPanel.itemId]?.image} style={styles.expandedArtImage} resizeMode="contain" />
                  <Text style={styles.expandedArtHint}>Tap anywhere to close</Text>
                </View>
              );
            })()}
          </Pressable>
        </Modal>
      ) : null}
      {conditionalEncounterOpen && activeConditionalEncounter ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConditionalEncounterOpen(false)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.14)", "rgba(96, 64, 154, 0.1)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.floorEncounterHead}>
                <Image
                  source={getAvatarSprite(activeConditionalEncounter.avatarId, activeConditionalEncounter.classId)}
                  style={styles.floorEncounterAvatar}
                  resizeMode="cover"
                />
                <View style={styles.floorEncounterText}>
                  <Text style={styles.floorEncounterName}>{activeConditionalEncounter.npcName}</Text>
                  <Text style={styles.floorEncounterMeta}>
                    {activeConditionalEncounter.npcTitle} • {activeConditionalEncounter.contactStyle === "disciplined" ? "Disciplined Intercept" : "Ash Lane Rescue"}
                  </Text>
                </View>
                <View style={styles.rewardChip}>
                  <MaterialCommunityIcons
                    name={activeConditionalEncounter.contactStyle === "disciplined" ? "star-four-points-circle-outline" : "pause-circle-outline"}
                    size={13}
                    color={activeConditionalEncounter.contactStyle === "disciplined" ? "#9fe3ff" : "#ffe2a5"}
                  />
                  <Text style={styles.rewardChipText}>
                    {activeConditionalEncounter.contactStyle === "disciplined" ? "Respect Noted" : "Run Paused"}
                  </Text>
                </View>
              </View>
              <Text style={styles.outcomeText}>{activeConditionalEncounter.message}</Text>
              <View style={styles.dualActionRow}>
                <Pressable onPress={() => handleConditionalEncounterChoice(false)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceRefuseButton]}>
                    <Text style={styles.dialogChoiceText}>{activeConditionalEncounter.declineLabel}</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => handleConditionalEncounterChoice(true)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceAcceptButton]}>
                    <Text style={styles.dialogChoiceText}>{activeConditionalEncounter.acceptLabel}</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {liveTowerBattle ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLiveTowerBattle(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              {(() => {
                const activeTelegraph = liveTowerBattle.telegraphs[liveTowerBattle.activeIndex] ?? null;
                const currentEnemy = liveTowerBattle.enemies.find((enemy) => enemy.id === activeTelegraph?.enemyId);
                const battleSkills = unlockedBattleSkills;
                const battleWon = Object.values(liveTowerBattle.enemyHpById).every((hp) => hp <= 0);
                const battleLost = liveTowerBattle.playerHp <= 0;
                const battleFinished = battleWon || battleLost;
                const awaitingNextEnemy = liveTowerBattle.queuedEnemyIndex != null;
                const effectNowMs = getLiveBattleEffectClockMs(liveTowerBattle, nowMs);
                const currentEnemyHp = currentEnemy ? liveTowerBattle.enemyHpById[currentEnemy.id] ?? currentEnemy.health ?? 1 : 0;
                const isPlayerTurn = liveTowerBattle.turnOwner === "player";
                const currentEnemyStatusFx = currentEnemy ? pruneExpiredStatusFx(liveTowerBattle.enemyStatusFxById[currentEnemy.id] ?? [], effectNowMs) : [];
                const equippedBattleWeapon = character.equippedWeaponId ? ITEM_BY_ID[character.equippedWeaponId] : null;
                const visiblePlayerStatusFx = pruneExpiredStatusFx(liveTowerBattle.playerStatusFx, effectNowMs);
                const activeSkillBonuses = getCombinedLiveSkillBonuses(
                  visiblePlayerStatusFx,
                  battleSkills.map((skill) => skill.id),
                  effectNowMs,
                );
                const playerStatusSnapshot = getBattleStatusSnapshot(visiblePlayerStatusFx);
                const livePlayerAttackBonus =
                  activeSkillBonuses.attackBonus + (playerStatusSnapshot.hasFrenzied ? 4 : 0);
                const livePlayerCritBonus =
                  activeSkillBonuses.critBonus + (playerStatusSnapshot.hasFrenzied ? 3 : 0);
                const livePlayerSpeedBonus = activeSkillBonuses.speedBonus;
                const skillStateEntries = battleSkills.map((skill) => {
                  const profile = getLiveBattleSkillProfile(skill.id);
                  const activeEffect = profile ? visiblePlayerStatusFx.find((effect) => effect.id === profile.effectId) : null;
                  const activeRemainingMs =
                    activeEffect?.expiresAtMs && activeEffect.expiresAtMs > effectNowMs ? activeEffect.expiresAtMs - effectNowMs : 0;
                  const cooldownRemainingMs = Math.max(0, (liveTowerBattle.skillCooldownEndsAtMsById?.[skill.id] ?? 0) - nowMs);
                  return {
                    skill,
                    profile,
                    activeEffect,
                    activeRemainingMs,
                    cooldownRemainingMs,
                  };
                });
                const primarySkillState = skillStateEntries.find((entry) => entry.activeRemainingMs > 0 || entry.cooldownRemainingMs > 0) ?? skillStateEntries[0] ?? null;
                const effectivePlayerSpeed = liveTowerBattle.playerStats.speed + activeSkillBonuses.speedBonus;
                const initiativePreview = buildInitiativePreview(liveTowerBattle, currentEnemy?.id, effectivePlayerSpeed);
                const playerEffectIcons = [
                  ...(equippedBattleWeapon
                    ? [
                        {
                          key: `battle-weapon-${equippedBattleWeapon.id}`,
                          label: equippedBattleWeapon.name,
                          detail: "Equipped weapon effect",
                          kind: "item" as const,
                          itemId: equippedBattleWeapon.id,
                          tone: "neutral" as const,
                        },
                      ]
                    : []),
                  ...activeBuffIds.map((buffId) => ({
                    key: `battle-buff-${buffId}`,
                    label: ITEM_BY_ID[buffId]?.name ?? "Active Sigil",
                    detail: "Active before and during the run",
                    kind: "item" as const,
                    itemId: buffId,
                    tone: "good" as const,
                  })),
                  ...(character.equippedPassiveAbilityIds ?? []).flatMap((passiveId) => {
                    const passive = ABILITY_BY_ID[passiveId];
                    return passive
                      ? [
                          {
                            key: `battle-passive-${passiveId}`,
                            abilityId: passiveId,
                            label: passive.name,
                            detail: getCombatAbilityEffectSummary(passiveId),
                            kind: "mc" as const,
                            icon: passive.icon as keyof typeof MaterialCommunityIcons.glyphMap,
                            tone: "good" as const,
                          },
                        ]
                      : [];
                  }),
                  ...visiblePlayerStatusFx.map((effect) => ({
                    key: `battle-status-${effect.id}`,
                    abilityId: getAbilityIdForBattleStatus(effect.id),
                    label: effect.label,
                    detail: formatStatusDetail(effect, effectNowMs),
                    kind: "mc" as const,
                    icon: effect.icon,
                    tone: effect.tone,
                  })),
                ];
                return (
                  <>
                    <View style={styles.encounterHead}>
                      <View style={styles.encounterHeadLeft}>
                        <MaterialCommunityIcons name="sword-cross" size={20} color="#ffd58f" />
                        <Text style={styles.resultTitle}>
                          {liveTowerBattle.source === "quest"
                            ? liveTowerBattle.encounterTitle ?? "Live Contract"
                            : liveTowerBattle.encounterTitle ??
                              (liveTowerBattle.wave === "normal"
                                ? "Live Clash: Normal Wave"
                                : liveTowerBattle.wave === "subBoss"
                                  ? "Live Clash: Sub-Boss"
                                  : "Live Clash: Main Boss")}
                        </Text>
                      </View>
                      <View style={[styles.encounterStatusPill, isPlayerTurn ? styles.towerPhaseResultOk : styles.towerPhaseResultFail]}>
                        <Text style={styles.encounterStatusText}>
                          {isPlayerTurn ? "YOUR TURN" : "ENEMY TURN"}
                        </Text>
                      </View>
                    </View>
                    <ScrollView style={styles.waveResolveScroll} contentContainerStyle={styles.waveResolveScrollContent} showsVerticalScrollIndicator={false}>
                      {liveTowerBattle.source === "quest" && liveTowerBattle.encounterSummary ? (
                        <Text style={styles.questMeta}>{liveTowerBattle.encounterSummary}</Text>
                      ) : null}
                      {initiativePreview.length ? (
                        <View style={styles.liveBattleInitiativeCard}>
                          <View style={styles.liveBattleSectionHead}>
                            <MaterialCommunityIcons name="timeline-outline" size={15} color="#9ecfff" />
                            <Text style={styles.reqTitle}>Initiative</Text>
                          </View>
                          <View style={styles.liveBattleInitiativeRow}>
                            {liveTowerBattle.initiativeHistory.map((entry, index) => (
                              <View
                                key={`initiative-history-${entry}-${index}`}
                                style={[
                                  styles.liveBattleInitiativeToken,
                                  styles.liveBattleInitiativeTokenResolved,
                                  entry === "player" ? styles.liveBattleInitiativeTokenPlayer : styles.liveBattleInitiativeTokenEnemy,
                                ]}
                              >
                                {entry === "player" ? (
                                  <Image source={getAvatarSprite(character.avatarId, character.classId)} style={styles.liveBattleInitiativeAvatar} resizeMode="cover" />
                                ) : currentEnemy && getTowerEnemyArt(currentEnemy) ? (
                                  <Image source={getTowerEnemyArt(currentEnemy)} style={styles.liveBattleInitiativeAvatar} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons name="skull-outline" size={14} color="#fff0cf" />
                                )}
                                <View style={styles.liveBattleInitiativeResolvedMark}>
                                  <MaterialCommunityIcons name="close" size={10} color="#1c0f15" />
                                </View>
                              </View>
                            ))}
                            {initiativePreview.map((entry, index) => (
                              <View
                                key={`initiative-${entry.key}`}
                                style={[
                                  styles.liveBattleInitiativeToken,
                                  index === 0 ? styles.liveBattleInitiativeTokenActive : null,
                                  entry.actor === "player" ? styles.liveBattleInitiativeTokenPlayer : styles.liveBattleInitiativeTokenEnemy,
                                ]}
                              >
                                {entry.actor === "player" ? (
                                  <Image source={getAvatarSprite(character.avatarId, character.classId)} style={styles.liveBattleInitiativeAvatar} resizeMode="cover" />
                                ) : currentEnemy && getTowerEnemyArt(currentEnemy) ? (
                                  <Image source={getTowerEnemyArt(currentEnemy)} style={styles.liveBattleInitiativeAvatar} resizeMode="cover" />
                                ) : (
                                  <MaterialCommunityIcons name="skull-outline" size={14} color="#fff0cf" />
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                      <View style={styles.liveBattleStatusGrid}>
                        <View style={styles.liveBattleEnemyCardWrap}>
                          {currentEnemy ? (
                            <View style={styles.liveBattleEnemyCard}>
                              {getTowerEnemyArt(currentEnemy) ? (
                                <View style={styles.liveBattleEnemyArtWrap}>
                                  <Image
                                    source={getTowerEnemyArt(currentEnemy)}
                                    style={[styles.liveBattleEnemyArt, currentEnemyHp <= 0 ? styles.liveBattleEnemyArtDowned : null]}
                                    resizeMode="contain"
                                  />
                                  {currentEnemyHp <= 0 ? (
                                    <View style={styles.liveBattleEnemyDownedMark}>
                                      <MaterialCommunityIcons name="close-thick" size={34} color="#ff8f9a" />
                                    </View>
                                  ) : null}
                                </View>
                              ) : null}
                              <Text style={styles.liveBattleEnemyName}>{currentEnemy.name}</Text>
                              <View style={styles.liveBattleEnemyMetaRow}>
                                <Text style={styles.liveBattleEnemyMeta}>Lv {currentEnemy.level}</Text>
                                <Text style={styles.liveBattleEnemyHpText}>Enemy HP</Text>
                              </View>
                              <HealthMeter
                                current={currentEnemyHp}
                                max={currentEnemy.health}
                                title="Enemy HP"
                                hideValues={currentEnemy.level > character.progression.level}
                                meta={currentEnemy.level > character.progression.level ? "Unknown endurance. Damage still lands in real time." : `Current HP ${currentEnemyHp}/${currentEnemy.health}`}
                              />
                              <View style={styles.liveBattleDamageMetaRow}>
                                <Text style={styles.liveBattleEnemyMeta}>
                                  {currentEnemyHp <= 0
                                    ? "Downed"
                                    : liveTowerBattle.lastPlayerDamage
                                      ? `Last hit ${liveTowerBattle.lastPlayerDamage}`
                                      : "Awaiting strike"}
                                </Text>
                                {liveTowerBattle.lastCrit ? <Text style={styles.liveBattleCritText}>CRIT</Text> : null}
                              </View>
                              <View style={styles.waveBattleStatsRow}>
                                <View style={styles.waveBattleStatChip}>
                                  <MaterialCommunityIcons name="sword-cross" size={13} color="#99dcff" />
                                  <Text style={styles.waveBattleStatText}>ATK {liveTowerBattle.enemyStatsById[currentEnemy.id]?.damage ?? 0}</Text>
                                </View>
                                <View style={styles.waveBattleStatChip}>
                                  <MaterialCommunityIcons name="creation" size={13} color="#ffd58f" />
                                  <Text style={styles.waveBattleStatText}>CRIT {liveTowerBattle.enemyStatsById[currentEnemy.id]?.critChance ?? 0}%</Text>
                                </View>
                                <View style={styles.waveBattleStatChip}>
                                  <MaterialCommunityIcons name="run-fast" size={13} color="#ffb1b1" />
                                  <Text style={styles.waveBattleStatText}>
                                    SPD {liveTowerBattle.enemyStatsById[currentEnemy.id]?.speed ?? 0}
                                    {liveTowerBattle.enemyStatsById[currentEnemy.id] && liveTowerBattle.enemyStatsById[currentEnemy.id].speed > liveTowerBattle.playerStats.speed ? " • Extra turns" : ""}
                                  </Text>
                                </View>
                              </View>
                              {currentEnemyStatusFx.length ? (
                                <View style={styles.liveBattleStatusFxRow}>
                                  {currentEnemyStatusFx.map((effect) => (
                                    <Pressable
                                      key={`enemy-fx-${currentEnemy.id}-${effect.id}`}
                                      onHoverIn={() => setBattleStatusHint(formatStatusDetail(effect, effectNowMs))}
                                      onHoverOut={() =>
                                        setBattleStatusHint((currentHint) =>
                                          currentHint === formatStatusDetail(effect, effectNowMs) ? null : currentHint,
                                        )
                                      }
                                      onPress={() => setBattleStatusHint(formatStatusDetail(effect, effectNowMs))}
                                      style={[styles.towerStatusIconBadge, getStatusToneBadgeStyle(effect.tone)]}
                                    >
                                      <MaterialCommunityIcons name={effect.icon} size={13} color="#ffe6bf" />
                                    </Pressable>
                                  ))}
                                </View>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      </View>
                      {activeTelegraph ? (
                        <View style={styles.liveBattleCallout}>
                          <Text style={styles.liveBattleCalloutLabel}>Telegraph</Text>
                          <Text style={styles.liveBattleCalloutTitle}>{activeTelegraph.enemyName}: {activeTelegraph.mechanic.split(":")[0]}</Text>
                          <Text style={styles.liveBattleCalloutBody}>
                            {awaitingNextEnemy
                              ? `${activeTelegraph.enemyName} is down. Read the lane, then advance when you're ready.`
                              : "Choose your turn. If your read is wrong, you eat the consequence."}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.liveBattleActionSection}>
                        <View style={styles.liveBattleSectionHead}>
                          <MaterialCommunityIcons name="sword-cross" size={15} color="#ffd58f" />
                          <Text style={styles.reqTitle}>Actions</Text>
                        </View>
                        <View style={styles.liveBattleActionRow}>
                          <Pressable
                            disabled={!isPlayerTurn || awaitingNextEnemy}
                            onPress={() => recordLiveBattleResponse("attack", "attack")}
                            onHoverIn={() =>
                              setBattleEffectHint(
                                currentEnemy && getPositionAttackBonus(currentEnemy, liveTowerBattle.position) > 0
                                  ? `Attack: Strike with your weapon. ${POSITION_LABELS[liveTowerBattle.position]} lane is a strong angle against ${currentEnemy.name}.`
                                  : "Attack: Strike the current target with your weapon.",
                              )
                            }
                            onHoverOut={() =>
                              setBattleEffectHint((currentHint) =>
                                currentHint === "Attack: Strike the current target with your weapon." ||
                                currentHint ===
                                  (currentEnemy && getPositionAttackBonus(currentEnemy, liveTowerBattle.position) > 0
                                    ? `Attack: Strike with your weapon. ${POSITION_LABELS[liveTowerBattle.position]} lane is a strong angle against ${currentEnemy.name}.`
                                    : "")
                                  ? null
                                  : currentHint,
                              )
                            }
                            onPressIn={() =>
                              setBattleEffectHint(
                                currentEnemy && getPositionAttackBonus(currentEnemy, liveTowerBattle.position) > 0
                                  ? `Attack: Strike with your weapon. ${POSITION_LABELS[liveTowerBattle.position]} lane is a strong angle against ${currentEnemy.name}.`
                                  : "Attack: Strike the current target with your weapon.",
                              )
                            }
                            style={[styles.liveBattleActionButton, styles.liveBattleActionButtonAttack, !isPlayerTurn ? styles.actionDisabled : null]}
                          >
                            <View style={styles.liveBattleActionButtonInner}>
                              <MaterialCommunityIcons name="sword-cross" size={15} color="#ffe6bf" />
                              <Text style={styles.liveBattleActionText}>Attack</Text>
                            </View>
                          </Pressable>
                          {(["front", "mid", "rear"] as TowerBattlePosition[]).map((position) => {
                            const positionBlocked = getEnemyBlockedPositions(currentEnemy).includes(position);
                            const positionHint =
                              describePositionRead(currentEnemy, position) ??
                              `Shift ${position[0].toUpperCase()}${position.slice(1)}: Reposition before the enemy acts.`;
                            return (
                            <Pressable
                              key={`tower-pos-${position}`}
                              disabled={!isPlayerTurn || awaitingNextEnemy || positionBlocked}
                              onPress={() => {
                                setLiveTowerBattle((current) => (current ? { ...current, position } : current));
                                recordLiveBattleResponse("move", position);
                              }}
                              style={[
                                styles.liveBattleActionButton,
                                styles.liveBattleActionButtonMove,
                                liveTowerBattle.position === position ? styles.liveBattleActionButtonActive : null,
                                !isPlayerTurn || awaitingNextEnemy || positionBlocked ? styles.actionDisabled : null,
                              ]}
                              onHoverIn={() => setBattleEffectHint(positionHint)}
                              onHoverOut={() =>
                                setBattleEffectHint((currentHint) =>
                                  currentHint === positionHint ? null : currentHint,
                                )
                              }
                              onPressIn={() => setBattleEffectHint(positionHint)}
                            >
                              <View style={styles.liveBattleActionButtonInner}>
                                <MaterialCommunityIcons
                                  name={position === "front" ? "sword" : position === "mid" ? "swap-horizontal" : "shield-sun-outline"}
                                  size={15}
                                  color="#ffe6bf"
                                />
                                <Text style={styles.liveBattleActionText}>Shift {position[0].toUpperCase()}{position.slice(1)}</Text>
                              </View>
                            </Pressable>
                          )})}
                        </View>
                      </View>
                      <Pressable
                        style={styles.liveBattleActionSection}
                        onHoverOut={() =>
                          setBattleEffectHint((currentHint) =>
                            currentHint === "Guard: Take less damage from the next enemy hit." ||
                            currentHint === "Pass: End your turn and let the enemy act." ||
                            currentHint === getBasicSkillHint("ability-warrior-iron-will") ||
                            currentHint === getBasicSkillHint("ability-warrior-steel-rhythm") ||
                            currentHint === getBasicSkillHint("ability-warrior-bulwark-oath") ||
                            currentHint === getBasicSkillHint("ability-warrior-bloodrush") ||
                            currentHint === getBasicSkillHint("ability-ranger-scout-path") ||
                            currentHint === getBasicSkillHint("ability-mage-arcane-surge")
                              ? null
                              : currentHint,
                          )
                        }
                      >
                        <View style={styles.liveBattleSectionHead}>
                          <MaterialCommunityIcons name="star-four-points-circle-outline" size={15} color="#9fe3ff" />
                          <Text style={styles.reqTitle}>Skills</Text>
                        </View>
                        <View style={styles.liveBattleActionRow}>
                          <Pressable
                            disabled={!isPlayerTurn || awaitingNextEnemy}
                            onPress={() => {
                              setLiveTowerBattle((current) => (current ? { ...current, braceUsed: true } : current));
                              recordLiveBattleResponse("brace", "brace");
                            }}
                            onHoverIn={() => setBattleEffectHint("Guard: Take less damage from the next enemy hit.")}
                            onPressIn={() => setBattleEffectHint("Guard: Take less damage from the next enemy hit.")}
                            style={[styles.liveBattleActionButton, styles.liveBattleActionButtonGuard, !isPlayerTurn || awaitingNextEnemy ? styles.actionDisabled : null]}
                          >
                            <View style={styles.liveBattleActionButtonInner}>
                              <MaterialCommunityIcons name="shield-outline" size={18} color="#ffe6bf" />
                              <Text style={styles.liveBattleActionText}>Guard</Text>
                            </View>
                          </Pressable>
                          {battleSkills.map((skill) => {
                            const profile = getLiveBattleSkillProfile(skill.id);
                            const skillAccent = getAbilityKindAccent(skill);
                            const cooldownRemainingMs = Math.max(0, (liveTowerBattle.skillCooldownEndsAtMsById?.[skill.id] ?? 0) - nowMs);
                            const activeEffect = profile ? visiblePlayerStatusFx.find((effect) => effect.id === profile.effectId) : null;
                            const skillReady =
                              isPlayerTurn &&
                              !battleFinished &&
                              !awaitingNextEnemy &&
                              cooldownRemainingMs <= 0;
                            const stateText =
                              activeEffect && activeEffect.expiresAtMs && activeEffect.expiresAtMs > effectNowMs
                                ? `Active ${formatRemainingDetailed(activeEffect.expiresAtMs - effectNowMs)}`
                                : cooldownRemainingMs > 0
                                  ? `CD ${formatRemainingDetailed(cooldownRemainingMs)}`
                                  : "Ready";
                            const skillArtSource = getAbilityArtSource(skill.id);
                            const hasSkillArt = Boolean(skillArtSource);
                            const skillHint = getBasicSkillHint(skill.id);
                            return (
                              <Pressable
                                key={`live-skill-${skill.id}`}
                                disabled={!skillReady}
                                onPress={() => {
                                  setLiveTowerBattle((current) => (current ? { ...current, skillUsed: true } : current));
                                  recordLiveBattleResponse("skill", skill.id);
                                }}
                                onHoverIn={() => setBattleEffectHint(skillHint)}
                                onPressIn={() => setBattleEffectHint(skillHint)}
                                style={[
                                  styles.liveBattleActionButton,
                                  getBattleSkillButtonTone(skill.id) === "defense"
                                    ? styles.liveBattleActionButtonSkillDefense
                                    : getBattleSkillButtonTone(skill.id) === "tempo"
                                      ? styles.liveBattleActionButtonSkillTempo
                                      : getBattleSkillButtonTone(skill.id) === "arcane"
                                        ? styles.liveBattleActionButtonSkillArcane
                                        : styles.liveBattleActionButtonSkillOffense,
                                  !skillReady ? styles.actionDisabled : null,
                                ]}
                              >
                                <View style={styles.liveBattleActionButtonInner}>
                                  <View
                                    style={[
                                      styles.liveBattleSkillPillIconWrap,
                                      hasSkillArt
                                        ? styles.liveBattleSkillPillIconWrapArt
                                        : {
                                            borderColor: skillAccent.border,
                                            backgroundColor: skillAccent.background,
                                          },
                                    ]}
                                  >
                                    {hasSkillArt ? (
                                      <Image
                                        fadeDuration={0}
                                        source={skillArtSource ?? undefined}
                                        style={styles.liveBattleSkillArt}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <MaterialCommunityIcons
                                        name={skill.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                        size={21}
                                        color={skillAccent.icon}
                                      />
                                    )}
                                    {activeEffect ? <View style={styles.liveBattleSkillActiveDot} /> : null}
                                  </View>
                                  <Text style={styles.liveBattleActionText}>{skill.name}</Text>
                                  {stateText !== "Ready" ? <Text style={styles.liveBattleSkillInlineState}>{stateText}</Text> : null}
                                </View>
                              </Pressable>
                            );
                          })}
                          <Pressable
                            disabled={!isPlayerTurn || awaitingNextEnemy}
                            onPress={() => recordLiveBattleResponse("pass", "pass")}
                            onHoverIn={() => setBattleEffectHint("Pass: End your turn and let the enemy act.")}
                            onPressIn={() => setBattleEffectHint("Pass: End your turn and let the enemy act.")}
                            style={[styles.liveBattleActionButton, styles.liveBattleActionButtonMove, !isPlayerTurn || awaitingNextEnemy ? styles.actionDisabled : null]}
                          >
                            <View style={styles.liveBattleActionButtonInner}>
                              <MaterialCommunityIcons name="skip-next-circle-outline" size={18} color="#ffe6bf" />
                              <Text style={styles.liveBattleActionText}>Pass</Text>
                            </View>
                          </Pressable>
                        </View>
                        <Text style={styles.liveBattleCommandHint}>{battleEffectHint ?? " "}</Text>
                      </Pressable>
                      <View style={styles.liveBattleActionSection}>
                        <View style={styles.liveBattleSectionHead}>
                          <MaterialCommunityIcons name="bag-personal-outline" size={15} color="#9effc4" />
                          <Text style={styles.reqTitle}>Items</Text>
                        </View>
                        <View style={styles.liveBattleItemRow}>
                          {Object.keys(liveTowerBattle.committedItems).length ? (
                            (Object.keys(liveTowerBattle.committedItems) as ItemId[]).map((itemId) => (
                              <Pressable
                                key={`live-battle-item-${itemId}`}
                                disabled={!isPlayerTurn || awaitingNextEnemy}
                                onPress={() => recordLiveBattleResponse("item", itemId)}
                                style={[styles.liveBattleItemButton, !isPlayerTurn || awaitingNextEnemy ? styles.actionDisabled : null]}
                              >
                                <GameItemIcon itemId={itemId} size={24} />
                                <View style={styles.liveBattleItemTextWrap}>
                                  <Text style={styles.liveBattleItemText}>{ITEM_BY_ID[itemId]?.name ?? itemId}</Text>
                                  <Text style={styles.liveBattleItemSubtext}>Battle Item</Text>
                                </View>
                              </Pressable>
                            ))
                          ) : (
                            <Text style={styles.questMeta}>No counter items committed for this wave.</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.liveBattlePlayerCard}>
                        <View style={styles.liveBattleCombatHead}>
                          <Image source={getAvatarSprite(character.avatarId, character.classId)} style={styles.liveBattlePlayerAvatar} resizeMode="cover" />
                          <View style={styles.liveBattleCombatText}>
                            <Text style={styles.liveBattleCombatLabel}>Adventurer</Text>
                            <Text style={styles.liveBattleCombatName}>{character.name}</Text>
                            <Text style={styles.liveBattleCombatMeta}>Current HP {liveTowerBattle.playerHp}/{character.healthCap}</Text>
                          </View>
                        </View>
                        {equippedBattleWeapon?.image ? (
                          <View style={styles.liveBattleWeaponRow}>
                            <View style={styles.liveBattleWeaponArtFrame}>
                              <Image source={equippedBattleWeapon.image} style={styles.liveBattleWeaponArt} resizeMode="contain" />
                            </View>
                            <View style={styles.liveBattleWeaponTextWrap}>
                              <Text style={styles.liveBattleWeaponLabel}>Equipped Weapon</Text>
                              <Text style={styles.liveBattleWeaponName}>{equippedBattleWeapon.name}</Text>
                              <Text
                                style={[
                                  styles.liveBattleWeaponGrade,
                                  { color: rarityColorMap[equippedBattleWeapon.rarity] },
                                  equippedBattleWeapon.rarity === "legendary" ? styles.legendaryTextGlow : null,
                                ]}
                              >
                                {equippedBattleWeapon.rarity.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        ) : null}
                        <HealthMeter
                          current={liveTowerBattle.playerHp}
                          max={character.healthCap}
                          title="Player HP"
                          meta={liveTowerBattle.lastEnemyDamage ? `Last hit taken: ${liveTowerBattle.lastEnemyDamage}` : "Live battle HP"}
                        />
                        <View style={styles.liveBattleCooldownCardSlim}>
                          <View style={styles.meterLabelRow}>
                            <Text style={styles.meterLabel}>Skill State</Text>
                            <Text style={styles.meterLabel}>
                              {primarySkillState?.activeRemainingMs
                                ? "ACTIVE"
                                : primarySkillState?.cooldownRemainingMs
                                  ? "COOLDOWN"
                                  : "READY"}
                            </Text>
                          </View>
                          <ProgressBar
                            value={
                              primarySkillState?.activeRemainingMs
                                ? primarySkillState.activeRemainingMs
                                : primarySkillState?.cooldownRemainingMs
                                  ? primarySkillState.cooldownRemainingMs
                                  : 1
                            }
                            max={
                              primarySkillState?.activeRemainingMs && primarySkillState.profile
                                ? primarySkillState.profile.cooldownSeconds * 1000
                                : primarySkillState?.cooldownRemainingMs && primarySkillState.skill
                                  ? primarySkillState.skill.cooldownSeconds * 1000
                                  : 1
                            }
                            variant="skill"
                          />
                        </View>
                        <View style={styles.waveBattleStatsRow}>
                          <View style={styles.liveBattleStatWrap}>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="sword-cross" size={13} color="#99dcff" />
                              <Text style={styles.waveBattleStatText}>ATK {liveTowerBattle.playerStats.damage}</Text>
                            </View>
                            {livePlayerAttackBonus > 0 ? <Text style={styles.liveBattleStatBonus}>+{livePlayerAttackBonus}</Text> : null}
                          </View>
                          <View style={styles.liveBattleStatWrap}>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="creation" size={13} color="#ffd58f" />
                              <Text style={styles.waveBattleStatText}>CRIT {liveTowerBattle.playerStats.critChance}%</Text>
                            </View>
                            {livePlayerCritBonus > 0 ? <Text style={styles.liveBattleStatBonus}>+{livePlayerCritBonus}%</Text> : null}
                          </View>
                          <View style={styles.liveBattleStatWrap}>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="run-fast" size={13} color="#9effc4" />
                              <Text style={styles.waveBattleStatText}>SPD {liveTowerBattle.playerStats.speed}</Text>
                            </View>
                            {livePlayerSpeedBonus > 0 ? <Text style={styles.liveBattleStatBonus}>+{livePlayerSpeedBonus}</Text> : null}
                          </View>
                        </View>
                        {playerEffectIcons.length ? (
                          <View style={styles.liveBattleStatusFxRow}>
                            {playerEffectIcons.map((effect) => (
                              (() => {
                                const accentAbilityId =
                                  "abilityId" in effect && typeof effect.abilityId === "string" ? effect.abilityId : null;
                                const statusArtSource = getAbilityArtSource(accentAbilityId);
                                return (
                                  <Pressable
                                    key={effect.key}
                                    onHoverIn={() => setBattleStatusHint(effect.detail)}
                                    onHoverOut={() => setBattleStatusHint((currentHint) => (currentHint === effect.detail ? null : currentHint))}
                                    onPress={() => setBattleStatusHint(effect.detail)}
                                    style={[
                                      styles.towerStatusIconBadge,
                                      accentAbilityId
                                        ? {
                                            borderColor: getAbilityAccent(accentAbilityId).border,
                                            backgroundColor: getAbilityAccent(accentAbilityId).background,
                                          }
                                        : getStatusToneBadgeStyle(effect.tone),
                                    ]}
                                  >
                                    {effect.kind === "item" && effect.itemId ? (
                                      <GameItemIcon itemId={effect.itemId} size={16} />
                                    ) : accentAbilityId && statusArtSource ? (
                                      <Image
                                        fadeDuration={0}
                                        source={statusArtSource}
                                        style={styles.liveBattleStatusArt}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <MaterialCommunityIcons
                                        name={"icon" in effect ? effect.icon : "star-four-points-circle-outline"}
                                        size={13}
                                        color={accentAbilityId ? getAbilityAccent(accentAbilityId).icon : "#ffe6bf"}
                                      />
                                    )}
                                  </Pressable>
                                );
                              })()
                            ))}
                          </View>
                        ) : null}
                        {battleStatusHint ? (
                          <Text style={styles.effectHintText}>{battleStatusHint}</Text>
                        ) : null}
                      </View>
                      <View style={styles.liveBattleLogCard}>
                        <Text style={styles.reqTitle}>Battle Log</Text>
                        <ScrollView style={styles.liveBattleLogScroll} contentContainerStyle={styles.liveBattleLogList} showsVerticalScrollIndicator={false}>
                          {liveTowerBattle.turnLog.map((line, index) => (
                            <View key={`live-log-${index}-${line}`} style={styles.liveBattleLogEntry}>
                              <View style={styles.liveBattleLogEntryDot} />
                              <Text style={styles.liveBattleLogEntryText}>{line}</Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </ScrollView>
                    {awaitingNextEnemy ? (
                      <Pressable onPress={advanceLiveBattleEnemy} style={styles.actionWrap}>
                        <View style={styles.claimButton}>
                          <Text style={styles.claimText}>Advance To Next Enemy</Text>
                        </View>
                      </Pressable>
                    ) : isPlayerTurn ? (
                      <Pressable onPress={resolveLiveTowerBattle} style={styles.actionWrap} disabled={!battleFinished}>
                        <View style={[styles.claimButton, !battleFinished ? styles.actionDisabled : null]}>
                          <Text style={styles.claimText}>{battleFinished ? (battleWon ? "Claim Victory" : "Accept Defeat") : "Battle In Progress"}</Text>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable onPress={playEnemyTurn} style={styles.actionWrap} disabled={enemyTurnAnimating}>
                        <View style={[styles.claimButton, enemyTurnAnimating ? styles.actionDisabled : null]}>
                          <Text style={styles.claimText}>{enemyTurnAnimating ? "Enemy Acting..." : "Resolve Enemy Turn"}</Text>
                        </View>
                      </Pressable>
                    )}
                    {!isPlayerTurn ? (
                      <View style={styles.liveBattleEnemyTurnMeterCard}>
                        <View style={styles.meterLabelRow}>
                          <Text style={styles.meterLabel}>Enemy Turn</Text>
                          <Text style={styles.meterLabel}>{enemyTurnAnimating ? `${enemyTurnMeter}%` : "Ready"}</Text>
                        </View>
                        <ProgressBar value={enemyTurnMeter} max={100} variant="time" />
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      ) : null}
      {waveResolveModal ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setWaveResolveModal(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              {(() => {
                const resolveFloor = towerFloors.find((floor) => floor.floorNumber === waveResolveModal.floorNumber);
                const resolveWaveRoster = resolveFloor?.enemyRoster
                  ? waveResolveModal.wave === "normal"
                    ? resolveFloor.enemyRoster.normal
                    : waveResolveModal.wave === "subBoss"
                      ? resolveFloor.enemyRoster.subBoss
                      : resolveFloor.enemyRoster.boss
                  : [];
                const battledEnemyIds = new Set((waveResolveModal.enemyBattles ?? []).map((battle) => battle.enemyId).filter(Boolean));
                const untouchedEnemies = resolveWaveRoster.filter((enemy) => !battledEnemyIds.has(enemy.id));
                return (
                  <>
              <View style={styles.encounterHead}>
                <View style={styles.encounterHeadLeft}>
                  <MaterialCommunityIcons name="sword-cross" size={20} color="#ffd58f" />
                  <Text style={[styles.resultTitle, waveResolveModal.success ? styles.ok : styles.fail]}>
                    {waveResolveModal.wave === "normal"
                      ? "Normal Wave"
                      : waveResolveModal.wave === "subBoss"
                        ? "Sub-Boss Wave"
                        : "Main Boss Wave"}
                  </Text>
                </View>
                <View style={[styles.encounterStatusPill, waveResolveModal.success ? styles.towerPhaseResultOk : styles.towerPhaseResultFail]}>
                  <Text style={styles.encounterStatusText}>{waveResolveModal.success ? "CLEARED" : "FAILED"}</Text>
                </View>
              </View>
              <ScrollView style={styles.waveResolveScroll} contentContainerStyle={styles.waveResolveScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.waveResolveMeterWrap}>
                  <HealthMeter current={character.health} max={character.healthCap} compact />
                </View>
                <View style={styles.waveResolveStatsRow}>
                  <View style={[styles.towerStatusFxChip, styles.towerStatusFxChipGood]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={12} color="#9effc4" />
                    <Text style={styles.towerStatusFxText}>Countered {waveResolveModal.countered}</Text>
                  </View>
                  <View style={[styles.towerStatusFxChip, styles.towerStatusFxChipBad]}>
                    <MaterialCommunityIcons name="alert-octagon-outline" size={12} color="#ffb1b1" />
                    <Text style={styles.towerStatusFxText}>Triggered {waveResolveModal.triggered}</Text>
                  </View>
                </View>
                {waveResolveModal.enemyBattles?.length ? (
                  <View style={styles.waveResolveBattleList}>
                    {(() => {
                      const battleCards = waveResolveModal.enemyBattles.map((battle, battleIndex) => {
                      const battleArt = battle.enemyId
                        ? getTowerEnemyArt({
                            id: battle.enemyId,
                            icon: battle.enemyIcon,
                            role: battle.enemyRole ?? waveResolveModal.wave,
                            level: battle.enemyLevel,
                            name: battle.enemyName,
                            health: battle.enemyHealth,
                            description: "",
                          })
                        : null;
                      return (
                        <View key={`wave-battle-${battle.enemyId ?? battle.enemyName}-${battleIndex}`} style={styles.waveBattleCard}>
                          <View style={styles.waveBattleHead}>
                            <View style={styles.waveBattleEnemyWrap}>
                              {battleArt ? (
                                <Image source={battleArt} style={styles.waveBattlePortrait} resizeMode="cover" />
                              ) : (
                                <View style={styles.waveBattlePortraitFallback}>
                                  <MaterialCommunityIcons
                                    name={battle.enemyIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={18}
                                    color="#ffd58f"
                                  />
                                </View>
                              )}
                              <View style={styles.waveBattleEnemyText}>
                                <Text style={styles.waveBattleEnemyName}>{battle.enemyName}</Text>
                                <Text style={styles.waveBattleEnemyMeta}>
                                  Lv {battle.enemyLevel} • {battle.enemyRole === "boss" ? "Main Boss" : battle.enemyRole === "subBoss" ? "Sub-Boss" : "Normal"}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.waveBattleIndexPill}>
                              <Text style={styles.waveBattleIndexText}>Enemy {battleIndex + 1}</Text>
                            </View>
                          </View>
                          <View style={styles.waveBattleHpWrap}>
                            <View style={styles.waveBattleHpHead}>
                              <Text style={styles.waveBattleHpLabel}>Enemy HP</Text>
                              <Text style={styles.waveBattleHpValue}>
                                {battle.enemyHealthRemaining}/{battle.enemyHealth}
                              </Text>
                            </View>
                            <View style={styles.waveBattleHpTrack}>
                              <View
                                style={[
                                  styles.waveBattleHpFill,
                                  battle.defeated ? styles.waveBattleHpFillDefeated : null,
                                  !battle.defeated
                                    ? { width: `${Math.max(6, Math.round((battle.enemyHealthRemaining / battle.enemyHealth) * 100))}%` }
                                    : null,
                                ]}
                              />
                              <View style={battle.defeated ? styles.waveBattleHpDefeatedPill : styles.waveBattleHpStandingPill}>
                                <Text style={styles.waveBattleHpDefeatedText}>{battle.defeated ? "Defeated" : "Still Standing"}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.waveBattleStatsRow}>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="heart-pulse" size={13} color="#ffadb7" />
                              <Text style={styles.waveBattleStatText}>HP {battle.enemyHealth}</Text>
                            </View>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="timeline-clock-outline" size={13} color="#ffd58f" />
                              <Text style={styles.waveBattleStatText}>{battle.turnsToDefeat} turns</Text>
                            </View>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="sword-cross" size={13} color="#99dcff" />
                              <Text style={styles.waveBattleStatText}>{battle.playerDamagePerTurn}/turn</Text>
                            </View>
                            <View style={styles.waveBattleStatChip}>
                              <MaterialCommunityIcons name="heart-minus" size={13} color="#ffb1b1" />
                              <Text style={styles.waveBattleStatText}>-{battle.damageTaken} HP</Text>
                            </View>
                          </View>
                          <View style={styles.waveBattleTimeline}>
                            {battle.events.map((event, eventIndex) => (
                              <View
                                key={`wave-battle-event-${battle.enemyName}-${event.mechanic}-${eventIndex}`}
                                style={[
                                  styles.waveBattleEventCard,
                                  event.positive ? styles.waveBattleEventCardGood : styles.waveBattleEventCardBad,
                                ]}
                              >
                                <View style={styles.waveBattleEventHead}>
                                  <View style={[styles.effectStepBadge, event.positive ? styles.effectStepBadgeGood : styles.effectStepBadgeBad]}>
                                    <Text style={styles.effectStepBadgeText}>{eventIndex + 1}</Text>
                                  </View>
                                  <MaterialCommunityIcons
                                    name={event.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={14}
                                    color={event.positive ? "#9effc4" : "#ffb1b1"}
                                  />
                                  <Text style={styles.waveBattleEventTitle}>{event.mechanic}</Text>
                                  <View
                                    style={[
                                      styles.effectResultPill,
                                      event.positive ? styles.effectResultPillCountered : styles.effectResultPillTriggered,
                                    ]}
                                  >
                                    <Text style={styles.effectResultText}>{event.positive ? "ADVANTAGE" : "IMPACT"}</Text>
                                  </View>
                                </View>
                                <Text style={styles.waveBattleEventBody}>{event.resultText}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                      });
                      const untouchedCards = untouchedEnemies.map((enemy, index) => (
                        <View key={`wave-battle-untouched-${enemy.id}-${index}`} style={[styles.waveBattleCard, styles.waveBattleCardUnengaged]}>
                          <View style={styles.waveBattleHead}>
                            <View style={styles.waveBattleEnemyWrap}>
                              {getTowerEnemyArt(enemy) ? (
                                <Image source={getTowerEnemyArt(enemy)} style={styles.waveBattlePortrait} resizeMode="cover" />
                              ) : (
                                <View style={styles.waveBattlePortraitFallback}>
                                  <MaterialCommunityIcons
                                    name={enemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                    size={18}
                                    color="#ffd58f"
                                  />
                                </View>
                              )}
                              <View style={styles.waveBattleEnemyText}>
                                <Text style={styles.waveBattleEnemyName}>{enemy.name}</Text>
                                <Text style={styles.waveBattleEnemyMeta}>
                                  Lv {enemy.level} • Unengaged
                                </Text>
                              </View>
                            </View>
                            <View style={styles.waveBattleIndexPill}>
                              <Text style={styles.waveBattleIndexText}>Enemy {(waveResolveModal.enemyBattles?.length ?? 0) + index + 1}</Text>
                            </View>
                          </View>
                          <View style={styles.waveBattleHpWrap}>
                            <View style={styles.waveBattleHpHead}>
                              <Text style={styles.waveBattleHpLabel}>Enemy HP</Text>
                              <Text style={styles.waveBattleHpValue}>
                                {(enemy.health ?? 1)}/{enemy.health ?? 1}
                              </Text>
                            </View>
                            <View style={styles.waveBattleHpTrack}>
                              <View style={[styles.waveBattleHpFill, styles.waveBattleHpFillFull]} />
                              <View style={styles.waveBattleHpStandingPill}>
                                <Text style={styles.waveBattleHpDefeatedText}>Unengaged</Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.waveBattleUnengagedText}>The lane never broke far enough to reach this enemy.</Text>
                        </View>
                      ));
                      return [...battleCards, ...untouchedCards];
                    })()}
                  </View>
                ) : (
                  <View style={styles.waveResolveLog}>
                    {waveResolveModal.lines.slice(0, 5).map((line, idx) => (
                      <View key={`wave-modal-line-${idx}`} style={styles.waveEventRow}>
                        <MaterialCommunityIcons
                          name={classifyWaveLine(line).icon}
                          size={12}
                          color={classifyWaveLine(line).color}
                        />
                        <Text style={styles.waveEventText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
              <Pressable
                onPress={() => {
                  const collapseMessage = waveResolveModal.collapsed ? waveResolveModal.collapseMessage : null;
                  setWaveResolveModal(null);
                  if (collapseMessage) {
                    setTowerCollapseAftermath({
                      title: "The Tower Casts You Out",
                      message: collapseMessage,
                    });
                  }
                }}
                style={styles.actionWrap}
              >
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>{waveResolveModal.collapsed ? "Ready" : "Continue"}</Text>
                </View>
              </Pressable>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      ) : null}
      {towerCollapseAftermath ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setTowerCollapseAftermath(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <View style={styles.encounterHead}>
                <View style={styles.encounterHeadLeft}>
                  <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#ffb1b1" />
                  <Text style={[styles.resultTitle, styles.fail]}>{towerCollapseAftermath.title}</Text>
                </View>
                <View style={[styles.encounterStatusPill, styles.towerPhaseResultFail]}>
                  <Text style={styles.encounterStatusText}>FRACTURED</Text>
                </View>
              </View>
              <Text style={styles.outcomeText}>{towerCollapseAftermath.message}</Text>
              <Pressable onPress={() => setTowerCollapseAftermath(null)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Hold Steady</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {floorLoreOpenFor !== null ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFloorLoreOpenFor(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <View style={styles.infoModalHead}>
                <View style={styles.infoModalHeadLeft}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#ffd58f" />
                  <Text style={styles.infoModalTitle}>
                    {FLOOR_ENTRY_LORE[floorLoreOpenFor]?.title ?? `Floor ${floorLoreOpenFor} Briefing`}
                  </Text>
                </View>
                <Pressable onPress={() => setFloorLoreOpenFor(null)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
                </Pressable>
              </View>
              <Text style={styles.outcomeText}>
                {FLOOR_ENTRY_LORE[floorLoreOpenFor]?.body ??
                  "The Tower shifts every run. Study the lane pressure and decide how to spend your supplies."}
              </Text>
              <View style={styles.dualActionRow}>
                <Pressable onPress={() => setFloorLoreOpenFor(null)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceRefuseButton]}>
                    <Text style={styles.dialogChoiceText}>Close</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => handleContinueFloorFromLore(floorLoreOpenFor)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceAcceptButton]}>
                    <Text style={styles.dialogChoiceText}>Continue</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {selectedTowerEnemy ? (
        (() => {
          const enemyKnown = (character.knownTowerEnemyIds ?? []).includes(selectedTowerEnemy.id);
          const enemyFloorNumber = getTowerEnemyFloorNumber(selectedTowerEnemy.id);
          const enemyIntelUnlocked = enemyFloorNumber ? hasFloorIntel(enemyFloorNumber) || character.towerProgress.highestFloorCleared >= enemyFloorNumber : enemyKnown;
          const enemyHpVisible = character.progression.level >= selectedTowerEnemy.level || enemyIntelUnlocked;
          const enemyRoleLabel =
            selectedTowerEnemy.role === "boss"
              ? "Main Boss"
              : selectedTowerEnemy.role === "subBoss"
                ? "Sub-Boss"
                : "Normal Enemy";
          const enemyCombatIntelUnlocked = enemyKnown || enemyIntelUnlocked;
          const usesTightCreaturePortrait = ["f1-ash-rat", "f1-dust-crawler"].includes(selectedTowerEnemy.id);
          const usesRatPortrait = selectedTowerEnemy.id === "f1-ash-rat";
          return (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTowerEnemy(null)}
        >
          <View style={styles.resultOverlay}>
            <View style={[styles.resultModal, styles.enemyDossierModal]}>
              <ScrollView
                style={styles.enemyDossierScroll}
                contentContainerStyle={styles.enemyDossierScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {Platform.OS !== "web" && towerEnemyArtExpanded && getTowerEnemyArt(selectedTowerEnemy) ? (
                <Pressable style={styles.enemyArtOverlayInline} onPress={() => setTowerEnemyArtExpanded(false)}>
                  <View style={styles.enemyArtLightbox}>
                    <Image
                      source={getTowerEnemyArt(selectedTowerEnemy)}
                      style={styles.enemyArtLightboxImage}
                      resizeMode="contain"
                    />
                    <View style={styles.enemyArtLightboxCaption}>
                      <Text style={styles.enemyArtLightboxTitle}>{selectedTowerEnemy.name}</Text>
                      <Text style={styles.enemyArtLightboxHint}>Tap anywhere to close</Text>
                    </View>
                  </View>
                </Pressable>
              ) : null}
              <View style={styles.enemyDossierOrnamentTop}>
                <MaterialCommunityIcons name="diamond-stone" size={13} color="#f3cf83" />
                <Text style={styles.enemyDossierKicker}>Guild Bestiary Dossier</Text>
                <MaterialCommunityIcons name="diamond-stone" size={13} color="#f3cf83" />
              </View>
              {getTowerEnemyArt(selectedTowerEnemy) ? (
                <Pressable style={styles.enemyModalPortrait} onPress={() => setTowerEnemyArtExpanded(true)}>
                  <View style={styles.enemyModalPortraitFrame}>
                    <Image
                      source={getTowerEnemyArt(selectedTowerEnemy)}
                      style={[
                        styles.enemyModalPortraitImage,
                        usesTightCreaturePortrait ? styles.enemyModalPortraitImageTight : null,
                        usesRatPortrait ? styles.enemyModalPortraitImageRat : null,
                      ]}
                      resizeMode={usesTightCreaturePortrait ? "cover" : "contain"}
                    />
                  </View>
                  <View style={styles.enemyPortraitTapHint}>
                    <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="#f7dfad" />
                    <Text style={styles.enemyPortraitTapHintText}>Tap to expand</Text>
                  </View>
                </Pressable>
              ) : null}
              <Text style={[styles.resultTitle, styles.enemyDossierTitle]}>{selectedTowerEnemy.name}</Text>
              <View style={styles.enemyMetaRow}>
                <View style={styles.enemyMetaChip}>
                  <View style={styles.enemyModalThumbWrap}>
                    {getTowerEnemyArt(selectedTowerEnemy) ? (
                      <Image source={getTowerEnemyArt(selectedTowerEnemy)} style={styles.enemyModalThumbImage} resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons
                        name={selectedTowerEnemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={16}
                        color="#ffd27d"
                      />
                    )}
                  </View>
                  <Text style={styles.enemyMetaText}>Lv {selectedTowerEnemy.level}</Text>
                </View>
                <View style={styles.enemyMetaChip}>
                  <MaterialCommunityIcons name="heart-pulse" size={14} color="#ff9aa5" />
                  <Text style={styles.enemyMetaText}>{enemyHpVisible ? `HP ${selectedTowerEnemy.health}` : "HP ???/???"}</Text>
                </View>
                <View style={styles.enemyMetaChip}>
                  <MaterialCommunityIcons name="information-outline" size={14} color="#8ec8ff" />
                  <Text style={styles.enemyMetaText}>{enemyRoleLabel}</Text>
                </View>
              </View>
              <View style={styles.enemyDossierLoreCard}>
                <Text style={styles.enemyDossierSectionTitle}>Field Notes</Text>
                <Text style={styles.outcomeText}>{selectedTowerEnemy.description}</Text>
              </View>
              {selectedTowerEnemy.lore ? (
                <View style={styles.enemyDossierLoreCard}>
                  <Text style={styles.enemyDossierSectionTitle}>Lore</Text>
                  <Text style={styles.enemyDossierLoreText}>{selectedTowerEnemy.lore}</Text>
                </View>
              ) : null}
              {enemyIntelUnlocked && ((selectedTowerEnemy.weaknessNotes?.length ?? 0) > 0 || (selectedTowerEnemy.weaknessItemIds?.length ?? 0) > 0) ? (
                <View style={styles.enemyDossierLoreCard}>
                  <Text style={styles.enemyDossierSectionTitle}>Weaknesses</Text>
                  {selectedTowerEnemy.weaknessNotes?.map((note) => (
                    <View key={`${selectedTowerEnemy.id}-${note}`} style={styles.enemyWeaknessRow}>
                      <MaterialCommunityIcons name="target-variant" size={13} color="#9fe0b3" />
                      <Text style={styles.enemyDossierLoreText}>{note}</Text>
                    </View>
                  ))}
                  {selectedTowerEnemy.weaknessItemIds?.length ? (
                    <View style={styles.enemyWeaknessItemRow}>
                      {selectedTowerEnemy.weaknessItemIds.map((itemId) => (
                        <Pressable
                          key={`${selectedTowerEnemy.id}-weakness-item-${itemId}`}
                          style={styles.enemyWeaknessItemChip}
                          onPress={() => showQuickInfo(getItemDisplayName(itemId), getItemDisplayDescription(itemId), getItemDisplayRarity(itemId), itemId)}
                        >
                          <GameItemIcon itemId={itemId} size={18} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
              {enemyCombatIntelUnlocked && selectedTowerEnemy.positioning ? (
                <View style={styles.enemyDossierLoreCard}>
                  <Text style={styles.enemyDossierSectionTitle}>Positioning</Text>
                  {selectedTowerEnemy.positioning.note ? (
                    <Text style={styles.enemyDossierLoreText}>{selectedTowerEnemy.positioning.note}</Text>
                  ) : null}
                  {selectedTowerEnemy.positioning.advantagePositions?.length ? (
                    <View style={styles.enemyWeaknessRow}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={13} color="#9fe0b3" />
                      <Text style={styles.enemyDossierLoreText}>
                        Strong angle: {selectedTowerEnemy.positioning.advantagePositions.map((position) => POSITION_LABELS[position]).join(", ")}
                      </Text>
                    </View>
                  ) : null}
                  {selectedTowerEnemy.positioning.blockedPositions?.length ? (
                    <View style={styles.enemyWeaknessRow}>
                      <MaterialCommunityIcons name="block-helper" size={13} color="#ffb1a4" />
                      <Text style={styles.enemyDossierLoreText}>
                        Closed lane: {selectedTowerEnemy.positioning.blockedPositions.map((position) => POSITION_LABELS[position]).join(", ")}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {enemyCombatIntelUnlocked ? (
                selectedTowerEnemy.mechanics && selectedTowerEnemy.mechanics.length > 0 ? (
                  <View style={[styles.requirementsBlock, styles.enemyDossierMechanicsBlock]}>
                    <Text style={styles.reqTitle}>Mechanics</Text>
                    {selectedTowerEnemy.mechanics.map((mechanic) => (
                      <View key={`${selectedTowerEnemy.id}-${mechanic}`} style={[styles.reqItem, styles.enemyDossierMechanicItem]}>
                        <MaterialCommunityIcons name="star-four-points-outline" size={12} color="#ffd27d" />
                        <Text style={styles.reqText}>{mechanic}</Text>
                      </View>
                    ))}
                  </View>
                ) : null
              ) : (
                <View style={styles.enemyIntelLocked}>
                  <MaterialCommunityIcons name="eye-off-outline" size={18} color="#d3b27f" />
                  <Text style={styles.questMeta}>
                    Combat intel locked. Encounter this enemy once in battle to reveal its mechanics.
                  </Text>
                </View>
              )}
              <Pressable onPress={() => setSelectedTowerEnemy(null)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
          );
        })()
      ) : null}
      {Platform.OS === "web" && selectedTowerEnemy && towerEnemyArtExpanded && getTowerEnemyArt(selectedTowerEnemy) ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setTowerEnemyArtExpanded(false)}
        >
          <Pressable style={styles.enemyArtOverlayWeb} onPress={() => setTowerEnemyArtExpanded(false)}>
            <View style={styles.enemyArtLightbox}>
              <Image
                source={getTowerEnemyArt(selectedTowerEnemy)}
                style={styles.enemyArtLightboxImage}
                resizeMode="contain"
              />
              <View style={styles.enemyArtLightboxCaption}>
                <Text style={styles.enemyArtLightboxTitle}>{selectedTowerEnemy.name}</Text>
                <Text style={styles.enemyArtLightboxHint}>Click anywhere to close</Text>
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {rescueDialogOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setRescueDialogOpen(false)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.14)", "rgba(96, 64, 154, 0.1)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile(RESCUE_REQUEST_NPC_PROFILE.id)?.avatarOverride ??
                    getAvatarSprite(RESCUE_REQUEST_NPC_PROFILE.avatarId, RESCUE_REQUEST_NPC_PROFILE.classId)
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Aldric Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                {rescueNpcStatus === "refused_once"
                  ? "\"Please... one last time. If you walk away again, I go alone. My daughter is still alive. Help me bring her home.\""
                  : "\"Bandits took my daughter at dusk near Watchtrail. I need a capable adventurer right now.\""}
              </Text>
              <View style={styles.dualActionRow}>
                {aldricChoices.map((choice) => (
                  <Pressable key={choice.label} onPress={() => handleRescueNpcChoice(choice.accept)} style={styles.dualActionButton}>
                    <View style={[styles.dialogChoiceButton, choice.accept ? styles.dialogChoiceAcceptButton : styles.dialogChoiceRefuseButton]}>
                      <Text style={styles.dialogChoiceText}>{choice.label}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "bran-store" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.14)", "rgba(96, 64, 154, 0.1)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={branProfile?.avatarOverride ?? getAvatarSprite("ranger-3", "ranger")}
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Quartermaster Bran</Text>
              </View>
              <Text style={styles.outcomeText}>{`"${branDialogLine}"`}</Text>
              <View style={styles.dualActionRow}>
                <Pressable onPress={() => handleBranDialogChoice(false)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceRefuseButton]}>
                    <Text style={styles.dialogChoiceText}>Maybe Later</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => handleBranDialogChoice(true)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceAcceptButton]}>
                    <Text style={styles.dialogChoiceText}>Open Guild Store</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "examiner-rank" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.14)", "rgba(96, 64, 154, 0.1)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={rankExaminerProfile.avatarOverride ?? getAvatarSprite(rankExaminerProfile.avatarId, rankExaminerProfile.classId)}
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Examiner {rankExaminerProfile.name}</Text>
              </View>
              <Text style={styles.outcomeText}>{`"${examinerDialogLine}"`}</Text>
              {rankTrial && !examinerReadyForTrial ? (
                <Text style={styles.questMeta}>{rankTrialAccess.reason ?? "Complete your requirements, then return."}</Text>
              ) : null}
              {rankTrial && !examinerReadyForTrial ? (
                <Pressable onPress={() => handleExaminerDialogChoice(false)} style={styles.actionWrap}>
                  <View style={styles.claimButton}>
                    <Text style={styles.claimText}>Understood. I'll Return.</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.dualActionRow}>
                  <Pressable onPress={() => handleExaminerDialogChoice(false)} style={styles.dualActionButton}>
                    <View style={[styles.dialogChoiceButton, styles.dialogChoiceRefuseButton]}>
                      <Text style={styles.dialogChoiceText}>{rankTrial ? "Maybe Later" : "Understood"}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleExaminerDialogChoice(true)}
                    style={styles.dualActionButton}
                    disabled={!rankTrial}
                  >
                    <View style={[styles.dialogChoiceButton, styles.dialogChoiceAcceptButton, !rankTrial ? styles.actionDisabled : null]}>
                      <Text style={styles.dialogChoiceText}>{rankTrial ? "Open Trial Desk" : "No Trial Available"}</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "tamsin-floor2" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(125, 186, 119, 0.12)", "rgba(84, 117, 171, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile("npc-tamsin-vale")?.avatarOverride ??
                    getAvatarSprite("ranger-2", "ranger")
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Tamsin Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                "Thorn Corridor is where clean plans start catching.
              </Text>
              <View style={styles.dialogInlineRequestWrap}>
                <Text style={styles.outcomeText}>I need a snapped </Text>
                <View style={styles.dialogInlineIconToken}>
                  <MaterialCommunityIcons name="hook" size={15} color="#f1dfbb" />
                  <Text style={styles.dialogInlineIconText}>snagline</Text>
                </View>
                <Text style={styles.outcomeText}> and the </Text>
                <View style={styles.dialogInlineIconToken}>
                  <MaterialCommunityIcons name="bag-personal-outline" size={15} color="#f1dfbb" />
                  <Text style={styles.dialogInlineIconText}>satchel</Text>
                </View>
                <Text style={styles.outcomeText}> tied to it brought back from the briar lanes.</Text>
              </View>
              <Text style={styles.outcomeText}>
                If you take my contract, tell me what kind of runner I'm sending in."
              </Text>
              <View style={styles.dialogChoiceStack}>
                {tamsinChoices.map((choice) => (
                  <Pressable key={choice.id} onPress={() => handleTamsinDialogChoice(choice.id)} style={styles.actionWrap}>
                    <View style={[styles.dialogChoiceButton, choice.id === "steady" ? styles.dialogChoiceAcceptButton : styles.dialogChoiceRefuseButton]}>
                      <Text style={styles.dialogChoiceTitle}>{choice.label}</Text>
                      <Text style={styles.dialogChoiceBody}>
                        {choice.id === "steady"
                          ? "Treat the lane like route work first. Tamsin will read you as steady and professional."
                          : "Take the contract, but show her coin is the first thing on your mind. She will remember it."}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "tamsin-followup" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(125, 186, 119, 0.12)", "rgba(84, 117, 171, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile("npc-tamsin-vale")?.avatarOverride ??
                    getAvatarSprite("ranger-2", "ranger")
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Tamsin Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                "You brought back the lane record instead of feeding it to the thorns."
              </Text>
              <View style={styles.dialogInlineRequestWrap}>
                <Text style={styles.outcomeText}>The snapped </Text>
                <View style={styles.dialogInlineIconToken}>
                  <MaterialCommunityIcons name="hook" size={15} color="#f1dfbb" />
                  <Text style={styles.dialogInlineIconText}>snagline</Text>
                </View>
                <Text style={styles.outcomeText}> told me where the pull started, and the recovered </Text>
                <View style={styles.dialogInlineIconToken}>
                  <MaterialCommunityIcons name="bag-personal-outline" size={15} color="#f1dfbb" />
                  <Text style={styles.dialogInlineIconText}>satchel</Text>
                </View>
                <Text style={styles.outcomeText}> told me what the lane tried to keep."</Text>
              </View>
              <Text style={styles.outcomeText}>
                {storyState.thornRunnerIntroductionChoice === "mercenary"
                  ? "\"You earned the pay. I'll hand over the useful notes too, but don't mistake that for trust.\""
                  : "\"That kind of recovery keeps runners alive. Take the notes. Floor 2: Thorn Corridor punishes people who walk in blind.\""}
              </Text>
              <Pressable onPress={handleTamsinFollowup} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Record Tamsin's Notes</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "tamsin-corridor-report" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(125, 186, 119, 0.12)", "rgba(84, 117, 171, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile("npc-tamsin-vale")?.avatarOverride ??
                    getAvatarSprite("ranger-2", "ranger")
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Tamsin Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                "Now give me the part the board contract could not."
              </Text>
              <Text style={styles.outcomeText}>
                "Tell me what Floor 2: Thorn Corridor actually did to you once you were inside it. Where did it slow you down? Where did it force you to spend recovery you thought you could save?"
              </Text>
              <Text style={styles.outcomeText}>
                {storyState.thornRunnerIntroductionChoice === "mercenary"
                  ? "\"You brought back the feel of Floor 2: Thorn Corridor, not just a payout. That earns you more of my route ledger than I expected.\""
                  : "\"That is the kind of report that keeps runners alive. I'll open more of my route ledger before Floor 2 closes its grip on the next climber.\""}
              </Text>
              <Pressable onPress={handleTamsinCorridorReport} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>File First Corridor Report</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "tamsin-deep-warning" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(186, 125, 119, 0.12)", "rgba(120, 97, 171, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile("npc-tamsin-vale")?.avatarOverride ??
                    getAvatarSprite("ranger-2", "ranger")
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Tamsin Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                "The deeper stretch you opened in Floor 2 changed how the whole corridor behaves."
              </Text>
              <Text style={styles.outcomeText}>
                "Past the execution stretch, the roots stop moving like a simple trap. They start turning, pulling, and closing in as if they are obeying something deeper below."
              </Text>
              <Text style={styles.outcomeText}>
                {storyState.thornRunnerIntroductionChoice === "mercenary"
                  ? "\"Call it what you like, but don't step deeper into Floor 2 expecting another brute with more thorns on it. Bring warding, keep your footing, and assume the floor is judging every mistake now.\""
                  : "\"I'm marking this because it matters: what waits deeper in Floor 2 is not just another thorn beast. Keep your footing, keep warding close, and do not let the floor set the pace of the fight for you.\""}
              </Text>
              <Pressable onPress={handleTamsinDeepWarning} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Log Deeper Corridor Warning</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {guildDialog === "tamsin-floor2-aftermath" ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setGuildDialog(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(222, 176, 98, 0.14)", "rgba(103, 132, 186, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <View style={styles.npcDialogHero}>
                <Image
                  source={
                    getNpcDialogProfile("npc-tamsin-vale")?.avatarOverride ??
                    getAvatarSprite("ranger-2", "ranger")
                  }
                  style={styles.npcDialogHeroAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.npcDialogHeroName}>Tamsin Vale</Text>
              </View>
              <Text style={styles.outcomeText}>
                {!storyState.thornRunnerIntroductionChoice
                  ? "\"You cleared Floor 2 before you ever took my route briefing. Fine. Then hear this part now, while the floor is still fresh in your blood.\""
                  : "\"Floor 2 is done. Stop and hear what that actually means before you treat it like one more mark on the board.\""}
              </Text>
              <Text style={styles.outcomeText}>
                {!storyState.thornRunnerIntroductionChoice
                  ? "\"People can stumble through Floor 1 and still look lucky. Floor 2: Thorn Corridor is where the guild starts deciding whether a climber can come back from a floor built to slow them, bleed them, and make them panic.\""
                  : "\"People survive Floor 1 and still look lucky. Thorn Corridor is where the guild starts deciding whether a climber can come back from a floor built to slow them, bleed them, and make them panic.\""}
              </Text>
              <Text style={styles.outcomeText}>
                {!storyState.thornRunnerIntroductionChoice
                  ? "\"You came back from it without my route help. That changes the read. It means I start from what you proved in the lane, not from what I hoped to teach you before you went in.\""
                  : storyState.thornRunnerIntroductionChoice === "mercenary"
                  ? "\"You still came back alive from the first real snare, and the hall noticed. Bran prices you differently now. The examiner watches you differently too. That is what a real floor clear changes.\""
                  : "\"You did more than live through it. You brought back a clear from the first floor that truly tries to hold people in place and wear them down. The hall notices that. So do I.\""}
              </Text>
              <Pressable onPress={handleTamsinFloorTwoAftermath} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close Thorn Corridor Ledger</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {aldricBattleOpen && activeQuest?.questId === SPECIAL_RESCUE_QUEST_ID ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(179, 77, 62, 0.15)", "rgba(91, 50, 123, 0.08)", "rgba(25, 18, 41, 0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <Text style={[styles.resultTitle, styles.ok]}>Watchtrail Rescue Operation</Text>
              <Text style={styles.resultChance}>Hold the line through both bandit waves to reach Aldric's daughter in time.</Text>
              <View style={styles.questCriticalTimerHero}>
                <Text style={styles.questCriticalTimerLabel}>Encounter Timer</Text>
                <Text style={styles.questCriticalTimerValue}>{formatRemainingDetailed(remainingMs)}</Text>
              </View>
              <View style={styles.questMeterBlock}>
                <View style={styles.meterLabelRow}>
                  <Text style={styles.meterLabel}>Battle Flow</Text>
                  <Text style={styles.meterLabel}>{Math.round(aldricBattleFlowRatio * 100)}%</Text>
                </View>
                <ProgressBar value={aldricBattleFlowRatio * 100} max={100} variant="chance" />
              </View>
              <View style={styles.waveResolveLog}>
                <View style={styles.meterLabelRow}>
                  <Text style={styles.meterLabel}>Field Report</Text>
                  <Text style={styles.meterLabel}>
                    {isQuestReadyToClaim
                      ? "Finalized"
                      : aldricBattleRevealCount <= 0
                        ? "Ingress"
                        : aldricBattleRevealCount === 1
                          ? "Wave 1"
                          : "Wave 2"}
                  </Text>
                </View>
                <Text style={styles.questMeta}>{aldricBattleStatusText}</Text>
              </View>
              <View style={styles.waveResolveBattleList}>
                {(() => {
                  let revealCursor = 0;
                  return ALDRIC_SPECIAL_BATTLES.map((battle, battleIndex) => {
                    const battleRevealStart = revealCursor;
                    const battleVisible = aldricBattleRevealStepCount > battleRevealStart;
                    revealCursor += 1;
                    const revealedEventCount = Math.max(
                      0,
                      Math.min(battle.events.length, aldricBattleRevealStepCount - revealCursor),
                    );
                    revealCursor += battle.events.length;
                    if (!battleVisible) {
                      return null;
                    }
                    const battleProgress = Math.max(
                      0,
                      Math.min(1, (aldricBattleRevealStepCount - battleRevealStart) / (battle.events.length + 1)),
                    );
                    const battleCleared = battleProgress >= 1 || isQuestReadyToClaim;
                    const enemyCurrentHp = battleCleared
                      ? 0
                      : Math.max(1, Math.round(battle.enemyHealth * (1 - battleProgress)));
                    return (
                      <View key={`aldric-battle-${battle.enemyId}-${battleIndex}`} style={styles.waveBattleCard}>
                        <View style={styles.waveBattleHead}>
                          <View style={styles.waveBattleEnemyWrap}>
                            <Image
                              source={getAvatarSprite(battle.avatarId, battle.classId)}
                              style={styles.waveBattlePortrait}
                              resizeMode="cover"
                            />
                            <View style={styles.waveBattleEnemyText}>
                              <Text style={styles.waveBattleEnemyName}>{battle.enemyName}</Text>
                              <Text style={styles.waveBattleEnemyMeta}>
                                {battle.waveLabel} • Lv {battle.enemyLevel} • {battle.enemyRole === "boss" ? "Bandit Leader" : "Lackey"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.waveBattleIndexPill}>
                            <Text style={styles.waveBattleIndexText}>Enemy {battleIndex + 1}</Text>
                          </View>
                        </View>
                        <View style={styles.waveBattleHpWrap}>
                          <View style={styles.waveBattleHpHead}>
                            <Text style={styles.waveBattleHpLabel}>Enemy HP</Text>
                            <Text style={styles.waveBattleHpValue}>
                              {enemyCurrentHp}/{battle.enemyHealth}
                            </Text>
                          </View>
                          <View style={styles.waveBattleHpTrack}>
                            <View
                              style={[
                                styles.waveBattleHpFill,
                                battleCleared ? styles.waveBattleHpFillDefeated : null,
                                { width: `${battleCleared ? 100 : Math.max(6, battleProgress * 100)}%` },
                              ]}
                            />
                            {battleCleared ? (
                              <View style={styles.waveBattleHpDefeatedPill}>
                                <Text style={styles.waveBattleHpDefeatedText}>Defeated</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.waveBattleStatsRow}>
                          <View style={styles.waveBattleStatChip}>
                            <MaterialCommunityIcons name="heart-pulse" size={13} color="#ffadb7" />
                            <Text style={styles.waveBattleStatText}>HP {battle.enemyHealth}</Text>
                          </View>
                          <View style={styles.waveBattleStatChip}>
                            <MaterialCommunityIcons name="timeline-clock-outline" size={13} color="#ffd58f" />
                            <Text style={styles.waveBattleStatText}>{battle.turnsToDefeat} turns</Text>
                          </View>
                          <View style={styles.waveBattleStatChip}>
                            <MaterialCommunityIcons name="sword-cross" size={13} color="#99dcff" />
                            <Text style={styles.waveBattleStatText}>{battle.playerDamagePerTurn}/turn</Text>
                          </View>
                          <View style={styles.waveBattleStatChip}>
                            <MaterialCommunityIcons name="heart-minus" size={13} color="#ffb1b1" />
                            <Text style={styles.waveBattleStatText}>-{battle.damageTaken} HP</Text>
                          </View>
                        </View>
                        <View style={styles.waveBattleTimeline}>
                          {battle.events.slice(0, revealedEventCount).map((event, eventIndex) => (
                            <View
                              key={`aldric-battle-event-${battle.enemyId}-${event.mechanic}-${eventIndex}`}
                              style={[
                                styles.waveBattleEventCard,
                                event.positive ? styles.waveBattleEventCardGood : styles.waveBattleEventCardBad,
                                eventIndex === revealedEventCount - 1
                                  ? event.positive
                                    ? styles.waveBattleEventCardFreshGood
                                    : styles.waveBattleEventCardFreshBad
                                  : null,
                              ]}
                            >
                              <View style={styles.waveBattleEventHead}>
                                <View style={[styles.effectStepBadge, event.positive ? styles.effectStepBadgeGood : styles.effectStepBadgeBad]}>
                                  <Text style={styles.effectStepBadgeText}>{eventIndex + 1}</Text>
                                </View>
                                <MaterialCommunityIcons
                                  name={event.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                  size={14}
                                  color={event.positive ? "#9effc4" : "#ffb1b1"}
                                />
                                <Text style={styles.waveBattleEventTitle}>{event.mechanic}</Text>
                                <View
                                  style={[
                                    styles.effectResultPill,
                                    event.positive ? styles.effectResultPillCountered : styles.effectResultPillTriggered,
                                  ]}
                                >
                                  <Text style={styles.effectResultText}>{event.positive ? "ADVANTAGE" : "IMPACT"}</Text>
                                </View>
                              </View>
                              <Text style={styles.waveBattleEventBody}>{event.resultText}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
              <View style={styles.questUrgencyBanner}>
                <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#ffd6a2" />
                <Text style={styles.questUrgencyText}>
                  This is a special rescue encounter. Results will be filed through the quest report when the final wave settles.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {lastQuestOutcome ? (
        <Modal visible={questResultOpen} transparent animationType="fade" onRequestClose={() => setQuestResultOpen(false)}>
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
              {typeof lastQuestOutcome.healthDelta === "number" ? (
                <View style={styles.rewardChip}>
                  <MaterialCommunityIcons
                    name={lastQuestOutcome.healthDelta < 0 ? "heart-broken-outline" : "heart-plus-outline"}
                    size={14}
                    color={lastQuestOutcome.healthDelta < 0 ? "#ff9b92" : "#86efb0"}
                  />
                  <Text style={styles.rewardChipText}>
                    Health {lastQuestOutcome.healthDelta > 0 ? "+" : ""}{lastQuestOutcome.healthDelta}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.outcomeText}>{lastQuestOutcome.summary}</Text>
              {lastQuestOutcome.questId === SPECIAL_RESCUE_QUEST_ID ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>{lastQuestOutcome.success ? "Bandit Engagement Report" : "Rescue Failure Report"}</Text>
                  <View style={styles.specialQuestWaveList}>
                    <View style={styles.specialQuestWaveCardCompact}>
                      <Text style={styles.specialQuestWaveLabel}>Wave 1</Text>
                      <Text style={styles.specialQuestWaveTitle}>Bandit Lackeys</Text>
                      <Text style={styles.questMeta}>
                        {lastQuestOutcome.success
                          ? "The outer lackeys collapsed under the rescue push before they could fully close the lane."
                          : lastQuestOutcome.successChance < 35
                            ? "The first bandit line bled your momentum early. You reached Watchtrail underprepared and never fully controlled the route."
                            : "The outer line slowed the rescue enough to force a weaker push into the camp."}
                      </Text>
                    </View>
                    <View style={styles.specialQuestWaveCardCompact}>
                      <Text style={styles.specialQuestWaveLabel}>Wave 2</Text>
                      <Text style={styles.specialQuestWaveTitle}>Watchtrail Butcher</Text>
                      <Text style={styles.questMeta}>
                        {lastQuestOutcome.success
                          ? "The bandit leader broke under pressure before the rescue window closed."
                          : lastQuestOutcome.successChance < 35
                            ? "The Butcher held the inner camp while your weakened rescue push stalled. By the time you forced the lane, the rescue had already failed."
                            : "The Butcher bought just enough time through the inner lane for the rescue window to collapse before you could finish him."}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

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
                              {getItemDisplayName(drop.itemId)}
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

              {lyraChoicePending ? (
                <View style={styles.lyraChoiceCard}>
                  <View style={styles.lyraChoiceHead}>
                    <GameItemIcon itemId="ward-charm" size={18} />
                    <View style={styles.lyraChoiceHeadText}>
                      <Text style={styles.reqTitle}>Lyra Awaits Your Decision</Text>
                      <Text style={styles.questMeta}>
                        You recovered the ember satchel. What you do with it decides how far Lyra will trust you.
                      </Text>
                    </View>
                  </View>
                  {lyraChoices.map((choice) => (
                    <Pressable key={choice.id} onPress={() => handleResolveLyraQuestChoice(choice.id)} style={styles.lyraChoiceAction}>
                      <LinearGradient
                        colors={[...choice.colors]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.lyraChoiceActionBg}
                      >
                        <Text style={styles.lyraChoiceTitle}>{choice.title}</Text>
                        <Text style={styles.lyraChoiceText}>{choice.text}</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable
                onPress={() => setQuestResultOpen(false)}
                style={styles.actionWrap}
                disabled={lyraChoicePending}
              >
                <View style={[styles.claimButton, lyraChoicePending ? styles.actionDisabled : null]}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {lyraDecisionOutstanding && !questResultOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(214, 160, 81, 0.13)", "rgba(96, 64, 154, 0.08)", "rgba(25, 18, 41, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              <Text style={[styles.resultTitle, styles.ok]}>Lyra's Ember Satchel</Text>
              <Text style={styles.outcomeText}>
                The satchel is yours, but the branch is not finished until you decide what kind of person Lyra just dealt with.
              </Text>
              <View style={styles.lyraChoiceCard}>
                {lyraChoices.map((choice) => (
                  <Pressable key={choice.id} onPress={() => handleResolveLyraQuestChoice(choice.id)} style={styles.lyraChoiceAction}>
                    <LinearGradient colors={[...choice.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lyraChoiceActionBg}>
                      <Text style={styles.lyraChoiceTitle}>{choice.title}</Text>
                      <Text style={styles.lyraChoiceText}>{choice.text}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
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
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cfa35c",
    backgroundColor: "rgba(70, 48, 23, 0.9)",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
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
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  guildTopHealthMeter: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  licenseText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  licenseStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 188, 116, 0.46)",
    backgroundColor: "rgba(78, 54, 23, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  licenseLevelPill: {
    borderColor: "rgba(116, 204, 255, 0.42)",
    backgroundColor: "rgba(22, 56, 82, 0.92)",
  },
  licensePillLabel: {
    color: "#f6dec0",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  licenseRankValue: {
    color: "#ffd77f",
    fontWeight: "900",
  },
  licenseLevelValue: {
    color: "#89dbff",
    fontWeight: "900",
  },
  licenseFloorInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#86aed4",
    backgroundColor: "rgba(31, 56, 89, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  licenseFloorInlineLabel: {
    color: "#d2e7ff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  licenseFloorInlineValue: {
    color: "#eef7ff",
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "900",
  },
  healthBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a56066",
    backgroundColor: "rgba(66, 26, 39, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  healthBannerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  healthBannerStatePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245, 203, 141, 0.55)",
    backgroundColor: "rgba(92, 48, 30, 0.72)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  healthBannerStateText: {
    color: "#ffe7bd",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  healthBannerTitle: {
    color: "#ffd2d6",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  healthBannerValue: {
    marginLeft: "auto",
    color: "#ffe8ea",
    fontSize: 12,
    fontWeight: "900",
  },
  healthBannerMeta: {
    color: "#e4c3c8",
    fontSize: 10,
    fontWeight: "700",
  },
  healthBannerTrack: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 197, 203, 0.28)",
    backgroundColor: "rgba(23, 11, 20, 0.72)",
    overflow: "hidden",
  },
  healthBannerFill: {
    height: "100%",
    borderRadius: 999,
  },
  healthBannerFillSafe: {
    backgroundColor: "#e56f83",
  },
  healthBannerFillWarn: {
    backgroundColor: "#ffb55f",
  },
  healthBannerFillCritical: {
    backgroundColor: "#ff6a76",
  },
  boardNavCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(38, 28, 46, 0.96)",
    padding: 10,
    gap: 7,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  boardNavHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  boardNavMeta: {
    color: "#d5be95",
    fontSize: 11,
    fontWeight: "700",
  },
  boardFilterLabel: {
    color: "#cdb48a",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  boardFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  boardFilterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7f6539",
    backgroundColor: "rgba(52, 38, 57, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  boardFilterPillActive: {
    borderColor: "#d4a85c",
    backgroundColor: "rgba(96, 64, 26, 0.92)",
  },
  boardFilterText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  boardFilterTextActive: {
    color: "#ffe7bb",
  },
  boardSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(37, 28, 49, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  boardSectionCardUrgent: {
    borderColor: "rgba(211, 101, 113, 0.72)",
    backgroundColor: "rgba(54, 26, 40, 0.95)",
  },
  boardSectionCardStory: {
    borderColor: "rgba(104, 166, 214, 0.7)",
    backgroundColor: "rgba(31, 34, 55, 0.95)",
  },
  boardSectionCardSpecial: {
    borderColor: "rgba(164, 122, 225, 0.72)",
    backgroundColor: "rgba(40, 29, 62, 0.95)",
  },
  boardSectionCardHunt: {
    borderColor: "rgba(86, 168, 153, 0.74)",
    backgroundColor: "rgba(22, 42, 41, 0.96)",
  },
  boardSectionCardWanted: {
    borderColor: "rgba(184, 92, 88, 0.74)",
    backgroundColor: "rgba(42, 24, 31, 0.96)",
  },
  boardSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  boardSectionToggle: {
    gap: 6,
  },
  boardSectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  boardSectionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  boardSectionTitle: {
    color: "#fff0cf",
    fontSize: 14,
    fontWeight: "900",
  },
  boardSectionMeta: {
    color: "#d8c4a1",
    fontSize: 12,
    fontWeight: "700",
  },
  boardSectionCountPill: {
    minWidth: 28,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(238, 211, 165, 0.45)",
    backgroundColor: "rgba(75, 56, 31, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  boardSectionCountText: {
    color: "#fff0cf",
    fontSize: 11,
    fontWeight: "900",
  },
  boardSectionList: {
    gap: 10,
  },
  floorClearHeroCard: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241, 211, 146, 0.34)",
    backgroundColor: "rgba(73, 51, 27, 0.32)",
  },
  floorClearHeroHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  floorClearHeroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 213, 143, 0.42)",
    backgroundColor: "rgba(110, 76, 36, 0.46)",
  },
  floorClearHeroText: {
    flex: 1,
    gap: 2,
  },
  floorClearHeroLabel: {
    color: "#d7c29b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  floorClearHeroTitle: {
    color: "#fff0cf",
    fontSize: 22,
    fontWeight: "900",
  },
  floorClearStoryCard: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 213, 143, 0.18)",
    backgroundColor: "rgba(35, 24, 17, 0.34)",
  },
  floorClearStoryLabel: {
    color: "#ffda96",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  floorClearQuestCard: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(168, 210, 255, 0.24)",
    backgroundColor: "rgba(31, 42, 69, 0.34)",
  },
  floorClearQuestHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  floorClearQuestTitle: {
    color: "#eef6ff",
    fontSize: 18,
    fontWeight: "900",
  },
  healthLockCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a45f67",
    backgroundColor: "rgba(67, 29, 42, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  healthLockHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  healthLockTitle: {
    flex: 1,
    color: "#ffd8dc",
    fontSize: 12,
    fontWeight: "900",
  },
  rankUpAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1a35b",
    backgroundColor: "rgba(78, 53, 20, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  rankUpAlertText: {
    color: "#ffe7b9",
    fontSize: 12,
    fontWeight: "800",
  },
  storyAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0b366",
    backgroundColor: "rgba(97, 57, 24, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  storyAlertText: {
    color: "#ffe8ba",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  guildTab: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  guildTabBadge: {
    position: "absolute",
    top: 5,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffd8d8",
    backgroundColor: "#d94657",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  guildTabBadgeText: {
    color: "#fff5f5",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10,
  },
  guildTabText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 11,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  guildTabTextActive: {
    color: colors.textPrimary,
  },
  npcCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(32, 24, 44, 0.96)",
    padding: 12,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  npcSecurityLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  npcWatermark: {
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
  npcPatternArcOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(234, 199, 132, 0.16)",
    top: -114,
    right: -82,
  },
  npcPatternArcTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(103, 205, 255, 0.16)",
    bottom: -66,
    left: -40,
  },
  npcPatternGrid: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(247, 227, 180, 0.06)",
  },
  npcTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  npcTopRightWrap: {
    alignItems: "flex-end",
    gap: 5,
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
  npcAttentionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffd8a7",
    backgroundColor: "rgba(116, 72, 25, 0.95)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  npcAttentionPillText: {
    color: "#fff2d3",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  npcSpeechBubble: {
    position: "relative",
    alignSelf: "flex-start",
    maxWidth: "92%",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  npcSpeechBubbleTail: {
    position: "absolute",
    left: 18,
    bottom: -7,
    width: 12,
    height: 12,
    backgroundColor: "rgba(82, 60, 34, 0.96)",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 214, 150, 0.4)",
    transform: [{ rotate: "-45deg" }],
  },
  npcSpeechBubbleInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  npcSpeechBubbleText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  npcBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  npcAvatar: {
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
  npcAvatarImage: {
    width: "100%",
    height: "100%",
  },
  npcTextWrap: {
    flex: 1,
    gap: 2,
  },
  npcRightBadges: {
    alignItems: "center",
    gap: 4,
  },
  npcLevelBadge: {
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
  npcLevelBadgeLabel: {
    color: "#f0ddb7",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  npcLevelBadgeValue: {
    color: "#ffe9be",
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
  },
  npcFloorBadge: {
    minWidth: 62,
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
  npcFloorBadgeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  npcFloorBadgeLabel: {
    color: "#c9e4ff",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  npcFloorBadgeValue: {
    color: "#e6f4ff",
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "900",
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
  npcAuthBar: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(181, 186, 197, 0.34)",
    backgroundColor: "rgba(126, 135, 152, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  npcAuthTextWrap: {
    flex: 1,
    gap: 1,
  },
  npcAuthLabel: {
    color: "rgba(223, 228, 239, 0.7)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  npcAuthValue: {
    color: "rgba(242, 246, 255, 0.9)",
    fontSize: 11,
    fontWeight: "800",
  },
  npcSignatureWrap: {
    alignItems: "flex-end",
    minWidth: 92,
  },
  npcSignatureText: {
    color: "rgba(225, 232, 248, 0.8)",
    fontSize: 17,
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 18,
  },
  npcSignatureHint: {
    marginTop: 1,
    color: "rgba(186, 194, 212, 0.66)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  npcDispositionCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(169, 131, 78, 0.34)",
    backgroundColor: "rgba(44, 31, 20, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 5,
  },
  npcDispositionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  npcDispositionHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  npcDispositionLabel: {
    color: "#d9c8a8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  npcDispositionInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 221, 163, 0.42)",
    backgroundColor: "rgba(84, 57, 28, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  npcDispositionTier: {
    fontSize: 12,
    fontWeight: "900",
  },
  npcDispositionTrack: {
    height: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(143, 112, 67, 0.66)",
    backgroundColor: "rgba(22, 16, 13, 0.95)",
    overflow: "hidden",
  },
  npcDispositionFill: {
    height: "100%",
    borderRadius: 999,
  },
  npcPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  npcInfoChip: {
    width: "48.6%",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(47, 35, 22, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  npcInfoChipText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    flexShrink: 1,
  },
  archmageRiteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(202, 167, 255, 0.54)",
    backgroundColor: "rgba(43, 28, 68, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  archmageRiteHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  archmageRiteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(222, 191, 255, 0.58)",
    backgroundColor: "rgba(83, 51, 124, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  archmageRiteTextWrap: {
    flex: 1,
    gap: 1,
  },
  archmageRiteInfoButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 221, 163, 0.45)",
    backgroundColor: "rgba(86, 55, 32, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  archmageRiteLabel: {
    color: "#dcb9ff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  archmageRiteName: {
    color: "#fff0d6",
    fontSize: 14,
    fontWeight: "900",
  },
  archmageRiteStatePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188, 229, 255, 0.55)",
    backgroundColor: "rgba(40, 66, 92, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  archmageRiteStatePillLocked: {
    borderColor: "rgba(255, 175, 161, 0.54)",
    backgroundColor: "rgba(88, 45, 41, 0.84)",
  },
  archmageRiteStateText: {
    color: "#eef5ff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  npcDialogHero: {
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  npcDialogHeroAvatar: {
    width: 104,
    height: 104,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#b68f53",
    backgroundColor: "rgba(29, 21, 13, 0.9)",
  },
  npcDialogHeroName: {
    color: "#fff0ce",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  dialogInlineRequestWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dialogInlineIconToken: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(193, 160, 101, 0.62)",
    backgroundColor: "rgba(55, 39, 22, 0.9)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  dialogInlineIconText: {
    color: "#f4e3bf",
    fontSize: 12,
    fontWeight: "800",
  },
  dualActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  dualActionButton: {
    flex: 1,
  },
  dialogChoiceButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  dialogChoiceRefuseButton: {
    borderColor: "#b08f6d",
    backgroundColor: "rgba(83, 61, 36, 0.95)",
  },
  dialogChoiceAcceptButton: {
    borderColor: "#d1a85c",
    backgroundColor: "rgba(91, 63, 24, 0.95)",
  },
  dialogChoiceText: {
    color: "#fff0ce",
    fontSize: 13,
    fontWeight: "900",
  },
  dialogChoiceStack: {
    gap: 10,
  },
  dialogChoiceTitle: {
    color: "#fff0ce",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  dialogChoiceBody: {
    color: "#e8d3af",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
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
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
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
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  npcQuestCard: {
    borderColor: "#6ea7d1",
    backgroundColor: "rgba(29, 27, 48, 0.98)",
  },
  specialQuestCard: {
    borderColor: "#df7882",
    borderWidth: 2,
    shadowColor: "#d36a73",
    shadowOpacity: 0.45,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  questSceneBanner: {
    height: 86,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(203, 159, 86, 0.58)",
    overflow: "hidden",
    marginBottom: 7,
  },
  questCardBackdropFull: {
    ...StyleSheet.absoluteFillObject,
  },
  questSceneOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  questSceneLabelWrap: {
    position: "absolute",
    left: 10,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(233, 191, 124, 0.8)",
    backgroundColor: "rgba(44, 31, 18, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  questSceneLabel: {
    color: "#ffe7ba",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  chipSprite: {
    width: 14,
    height: 14,
  },
  chipPortrait: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(221, 181, 118, 0.7)",
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
  specialQuestBadge: {
    marginLeft: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffb7bf",
    backgroundColor: "rgba(171, 43, 64, 0.94)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  specialQuestBadgeText: {
    color: "#fff0f3",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  npcQuestBadge: {
    marginLeft: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9fd8ff",
    backgroundColor: "rgba(32, 83, 120, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  npcQuestBadgeText: {
    color: "#eef8ff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
  },
  huntQuestBadge: {
    marginLeft: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8fe7dc",
    backgroundColor: "rgba(24, 89, 78, 0.94)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  huntQuestBadgeText: {
    color: "#ecfffb",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
  },
  wantedPlaceholderCard: {
    borderColor: "rgba(184, 92, 88, 0.75)",
    backgroundColor: "rgba(38, 22, 29, 0.98)",
  },
  wantedQuestBadge: {
    marginLeft: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffb8a8",
    backgroundColor: "rgba(122, 36, 41, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  wantedQuestBadgeText: {
    color: "#fff2ef",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
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
    alignItems: "flex-start",
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
    maxWidth: "100%",
    flexShrink: 1,
  },
  rewardChipText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  wantedDetailsList: {
    gap: 4,
  },
  wantedDetailText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  titleRewardCard: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(41, 30, 20, 0.94)",
    padding: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  floorDropBlock: {
    marginTop: 8,
    gap: 8,
  },
  floorDropLabel: {
    color: "#f3deba",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  floorDropGrid: {
    gap: 8,
  },
  floorDropCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  floorDropIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 236, 198, 0.28)",
    backgroundColor: "rgba(17, 16, 24, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  floorDropTextWrap: {
    flex: 1,
    gap: 2,
  },
  floorDropName: {
    color: "#fff1d7",
    fontSize: 13,
    fontWeight: "900",
  },
  floorDropMeta: {
    color: "#f0d4a7",
    fontSize: 10,
    fontWeight: "700",
  },
  titleRewardLegendary: {
    shadowColor: "#ffd287",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  titleRewardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(17, 19, 30, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRewardIcon: {
    width: 32,
    height: 32,
  },
  titleRewardTextWrap: {
    flex: 1,
    gap: 2,
  },
  titleRewardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRewardLabel: {
    color: "#f0dcba",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  titleRewardGradePill: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(14, 18, 34, 0.86)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  titleRewardGradeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  titleRewardName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  titleRewardMeta: {
    color: "#ccb58b",
    fontSize: 10,
    fontWeight: "700",
  },
  titleRewardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  titleEarnedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#63c890",
    backgroundColor: "rgba(22, 85, 52, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  titleEarnedText: {
    color: "#baf8d2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  titleRewardProgressTrack: {
    marginTop: 2,
    width: "100%",
    height: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#82653a",
    backgroundColor: "rgba(16, 18, 31, 0.92)",
    overflow: "hidden",
  },
  titleRewardProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  meterBlock: {
    gap: 4,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  questMeterBlock: {
    gap: 4,
    width: "100%",
    maxWidth: 880,
    alignSelf: "center",
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
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(223, 185, 113, 0.62)",
    backgroundColor: "rgba(41, 28, 56, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: "hidden",
    position: "relative",
  },
  waveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  waveSectionLabel: {
    color: "#e7d4ad",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  waveHudCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(194, 156, 95, 0.72)",
    backgroundColor: "rgba(45, 32, 52, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  waveHudRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  waveHudLabel: {
    color: "#e8d8b8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  waveHudValue: {
    marginLeft: "auto",
    color: "#ffe8c0",
    fontSize: 11,
    fontWeight: "800",
  },
  waveHudIconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "center",
  },
  waveHudIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  waveHudIconImage: {
    width: 15,
    height: 15,
    borderRadius: 3,
  },
  waveReportCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(187, 148, 86, 0.7)",
    backgroundColor: "rgba(56, 40, 24, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  waveReportTitle: {
    color: "#ffe3ab",
    fontSize: 11,
    fontWeight: "900",
  },
  waveReportMeta: {
    color: "#d6bf96",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  waveEventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  waveEventText: {
    flex: 1,
    color: "#ecdcbc",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  waveResolveMeterWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(180, 144, 85, 0.6)",
    backgroundColor: "rgba(46, 33, 56, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  waveResolveStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  waveResolveScroll: {
    maxHeight: 460,
  },
  waveResolveScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  waveResolveLog: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(180, 144, 85, 0.58)",
    backgroundColor: "rgba(39, 29, 50, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  waveResolveBattleList: {
    gap: 8,
  },
  liveBattleStatusGrid: {
    gap: 10,
  },
  liveBattlePlayerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(140, 194, 255, 0.42)",
    backgroundColor: "rgba(26, 37, 56, 0.86)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  liveBattleCombatHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveBattlePlayerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(159, 201, 255, 0.5)",
  },
  liveBattleCombatText: {
    flex: 1,
    gap: 2,
  },
  liveBattleCombatLabel: {
    color: "#9ecfff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  liveBattleCombatName: {
    color: "#fff0cf",
    fontSize: 19,
    fontWeight: "900",
  },
  liveBattleCombatMeta: {
    color: "#dbe9ff",
    fontSize: 12,
    fontWeight: "800",
  },
  liveBattleEnemyCardWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(189, 149, 86, 0.42)",
    backgroundColor: "rgba(49, 34, 25, 0.84)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  liveBattleEnemyCard: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  liveBattleEnemyArtWrap: {
    width: 180,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBattleEnemyArt: {
    width: 180,
    height: 120,
  },
  liveBattleEnemyArtDowned: {
    opacity: 0.42,
  },
  liveBattleEnemyDownedMark: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBattleEnemyName: {
    color: "#fff0cf",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  liveBattleEnemyMeta: {
    color: "#d9c39f",
    fontSize: 12,
    fontWeight: "700",
  },
  liveBattleEnemyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  liveBattleEnemyHpText: {
    color: "#ffe9cd",
    fontSize: 15,
    fontWeight: "900",
  },
  liveBattleEnemyHpStatLine: {
    color: "#ffe9cd",
    fontSize: 13,
    fontWeight: "900",
  },
  liveBattleDamageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  liveBattleCritText: {
    color: "#ffd58f",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  liveBattleCallout: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(227, 151, 92, 0.55)",
    backgroundColor: "rgba(74, 37, 28, 0.82)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  liveBattleCalloutLabel: {
    color: "#ffd8a1",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  liveBattleCalloutTitle: {
    color: "#fff0cf",
    fontSize: 18,
    fontWeight: "900",
  },
  liveBattleCalloutBody: {
    color: "#efdcc0",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  liveBattleInitiativeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(134, 173, 220, 0.38)",
    backgroundColor: "rgba(31, 36, 58, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  liveBattleInitiativeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  liveBattleInitiativeToken: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  liveBattleInitiativeTokenActive: {
    transform: [{ scale: 1.08 }],
    shadowColor: "#ffe6bf",
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  liveBattleInitiativeTokenResolved: {
    opacity: 0.45,
  },
  liveBattleInitiativeTokenPlayer: {
    borderColor: "rgba(159, 201, 255, 0.72)",
    backgroundColor: "rgba(30, 55, 83, 0.88)",
  },
  liveBattleInitiativeTokenEnemy: {
    borderColor: "rgba(227, 151, 92, 0.62)",
    backgroundColor: "rgba(82, 44, 28, 0.88)",
  },
  liveBattleInitiativeAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  liveBattleInitiativeResolvedMark: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#ff9ea9",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBattleSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveBattleSequenceHint: {
    color: "#cdb793",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  liveBattleActionSection: {
    gap: 8,
  },
  liveBattleSkillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  liveBattleActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  liveBattleActionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 144, 85, 0.58)",
    backgroundColor: "rgba(39, 29, 50, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  liveBattleActionButtonAttack: {
    borderColor: "rgba(210, 128, 92, 0.58)",
    backgroundColor: "rgba(74, 36, 28, 0.84)",
  },
  liveBattleActionButtonMove: {
    borderColor: "rgba(122, 190, 255, 0.42)",
    backgroundColor: "rgba(24, 45, 68, 0.82)",
  },
  liveBattleActionButtonGuard: {
    borderColor: "rgba(134, 214, 179, 0.46)",
    backgroundColor: "rgba(24, 58, 45, 0.82)",
  },
  liveBattleActionButtonSkillDefense: {
    borderColor: "rgba(214, 192, 118, 0.48)",
    backgroundColor: "rgba(72, 58, 28, 0.84)",
  },
  liveBattleActionButtonSkillTempo: {
    borderColor: "rgba(122, 190, 255, 0.42)",
    backgroundColor: "rgba(33, 49, 73, 0.84)",
  },
  liveBattleActionButtonSkillOffense: {
    borderColor: "rgba(223, 116, 123, 0.42)",
    backgroundColor: "rgba(79, 31, 43, 0.84)",
  },
  liveBattleActionButtonSkillArcane: {
    borderColor: "rgba(174, 147, 255, 0.44)",
    backgroundColor: "rgba(58, 37, 87, 0.84)",
  },
  liveBattleActionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveBattleSkillPillIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    overflow: "hidden",
  },
  liveBattleSkillPillIconWrapArt: {
    width: 22,
    height: 22,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  liveBattleSkillArt: {
    width: 22,
    height: 22,
  },
  liveBattleStatusArt: {
    width: 14,
    height: 14,
  },
  liveBattleSkillActiveDot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#8de9a8",
    borderWidth: 1,
    borderColor: "#142018",
  },
  liveBattleActionButtonActive: {
    borderColor: "rgba(140, 225, 182, 0.84)",
    backgroundColor: "rgba(24, 72, 52, 0.88)",
  },
  liveBattleActionText: {
    color: "#fff0cf",
    fontSize: 12,
    fontWeight: "900",
  },
  liveBattleItemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  liveBattleItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 144, 85, 0.52)",
    backgroundColor: "rgba(49, 36, 25, 0.84)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  liveBattleItemTextWrap: {
    gap: 2,
  },
  liveBattleItemText: {
    color: "#ffedcb",
    fontSize: 11,
    fontWeight: "800",
  },
  liveBattleItemSubtext: {
    color: "#cdb793",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  liveBattleSkillState: {
    color: "#9ecfff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  liveBattleSkillInlineState: {
    color: "#9ecfff",
    fontSize: 10,
    fontWeight: "900",
  },
  liveBattleCommandHint: {
    color: "#d9e8ff",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    paddingHorizontal: 2,
    minHeight: 18,
  },
  liveBattleSkillInfoText: {
    color: "#cfdff9",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  liveBattleWeaponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveBattleWeaponArtFrame: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(214, 178, 112, 0.46)",
    backgroundColor: "rgba(45, 33, 25, 0.62)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  liveBattleWeaponArt: {
    width: 82,
    height: 82,
  },
  liveBattleWeaponTextWrap: {
    flex: 1,
    gap: 2,
  },
  liveBattleWeaponLabel: {
    color: "#9ecfff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  liveBattleWeaponName: {
    color: "#fff0cf",
    fontSize: 13,
    fontWeight: "800",
  },
  liveBattleWeaponGrade: {
    color: "#d9c39f",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  liveBattleCooldownCardSlim: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(122, 190, 255, 0.28)",
    backgroundColor: "rgba(24, 31, 54, 0.52)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  liveBattleCooldownCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(122, 190, 255, 0.34)",
    backgroundColor: "rgba(24, 31, 54, 0.78)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  liveBattleCooldownHint: {
    color: "#cfe1ff",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  liveBattleLogCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(189, 149, 86, 0.38)",
    backgroundColor: "rgba(36, 27, 46, 0.86)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  liveBattleLogList: {
    gap: 6,
    paddingRight: 4,
  },
  liveBattleLogScroll: {
    maxHeight: 132,
  },
  liveBattleLogEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(189, 149, 86, 0.22)",
    backgroundColor: "rgba(28, 21, 38, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  liveBattleLogEntryDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#ffd58f",
    marginTop: 5,
  },
  liveBattleLogEntryText: {
    flex: 1,
    color: "#ecdcbc",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  liveBattleStatusFxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  liveBattleStatWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveBattleStatBonus: {
    color: "#86efb0",
    fontSize: 11,
    fontWeight: "900",
  },
  liveBattleNoEffectsText: {
    color: "#d0c1a5",
    fontSize: 10,
    fontWeight: "700",
  },
  liveBattleStatusFxChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  liveBattleStatusFxChipGood: {
    borderColor: "rgba(124, 226, 170, 0.62)",
    backgroundColor: "rgba(26, 71, 52, 0.84)",
  },
  liveBattleStatusFxChipBad: {
    borderColor: "rgba(244, 135, 149, 0.62)",
    backgroundColor: "rgba(86, 31, 43, 0.84)",
  },
  liveBattleStatusFxChipNeutral: {
    borderColor: "rgba(180, 144, 85, 0.52)",
    backgroundColor: "rgba(58, 42, 26, 0.82)",
  },
  liveBattleStatusFxText: {
    color: "#ffe9cd",
    fontSize: 10,
    fontWeight: "800",
  },
  liveBattleEnemyTurnMeterCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201, 134, 92, 0.42)",
    backgroundColor: "rgba(66, 35, 28, 0.84)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  waveBattleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(189, 149, 86, 0.62)",
    backgroundColor: "rgba(40, 29, 52, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 8,
  },
  waveBattleCardUnengaged: {
    opacity: 0.9,
    borderColor: "rgba(122, 132, 156, 0.42)",
    backgroundColor: "rgba(34, 35, 48, 0.88)",
  },
  waveBattleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  waveBattleEnemyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  waveBattlePortrait: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(238, 202, 141, 0.64)",
  },
  waveBattlePortraitFallback: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(238, 202, 141, 0.64)",
    backgroundColor: "rgba(63, 43, 23, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  waveBattleEnemyText: {
    flex: 1,
    gap: 2,
  },
  waveBattleEnemyName: {
    color: "#fff0cf",
    fontSize: 13,
    fontWeight: "900",
  },
  waveBattleEnemyMeta: {
    color: "#d9c39f",
    fontSize: 10,
    fontWeight: "700",
  },
  waveBattleIndexPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(159, 201, 255, 0.4)",
    backgroundColor: "rgba(33, 53, 79, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waveBattleIndexText: {
    color: "#e0eeff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  waveBattleStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  waveBattleHpWrap: {
    gap: 4,
  },
  waveBattleHpHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waveBattleHpLabel: {
    color: "#f7dcb4",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  waveBattleHpValue: {
    color: "#ffe9cd",
    fontSize: 10,
    fontWeight: "900",
  },
  waveBattleHpTrack: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(154, 108, 116, 0.66)",
    backgroundColor: "rgba(52, 20, 32, 0.92)",
    overflow: "hidden",
    position: "relative",
  },
  waveBattleHpFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#d46674",
  },
  waveBattleHpFillDefeated: {
    width: "0%",
  },
  waveBattleHpFillFull: {
    backgroundColor: "#6bb880",
  },
  waveBattleHpDefeatedPill: {
    position: "absolute",
    right: 4,
    top: 1,
    bottom: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 232, 185, 0.7)",
    backgroundColor: "rgba(73, 46, 17, 0.88)",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  waveBattleHpStandingPill: {
    position: "absolute",
    right: 4,
    top: 1,
    bottom: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(180, 231, 197, 0.72)",
    backgroundColor: "rgba(19, 62, 45, 0.9)",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  waveBattleHpDefeatedText: {
    color: "#ffebc1",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  waveBattleUnengagedText: {
    color: "#c8d2df",
    fontSize: 11,
    lineHeight: 16,
  },
  waveBattleStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(165, 130, 83, 0.52)",
    backgroundColor: "rgba(56, 40, 25, 0.86)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waveBattleStatText: {
    color: "#f7e4be",
    fontSize: 10,
    fontWeight: "800",
  },
  waveBattleTimeline: {
    gap: 6,
  },
  waveBattleEventCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  waveBattleEventCardGood: {
    borderColor: "#5eb785",
    backgroundColor: "rgba(24, 80, 54, 0.82)",
  },
  waveBattleEventCardBad: {
    borderColor: "#bd6d78",
    backgroundColor: "rgba(89, 32, 47, 0.84)",
  },
  waveBattleEventCardFreshGood: {
    shadowColor: "#97ffc5",
    shadowOpacity: 0.75,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  waveBattleEventCardFreshBad: {
    shadowColor: "#ff9fae",
    shadowOpacity: 0.82,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  waveBattleEventHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  waveBattleEventTitle: {
    flex: 1,
    color: "#f5e1c1",
    fontSize: 10,
    fontWeight: "900",
  },
  waveBattleEventBody: {
    color: "#f4e8d0",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  effectHintText: {
    color: "#f2e1bd",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  encounterHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  encounterHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  encounterStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b48a4f",
    backgroundColor: "rgba(77, 54, 23, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  encounterStatusText: {
    color: "#ffe7bb",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  encounterHealthCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9f6067",
    backgroundColor: "rgba(66, 29, 42, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  encounterHealthHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  encounterHealthValue: {
    marginLeft: "auto",
    color: "#ffe6e9",
    fontSize: 11,
    fontWeight: "900",
  },
  encounterDeltaPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  encounterDeltaPillLoss: {
    borderColor: "#d97a86",
    backgroundColor: "rgba(107, 31, 47, 0.88)",
  },
  encounterDeltaPillGain: {
    borderColor: "#64c38f",
    backgroundColor: "rgba(20, 82, 53, 0.84)",
  },
  encounterDeltaText: {
    color: "#ffe2b4",
    fontSize: 10,
    fontWeight: "900",
  },
  encounterSupplyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  encounterSupplyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8c7044",
    backgroundColor: "rgba(52, 37, 21, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  encounterEnemyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7f6439",
    backgroundColor: "rgba(44, 31, 18, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 150,
  },
  encounterEnemyThumb: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 190, 129, 0.6)",
  },
  encounterSupplyText: {
    color: "#f6dfb5",
    fontSize: 10,
    fontWeight: "800",
  },
  effectRow: {
    flexDirection: "column",
    gap: 8,
  },
  effectEnemyCard: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#8c6e40",
    backgroundColor: "rgba(49, 35, 21, 0.84)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 6,
  },
  effectEnemyCardSkipped: {
    borderColor: "#7e7e7e",
    backgroundColor: "rgba(56, 56, 56, 0.72)",
  },
  effectCard: {
    width: "100%",
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  effectCardCountered: {
    borderColor: "#5eb785",
    backgroundColor: "rgba(24, 80, 54, 0.82)",
  },
  effectCardTriggered: {
    borderColor: "#bd6d78",
    backgroundColor: "rgba(89, 32, 47, 0.84)",
  },
  effectHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  effectEnemy: {
    flex: 1,
    color: "#ffebc4",
    fontSize: 10,
    fontWeight: "900",
  },
  effectEnemyPortrait: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(230, 197, 140, 0.64)",
  },
  effectBattleStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  effectBattleStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(159, 128, 84, 0.5)",
    backgroundColor: "rgba(69, 49, 28, 0.82)",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  effectBattleStatText: {
    color: "#ffe9c2",
    fontSize: 9,
    fontWeight: "800",
  },
  effectMechanic: {
    color: "#f3dfbc",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },
  effectResultPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  effectResultPillCountered: {
    borderColor: "#6fd19a",
    backgroundColor: "rgba(15, 96, 58, 0.86)",
  },
  effectResultPillTriggered: {
    borderColor: "#e08490",
    backgroundColor: "rgba(116, 39, 56, 0.9)",
  },
  effectResultText: {
    color: "#ffe6bb",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  effectStepBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  effectStepBadgeGood: {
    borderColor: "rgba(148, 236, 181, 0.6)",
    backgroundColor: "rgba(34, 91, 60, 0.84)",
  },
  effectStepBadgeBad: {
    borderColor: "rgba(255, 178, 178, 0.62)",
    backgroundColor: "rgba(111, 45, 58, 0.86)",
  },
  effectStepBadgeText: {
    color: "#fff1d1",
    fontSize: 9,
    fontWeight: "900",
  },
  effectResultBody: {
    color: "#f0d5da",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  levelPenaltyCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c56d79",
    backgroundColor: "rgba(94, 33, 47, 0.86)",
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 4,
  },
  levelPenaltyHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelPenaltyTitle: {
    color: "#ffd6db",
    fontSize: 12,
    fontWeight: "900",
  },
  levelPenaltyText: {
    color: "#f6d7dc",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  phaseTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  phaseTrackNodeWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  phaseTrackNode: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  phaseTrackNodePending: {
    borderColor: "#8e7b60",
    backgroundColor: "rgba(54, 44, 34, 0.9)",
  },
  phaseTrackNodeOk: {
    borderColor: "#5cc08a",
    backgroundColor: "rgba(34, 103, 69, 0.95)",
  },
  phaseTrackNodeFail: {
    borderColor: "#d27a83",
    backgroundColor: "rgba(118, 43, 54, 0.95)",
  },
  phaseTrackNodeSkipped: {
    borderColor: "#8d8d8d",
    backgroundColor: "rgba(72, 72, 72, 0.86)",
  },
  phaseTrackLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "rgba(95, 76, 54, 0.7)",
  },
  phaseTrackLineActive: {
    backgroundColor: "rgba(214, 163, 86, 0.9)",
  },
  towerPhaseCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7244",
    backgroundColor: "rgba(47, 34, 55, 0.92)",
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 6,
  },
  towerPhaseCardNormal: {
    backgroundColor: "rgba(57, 39, 23, 0.88)",
  },
  towerPhaseCardSubBoss: {
    backgroundColor: "rgba(69, 37, 33, 0.9)",
  },
  towerPhaseCardBoss: {
    backgroundColor: "rgba(87, 45, 24, 0.92)",
  },
  towerPhaseHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  towerPhaseResultPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerPhaseResultOk: {
    borderColor: "#4e9a72",
    backgroundColor: "rgba(21, 74, 48, 0.78)",
  },
  towerPhaseResultFail: {
    borderColor: "#b26770",
    backgroundColor: "rgba(84, 33, 46, 0.82)",
  },
  towerPhaseResultSkipped: {
    borderColor: "#818181",
    backgroundColor: "rgba(62, 62, 62, 0.84)",
  },
  towerPhaseResultText: {
    color: "#ffe8bd",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  towerPhaseSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  enemyRosterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    alignSelf: "center",
    width: "100%",
  },
  enemyCard: {
    width: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a98148",
    backgroundColor: "rgba(58, 40, 21, 0.9)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  enemyCardElite: {
    width: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d28f71",
    backgroundColor: "rgba(82, 43, 29, 0.92)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  enemyCardBoss: {
    width: 118,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8ad64",
    backgroundColor: "rgba(96, 53, 22, 0.94)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  enemyCardScout: {
    minHeight: 146,
    justifyContent: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 0,
    gap: 5,
    borderWidth: 0,
    backgroundColor: "transparent",
    position: "relative",
  },
  enemyCardScoutWide: {
    flex: 1,
    minWidth: 220,
    maxWidth: 360,
    minHeight: 280,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "flex-start",
  },
  enemyCardScoutSolo: {
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
  },
  enemyPortrait: {
    width: 88,
    height: 58,
  },
  enemyPortraitScout: {
    width: 132,
    height: 96,
  },
  enemyPortraitScoutWide: {
    width: 260,
    height: 200,
  },
  enemyPortraitScoutSolo: {
    width: 340,
    height: 260,
  },
  enemyScoutCaption: {
    alignItems: "center",
    gap: 2,
    width: "100%",
    marginTop: -4,
  },
  enemyScoutCaptionWide: {
    maxWidth: 280,
  },
  enemyCardScoutDefeated: {
    opacity: 0.72,
  },
  enemyPortraitDefeated: {
    opacity: 0.46,
  },
  enemyDefeatedOverlay: {
    position: "absolute",
    top: "26%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
    pointerEvents: "none",
  },
  enemyScoutHpWrap: {
    width: "100%",
    maxWidth: 280,
    gap: 4,
    marginTop: 2,
  },
  enemyScoutHpHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  enemyScoutHpLabel: {
    color: "#e6cfa5",
    fontSize: 10,
    fontWeight: "800",
  },
  enemyScoutHpValue: {
    color: "#f3dfbf",
    fontSize: 10,
    fontWeight: "800",
  },
  enemyScoutHpTrack: {
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(191, 145, 87, 0.54)",
    backgroundColor: "rgba(43, 27, 34, 0.82)",
    overflow: "hidden",
  },
  enemyScoutHpFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#d96574",
  },
  enemyScoutHpFillEmpty: {
    backgroundColor: "rgba(140, 120, 120, 0.4)",
  },
  enemyName: {
    color: "#f7e5c1",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  enemyLevel: {
    color: "#d3bb8e",
    fontSize: 10,
    fontWeight: "700",
  },
  enemyModalPortrait: {
    height: 230,
    borderRadius: 16,
    backgroundColor: "rgba(28, 18, 37, 0.96)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    overflow: "hidden",
  },
  enemyModalPortraitFrame: {
    width: 208,
    height: 208,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  enemyModalPortraitImage: {
    width: 204,
    height: 204,
  },
  enemyModalPortraitImageTight: {
    position: "absolute",
    top: -18,
    left: -22,
    right: -22,
    bottom: -12,
    width: undefined,
    height: undefined,
    transform: [{ scale: 1.45 }],
  },
  enemyModalPortraitImageRat: {
    top: -8,
    left: -8,
    right: -8,
    bottom: -4,
    transform: [{ scale: 1.18 }],
  },
  enemyPortraitTapHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(231, 199, 136, 0.52)",
    backgroundColor: "rgba(31, 20, 15, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enemyPortraitTapHintText: {
    color: "#f7dfad",
    fontSize: 10,
    fontWeight: "800",
  },
  enemyModalThumb: {
    width: 20,
    height: 20,
  },
  enemyModalThumbWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(226, 190, 129, 0.72)",
    backgroundColor: "rgba(34, 24, 14, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  enemyModalThumbImage: {
    width: "100%",
    height: "100%",
  },
  enemyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  enemyMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(47, 35, 22, 0.9)",
    borderWidth: 1,
    borderColor: "#8d6f40",
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  enemyMetaText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  enemyDossierModal: {
    maxWidth: 500,
    maxHeight: "92%",
    borderColor: "#c8a96a",
    backgroundColor: "rgba(25, 18, 36, 0.985)",
    paddingTop: 12,
    gap: 10,
  },
  enemyDossierScroll: {
    width: "100%",
    flexGrow: 0,
  },
  enemyDossierScrollContent: {
    gap: 10,
    paddingBottom: 14,
  },
  enemyDossierOrnamentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  enemyDossierKicker: {
    color: "#f3d59f",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  enemyDossierTitle: {
    textAlign: "center",
    marginTop: -2,
  },
  enemyDossierLoreCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(203, 168, 105, 0.52)",
    backgroundColor: "rgba(57, 38, 24, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
  },
  enemyDossierSectionTitle: {
    color: "#f6d69a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  enemyDossierLoreText: {
    color: "#ead8be",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  enemyWeaknessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  enemyWeaknessItemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  enemyWeaknessItemChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(118, 192, 143, 0.6)",
    backgroundColor: "rgba(22, 38, 27, 0.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  enemyDossierMechanicsBlock: {
    marginTop: 0,
  },
  enemyDossierMechanicItem: {
    borderRadius: 12,
    borderColor: "rgba(165, 127, 71, 0.95)",
    backgroundColor: "rgba(58, 39, 24, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  enemyArtOverlayInline: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "rgba(7, 4, 14, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  enemyArtOverlayWeb: {
    flex: 1,
    backgroundColor: "rgba(7, 4, 14, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  enemyArtLightbox: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
    gap: 10,
  },
  enemyArtLightboxImage: {
    width: "100%",
    height: 420,
  },
  enemyArtLightboxCaption: {
    alignItems: "center",
    gap: 2,
  },
  enemyArtLightboxTitle: {
    color: "#fff0c8",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  enemyArtLightboxHint: {
    color: "#d6c29f",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  enemyIntelLocked: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(198, 161, 99, 0.6)",
    backgroundColor: "rgba(49, 36, 20, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
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
    maxWidth: "100%",
    flexWrap: "wrap",
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
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  reqOwnedText: {
    color: "#cbb58f",
    fontSize: 10,
    fontWeight: "700",
  },
  stepperButton: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9f804b",
    backgroundColor: "rgba(67, 48, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    color: "#ffe4b0",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 12,
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
    maxHeight: "92%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(35, 26, 49, 0.98)",
    padding: 14,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  encounterScroll: {
    maxHeight: 500,
  },
  encounterScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  resultTitle: {
    color: "#ffe8bc",
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
  lyraChoiceCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(214, 168, 100, 0.62)",
    backgroundColor: "rgba(46, 28, 40, 0.92)",
    padding: 10,
    gap: 8,
  },
  lyraChoiceHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  lyraChoiceHeadText: {
    flex: 1,
    gap: 2,
  },
  lyraChoiceAction: {
    borderRadius: 12,
    overflow: "hidden",
  },
  lyraChoiceActionBg: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  lyraChoiceTitle: {
    color: "#fff1d5",
    fontSize: 13,
    fontWeight: "900",
  },
  lyraChoiceText: {
    color: "#ead9bf",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
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
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
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
    width: "100%",
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
  craftEchoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b78949",
    backgroundColor: "rgba(52, 36, 19, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
  },
  craftEchoHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  craftEchoKicker: {
    color: "#ffd9a0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  craftEchoBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  craftEchoIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c79a55",
    backgroundColor: "rgba(26, 20, 34, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  craftEchoTextWrap: {
    flex: 1,
    gap: 3,
  },
  craftEchoTitle: {
    color: "#fff1cf",
    fontSize: 15,
    fontWeight: "900",
  },
  craftEchoText: {
    color: "#d9c9a7",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  storeSection: {
    gap: 8,
    width: "100%",
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
    width: "100%",
  },
  leaderboardList: {
    gap: 7,
    marginTop: 6,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(198, 156, 95, 0.32)",
    backgroundColor: "rgba(54, 33, 18, 0.56)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  leaderRowPlayer: {
    borderColor: "rgba(133, 193, 255, 0.72)",
    backgroundColor: "rgba(26, 54, 94, 0.6)",
  },
  leaderRank: {
    color: "#ffe2ad",
    fontSize: 12,
    fontWeight: "900",
    width: 28,
  },
  leaderAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255, 223, 173, 0.54)",
  },
  leaderText: {
    flex: 1,
    minWidth: 0,
  },
  leaderName: {
    color: "#f8e7c2",
    fontSize: 12,
    fontWeight: "800",
  },
  leaderMeta: {
    color: "#cfbb95",
    fontSize: 10,
    fontWeight: "700",
  },
  floorEncounterCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(211, 170, 105, 0.58)",
    backgroundColor: "rgba(58, 31, 70, 0.62)",
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 7,
  },
  floorEncounterHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  floorEncounterAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 220, 163, 0.6)",
  },
  floorEncounterText: {
    flex: 1,
    minWidth: 0,
  },
  floorEncounterName: {
    color: "#ffe6b8",
    fontSize: 13,
    fontWeight: "900",
  },
  floorEncounterMeta: {
    color: "#d2c0a0",
    fontSize: 10,
    fontWeight: "700",
  },
  floorEncounterActions: {
    flexDirection: "row",
    gap: 8,
  },
  conditionalEncounterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 178, 102, 0.62)",
    backgroundColor: "rgba(66, 29, 80, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 7,
    marginBottom: 8,
  },
  eventAcceptedPill: {
    borderColor: "rgba(132, 227, 162, 0.6)",
    backgroundColor: "rgba(20, 75, 45, 0.45)",
  },
  eventDeclinedPill: {
    borderColor: "rgba(255, 165, 165, 0.6)",
    backgroundColor: "rgba(90, 35, 45, 0.45)",
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
  towerSceneBanner: {
    height: 138,
    borderRadius: 11,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#9e7a47",
    marginBottom: 8,
    justifyContent: "flex-end",
  },
  towerSceneOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  towerFloorHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  towerFloorHeadMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  towerLevelPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    backgroundColor: "rgba(70, 52, 24, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerRankPill: {
    backgroundColor: "rgba(68, 49, 93, 0.94)",
    borderColor: "rgba(180, 141, 255, 0.42)",
  },
  towerLevelPillText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  towerStageRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  towerStagePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(201, 161, 91, 0.45)",
    backgroundColor: "rgba(44, 31, 18, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerStagePillDone: {
    borderColor: "#e6bb77",
    backgroundColor: "rgba(120, 84, 29, 0.7)",
  },
  towerStagePillText: {
    color: "#f3e4c2",
    fontSize: 10,
    fontWeight: "800",
  },
  towerCombatHudCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 186, 118, 0.7)",
    backgroundColor: "rgba(33, 24, 49, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 7,
    overflow: "hidden",
    position: "relative",
  },
  towerHudHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  towerHudWaveTag: {
    marginLeft: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c5a06d",
    backgroundColor: "rgba(88, 63, 31, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerHudWaveTagText: {
    color: "#f9e6bb",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.35,
  },
  towerHudMeterBlock: {
    gap: 4,
  },
  towerHudMeterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  towerHudLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  towerHudLabel: {
    color: "#e8d8b8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  towerHudValue: {
    color: "#ffe8c0",
    fontSize: 11,
    fontWeight: "800",
  },
  towerStatusFxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  towerStatusIconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  towerStatusIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  towerStatusIconBadgeGood: {
    borderColor: "rgba(103, 199, 144, 0.85)",
    backgroundColor: "rgba(26, 84, 58, 0.72)",
  },
  towerStatusIconBadgeBad: {
    borderColor: "rgba(210, 111, 122, 0.86)",
    backgroundColor: "rgba(88, 33, 46, 0.76)",
  },
  towerStatusIconBadgeNeutral: {
    borderColor: "rgba(191, 161, 112, 0.8)",
    backgroundColor: "rgba(72, 54, 31, 0.72)",
  },
  towerStatusIconImage: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  towerStatusIconCountBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    minWidth: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(229, 200, 143, 0.9)",
    backgroundColor: "rgba(45, 27, 18, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  towerStatusIconCountText: {
    color: "#ffe8bc",
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 9,
  },
  towerStatusFxChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  towerStatusFxChipGood: {
    borderColor: "rgba(103, 199, 144, 0.85)",
    backgroundColor: "rgba(26, 84, 58, 0.72)",
  },
  towerStatusFxChipBad: {
    borderColor: "rgba(210, 111, 122, 0.86)",
    backgroundColor: "rgba(88, 33, 46, 0.76)",
  },
  towerStatusFxChipNeutral: {
    borderColor: "rgba(191, 161, 112, 0.8)",
    backgroundColor: "rgba(72, 54, 31, 0.72)",
  },
  towerStatusFxText: {
    color: "#f2e4c3",
    fontSize: 10,
    fontWeight: "800",
  },
  towerIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf: "center",
    width: "100%",
  },
  towerIconChip: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#f1c876",
    backgroundColor: "rgba(176, 120, 44, 0.34)",
    shadowColor: "#ffd98a",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  towerChipSprite: {
    width: 24,
    height: 24,
  },
  waveHeaderIcon: {
    width: 16,
    height: 16,
  },
  towerChipLegend: {
    marginTop: -1,
    color: "#c3af88",
    fontSize: 10,
    fontWeight: "700",
  },
  towerDropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  towerScoutWrap: {
    gap: 10,
    width: "100%",
    alignItems: "center",
  },
  towerScoutHeroCard: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(223, 185, 113, 0.62)",
    backgroundColor: "rgba(41, 28, 56, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  towerScoutHeroHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  towerScoutEyebrow: {
    color: "#d3b383",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  towerScoutStatePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 218, 158, 0.55)",
    backgroundColor: "rgba(87, 59, 26, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  towerScoutStateText: {
    color: "#ffe7bd",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  towerScoutStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  towerScoutStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(196, 156, 93, 0.6)",
    backgroundColor: "rgba(63, 43, 22, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  towerScoutStatText: {
    color: "#f3dfbb",
    fontSize: 10,
    fontWeight: "800",
  },
  towerScoutGrid: {
    gap: 10,
    width: "100%",
    alignSelf: "stretch",
  },
  towerScoutCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(164, 129, 75, 0.58)",
    backgroundColor: "rgba(36, 28, 47, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  towerScoutCardBody: {
    gap: 10,
  },
  towerScoutCardBodyWide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  towerScoutCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  towerScoutCardHeadRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  towerScoutCardTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  towerScoutCountPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(155, 196, 255, 0.38)",
    backgroundColor: "rgba(30, 46, 70, 0.74)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerScoutCountText: {
    color: "#d3e9ff",
    fontSize: 10,
    fontWeight: "800",
  },
  towerScoutEnemyStage: {
    gap: 8,
  },
  towerScoutEnemyStageWide: {
    flex: 1.15,
    minWidth: 360,
  },
  towerScoutIntelStage: {
    gap: 8,
  },
  towerScoutIntelStageWide: {
    flex: 0.95,
    minWidth: 0,
    alignSelf: "stretch",
  },
  enemyRosterRowScout: {
    alignSelf: "stretch",
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: 14,
  },
  towerScoutUtilityGrid: {
    alignSelf: "stretch",
  },
  towerScoutUtilityGridWide: {
    gap: 10,
    rowGap: 10,
  },
  towerSupplyCardScoutWide: {
    minWidth: 84,
    maxWidth: 96,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  towerScoutFootnote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 127, 73, 0.58)",
    backgroundColor: "rgba(40, 28, 22, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  towerDropIconCard: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(46, 33, 21, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  towerDropLegendaryGlow: {
    shadowColor: "#ffc66f",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
    backgroundColor: "rgba(255, 191, 106, 0.2)",
  },
  appraisalGlowSmall: {
    shadowColor: "#95a6ff",
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    borderColor: "#8aa2ff",
  },
  towerDropGradeBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(16, 22, 44, 0.97)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  towerDropGradeText: {
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 10,
  },
  towerDropQtyBadge: {
    position: "absolute",
    left: -4,
    top: -4,
    minWidth: 20,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9a7b48",
    backgroundColor: "rgba(68, 50, 27, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  towerDropQtyText: {
    color: "#ffe4b0",
    fontSize: 8,
    fontWeight: "900",
  },
  towerSupplyIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9a7b48",
    backgroundColor: "rgba(54, 40, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  towerSupplyCard: {
    width: 72,
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 0,
    gap: 3,
  },
  towerSupplyStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  towerSupplyOwnedText: {
    color: "#cdb88f",
    fontSize: 9,
    fontWeight: "800",
  },
  towerLockedPreview: {
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(203, 164, 93, 0.6)",
    backgroundColor: "rgba(51, 36, 22, 0.84)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  infoModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bf9351",
    backgroundColor: "rgba(35, 24, 54, 0.98)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  infoModalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  infoModalHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  infoModalTitle: {
    color: "#ffeec9",
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },
  infoRarityPill: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(14, 18, 34, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  infoRarityText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  infoItemShowcase: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 7,
  },
  infoItemIconWrap: {
    width: 188,
    height: 188,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ba9258",
    backgroundColor: "rgba(21, 16, 34, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoItemArt: {
    width: "92%",
    height: "92%",
  },
  infoItemDescriptionCard: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(154, 124, 76, 0.55)",
    backgroundColor: "rgba(24, 18, 39, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  infoItemDescriptionTitle: {
    color: "#ffd58f",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoItemDescriptionText: {
    color: "#f2e2be",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  infoModalBodyWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(154, 124, 76, 0.5)",
    backgroundColor: "rgba(26, 18, 40, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  infoModalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  infoModalLabel: {
    color: "#cdb48a",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  infoModalValue: {
    color: "#f3e3bf",
    fontSize: 11,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
  },
  infoModalBody: {
    color: "#e9d8b2",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  expandedArtOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 8, 17, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  expandedArtCard: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
    gap: 12,
  },
  expandedArtTitle: {
    color: "#fff0ca",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  expandedArtRarityPill: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(14, 18, 34, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expandedArtRarityText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  expandedArtImage: {
    width: "100%",
    height: 420,
  },
  expandedArtHint: {
    color: "#d6c29d",
    fontSize: 11,
    fontWeight: "700",
  },
  legendaryTextGlow: {
    textShadowColor: "rgba(255, 204, 116, 0.7)",
    textShadowRadius: 6,
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
  storeSubtabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  storeSubtabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8d6b3c",
    backgroundColor: "rgba(52, 37, 21, 0.72)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  storeSubtabButtonActive: {
    borderColor: "#d7b072",
    backgroundColor: "rgba(104, 73, 28, 0.9)",
  },
  storeSubtabText: {
    color: "#bda77a",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  storeSubtabTextActive: {
    color: "#f9e5bf",
  },
  intelRevealRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intelRevealChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(195, 160, 97, 0.55)",
    backgroundColor: "rgba(58, 42, 24, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  intelRevealChipText: {
    color: "#f3e3bf",
    fontSize: 11,
    fontWeight: "800",
  },
  deskNavCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8a6a3c",
    backgroundColor: "rgba(33, 24, 44, 0.96)",
    padding: 10,
    gap: 8,
    overflow: "hidden",
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  deskNavRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  deskNpcChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8f7244",
    backgroundColor: "rgba(52, 37, 22, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  deskNpcAvatar: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b7925b",
    backgroundColor: "rgba(30, 22, 14, 0.9)",
  },
  deskNpcChipText: {
    color: "#f0ddb9",
    fontSize: 10,
    fontWeight: "800",
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
  recipeCard: {
    alignItems: "flex-start",
  },
  recipeBlueprint: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  recipeBlueprintSigil: {
    position: "absolute",
    alignSelf: "center",
    top: 4,
  },
  recipeOutputPanel: {
    width: 150,
    borderRadius: 14,
    backgroundColor: "rgba(49, 36, 18, 0.86)",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  recipeIngredientPanel: {
    flex: 1,
    paddingVertical: 4,
    gap: 8,
  },
  recipePanelLabel: {
    color: "#d3bc92",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  recipeOutputIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "rgba(24, 18, 33, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeOutputName: {
    color: "#f5e7c8",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  recipeTypePill: {
    minWidth: 28,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  recipeLockedPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b68c5a",
    backgroundColor: "rgba(64, 47, 29, 0.82)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  recipeLockedPillText: {
    color: "#f0ddbb",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  recipeArrowWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  offerImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a4814c",
    backgroundColor: "rgba(31, 23, 41, 0.94)",
  },
  offerInspectArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offerVisualWrap: {
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  offerWeaponArt: {
    width: 108,
    height: 108,
  },
  offerWeaponArtHero: {
    width: 132,
    height: 132,
  },
  legendaryGlow: {
    shadowColor: "#ffd67a",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    borderRadius: 12,
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
    alignSelf: "stretch",
    justifyContent: "center",
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
  storeSellPrice: {
    color: "#9edfb5",
    fontSize: 10,
    fontWeight: "800",
  },
  appraisalGlow: {
    shadowColor: "#95a6ff",
    shadowOpacity: 0.82,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
    backgroundColor: "rgba(96, 112, 206, 0.08)",
  },
  storeEmptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8c6a3f",
    backgroundColor: "rgba(52, 37, 21, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storeEmptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  offerLore: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  recipeIngredientRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recipeIngredientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  recipeIngredientTile: {
    width: 122,
    minWidth: 122,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(41, 30, 55, 0.58)",
    gap: 4,
    alignItems: "center",
  },
  recipeIngredientTileThird: {
    alignSelf: "center",
  },
  recipeIngredientTileReady: {
    borderColor: "rgba(118, 224, 146, 0.72)",
  },
  recipeIngredientTileMissing: {
    borderColor: "rgba(255, 158, 169, 0.65)",
  },
  recipeIngredientTileName: {
    color: "#f3e2b5",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  recipeIngredientTileCount: {
    color: "#cdb892",
    fontSize: 10,
    fontWeight: "700",
  },
  recipeUnlockText: {
    color: "#d7c099",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
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
  towerEntryButton: {
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#76d5ff",
    backgroundColor: "rgba(20, 88, 122, 0.98)",
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#66d4ff",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  towerWaveActionButton: {
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffcf84",
    backgroundColor: "rgba(165, 85, 20, 0.98)",
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#ffb25f",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  towerWaveActionButtonDisabled: {
    borderColor: "rgba(193, 124, 84, 0.55)",
    backgroundColor: "rgba(72, 46, 31, 0.98)",
    shadowOpacity: 0,
  },
  towerPrimaryActionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  towerPrimaryActionText: {
    color: "#fff7e8",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.35,
  },
  sellButton: {
    minWidth: 54,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#69bc8e",
    backgroundColor: "rgba(25, 83, 55, 0.92)",
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
  questUrgencyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c88466",
    backgroundColor: "rgba(92, 45, 31, 0.82)",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  questUrgencyText: {
    flex: 1,
    color: "#ffe4c1",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
  },
  questCriticalTimerHero: {
    alignSelf: "center",
    minWidth: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d89d72",
    backgroundColor: "rgba(76, 31, 28, 0.9)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  questCriticalTimerLabel: {
    color: "#ffdcb0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  questCriticalTimerValue: {
    color: "#fff1dc",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  questCriticalTimerMini: {
    alignSelf: "center",
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 157, 114, 0.8)",
    backgroundColor: "rgba(72, 31, 30, 0.84)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  questCriticalTimerMiniLabel: {
    color: "#ffd6aa",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  questCriticalTimerMiniValue: {
    color: "#fff0dd",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  specialQuestWaveList: {
    gap: 10,
  },
  specialQuestWaveCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(197, 142, 85, 0.62)",
    backgroundColor: "rgba(44, 28, 52, 0.88)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  specialQuestWaveCardCompact: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(182, 136, 82, 0.48)",
    backgroundColor: "rgba(36, 24, 47, 0.82)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  specialQuestWaveHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  specialQuestWaveLabel: {
    color: "#f6cfa4",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  specialQuestWaveTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  specialQuestWaveStatePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  specialQuestWaveStatePillClear: {
    borderColor: "#90e2b1",
    backgroundColor: "rgba(28, 73, 47, 0.86)",
  },
  specialQuestWaveStatePillActive: {
    borderColor: "#ffcc8a",
    backgroundColor: "rgba(104, 63, 29, 0.86)",
  },
  specialQuestWaveStatePillLocked: {
    borderColor: "rgba(176, 141, 90, 0.5)",
    backgroundColor: "rgba(44, 33, 22, 0.7)",
  },
  specialQuestWaveStateText: {
    color: "#fff0d2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  specialQuestEnemyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  specialQuestEnemyCard: {
    minWidth: 150,
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(187, 145, 87, 0.52)",
    backgroundColor: "rgba(32, 22, 41, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  specialQuestEnemyPortraitWrap: {
    width: "100%",
    height: 128,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(53, 31, 22, 0.72)",
  },
  specialQuestEnemyPortrait: {
    width: "100%",
    height: "100%",
  },
  specialQuestEnemyName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  specialQuestEnemyRole: {
    color: "#d9bd93",
    fontSize: 11,
    fontWeight: "700",
  },
  specialQuestEnemyHpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specialQuestEnemyHp: {
    color: "#ffd9d9",
    fontSize: 12,
    fontWeight: "800",
  },
  skillPrimeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c59859",
    backgroundColor: "rgba(57, 35, 74, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 9,
    overflow: "hidden",
    position: "relative",
  },
  skillPrimeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skillPrimeIconRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    maxWidth: 120,
  },
  skillPrimeAbilityList: {
    gap: 4,
  },
  skillPrimeAbilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skillPrimeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c99c57",
    backgroundColor: "rgba(88, 57, 24, 0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  skillPrimeTextWrap: {
    flex: 1,
    gap: 2,
  },
  skillPrimeLabel: {
    color: "#ebcd93",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  skillPrimeName: {
    color: "#ffe9bf",
    fontSize: 15,
    fontWeight: "900",
  },
  skillPrimeMeta: {
    color: "#d6c2ee",
    fontSize: 11,
    fontWeight: "700",
  },
  skillPrimeBonusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  skillPrimeBonusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b98d4f",
    backgroundColor: "rgba(84, 54, 24, 0.88)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  skillPrimeBonusText: {
    color: "#ffe8c4",
    fontSize: 11,
    fontWeight: "800",
  },
});
