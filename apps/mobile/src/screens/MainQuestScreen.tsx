import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AtmosphereBackdrop } from "../components/AtmosphereBackdrop";
import { ProgressBar } from "../components/ProgressBar";
import { MainQuestTracker, StoryState } from "../types/game";
import { colors } from "../theme/colors";

interface MainQuestScreenProps {
  tracker: MainQuestTracker;
  storyState: StoryState;
}

export const MainQuestScreen = ({ tracker, storyState }: MainQuestScreenProps) => {
  const stageRatio = Math.max(1, tracker.progressIndex);
  const recentLog = storyState.mainQuestLog.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AtmosphereBackdrop />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerFrame}>
            <Text style={styles.headerEyebrow}>Main Quest Chronicle</Text>
            <Text style={styles.headerTitle}>{tracker.title}</Text>
            <Text style={styles.headerChapter}>{tracker.chapter}</Text>
          </View>
          <View style={[styles.headerIconWrap, { borderColor: tracker.accent }]}>
            <MaterialCommunityIcons name={tracker.icon} size={30} color={tracker.accent} />
          </View>
        </View>

        <LinearGradient colors={["rgba(60,42,90,0.96)", "rgba(34,25,54,0.95)"]} style={styles.heroCard}>
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
});
