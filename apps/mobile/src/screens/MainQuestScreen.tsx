import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { ProgressBar } from "../components/ProgressBar";
import { QUESTS } from "../data/quests";
import { ActiveQuestState, CharacterState, MainQuestTracker, QuestDefinition, QuestThreadState, StoryState } from "../types/game";
import { colors } from "../theme/colors";

type JournalTab = "main" | "side" | "hunt" | "wanted";

interface MainQuestScreenProps {
  tracker: MainQuestTracker;
  storyState: StoryState;
  character: CharacterState;
  quests: QuestDefinition[];
  activeQuest: ActiveQuestState | null;
  unreadCount: number;
  onAcknowledgeUpdates: () => void;
}

const SIDE_QUEST_IDS = new Set([
  "quest-aldric-child-rescue",
  "quest-lyra-ember-maps",
  "quest-tamsin-snagline-recovery",
]);

type SideQuestEntry = {
  id: string;
  title: string;
  state: QuestThreadState;
  status: string;
  summary: string;
  done: string[];
  pending: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const SIDE_QUEST_STATE_PRESENTATION: Record<
  QuestThreadState,
  { status: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  discovered: { status: "Discovered", color: "#c8b7d8", icon: "compass-outline" },
  available: { status: "Available", color: "#8ec8ff", icon: "script-text-outline" },
  accepted: { status: "Accepted", color: "#9dd7ff", icon: "handshake-outline" },
  active: { status: "Active", color: "#ffd58f", icon: "sword-cross" },
  paused: { status: "Paused", color: "#c8b7d8", icon: "pause-circle-outline" },
  follow_up: { status: "Follow-Up", color: "#ffd58f", icon: "book-clock-outline" },
  timed_out: { status: "Timed Out", color: "#c9a6ff", icon: "timer-sand-empty" },
  failed: { status: "Failed", color: "#ffb18f", icon: "close-octagon-outline" },
  refused: { status: "Refused", color: "#ff9a9a", icon: "close-octagon-outline" },
  completed: { status: "Completed", color: "#8fe4b0", icon: "check-circle-outline" },
  archived: { status: "Archived", color: "#c8b7d8", icon: "archive-outline" },
};

const buildSideQuestEntry = (
  base: Omit<SideQuestEntry, "status" | "color" | "icon">,
): SideQuestEntry => {
  const presentation = SIDE_QUEST_STATE_PRESENTATION[base.state];
  return {
    ...base,
    status: presentation.status,
    color: presentation.color,
    icon: presentation.icon,
  };
};

export const MainQuestScreen = ({
  tracker,
  storyState,
  character,
  quests,
  activeQuest,
  unreadCount,
  onAcknowledgeUpdates,
}: MainQuestScreenProps) => {
  const [journalTab, setJournalTab] = useState<JournalTab>("main");
  const [expandedSideQuestIds, setExpandedSideQuestIds] = useState<string[]>([]);
  const stageRatio = Math.max(1, tracker.progressIndex);
  const recentLog = storyState.mainQuestLog.slice(0, 5);
  const sideQuestDefinitions = useMemo(
    () => QUESTS.filter((quest) => SIDE_QUEST_IDS.has(quest.id)),
    [],
  );
  const sideQuestEntries = useMemo<SideQuestEntry[]>(() => {
    return sideQuestDefinitions.flatMap((quest) => {
      if (quest.id === "quest-aldric-child-rescue") {
        const completed = (character.alliedNpcIds ?? []).includes("ally-aldric-vale");
        const active = activeQuest?.questId === quest.id;
        const tooLate = storyState.aldricQuestPath === "too_late";
        const refused = storyState.aldricQuestPath === "refused";
        const accepted = storyState.rescueNpcStatus === "accepted" && !active && !completed && !tooLate;
        const available = storyState.rescueNpcStatus === "available" || storyState.rescueNpcStatus === "refused_once";
        const visible =
          completed ||
          tooLate ||
          refused ||
          active ||
          accepted ||
          available;
        if (!visible) {
          return [];
        }
        const state: QuestThreadState = completed
          ? "completed"
          : tooLate
            ? "timed_out"
            : refused
              ? "refused"
              : active
                ? "active"
                : accepted
                  ? "accepted"
                  : available
                    ? "available"
                    : "discovered";
        return [buildSideQuestEntry({
          id: quest.id,
          title: quest.title,
          state,
          summary: completed
            ? "You saved Aldric's daughter, and the plea became a lasting bond."
            : tooLate
              ? "You accepted Aldric's plea, but the rescue window closed and the loss changed him."
              : refused
                ? "You refused Aldric's plea. The request is over, but the consequence is not."
                : accepted
                  ? "You committed to Aldric's plea. The rescue thread is now yours to act on before it slips."
                  : "A father in the guild hall begging for help after bandits took his daughter.",
          done: completed
            ? [
                "Heard Aldric's plea in the NPC Hall.",
                "Accepted his rescue request.",
                "Completed the rescue and brought his daughter home.",
              ]
            : tooLate
              ? [
                  "Heard Aldric's plea in the NPC Hall.",
                  "Accepted his rescue request.",
                  "Reached the trail too late. Aldric's daughter was lost.",
                ]
              : refused
                ? [
                    "Heard Aldric's plea in the NPC Hall.",
                    "Refused the rescue request until Aldric left the hall.",
                  ]
              : accepted || active
              ? [
                  "Heard Aldric's plea in the NPC Hall.",
                  "Accepted his rescue request.",
                ]
              : storyState.rescueNpcStatus === "refused_once"
                ? [
                    "Heard Aldric's plea in the NPC Hall.",
                    "Refused him once. He is still waiting.",
                  ]
                : storyState.rescueNpcStatus === "available"
                  ? ["Aldric's plea is waiting in the NPC Hall."]
                  : [],
          pending: completed
            ? "No pending step. This thread is complete."
            : tooLate
              ? "??"
            : refused
              ? "??"
            : active
              ? "Resolve Aldric Vale's Child Rescue from the Guild board."
              : accepted
                ? "Start Aldric Vale's Child Rescue from the Guild board before the rescue window expires."
                : storyState.rescueNpcStatus === "refused_once"
                  ? "Return to Aldric in the NPC Hall if you want to reconsider."
                  : "Meet Aldric in the NPC Hall first.",
        })];
      }
      if (quest.id === "quest-lyra-ember-maps") {
        const completed = storyState.lyraQuestStatus === "completed";
        const active = activeQuest?.questId === quest.id;
        const available = storyState.lyraQuestStatus === "available";
        const unresolved = storyState.lyraQuestResolution === "unresolved";
        const discovered = storyState.lyraMet && !available && !active && !completed;
        const visible = completed || active || available || unresolved || discovered;
        if (!visible) {
          return [];
        }
        const state: QuestThreadState = unresolved
          ? "follow_up"
          : completed
            ? "completed"
            : active
              ? "active"
              : available
                ? "available"
                : "discovered";
        return [buildSideQuestEntry({
          id: quest.id,
          title: quest.title,
          state,
          summary: "A quiet scout thread tied to Lyra's ember satchel and the route notes hidden inside it.",
          done: completed
            ? [
                "Made real contact with Lyra Ashstep.",
                "Unlocked Lyra's Ember Map Recovery.",
                "Recovered Lyra's satchel.",
              ]
            : active
              ? [
                  "Made real contact with Lyra Ashstep.",
                  "Unlocked Lyra's Ember Map Recovery.",
                ]
              : available
                ? [
                    "Made real contact with Lyra Ashstep.",
                    "Unlocked Lyra's Ember Map Recovery.",
                  ]
                : discovered
                  ? ["Made real contact with Lyra Ashstep."]
                  : [],
          pending: unresolved
            ? "Choose what to do with Lyra's recovered satchel."
            : completed
              ? "No pending step. Wait for the consequences of your decision to surface later."
            : active
              ? "Resolve Lyra's Ember Map Recovery from the Guild board."
            : available
              ? "Start Lyra's Ember Map Recovery from the Guild board."
              : "Meet Lyra properly through the Floor 1 climb first.",
        })];
      }
      const completed = storyState.thornRunnerQuestStatus === "completed";
      const followupReviewed = storyState.thornRunnerFollowupReviewed;
      const corridorReportReady = storyState.thornRunnerCorridorReportReady;
      const corridorReportReviewed = storyState.thornRunnerCorridorReportReviewed;
      const deepLaneWarningReady = storyState.thornRunnerDeepLaneWarningReady;
      const deepLaneWarningReviewed = storyState.thornRunnerDeepLaneWarningReviewed;
      const floorTwoAftermathReady = storyState.thornRunnerFloorTwoAftermathReady;
      const floorTwoAftermathReviewed = storyState.thornRunnerFloorTwoAftermathReviewed;
      const active = activeQuest?.questId === quest.id;
      const available = storyState.thornRunnerQuestStatus === "available";
      const accepted = Boolean(storyState.thornRunnerIntroductionChoice) && !active && !completed;
      const visible =
        completed ||
        active ||
        accepted ||
        available ||
        corridorReportReady ||
        corridorReportReviewed ||
        deepLaneWarningReady ||
        deepLaneWarningReviewed ||
        floorTwoAftermathReady ||
        floorTwoAftermathReviewed;
      if (!visible) {
        return [];
      }
      const state: QuestThreadState = floorTwoAftermathReady
        ? "follow_up"
        : deepLaneWarningReady
        ? "follow_up"
        : corridorReportReady
        ? "follow_up"
        : completed
          ? followupReviewed && corridorReportReviewed
            ? deepLaneWarningReviewed
              ? floorTwoAftermathReviewed
              ? "completed"
              : "follow_up"
              : "follow_up"
            : "follow_up"
        : active
          ? "active"
          : accepted
            ? "accepted"
            : available
              ? "available"
              : "discovered";
      return [buildSideQuestEntry({
        id: quest.id,
        title: quest.title,
        state,
        summary: "A thorn-lane contract from Tamsin Vale to recover a broken snagline record and the satchel tied to it.",
        done: completed
          ? [
              "Reached Floor 2 readiness.",
              "Met Tamsin Vale in the NPC Hall.",
              "Unlocked Tamsin's Snagline Recovery.",
              "Completed the snagline contract.",
              ...(followupReviewed ? ["Reviewed Tamsin's thorn notes in the NPC Hall."] : []),
              ...(corridorReportReviewed ? ["Filed your first Thorn Corridor field report with Tamsin."] : []),
              ...(deepLaneWarningReviewed ? ["Reviewed Tamsin's deeper corridor warning after breaking the execution lane."] : []),
              ...(floorTwoAftermathReviewed ? ["Closed Thorn Corridor's first-clear aftermath with Tamsin in the NPC Hall."] : []),
            ]
          : active
            ? [
              "Reached Floor 2 readiness.",
              "Met Tamsin Vale in the NPC Hall.",
              "Unlocked Tamsin's Snagline Recovery.",
            ]
            : accepted
              ? storyState.thornRunnerIntroductionChoice
                ? [
                    "Reached Floor 2 readiness.",
                    "Met Tamsin Vale in the NPC Hall.",
                    "Unlocked Tamsin's Snagline Recovery.",
                  ]
                : ["Reached Floor 2 readiness.", "Met Tamsin Vale in the NPC Hall."]
              : available
                ? ["Reached Floor 2 readiness.", "Met Tamsin Vale in the NPC Hall."]
                : [],
        pending: floorTwoAftermathReady
          ? "Return to Tamsin in the NPC Hall and close the ledger on your first full Thorn Corridor clear."
          : deepLaneWarningReady
          ? "Return to Tamsin in the NPC Hall and review her deeper corridor warning before you commit harder into Floor 2's lower lane."
          : corridorReportReady
          ? "Return to Tamsin in the NPC Hall and file your first report from inside Thorn Corridor."
          : completed
            ? followupReviewed && corridorReportReviewed && deepLaneWarningReviewed && floorTwoAftermathReviewed
              ? "No pending step. This thread is complete."
              : !followupReviewed
                ? "Return to Tamsin in the NPC Hall to review the notes she pulled from the recovered satchel."
                : !corridorReportReviewed
                  ? "Enter Thorn Corridor once, then return to Tamsin with your first real corridor report."
                  : !deepLaneWarningReviewed
                    ? "Push deeper into Floor 2, then return when Tamsin marks the next real change in the corridor."
                    : !floorTwoAftermathReviewed
                      ? "Clear Floor 2, then return to Tamsin so she can close the Thorn Corridor ledger with you."
                  : "Push deeper into Floor 2, then return when Tamsin marks the next real change in the lane."
          : active
            ? "Resolve Tamsin's Snagline Recovery from the Guild board."
            : accepted
              ? storyState.thornRunnerIntroductionChoice
                ? "Start Tamsin's Snagline Recovery from the Guild board."
                : "Hear Tamsin's thorn briefing in the NPC Hall."
              : available
                ? "Hear Tamsin's thorn briefing in the NPC Hall."
              : "Clear Floor 1 first. Tamsin opens corridor work once the climb has actually reached Thorn Corridor's shadow.",
      })];
    });
  }, [activeQuest, character.alliedNpcIds, sideQuestDefinitions, storyState]);

  const renderJournalTabs = () => (
    <View style={styles.tabRow}>
      {([
        { id: "main", label: "Main Quest", icon: "book-open-page-variant-outline" },
        { id: "side", label: "Side Quest", icon: "account-group-outline" },
        { id: "hunt", label: "Hunt", icon: "target-account" },
        { id: "wanted", label: "Wanted", icon: "account-alert-outline" },
      ] as Array<{ id: JournalTab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }>).map((tab) => {
        const active = journalTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => setJournalTab(tab.id)}
            style={[styles.journalTab, active ? styles.journalTabActive : null]}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={16}
              color={active ? "#fff1d0" : "#cfba91"}
            />
            <Text style={[styles.journalTabText, active ? styles.journalTabTextActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const toggleSideQuestExpanded = (questId: string) => {
    setExpandedSideQuestIds((current) =>
      current.includes(questId) ? current.filter((id) => id !== questId) : [...current, questId],
    );
  };

  const renderMainQuest = () => (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerFrame}>
          <Text style={styles.headerEyebrow}>Quest Journal</Text>
          <Text style={styles.headerTitle}>{tracker.title}</Text>
          <Text style={styles.headerChapter}>{tracker.chapter}</Text>
        </View>
        <View style={[styles.headerIconWrap, { borderColor: tracker.accent }]}>
          <MaterialCommunityIcons name={tracker.icon} size={30} color={tracker.accent} />
        </View>
      </View>

      <LinearGradient colors={["rgba(60,42,90,0.96)", "rgba(34,25,54,0.95)"]} style={styles.heroCard}>
        {unreadCount > 0 ? (
          <View style={styles.updateNoticeCard}>
            <View style={styles.updateNoticeTextWrap}>
              <Text style={styles.updateNoticeLabel}>New Chronicle Updates</Text>
              <Text style={styles.updateNoticeBody}>
                {unreadCount} {unreadCount === 1 ? "entry is" : "entries are"} waiting in your main quest log below.
              </Text>
            </View>
            <Pressable onPress={onAcknowledgeUpdates} style={styles.updateNoticeButton}>
              <Text style={styles.updateNoticeButtonText}>Mark Read</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.heroTopRow}>
          <View style={[styles.heroGlyph, { backgroundColor: `${tracker.accent}22`, borderColor: `${tracker.accent}88` }]}>
            <MaterialCommunityIcons name={tracker.icon} size={22} color={tracker.accent} />
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.heroChapter}>{tracker.chapter}</Text>
            <Text style={styles.heroDirective}>{tracker.currentDirective}</Text>
          </View>
        </View>
        <Text style={styles.heroSummary}>{tracker.summary}</Text>
        <View style={styles.progressBlock}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Chapter Progress</Text>
            <Text style={styles.progressValue}>
              Step {tracker.progressIndex}/{tracker.totalStages}
            </Text>
          </View>
          <ProgressBar value={stageRatio} max={tracker.totalStages} variant="chance" />
        </View>
        <View style={styles.stakesCard}>
          <MaterialCommunityIcons name="flare" size={18} color="#ffd47d" />
          <Text style={styles.stakesText}>{tracker.stakes}</Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Objectives</Text>
        {tracker.objectives.map((objective) => (
          <View key={objective.id} style={[styles.objectiveCard, objective.done ? styles.objectiveCardDone : null]}>
            <View style={[styles.objectiveIconWrap, objective.done ? styles.objectiveIconDone : null]}>
              <MaterialCommunityIcons
                name={objective.done ? "check-circle" : objective.icon}
                size={18}
                color={objective.done ? "#6ee7a5" : "#ffd584"}
              />
            </View>
            <View style={styles.objectiveTextWrap}>
              <Text style={styles.objectiveTitle}>{objective.label}</Text>
              <Text style={styles.objectiveDetail}>{objective.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quest Thread</Text>
        <View style={styles.threadPanel}>
          {tracker.objectives.map((objective, index) => (
            <View key={`${objective.id}-thread`} style={styles.threadRow}>
              <View style={styles.threadRail}>
                <View style={[styles.threadNode, objective.done ? styles.threadNodeDone : null]}>
                  <MaterialCommunityIcons
                    name={objective.done ? "check" : objective.icon}
                    size={14}
                    color={objective.done ? "#071611" : "#2a1d12"}
                  />
                </View>
                {index < tracker.objectives.length - 1 ? <View style={styles.threadLine} /> : null}
              </View>
              <View style={styles.threadTextWrap}>
                <Text style={styles.threadTitle}>{objective.label}</Text>
                <Text style={styles.threadStatus}>{objective.done ? "Completed" : "Active"}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Story Updates</Text>
        {recentLog.length > 0 ? (
          recentLog.map((entry) => (
            <View key={entry.id} style={styles.logCard}>
              <View style={styles.logIconWrap}>
                <MaterialCommunityIcons name={entry.icon} size={18} color="#ffd37b" />
              </View>
              <View style={styles.logTextWrap}>
                <Text style={styles.logChapter}>{entry.chapter}</Text>
                <Text style={styles.logTitle}>{entry.title}</Text>
                <Text style={styles.logMessage}>{entry.message}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.logEmpty}>
            <Text style={styles.logEmptyText}>Your main quest updates will collect here as the climb unfolds.</Text>
          </View>
        )}
      </View>
    </>
  );

  const renderSideQuest = () => (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerFrame}>
          <Text style={styles.headerEyebrow}>Quest Journal</Text>
          <Text style={styles.headerTitle}>Side Quest Ledger</Text>
          <Text style={styles.headerChapter}>Guild Threads, Favours, and Field Contacts</Text>
        </View>
        <View style={[styles.headerIconWrap, { borderColor: "#8ec8ff" }]}>
          <MaterialCommunityIcons name="account-group-outline" size={30} color="#8ec8ff" />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracked Side Quest Threads</Text>
        {sideQuestEntries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => toggleSideQuestExpanded(entry.id)}
            style={[styles.sideQuestCard, { borderColor: `${entry.color}88` }]}
          >
            <View style={styles.sideQuestHead}>
              <View style={[styles.sideQuestIconWrap, { borderColor: `${entry.color}88`, backgroundColor: `${entry.color}18` }]}>
                <MaterialCommunityIcons name={entry.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={entry.color} />
              </View>
              <View style={styles.sideQuestTextWrap}>
                <View style={styles.sideQuestTopRow}>
                  <Text style={styles.sideQuestTitle}>{entry.title}</Text>
                  <View style={[styles.sideQuestStatusPill, { borderColor: `${entry.color}88` }]}>
                    <Text style={[styles.sideQuestStatusText, { color: entry.color }]}>{entry.status}</Text>
                  </View>
                </View>
                <Text style={styles.sideQuestSummary}>{entry.summary}</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedSideQuestIds.includes(entry.id) ? "chevron-up" : "chevron-down"}
                size={18}
                color="#e7d4a5"
              />
            </View>
            {expandedSideQuestIds.includes(entry.id) ? (
              <View style={styles.sideQuestExpandedBlock}>
                <View style={styles.sideQuestInfoBlock}>
                  <Text style={styles.sideQuestInfoLabel}>Done</Text>
                  {entry.done.length > 0 ? (
                    entry.done.map((line) => (
                      <View key={`${entry.id}-done-${line}`} style={styles.sideQuestProgressRow}>
                        <MaterialCommunityIcons name="check-circle" size={13} color="#8fe4b0" />
                        <Text style={styles.sideQuestInfoText}>{line}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.sideQuestProgressRow}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color="#c8b7d8" />
                      <Text style={styles.sideQuestInfoText}>Nothing recorded yet.</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sideQuestInfoBlock}>
                  <Text style={styles.sideQuestInfoLabel}>Pending</Text>
                  <View style={styles.sideQuestProgressRow}>
                    <MaterialCommunityIcons name="progress-clock" size={13} color="#ffd58f" />
                    <Text style={styles.sideQuestInfoText}>{entry.pending}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </>
  );

  const renderPlaceholder = (
    title: string,
    chapter: string,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    accent: string,
    body: string,
  ) => (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerFrame}>
          <Text style={styles.headerEyebrow}>Quest Journal</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerChapter}>{chapter}</Text>
        </View>
        <View style={[styles.headerIconWrap, { borderColor: accent }]}>
          <MaterialCommunityIcons name={icon} size={30} color={accent} />
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.placeholderCard}>
          <MaterialCommunityIcons name={icon} size={26} color={accent} />
          <Text style={styles.placeholderTitle}>{title}</Text>
          <Text style={styles.placeholderBody}>{body}</Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop />
      <ScrollView contentContainerStyle={styles.content}>
        {renderJournalTabs()}
        {journalTab === "main"
          ? renderMainQuest()
          : journalTab === "side"
            ? renderSideQuest()
            : journalTab === "hunt"
              ? renderPlaceholder(
                  "Hunt Ledger",
                  "Field Hunts, monster contracts, and named prey",
                  "target-account",
                  "#d7b572",
                  "Hunt quests will track guild monster contracts and named targets here once the hunt board opens."
                )
              : renderPlaceholder(
                  "Wanted Ledger",
                  "Wanted adventurers, sanctions, and pursuit notices",
                  "account-alert-outline",
                  "#ff9ea9",
                  "Wanted contracts will gather here when the guild starts issuing sanctioned pursuit notices against dangerous adventurers."
                )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  journalTab: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(131, 102, 58, 0.7)",
    backgroundColor: "rgba(35, 28, 48, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  journalTabActive: {
    borderColor: "#d5a95b",
    backgroundColor: "rgba(88, 60, 25, 0.94)",
  },
  journalTabText: {
    color: "#cfba91",
    fontSize: 12,
    fontWeight: "800",
  },
  journalTabTextActive: {
    color: "#fff1d0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  headerFrame: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#8f6e36",
    backgroundColor: "rgba(74, 51, 22, 0.85)",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerEyebrow: {
    color: "#f4d189",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4,
  },
  headerChapter: {
    color: "#e5c99c",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(38, 29, 59, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(205, 165, 93, 0.72)",
    padding: 18,
    gap: 14,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  updateNoticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 168, 90, 0.72)",
    backgroundColor: "rgba(81, 53, 18, 0.72)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  updateNoticeTextWrap: {
    flex: 1,
    gap: 3,
  },
  updateNoticeLabel: {
    color: "#ffedc8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  updateNoticeBody: {
    color: "#ead9b7",
    fontSize: 12,
    lineHeight: 17,
  },
  updateNoticeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 223, 167, 0.7)",
    backgroundColor: "rgba(118, 81, 27, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  updateNoticeButtonText: {
    color: "#fff1d2",
    fontSize: 12,
    fontWeight: "900",
  },
  heroGlyph: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroChapter: {
    color: "#f2cf8d",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.15,
  },
  heroDirective: {
    color: "#fff0d0",
    fontSize: 17,
    fontWeight: "800",
  },
  heroSummary: {
    color: "#d6c4ea",
    fontSize: 14,
    lineHeight: 21,
  },
  progressBlock: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#f0d69c",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressValue: {
    color: "#ffeec8",
    fontSize: 12,
    fontWeight: "800",
  },
  stakesCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(216, 162, 87, 0.55)",
    backgroundColor: "rgba(87, 53, 21, 0.66)",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stakesText: {
    color: "#ffe7bf",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  section: {
    gap: 12,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  sectionTitle: {
    color: "#fff0d1",
    fontSize: 22,
    fontWeight: "900",
  },
  objectiveCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143, 111, 57, 0.74)",
    backgroundColor: "rgba(32, 26, 46, 0.92)",
    padding: 14,
  },
  objectiveCardDone: {
    backgroundColor: "rgba(18, 42, 32, 0.95)",
    borderColor: "rgba(105, 187, 135, 0.62)",
  },
  objectiveIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(202, 160, 84, 0.7)",
    backgroundColor: "rgba(77, 53, 24, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  objectiveIconDone: {
    borderColor: "rgba(105, 187, 135, 0.72)",
    backgroundColor: "rgba(25, 73, 52, 0.9)",
  },
  objectiveTextWrap: {
    flex: 1,
    gap: 5,
  },
  objectiveTitle: {
    color: "#fff1d0",
    fontSize: 16,
    fontWeight: "800",
  },
  objectiveDetail: {
    color: "#ccb9de",
    fontSize: 13,
    lineHeight: 18,
  },
  threadPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(126, 101, 58, 0.7)",
    backgroundColor: "rgba(28, 24, 40, 0.92)",
    padding: 14,
    gap: 6,
  },
  threadRow: {
    flexDirection: "row",
    gap: 12,
  },
  threadRail: {
    alignItems: "center",
    width: 26,
  },
  threadNode: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d5a957",
    backgroundColor: "#f0c56f",
    alignItems: "center",
    justifyContent: "center",
  },
  threadNodeDone: {
    backgroundColor: "#6ee7a5",
    borderColor: "#9bf6c4",
  },
  threadLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(151, 121, 70, 0.5)",
    marginVertical: 6,
  },
  threadTextWrap: {
    flex: 1,
    paddingBottom: 12,
    gap: 2,
  },
  threadTitle: {
    color: "#f8ead1",
    fontSize: 15,
    fontWeight: "800",
  },
  threadStatus: {
    color: "#d0b988",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  logCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(123, 97, 58, 0.7)",
    backgroundColor: "rgba(27, 22, 38, 0.92)",
    padding: 14,
  },
  logIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(210, 164, 88, 0.65)",
    backgroundColor: "rgba(76, 52, 24, 0.84)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  logTextWrap: {
    flex: 1,
    gap: 2,
  },
  logChapter: {
    color: "#d4b36f",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  logTitle: {
    color: "#fff0d2",
    fontSize: 15,
    fontWeight: "800",
  },
  logMessage: {
    color: "#c8b6dd",
    fontSize: 13,
    lineHeight: 18,
  },
  logEmpty: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(112, 90, 55, 0.62)",
    backgroundColor: "rgba(25, 21, 35, 0.9)",
    padding: 16,
  },
  logEmptyText: {
    color: "#c8b7d8",
    fontSize: 13,
    lineHeight: 18,
  },
  sideQuestCard: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(29, 24, 42, 0.94)",
    padding: 14,
    gap: 12,
  },
  sideQuestHead: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  sideQuestIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sideQuestTextWrap: {
    flex: 1,
    gap: 4,
  },
  sideQuestExpandedBlock: {
    gap: 10,
  },
  sideQuestTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sideQuestTitle: {
    flex: 1,
    color: "#fff0d1",
    fontSize: 16,
    fontWeight: "800",
  },
  sideQuestStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sideQuestStatusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sideQuestCategory: {
    color: "#d6c192",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sideQuestSummary: {
    color: "#ccb9de",
    fontSize: 13,
    lineHeight: 18,
  },
  sideQuestInfoBlock: {
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(122, 95, 57, 0.56)",
    backgroundColor: "rgba(24, 20, 35, 0.7)",
    padding: 10,
  },
  sideQuestInfoLabel: {
    color: "#f1d79d",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sideQuestInfoText: {
    color: "#efe3c8",
    fontSize: 13,
    lineHeight: 18,
  },
  sideQuestProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 1,
  },
  placeholderCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(126, 101, 58, 0.7)",
    backgroundColor: "rgba(28, 24, 40, 0.92)",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  placeholderTitle: {
    color: "#fff0d1",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  placeholderBody: {
    color: "#c8b7d8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 560,
  },
});
