import { StatusBar } from "expo-status-bar";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppTabs, AppTabId } from "./components/AppTabs";
import { ClassSelectionScreen } from "./screens/ClassSelectionScreen";
import { ClassScreen } from "./screens/ClassScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { QuestsScreen } from "./screens/QuestsScreen";
import { useGameState } from "./state/useGameState";
import { colors } from "./theme/colors";
import { useState } from "react";
import { getAssetBaseUrl } from "./lib/assetSource";

export default function App() {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [showTempCreation, setShowTempCreation] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const assetBaseUrl = getAssetBaseUrl();

  const renderTabContent = () => {
    if (!game.character) {
      return null;
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            character={game.character}
            classes={game.classes}
            dailies={game.dailies}
            completedQuestCount={game.completedQuestCount}
            guildMasterName={game.currentGuildMasterName}
            helpfulAllies={game.helpfulAllies}
            onUnequipWeapon={game.unequipWeapon}
            onUnequipBuff={game.unequipBuff}
            onActivateClassAbility={game.activateClassAbility}
            onDeactivateClassAbility={game.deactivateClassAbility}
            onSetActiveClassSkill={game.setActiveClassSkill}
            onTogglePassiveAbility={game.togglePassiveAbility}
          />
        );
      case "quests":
        return (
          <QuestsScreen
            character={game.character}
            quests={game.quests}
            towerFloors={game.towerFloors}
            activeQuest={game.activeQuest}
            lastQuestOutcome={game.lastQuestOutcome}
            lastTowerOutcome={game.lastTowerOutcome}
            lastRankUpOutcome={game.lastRankUpOutcome}
            completedQuestCount={game.completedQuestCount}
            getQuestSuccessChance={game.getQuestSuccessChance}
            getQuestAccess={game.getQuestAccess}
            getTowerSuccessChance={game.getTowerSuccessChance}
            getTowerAccess={game.getTowerAccess}
            getNextRankTrial={game.getNextRankTrial}
            getRankTrialAccess={game.getRankTrialAccess}
            getRankTrialSuccessChance={game.getRankTrialSuccessChance}
            buyGuildItem={game.buyGuildItem}
            sellGuildItem={game.sellGuildItem}
            requestGuildMageRecovery={game.requestGuildMageRecovery}
            onActivateBuff={game.activateBuff}
            onDeactivateBuff={game.deactivateBuff}
            onStartQuest={game.startQuest}
            onClaimQuest={game.claimQuest}
            onConquerTowerFloor={game.conquerTowerFloor}
            onAttemptRankUp={game.attemptRankUp}
            rescueNpcStatus={game.storyState.rescueNpcStatus}
            npcUnreadCount={game.storyState.rescueNpcUnreadCount}
            onNpcTabOpened={game.markNpcTabOpened}
            onRespondRescueNpcRequest={game.respondRescueNpcRequest}
          />
        );
      case "inventory":
        return (
          <InventoryScreen
            character={game.character}
            onEquipWeapon={game.equipWeapon}
            onEquipBuff={game.equipBuff}
            onUnequipBuff={game.unequipBuff}
            onEquipTitle={game.equipTitle}
            onUnequipTitle={game.unequipTitle}
            onUseSkillResourceItem={game.useSkillResourceItem}
            onUseHealthRecoveryItem={game.useHealthRecoveryItem}
          />
        );
      case "class":
        return (
          <ClassScreen
            character={game.character}
            classes={game.classes}
            onChooseWarriorPath={game.chooseWarriorPath}
          />
        );
      default:
        return null;
    }
  };

  const shouldShowCreation = !game.character || showTempCreation;
  const intelligenceLabel = "Resolve";

  return (
    <SafeAreaProvider>
      {!game.isHydrated ? (
        <SafeAreaView style={styles.loadingScreen}>
          <StatusBar style="light" />
          <Text style={styles.loadingText}>Loading local game data...</Text>
        </SafeAreaView>
      ) : (
        <>
      <StatusBar style="light" />
      {!shouldShowCreation ? (
        <View style={styles.appShell}>
          <View style={styles.devMenuWrap}>
            <Pressable onPress={() => setShowDevMenu((current) => !current)} style={styles.devMenuToggle}>
              <Text style={styles.devMenuToggleText}>TEMP: Dev Menu</Text>
            </Pressable>
            {showDevMenu ? (
              <View style={styles.devMenuPanel}>
                <Pressable
                  onPress={() => {
                    setShowTempCreation(true);
                    setShowDevMenu(false);
                  }}
                  style={[styles.devMenuButton, styles.devMenuButtonBlue]}
                >
                  <Text style={styles.devMenuButtonText}>Character Creation</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    game.devIncreaseLevel();
                    setShowDevMenu(false);
                  }}
                  style={[styles.devMenuButton, styles.devMenuButtonGold]}
                >
                  <Text style={styles.devMenuButtonText}>+1 Level</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    game.resetTowerProgress();
                    setActiveTab("quests");
                    setShowDevMenu(false);
                  }}
                  style={[styles.devMenuButton, styles.devMenuButtonCyan]}
                >
                  <Text style={styles.devMenuButtonText}>Reset Tower</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    game.resetGame();
                    setActiveTab("home");
                    setShowTempCreation(false);
                    setShowDevMenu(false);
                  }}
                  style={[styles.devMenuButton, styles.devMenuButtonRed]}
                >
                  <Text style={styles.devMenuButtonText}>Reset Save</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View style={styles.content}>{renderTabContent()}</View>
          <AppTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>
      ) : (
        <View style={styles.creationShell}>
          {showTempCreation && game.character ? (
            <Pressable onPress={() => setShowTempCreation(false)} style={styles.tempReturnButton}>
              <Text style={styles.tempReturnButtonText}>TEMP: Back To Game</Text>
            </Pressable>
          ) : null}
          <ClassSelectionScreen
            classes={game.classes}
            selectedClass={game.selectedClass}
            onSelectClass={game.chooseClass}
            onCreateCharacter={(name, avatarId) => {
              if (game.character) {
                setShowTempCreation(false);
                return;
              }
              game.createCharacter(name, avatarId);
            }}
          />
        </View>
      )}
      {game.levelUpEvent ? (
        <Modal transparent animationType="fade" visible onRequestClose={game.clearLevelUpEvent}>
          <View style={styles.levelOverlay}>
            <View style={styles.levelCard}>
              <Text style={styles.levelTitle}>Level Up</Text>
              <View style={styles.levelMainRow}>
                <MaterialCommunityIcons name="arrow-up-bold-circle" size={20} color="#ffd58f" />
                <Text style={styles.levelMainText}>
                  Level {game.levelUpEvent.fromLevel} {"->"} Level {game.levelUpEvent.toLevel}
                </Text>
              </View>
              <Text style={styles.levelSub}>Core Attribute Growth</Text>
              <View style={styles.levelStats}>
                <Text style={styles.levelStatText}>Strength +{game.levelUpEvent.attributeDelta.strength}</Text>
                <Text style={styles.levelStatText}>Agility +{game.levelUpEvent.attributeDelta.agility}</Text>
                <Text style={styles.levelStatText}>{intelligenceLabel} +{game.levelUpEvent.attributeDelta.intelligence}</Text>
                <Text style={styles.levelStatText}>Vitality +{game.levelUpEvent.attributeDelta.vitality}</Text>
              </View>
              <Pressable onPress={game.clearLevelUpEvent} style={styles.levelButton}>
                <Text style={styles.levelButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {game.storyNotification ? (
        <Modal transparent animationType="fade" visible onRequestClose={game.dismissStoryNotification}>
          <View style={styles.levelOverlay}>
            <View style={[styles.levelCard, styles.storyNoticeCard]}>
              <Text style={styles.levelTitle}>{game.storyNotification.title}</Text>
              <View style={styles.levelMainRow}>
                <MaterialCommunityIcons name="bell-badge-outline" size={20} color="#ffd58f" />
                <Text style={styles.levelMainText}>New NPC Request</Text>
              </View>
              <Text style={styles.levelSub}>{game.storyNotification.message}</Text>
              <View style={styles.storyNoticeActions}>
                <Pressable
                  onPress={game.dismissStoryNotification}
                  style={[styles.levelButton, styles.storyNoticeActionBtn, styles.storyNoticeLaterBtn]}
                >
                  <Text style={styles.levelButtonText}>Later</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setActiveTab("quests");
                    game.dismissStoryNotification();
                  }}
                  style={[styles.levelButton, styles.storyNoticeActionBtn]}
                >
                  <Text style={styles.levelButtonText}>Go To Guild</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {game.levelDownEvent ? (
        <Modal transparent animationType="fade" visible onRequestClose={game.clearLevelDownEvent}>
          <View style={styles.levelOverlay}>
            <View style={[styles.levelCard, styles.levelDownCard]}>
              <Text style={[styles.levelTitle, styles.levelDownTitle]}>Level Penalty</Text>
              <View style={styles.levelMainRow}>
                <MaterialCommunityIcons name="arrow-down-bold-circle" size={20} color="#ffb5be" />
                <Text style={[styles.levelMainText, styles.levelDownMainText]}>
                  Level {game.levelDownEvent.fromLevel} {"->"} Level {game.levelDownEvent.toLevel}
                </Text>
              </View>
              <Text style={styles.levelSub}>{game.levelDownEvent.reason}</Text>
              <Text style={styles.levelSub}>Core Attribute Loss</Text>
              <View style={styles.levelStats}>
                <Text style={[styles.levelStatText, styles.levelDownStatText]}>Strength -{game.levelDownEvent.attributeLoss.strength}</Text>
                <Text style={[styles.levelStatText, styles.levelDownStatText]}>Agility -{game.levelDownEvent.attributeLoss.agility}</Text>
                <Text style={[styles.levelStatText, styles.levelDownStatText]}>{intelligenceLabel} -{game.levelDownEvent.attributeLoss.intelligence}</Text>
                <Text style={[styles.levelStatText, styles.levelDownStatText]}>Vitality -{game.levelDownEvent.attributeLoss.vitality}</Text>
              </View>
              <Pressable onPress={game.clearLevelDownEvent} style={[styles.levelButton, styles.levelDownButton]}>
                <Text style={styles.levelButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {__DEV__ ? (
        <View pointerEvents="none" style={styles.assetDebugChip}>
          <Text numberOfLines={1} style={styles.assetDebugText}>
            Assets: {assetBaseUrl}
          </Text>
        </View>
      ) : null}
        </>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  content: {
    flex: 1,
  },
  creationShell: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  devMenuWrap: {
    position: "absolute",
    top: 52,
    right: 12,
    zIndex: 30,
    alignItems: "flex-end",
    gap: 6,
  },
  devMenuToggle: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffd27a",
    backgroundColor: "rgba(96, 59, 14, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  devMenuToggleText: {
    color: "#ffeaaf",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  devMenuPanel: {
    width: 164,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8c6c3f",
    backgroundColor: "rgba(23, 19, 35, 0.96)",
    padding: 8,
    gap: 7,
  },
  devMenuButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  devMenuButtonBlue: {
    borderColor: "#7cb2ff",
    backgroundColor: "rgba(20, 45, 99, 0.94)",
  },
  devMenuButtonGold: {
    borderColor: "#e0b56b",
    backgroundColor: "rgba(102, 66, 19, 0.96)",
  },
  devMenuButtonCyan: {
    borderColor: "#8dc2ff",
    backgroundColor: "rgba(19, 54, 110, 0.95)",
  },
  devMenuButtonRed: {
    borderColor: "#ffb0aa",
    backgroundColor: "rgba(112, 25, 25, 0.94)",
  },
  devMenuButtonText: {
    color: "#f4e7cd",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tempReturnButton: {
    position: "absolute",
    top: 52,
    right: 12,
    zIndex: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7cb2ff",
    backgroundColor: "rgba(20, 45, 99, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tempReturnButtonText: {
    color: "#d8e7ff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  levelOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 9, 16, 0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  levelCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c99b56",
    backgroundColor: "rgba(49, 33, 63, 0.97)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  levelDownCard: {
    borderColor: "#c36b75",
    backgroundColor: "rgba(66, 21, 34, 0.97)",
  },
  levelTitle: {
    color: "#ffe7b9",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  levelDownTitle: {
    color: "#ffc7cf",
  },
  levelMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  levelMainText: {
    color: "#f6dcb0",
    fontSize: 15,
    fontWeight: "800",
  },
  levelDownMainText: {
    color: "#ffd8de",
  },
  levelSub: {
    color: "#d4bc91",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  levelStats: {
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8f7245",
    backgroundColor: "rgba(60, 43, 23, 0.84)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  levelStatText: {
    color: "#ffe9c0",
    fontSize: 13,
    fontWeight: "800",
  },
  levelDownStatText: {
    color: "#ffd3d9",
  },
  storyNoticeCard: {
    borderColor: "#c89c5a",
    backgroundColor: "rgba(42, 29, 62, 0.98)",
  },
  storyNoticeActions: {
    flexDirection: "row",
    gap: 8,
  },
  assetDebugChip: {
    position: "absolute",
    left: 8,
    bottom: 6,
    maxWidth: "80%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 220, 153, 0.5)",
    backgroundColor: "rgba(17, 12, 28, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  assetDebugText: {
    color: "#ffe7b2",
    fontSize: 10,
    fontWeight: "700",
  },
  storyNoticeActionBtn: {
    flex: 1,
    minHeight: 40,
  },
  storyNoticeLaterBtn: {
    borderColor: "#8f87a8",
    backgroundColor: "rgba(63, 54, 90, 0.95)",
  },
  levelButton: {
    marginTop: 4,
    alignSelf: "stretch",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cda257",
    backgroundColor: "rgba(91, 63, 24, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  levelDownButton: {
    borderColor: "#d27884",
    backgroundColor: "rgba(118, 31, 49, 0.96)",
  },
  levelButtonText: {
    color: "#fff2d0",
    fontSize: 14,
    fontWeight: "900",
  },
});
