import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { GameItemIcon } from "../components/GameItemIcon";
import { IconTooltip } from "../components/IconTooltip";
import { ProgressBar } from "../components/ProgressBar";
import { GUILD_STORE_ITEMS } from "../data/guildStore";
import { HUD_ASSETS } from "../data/hudAssets";
import { ITEM_BY_ID } from "../data/items";
import { GUILD_CORE_NPCS, getExaminerForRank, GuildNpcProfile } from "../data/guildPersonnel";
import { QUEST_BACKGROUND_ART } from "../data/questVisuals";
import { getMaxRankForLevel } from "../data/rankProgression";
import { TOWER_BACKGROUND_ART } from "../data/towerVisuals";
import { TITLES } from "../data/titles";
import { TITLE_ICON_ART } from "../data/titleVisuals";
import { CURRENCY_SPRITES, QUEST_TYPE_SPRITE, getAvatarSprite } from "../data/uiSprites";
import { ABILITY_BY_ID } from "../data/abilities";
import { getPendingAbilityBonuses, getPendingAbilityComboSummary } from "../lib/abilities";
import { getBuffRemainingSeconds, isBuffActive } from "../lib/buffs";
import { getCharacterCombatStats } from "../lib/combat";
import { s3AssetWithFallback } from "../lib/assetSource";
import { calculateTowerMechanicPressure } from "../services/gameService";
import {
  ActiveQuestState,
  AdventurerRank,
  BaseClassId,
  CharacterState,
  ItemId,
  ItemRarity,
  QuestDefinition,
  QuestOutcome,
  RankUpOutcome,
  RankUpTrialDefinition,
  RescueNpcStatus,
  TowerFloorDefinition,
  TowerEnemyUnit,
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
  requestGuildMageRecovery: () => { ok: boolean; reason?: string };
  onActivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onDeactivateBuff: (itemId: string) => { ok: boolean; reason?: string };
  onStartQuest: (questId: string, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  onClaimQuest: () => { ok: boolean; reason?: string };
  onConquerTowerFloor: (floorNumber: number, committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  onAttemptRankUp: (committedItems?: Record<ItemId, number>) => { ok: boolean; reason?: string };
  rescueNpcStatus: RescueNpcStatus;
  npcUnreadCount: number;
  onNpcTabOpened: () => void;
  onRespondRescueNpcRequest: (accept: boolean) => { ok: boolean; reason?: string; status?: RescueNpcStatus };
}

type GuildTab = "board" | "store" | "tower" | "npc" | "rank";

type BoardRankFilter = "all" | AdventurerRank;
type BoardTypeFilter = "all" | QuestDefinition["type"];

const RANK_ORDER: AdventurerRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];

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
  "f1-gate-sentinel": s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_12.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_12.png")),
  "f1-warden-of-sparks": s3AssetWithFallback("ui/source/vol6/Combo Objects/Combo Objects_17.png", require("../../assets/ui/source/vol6/Combo Objects/Combo Objects_17.png")),
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
const GUILD_MAGE_NPC_ID = "npc-mage-seraphine";
const QUARTERMASTER_BRAN_NPC_ID = "npc-quartermaster-bran";

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
  requestGuildMageRecovery,
  onActivateBuff,
  onDeactivateBuff,
  onStartQuest,
  onClaimQuest,
  onConquerTowerFloor,
  onAttemptRankUp,
  rescueNpcStatus,
  npcUnreadCount,
  onNpcTabOpened,
  onRespondRescueNpcRequest,
}: QuestsScreenProps) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [isBuying, setIsBuying] = useState(false);
  const [lastPurchasedItemId, setLastPurchasedItemId] = useState<string | null>(null);
  const [lastPurchaseText, setLastPurchaseText] = useState("");
  const [questResultOpen, setQuestResultOpen] = useState(false);
  const [pendingQuestResultOpen, setPendingQuestResultOpen] = useState(false);
  const [towerEncounterOpen, setTowerEncounterOpen] = useState(false);
  const [pendingTowerEncounterOpen, setPendingTowerEncounterOpen] = useState(false);
  const [revealedTowerPhases, setRevealedTowerPhases] = useState(0);
  const [guildTab, setGuildTab] = useState<GuildTab>("npc");
  const [selectedItemsByQuest, setSelectedItemsByQuest] = useState<Record<string, Record<ItemId, number>>>({});
  const [selectedItemsForRankTrial, setSelectedItemsForRankTrial] = useState<Record<ItemId, number>>({});
  const [selectedItemsForTower, setSelectedItemsForTower] = useState<Record<string, Record<ItemId, number>>>({});
  const [selectedTowerEnemy, setSelectedTowerEnemy] = useState<TowerEnemyUnit | null>(null);
  const [rescueDialogOpen, setRescueDialogOpen] = useState(false);
  const [guildDialog, setGuildDialog] = useState<"bran-store" | "examiner-rank" | null>(null);
  const [branSpeakCount, setBranSpeakCount] = useState(0);
  const [examinerSpeakCount, setExaminerSpeakCount] = useState(0);
  const [branDialogLine, setBranDialogLine] = useState(BRAN_STORE_DIALOG_LINES[0]);
  const [examinerDialogLine, setExaminerDialogLine] = useState(EXAMINER_NOT_READY_DIALOG_LINES[0]);
  const [infoPanel, setInfoPanel] = useState<{ title: string; body: string; rarity?: ItemRarity; itemId?: ItemId } | null>(null);
  const [boardRankFilter, setBoardRankFilter] = useState<BoardRankFilter>("all");
  const [boardTypeFilter, setBoardTypeFilter] = useState<BoardTypeFilter>("all");

  const getTowerEnemyArt = (enemy: TowerEnemyUnit): ImageSourcePropType | undefined => TOWER_ENEMY_ART[enemy.id];
  const rescueNpcVisible = rescueNpcStatus === "available" || rescueNpcStatus === "refused_once" || rescueNpcStatus === "accepted";
  const warriorPathGuideVisible =
    character.classId === "warrior" &&
    character.progression.level >= 15 &&
    !character.warriorPathChoice;
  const rankExaminerProfile = getExaminerForRank(character.adventurerRank);
  const npcProfiles = useMemo(
    () => {
      const profiles = [...GUILD_CORE_NPCS, rankExaminerProfile];
      if (warriorPathGuideVisible) {
        profiles.push(WARRIOR_PATH_GUIDE_NPC_PROFILE);
      }
      if (rescueNpcVisible) {
        profiles.push(RESCUE_REQUEST_NPC_PROFILE);
      }
      return profiles;
    },
    [rankExaminerProfile, rescueNpcVisible, warriorPathGuideVisible],
  );
  const branProfile = GUILD_CORE_NPCS.find((npc) => npc.id === QUARTERMASTER_BRAN_NPC_ID) ?? null;

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
    if (!lastQuestOutcome || !pendingQuestResultOpen) {
      return;
    }
    setQuestResultOpen(true);
    setPendingQuestResultOpen(false);
  }, [lastQuestOutcome, pendingQuestResultOpen]);
  useEffect(() => {
    if (!lastTowerOutcome || !pendingTowerEncounterOpen) {
      return;
    }
    setTowerEncounterOpen(true);
    setRevealedTowerPhases(0);
    setPendingTowerEncounterOpen(false);
  }, [lastTowerOutcome, pendingTowerEncounterOpen]);
  useEffect(() => {
    if (!towerEncounterOpen || !lastTowerOutcome?.phaseResults?.length) {
      return;
    }
    if (revealedTowerPhases >= lastTowerOutcome.phaseResults.length) {
      return;
    }
    const timer = setTimeout(() => {
      setRevealedTowerPhases((current) => current + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [towerEncounterOpen, lastTowerOutcome, revealedTowerPhases]);

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
        .filter((quest) => visibleRanks.includes(quest.rank))
        .filter((quest) => (boardRankFilter === "all" ? true : quest.rank === boardRankFilter))
        .filter((quest) => (boardTypeFilter === "all" ? true : quest.type === boardTypeFilter))
        .sort((a, b) => {
          const rankDelta = RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
          if (rankDelta !== 0) {
            return rankDelta;
          }
          return a.minLevel - b.minLevel;
        }),
    [quests, visibleRanks, boardRankFilter, boardTypeFilter],
  );
  useEffect(() => {
    if (boardRankFilter !== "all" && !visibleRanks.includes(boardRankFilter)) {
      setBoardRankFilter("all");
    }
  }, [boardRankFilter, visibleRanks]);

  const isQuestReadyToClaim = Boolean(activeQuest && nowMs >= activeQuest.endsAtMs);
  const remainingMs = activeQuest ? Math.max(0, activeQuest.endsAtMs - nowMs) : 0;
  const activeDurationMs = activeQuest ? activeQuest.endsAtMs - activeQuest.startedAtMs : 0;
  const elapsedRatio = activeQuest
    ? Math.max(0, Math.min(1, (activeDurationMs - remainingMs) / Math.max(1, activeDurationMs)))
    : 0;

  const handleStartQuest = (questId: string) => {
    const selectedItems = selectedItemsByQuest[questId] ?? {};
    const result = onStartQuest(questId, selectedItems);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? (result.reason?.trim() || "Quest accepted.") : result.reason ?? "Could not start quest.");
    if (result.ok) {
      setSelectedItemsByQuest((current) => {
        const next = { ...current };
        delete next[questId];
        return next;
      });
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

  const getTowerCommittedCount = (floorId: string, itemId: ItemId): number =>
    selectedItemsForTower[floorId]?.[itemId] ?? 0;

  const adjustTowerCommittedItem = (
    floorId: string,
    itemId: ItemId,
    delta: number,
    maxAllowed: number,
    owned: number,
  ) => {
    setSelectedItemsForTower((current) => {
      const floorSelection = { ...(current[floorId] ?? {}) };
      const currentAmount = floorSelection[itemId] ?? 0;
      const nextAmount = Math.max(0, Math.min(maxAllowed, Math.min(owned, currentAmount + delta)));
      if (nextAmount <= 0) {
        delete floorSelection[itemId];
      } else {
        floorSelection[itemId] = nextAmount;
      }
      return {
        ...current,
        [floorId]: floorSelection,
      };
    });
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
  const handleSell = (itemId: string, unitPrice: number) => {
    if (isBuying) {
      return;
    }
    setIsBuying(true);
    const result = sellGuildItem(itemId, unitPrice, 1);
    const itemName = ITEM_BY_ID[itemId]?.name ?? itemId;
    const sellUnitPrice = Math.max(1, Math.floor(unitPrice * 0.5));
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.ok ? `Sold: ${itemName} for ${sellUnitPrice}g.` : result.reason ?? "Could not sell.");
    if (result.ok) {
      setLastPurchaseText(`Sold ${itemName} for ${sellUnitPrice}g`);
    }
    setTimeout(() => setIsBuying(false), 450);
  };
  const handleGuildMageRecovery = () => {
    const result = requestGuildMageRecovery();
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Guild mage recovery complete." : "Could not request guild mage recovery."));
  };
  const handleRescueNpcChoice = (accept: boolean) => {
    const result = onRespondRescueNpcRequest(accept);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Response recorded." : "Could not respond."));
    if (result.status === "accepted" || result.status === "gone") {
      setRescueDialogOpen(false);
    }
  };
  const handleConquerTowerFloor = (floorNumber: number) => {
    const floorKey = `floor-${floorNumber}`;
    const selectedItems = selectedItemsForTower[floorKey] ?? {};
    const result = onConquerTowerFloor(floorNumber, selectedItems);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Floor challenge completed." : "Could not challenge floor."));
    if (result.ok) {
      setPendingTowerEncounterOpen(true);
      setSelectedItemsForTower((current) => {
        const next = { ...current };
        delete next[floorKey];
        return next;
      });
    }
  };
  const handleAttemptRankUp = () => {
    const result = onAttemptRankUp(selectedItemsForRankTrial);
    setNoticeTone(result.ok ? "ok" : "error");
    setNotice(result.reason ?? (result.ok ? "Rank trial resolved." : "Could not start rank trial."));
    if (result.ok) {
      setSelectedItemsForRankTrial({});
    }
  };
  const openStoreDesk = () => {
    setGuildTab("store");
    setNoticeTone("ok");
    setNotice("Bran Kest: Supplies in stock. Buy what you need, and sell what you don't.");
  };
  const promptStoreVisit = () => {
    setBranSpeakCount((prev) => {
      const next = prev + 1;
      setBranDialogLine(pickEscalatingDialog(BRAN_STORE_DIALOG_LINES, next));
      return next;
    });
    setGuildDialog("bran-store");
  };
  const handleBranDialogChoice = (openStore: boolean) => {
    setGuildDialog(null);
    if (openStore) {
      openStoreDesk();
      return;
    }
    setNoticeTone("ok");
    setNotice("Bran Kest: I'll keep the stock ready for your next run.");
  };
  const promptRankVisit = () => {
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
    setGuildDialog(null);
    if (openDesk) {
      openRankDesk();
      return;
    }
    setNoticeTone("ok");
    setNotice(`Examiner ${rankExaminerProfile.name}: Return when your preparation is complete.`);
  };
  const returnToNpcHall = () => {
    setGuildTab("npc");
    setNoticeTone("ok");
    setNotice("Returned to NPC Hall.");
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
  const showQuickInfo = (title: string, body: string, rarity?: ItemRarity, itemId?: ItemId) => {
    const itemDescription = itemId ? ITEM_BY_ID[itemId]?.description : undefined;
    const nextBody =
      itemDescription && !body.toLowerCase().includes("use:")
        ? `${body}\nUse: ${itemDescription}`
        : body;
    setNoticeTone("ok");
    setNotice(`${title}: ${nextBody}`);
    setInfoPanel({ title, body: nextBody, rarity, itemId });
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
  const rankTrial = getNextRankTrial();
  const rankTrialAccess = getRankTrialAccess();
  const rankTrialChance = getRankTrialSuccessChance(selectedItemsForRankTrial);
  const rankUpAvailable = rankTrialAccess.allowed;
  const examinerReadyForTrial = Boolean(rankTrial && rankTrialAccess.allowed);
  const questHealthGate = Math.ceil(character.healthCap * 0.5);
  const isDead = character.health <= 0;
  const questHealthLocked = character.health > 0 && character.health < questHealthGate;
  const canRequestGuildMage = isDead && character.progression.level > 1;
  const healthPercent = Math.round((character.health / Math.max(1, character.healthCap)) * 100);
  const towerOutcomeFloor = lastTowerOutcome
    ? towerFloors.find((floor) => floor.floorNumber === lastTowerOutcome.floorNumber) ?? null
    : null;
  const primedAbilityIds = character.pendingAbilityIds ?? (character.pendingAbilityId ? [character.pendingAbilityId] : []);
  const primedAbilities = primedAbilityIds
    .map((abilityId) => ABILITY_BY_ID[abilityId])
    .filter(Boolean);
  const pendingAbilityBonuses = getPendingAbilityBonuses(character);
  const pendingComboSummary = getPendingAbilityComboSummary(character);
  const weaponProficiency =
    equippedWeapon?.category === "weapon"
      ? character.progression.level >= (equippedWeapon.requiredLevel ?? 1)
        ? 100
        : 25
      : 0;
  const getNpcSummaryText = (npc: GuildNpcProfile): string => {
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
      return rescueNpcStatus === "accepted"
        ? "Aldric remains in the guild while the rescue operation is active."
        : "A father asks for your help rescuing his daughter from nearby bandits.";
    }
    if (npc.id === WARRIOR_PATH_GUIDE_NPC_PROFILE.id) {
      return "Your Level 15 specialization mentor is now available in the NPC Hall.";
    }
    if (npc.id === GUILD_MAGE_NPC_ID) {
      return isDead
        ? "You are at 0 HP. Interact with this license to revive outside the tower."
        : "Revival service activates only when your HP is 0.";
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID) {
      return "Quartermaster Bran manages the guild store. Buy gear, supplies, and sell materials through this desk.";
    }
    if (rankTrial && npc.id === rankExaminerProfile.id) {
      return `Assigned examiner for ${rankTrial.fromRank} -> ${rankTrial.toRank} promotion trial.`;
    }
    return "Guild operations personnel. Additional interactions unlock as systems expand.";
  };
  const getNpcTypeChips = (npc: GuildNpcProfile): Array<{ icon: string; color: string; text: string; itemId?: ItemId }> => {
    if (npc.id === RESCUE_REQUEST_NPC_PROFILE.id) {
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
        { icon: "heart-plus", color: "#ffb8ac", text: "Revive To Full HP", itemId: "health-potion" },
        { icon: "flash-outline", color: "#ffd48f", text: "Cost: Level -1" },
        { icon: "shield-star-outline", color: "#a8d2ff", text: "Arcane License: Active", itemId: "ward-charm" },
        { icon: "lifebuoy", color: "#ffc47d", text: "Emergency Tower Rescue" },
      ];
    }
    if (npc.id === QUARTERMASTER_BRAN_NPC_ID) {
      return [
        { icon: "storefront-outline", color: "#ffd48f", text: "Guild Store Access" },
        { icon: "sack", color: "#9ce8c2", text: "Buy / Sell Materials" },
        { icon: "sword-cross", color: "#a8d2ff", text: "Weapon Inventory" },
        { icon: "flask-outline", color: "#d0b4ff", text: "Buff & Potion Supply" },
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
              setGuildTab("npc");
              onNpcTabOpened();
            }}
            style={[styles.guildTabWrap, guildTab === "npc" ? styles.guildTabWrapActive : null]}
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
              {npcUnreadCount > 0 ? (
                <View style={styles.guildTabBadge}>
                  <Text style={styles.guildTabBadgeText}>{Math.min(9, npcUnreadCount)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
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
            onPress={() => setGuildTab("store")}
            style={[styles.guildTabWrap, guildTab === "store" ? styles.guildTabWrapActive : null]}
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
            onPress={() => setGuildTab("tower")}
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
        </View>

        <View style={styles.licenseRow}>
          <MaterialCommunityIcons name="badge-account-horizontal-outline" size={15} color={colors.gold} />
          <Text style={styles.licenseText}>
            Adventurer Rank: {character.adventurerRank} • Level {character.progression.level}
          </Text>
        </View>
        <View style={styles.healthBanner}>
          <View style={styles.healthBannerHead}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color="#ff9aa5" />
            <Text style={styles.healthBannerTitle}>HP</Text>
            <Text style={styles.healthBannerValue}>
              {character.health}/{character.healthCap}
            </Text>
          </View>
          <ProgressBar value={healthPercent} max={100} />
          <Text style={styles.healthBannerMeta}>Combat Health • Keep this high for tower pushes</Text>
        </View>
        {rankUpAvailable ? (
          <Pressable
            onPress={() => {
              setGuildTab("npc");
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
        {npcUnreadCount > 0 ? (
          <Pressable
            onPress={() => {
              setGuildTab("npc");
              onNpcTabOpened();
            }}
            style={styles.storyAlertButton}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={15} color="#ffe8b2" />
            <Text style={styles.storyAlertText}>Guild Alert: An NPC is looking for help in the NPC Hall.</Text>
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
                      ? `Quest Lock: Incapacitated at HP 0/${character.healthCap}`
                      : `Quest Lock: HP ${character.health}/${character.healthCap} (need ${questHealthGate}+)`}
                  </Text>
                </View>
                <Text style={styles.questMeta}>
                  {isDead
                    ? "You are incapacitated. Visit Guild NPC and interact with the 10th-circle mage license to revive."
                    : "You cannot start quests below 50% HP. Buy/use Health Potion, sell items for gold, or visit Guild NPC."}
                </Text>
              </View>
            ) : null}

            {boardVisibleQuests.map((quest) => {
              const selectedItems = selectedItemsByQuest[quest.id] ?? {};
              const successChance = getQuestSuccessChance(quest.id, selectedItems);
              const access = getQuestAccess(quest.id);
              const blocked = !access.allowed;
              const questArt = QUEST_BACKGROUND_ART[quest.id];
              const isSpecialQuest = quest.id === SPECIAL_RESCUE_QUEST_ID;
              const titleTrails = TITLES.filter(
                (title) => title.unlockRequirement?.type === "quest_starts" && title.unlockRequirement.questId === quest.id,
              );
              return (
                <View key={quest.id} style={[styles.questCard, isSpecialQuest ? styles.specialQuestCard : null]}>
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
                    ) : null}
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
                      <Image source={CURRENCY_SPRITES.stamina} style={styles.chipSprite} resizeMode="contain" />
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
                        {isDead ? "Incapacitated" : questHealthLocked ? "Need 50% HP" : blocked ? "Locked" : activeQuest ? "On a Quest" : "Take This Quest"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
            {boardVisibleQuests.length === 0 ? (
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
                      <GameItemIcon itemId={entry.itemId} size={38} />
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
                    <GameItemIcon itemId={entry.itemId} size={24} />
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
                    <Image source={CURRENCY_SPRITES.stamina} style={styles.chipSprite} resizeMode="contain" />
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
                const towerSelectionKey = `floor-${currentTowerFloor.floorNumber}`;
                const towerSelectedItems = selectedItemsForTower[towerSelectionKey] ?? {};
                const successChance = getTowerSuccessChance(currentTowerFloor.floorNumber, towerSelectedItems);
                const access = getTowerAccess(currentTowerFloor.floorNumber);
                const blocked = !access.allowed;
                const towerEnemies = getTowerEnemiesForFloor(currentTowerFloor);
                const mechanicPressure = calculateTowerMechanicPressure(character, currentTowerFloor, towerSelectedItems);
                const towerArt = TOWER_BACKGROUND_ART[currentTowerFloor.id];
                const totalRecommended = currentTowerFloor.recommendedItems.reduce(
                  (sum, requirement) => sum + requirement.needed,
                  0,
                );
                const committedRecommended = currentTowerFloor.recommendedItems.reduce((sum, requirement) => {
                  const committed = towerSelectedItems[requirement.itemId] ?? 0;
                  return sum + Math.min(requirement.needed, committed);
                }, 0);
                const supplyReadiness = totalRecommended <= 0 ? 0 : Math.round((committedRecommended / totalRecommended) * 100);
                const threatScore =
                  mechanicPressure.normalPhasePenalty +
                  mechanicPressure.subBossPhasePenalty +
                  mechanicPressure.bossPhasePenalty;
                const threatLabel = threatScore <= 10 ? "Low" : threatScore <= 22 ? "Medium" : "High";

                return (
                  <View style={styles.towerProgressCard}>
                    {towerArt ? (
                      <ImageBackground source={towerArt.backdrop} style={styles.towerSceneBanner} resizeMode="cover">
                        <LinearGradient
                          pointerEvents="none"
                          colors={towerArt.overlay}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.towerSceneOverlay}
                        />
                        <View style={styles.questSceneLabelWrap}>
                          <MaterialCommunityIcons name="castle" size={12} color="#ffe5ad" />
                          <Text style={styles.questSceneLabel}>{towerArt.sceneLabel}</Text>
                        </View>
                      </ImageBackground>
                    ) : null}
                    <View style={styles.towerFloorHead}>
                      <Text style={styles.questTitle}>Floor {currentTowerFloor.floorNumber}: {currentTowerFloor.title}</Text>
                      <View style={styles.towerLevelPill}>
                        <Text style={styles.towerLevelPillText}>Lv {currentTowerFloor.minLevel}+</Text>
                      </View>
                    </View>

                    <View style={styles.towerIconGrid}>
                      <Pressable
                        onPress={() => showQuickInfo("Stamina Cost", `${currentTowerFloor.staminaCost}`)}
                        style={styles.towerIconChip}
                      >
                        <Image source={CURRENCY_SPRITES.stamina} style={styles.towerChipSprite} resizeMode="contain" />
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

                    <View style={styles.meterBlock}>
                      <View style={styles.meterLabelRow}>
                        <Text style={styles.meterLabel}>Floor Clear Chance</Text>
                        <Text style={styles.meterLabel}>{successChance}%</Text>
                      </View>
                      <ProgressBar value={successChance} max={100} />
                    </View>
                    <View style={styles.towerIconGrid}>
                      <Pressable
                        onPress={() => showQuickInfo("Supply Readiness", `${supplyReadiness}%`)}
                        style={styles.towerIconChip}
                      >
                        <GameItemIcon itemId="rope" size={18} />
                      </Pressable>
                      <Pressable
                        onPress={() => showQuickInfo("Mechanic Threat", threatLabel)}
                        style={styles.towerIconChip}
                      >
                        <GameItemIcon itemId="grounding-tonic" size={18} />
                      </Pressable>
                    </View>

                    <Text style={styles.reqTitle}>Recommended Supplies</Text>
                    <View style={styles.towerDropGrid}>
                      {currentTowerFloor.recommendedItems.map((requirement) => {
                        const item = ITEM_BY_ID[requirement.itemId];
                        const itemRarity = item?.rarity ?? "common";
                        const owned = character.inventory[requirement.itemId] ?? 0;
                        const committed = getTowerCommittedCount(towerSelectionKey, requirement.itemId);
                        const satisfied = committed >= requirement.needed;
                        const questSources = getQuestSourcesForItem(requirement.itemId);
                        return (
                          <View
                            key={`${currentTowerFloor.id}-${requirement.itemId}`}
                            style={[styles.towerSupplyCard, { borderColor: rarityColorMap[itemRarity] }]}
                          >
                            <Pressable
                              onPress={() =>
                                showQuickInfo(
                                  item?.name ?? requirement.itemId,
                                  `Loaded: ${committed}/${requirement.needed}\nOwned: ${owned}${questSources.length > 0 ? `\nFarm in quests: ${questSources.join(" / ")}` : ""}`,
                                  itemRarity,
                                  requirement.itemId,
                                )
                              }
                              style={[styles.towerSupplyIconButton, { borderColor: rarityColorMap[itemRarity] }]}
                            >
                              <GameItemIcon itemId={requirement.itemId} size={24} />
                            </Pressable>
                            <View style={[styles.towerDropGradeBadge, { borderColor: rarityColorMap[itemRarity] }]}>
                              <Text style={[styles.towerDropGradeText, { color: rarityColorMap[itemRarity] }]}>
                                {itemRarity.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.towerSupplyStepperRow}>
                              <Pressable
                                onPress={() =>
                                  adjustTowerCommittedItem(
                                    towerSelectionKey,
                                    requirement.itemId,
                                    -1,
                                    requirement.needed,
                                    owned,
                                  )
                                }
                                style={styles.stepperButton}
                              >
                                <Text style={styles.stepperButtonText}>-</Text>
                              </Pressable>
                              <Text style={[styles.reqText, satisfied ? styles.reqOk : styles.reqMiss]}>
                                {committed}/{requirement.needed}
                              </Text>
                              <Pressable
                                onPress={() =>
                                  adjustTowerCommittedItem(
                                    towerSelectionKey,
                                    requirement.itemId,
                                    1,
                                    requirement.needed,
                                    owned,
                                  )
                                }
                                style={styles.stepperButton}
                              >
                                <Text style={styles.stepperButtonText}>+</Text>
                              </Pressable>
                            </View>
                            <Text style={styles.towerSupplyOwnedText}>Owned {owned}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {currentTowerFloor.guaranteedItemRewards && currentTowerFloor.guaranteedItemRewards.length > 0 ? (
                      <View style={styles.requirementsBlock}>
                        <Text style={styles.reqTitle}>Guaranteed Monster Parts</Text>
                        <View style={styles.towerDropGrid}>
                          {currentTowerFloor.guaranteedItemRewards.map((reward) => {
                            const rewardItem = ITEM_BY_ID[reward.itemId];
                            const rewardRarity = rewardItem?.rarity ?? "common";
                            return (
                              <Pressable
                                key={`${currentTowerFloor.id}-guaranteed-${reward.itemId}`}
                                style={[
                                  styles.towerDropIconCard,
                                  { borderColor: rarityColorMap[rewardRarity] },
                                  rewardRarity === "legendary" ? styles.towerDropLegendaryGlow : null,
                                ]}
                                onPress={() =>
                                  showQuickInfo(
                                    rewardItem?.name ?? reward.itemId,
                                    `Drop Type: Guaranteed\nAmount: x${reward.amount}`,
                                    rewardRarity,
                                    reward.itemId,
                                  )
                                }
                              >
                                <GameItemIcon itemId={reward.itemId} size={24} />
                                <View style={[styles.towerDropGradeBadge, { borderColor: rarityColorMap[rewardRarity] }]}>
                                  <Text style={[styles.towerDropGradeText, { color: rarityColorMap[rewardRarity] }]}>
                                    {rewardRarity.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.towerDropQtyBadge}>
                                  <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}

                    {currentTowerFloor.bonusItemRewards && currentTowerFloor.bonusItemRewards.length > 0 ? (
                      <View style={styles.requirementsBlock}>
                        <Text style={styles.reqTitle}>Possible Floor Drops</Text>
                        <View style={styles.towerDropGrid}>
                          {currentTowerFloor.bonusItemRewards.map((reward) => {
                            const rewardItem = ITEM_BY_ID[reward.itemId];
                            const rewardRarity = rewardItem?.rarity ?? "common";
                            return (
                              <Pressable
                                key={`${currentTowerFloor.id}-drop-${reward.itemId}`}
                                style={[
                                  styles.towerDropIconCard,
                                  { borderColor: rarityColorMap[rewardRarity] },
                                  rewardRarity === "legendary" ? styles.towerDropLegendaryGlow : null,
                                ]}
                                onPress={() =>
                                  showQuickInfo(
                                    rewardItem?.name ?? reward.itemId,
                                    `Drop Chance: ${Math.round(reward.chance * 100)}%\nAmount: x${reward.amount}`,
                                    rewardRarity,
                                    reward.itemId,
                                  )
                                }
                              >
                                <GameItemIcon itemId={reward.itemId} size={24} />
                                <View style={[styles.towerDropGradeBadge, { borderColor: rarityColorMap[rewardRarity] }]}>
                                  <Text style={[styles.towerDropGradeText, { color: rarityColorMap[rewardRarity] }]}>
                                    {rewardRarity.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.towerDropQtyBadge}>
                                  <Text style={styles.towerDropQtyText}>x{reward.amount}</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}

                    <Text style={styles.reqTitle}>Enemy Waves</Text>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.normal} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Normal</Text>
                      </View>
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
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.subBoss} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Sub-Boss</Text>
                      </View>
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
                    </View>
                    <View style={styles.waveBlock}>
                      <View style={styles.waveHeader}>
                        <Image source={TOWER_ENEMY_ROLE_ART.boss} style={styles.waveHeaderIcon} resizeMode="contain" />
                        <Text style={styles.reqTitle}>Main Boss</Text>
                      </View>
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
                        <Text style={styles.startText}>{blocked ? (isDead ? "Incapacitated" : "Locked") : "Conquer Floor"}</Text>
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
                {typeof lastTowerOutcome.healthDelta === "number" ? (
                  <Text style={styles.outcomeText}>
                    Health {lastTowerOutcome.healthDelta > 0 ? "+" : ""}{lastTowerOutcome.healthDelta}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : guildTab === "npc" ? (
          <View style={styles.storeShell}>
            {npcProfiles.map((npc) => (
              <View key={npc.id} style={styles.npcCard}>
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
                  <ImageBackground source={HUD_ASSETS.badges.rank} style={styles.rankSeal} resizeMode="contain">
                    <Text style={styles.rankSealLabel}>Rank</Text>
                    <Text style={styles.rankSealValue}>{getMaxRankForLevel(npc.level)}</Text>
                  </ImageBackground>
                </View>
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
                  <View style={styles.npcLevelBadge}>
                    <Text style={styles.npcLevelBadgeLabel}>Level</Text>
                    <Text style={styles.npcLevelBadgeValue}>{npc.level}</Text>
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
                <Text style={styles.questMeta}>{getNpcSummaryText(npc)}</Text>
                {npc.id === RESCUE_REQUEST_NPC_PROFILE.id ? (
                  rescueNpcStatus === "accepted" ? (
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
                        {npc.id === GUILD_MAGE_NPC_ID
                          ? canRequestGuildMage
                            ? "Interact: Revival Rite"
                            : "Revival Unavailable"
                          : "No Active Interaction"}
                      </Text>
                    </View>
                  </Pressable>
                )}
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
                      <GameItemIcon itemId="part-sentinel-core" size={12} />
                      <Text style={styles.rewardChipText}>Quests {completedQuestCount}/{rankTrial.minQuestClears}</Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <Image source={CURRENCY_SPRITES.stamina} style={styles.chipSprite} resizeMode="contain" />
                      <Text style={styles.rewardChipText}>{rankTrial.staminaCost}</Text>
                    </View>
                  </View>
                  <View style={styles.meterBlock}>
                    <View style={styles.meterLabelRow}>
                      <Text style={styles.meterLabel}>Promotion Success Chance</Text>
                      <Text style={styles.meterLabel}>{rankTrialChance}%</Text>
                    </View>
                    <ProgressBar value={rankTrialChance} max={100} />
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
              <ScrollView
                style={styles.encounterScroll}
                contentContainerStyle={styles.encounterScrollContent}
                showsVerticalScrollIndicator={false}
              >
              <Text style={styles.resultChance}>Progression: Normal {"->"} Sub-Boss {"->"} Boss</Text>
              <View style={styles.encounterHealthCard}>
                <View style={styles.encounterHealthHead}>
                  <MaterialCommunityIcons name="heart-pulse" size={16} color="#ff9aa5" />
                  <Text style={styles.reqTitle}>Current HP</Text>
                  <Text style={styles.encounterHealthValue}>
                    {character.health}/{character.healthCap}
                  </Text>
                  {typeof lastTowerOutcome.healthDelta === "number" ? (
                    <View
                      style={[
                        styles.encounterDeltaPill,
                        lastTowerOutcome.healthDelta < 0 ? styles.encounterDeltaPillLoss : styles.encounterDeltaPillGain,
                      ]}
                    >
                      <Text style={styles.encounterDeltaText}>
                        {lastTowerOutcome.healthDelta > 0 ? "+" : ""}
                        {lastTowerOutcome.healthDelta}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <ProgressBar value={Math.round((character.health / Math.max(1, character.healthCap)) * 100)} max={100} />
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
                          {phaseEntries.map((entry, entryIndex) => (
                            <View key={`effect-enemy-${phaseConfig.phase}-${entry.enemyName}-${entryIndex}`} style={styles.effectEnemyCard}>
                              <View style={styles.effectHead}>
                                <MaterialCommunityIcons
                                  name={entry.enemyIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                                  size={15}
                                  color={phaseConfig.color}
                                />
                                <Text style={styles.effectEnemy} numberOfLines={1}>
                                  {entry.enemyName}
                                </Text>
                                <View style={[styles.towerPhaseResultPill, styles.towerPhaseResultOk]}>
                                  <Text style={styles.towerPhaseResultText}>ENGAGED</Text>
                                </View>
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
                          ))}
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
              <Pressable onPress={() => setTowerEncounterOpen(false)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {infoPanel ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setInfoPanel(null)}>
          <View style={styles.resultOverlay}>
            <View style={styles.infoModalCard}>
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
                  <Text style={styles.infoModalTitle}>{infoPanel.title}</Text>
                </View>
                {infoPanel.rarity ? (
                  <View style={[styles.infoRarityPill, { borderColor: rarityColorMap[infoPanel.rarity] }]}>
                    <Text style={[styles.infoRarityText, { color: rarityColorMap[infoPanel.rarity] }]}>
                      {infoPanel.rarity.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                <Pressable onPress={() => setInfoPanel(null)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#f1d8a8" />
                </Pressable>
              </View>
              {infoPanel.itemId ? (
                <View style={styles.infoItemShowcase}>
                  <View
                    style={[
                      styles.infoItemIconWrap,
                      infoPanel.rarity ? { borderColor: rarityColorMap[infoPanel.rarity] } : null,
                    ]}
                  >
                    <GameItemIcon itemId={infoPanel.itemId} size={54} />
                  </View>
                  {ITEM_BY_ID[infoPanel.itemId]?.description ? (
                    <View style={styles.infoItemDescriptionCard}>
                      <Text style={styles.infoItemDescriptionTitle}>Use</Text>
                      <Text style={styles.infoItemDescriptionText}>{ITEM_BY_ID[infoPanel.itemId]?.description}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.infoModalBodyWrap}>
                {infoPanel.body.split("\n").map((line) => {
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
              <Pressable onPress={() => setInfoPanel(null)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {selectedTowerEnemy ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTowerEnemy(null)}
        >
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              {getTowerEnemyArt(selectedTowerEnemy) ? (
                <View style={styles.enemyModalPortrait}>
                  <View style={styles.enemyModalPortraitFrame}>
                    <Image
                      source={getTowerEnemyArt(selectedTowerEnemy)}
                      style={styles.enemyModalPortraitImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : null}
              <Text style={styles.resultTitle}>{selectedTowerEnemy.name}</Text>
              <View style={styles.enemyMetaRow}>
                <View style={styles.enemyMetaChip}>
                  <View style={styles.enemyModalThumbWrap}>
                    <MaterialCommunityIcons
                      name={selectedTowerEnemy.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={16}
                      color="#ffd27d"
                    />
                  </View>
                  <Text style={styles.enemyMetaText}>Lv {selectedTowerEnemy.level}</Text>
                </View>
                <View style={styles.enemyMetaChip}>
                  <MaterialCommunityIcons name="heart-pulse" size={14} color="#ff9aa5" />
                  <Text style={styles.enemyMetaText}>HP {selectedTowerEnemy.health}</Text>
                </View>
                <View style={styles.enemyMetaChip}>
                  <MaterialCommunityIcons name="information-outline" size={14} color="#8ec8ff" />
                  <Text style={styles.enemyMetaText}>
                    {selectedTowerEnemy.role === "boss"
                      ? "Main Boss"
                      : selectedTowerEnemy.role === "subBoss"
                        ? "Sub-Boss"
                        : "Normal Enemy"}
                  </Text>
                </View>
              </View>
              <Text style={styles.outcomeText}>{selectedTowerEnemy.description}</Text>
              {selectedTowerEnemy.mechanics && selectedTowerEnemy.mechanics.length > 0 ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.reqTitle}>Mechanics</Text>
                  {selectedTowerEnemy.mechanics.map((mechanic) => (
                    <View key={`${selectedTowerEnemy.id}-${mechanic}`} style={styles.reqItem}>
                      <MaterialCommunityIcons name="star-four-points-outline" size={12} color="#ffd27d" />
                      <Text style={styles.reqText}>{mechanic}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Pressable onPress={() => setSelectedTowerEnemy(null)} style={styles.actionWrap}>
                <View style={styles.claimButton}>
                  <Text style={styles.claimText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {rescueDialogOpen ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setRescueDialogOpen(false)}>
          <View style={styles.resultOverlay}>
            <View style={styles.resultModal}>
              <Text style={styles.resultTitle}>Aldric Vale</Text>
              <Text style={styles.outcomeText}>
                {rescueNpcStatus === "refused_once"
                  ? "\"Please... I beg you one last time. My daughter is still alive. Help me bring her home.\""
                  : "\"Bandits took my daughter at dusk near Watchtrail. I need a capable adventurer right now.\""}
              </Text>
              <View style={styles.dualActionRow}>
                <Pressable onPress={() => handleRescueNpcChoice(false)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceRefuseButton]}>
                    <Text style={styles.dialogChoiceText}>Refuse</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => handleRescueNpcChoice(true)} style={styles.dualActionButton}>
                  <View style={[styles.dialogChoiceButton, styles.dialogChoiceAcceptButton]}>
                    <Text style={styles.dialogChoiceText}>Accept Request</Text>
                  </View>
                </Pressable>
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
              <View style={styles.npcDialogHeader}>
                <Image
                  source={branProfile?.avatarOverride ?? getAvatarSprite("ranger-3", "ranger")}
                  style={styles.npcDialogAvatar}
                  resizeMode="cover"
                />
                <View style={styles.npcDialogTextWrap}>
                  <Text style={styles.resultTitle}>Quartermaster Bran</Text>
                  <Text style={styles.resultChance}>Guild Supply Desk</Text>
                </View>
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
              <View style={styles.npcDialogHeader}>
                <Image
                  source={rankExaminerProfile.avatarOverride ?? getAvatarSprite(rankExaminerProfile.avatarId, rankExaminerProfile.classId)}
                  style={styles.npcDialogAvatar}
                  resizeMode="cover"
                />
                <View style={styles.npcDialogTextWrap}>
                  <Text style={styles.resultTitle}>Examiner {rankExaminerProfile.name}</Text>
                  <Text style={styles.resultChance}>Guild Rank Office</Text>
                </View>
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
  boardNavCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8f7243",
    backgroundColor: "rgba(38, 28, 46, 0.96)",
    padding: 10,
    gap: 7,
    overflow: "hidden",
    position: "relative",
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
  healthLockCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a45f67",
    backgroundColor: "rgba(67, 29, 42, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
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
  npcDialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8d6f40",
    backgroundColor: "rgba(52, 38, 23, 0.92)",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  npcDialogAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b68f53",
    backgroundColor: "rgba(29, 21, 13, 0.9)",
  },
  npcDialogTextWrap: {
    flex: 1,
    gap: 1,
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
  },
  enemyCard: {
    width: 106,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a98148",
    backgroundColor: "rgba(58, 40, 21, 0.9)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  enemyCardElite: {
    width: 106,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d28f71",
    backgroundColor: "rgba(82, 43, 29, 0.92)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  enemyCardBoss: {
    width: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8ad64",
    backgroundColor: "rgba(96, 53, 22, 0.94)",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  enemyPortrait: {
    width: 74,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 190, 129, 0.55)",
    backgroundColor: "rgba(28, 18, 40, 0.88)",
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
    height: 130,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8f7244",
    backgroundColor: "rgba(26, 18, 39, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  enemyModalPortraitFrame: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9a7a45",
    backgroundColor: "rgba(40, 28, 20, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  enemyModalPortraitImage: {
    width: 94,
    height: 94,
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
  towerLevelPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.panelBorderSoft,
    backgroundColor: "rgba(70, 52, 24, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  towerLevelPillText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  towerIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "flex-start",
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
    width: 92,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(46, 33, 21, 0.92)",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
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
    width: 88,
    height: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ba9258",
    backgroundColor: "rgba(21, 16, 34, 0.9)",
    alignItems: "center",
    justifyContent: "center",
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
  deskNavCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8a6a3c",
    backgroundColor: "rgba(33, 24, 44, 0.96)",
    padding: 10,
    gap: 8,
    overflow: "hidden",
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
  storeSellPrice: {
    color: "#9edfb5",
    fontSize: 10,
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
