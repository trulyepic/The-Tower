import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AppTabs, AppTabId } from "./components/AppTabs";
import { ClassSelectionScreen } from "./screens/ClassSelectionScreen";
import { ClassScreen } from "./screens/ClassScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { QuestsScreen } from "./screens/QuestsScreen";
import { useGameState } from "./state/useGameState";
import { colors } from "./theme/colors";
import { useState } from "react";

export default function App() {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [showTempCreation, setShowTempCreation] = useState(false);

  if (!game.isHydrated) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading local game data...</Text>
      </SafeAreaView>
    );
  }

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
            onUnequipWeapon={game.unequipWeapon}
            onUnequipBuff={game.unequipBuff}
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
            getQuestSuccessChance={game.getQuestSuccessChance}
            getQuestAccess={game.getQuestAccess}
            getTowerSuccessChance={game.getTowerSuccessChance}
            getTowerAccess={game.getTowerAccess}
            buyGuildItem={game.buyGuildItem}
            onActivateBuff={game.activateBuff}
            onDeactivateBuff={game.deactivateBuff}
            onStartQuest={game.startQuest}
            onClaimQuest={game.claimQuest}
            onConquerTowerFloor={game.conquerTowerFloor}
          />
        );
      case "inventory":
        return (
          <InventoryScreen
            character={game.character}
            onEquipWeapon={game.equipWeapon}
            onEquipBuff={game.equipBuff}
            onUnequipBuff={game.unequipBuff}
          />
        );
      case "class":
        return <ClassScreen character={game.character} classes={game.classes} />;
      default:
        return null;
    }
  };

  const shouldShowCreation = !game.character || showTempCreation;

  return (
    <>
      <StatusBar style="light" />
      {!shouldShowCreation ? (
        <View style={styles.appShell}>
          <Pressable onPress={() => setShowTempCreation(true)} style={styles.tempDevButton}>
            <Text style={styles.tempDevButtonText}>TEMP: Character Creation</Text>
          </Pressable>
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
    </>
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
  tempDevButton: {
    position: "absolute",
    top: 52,
    right: 12,
    zIndex: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffd27a",
    backgroundColor: "rgba(96, 59, 14, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tempDevButtonText: {
    color: "#ffeaaf",
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
});
