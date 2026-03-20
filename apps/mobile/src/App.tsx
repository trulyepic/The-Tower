import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppTabs, AppTabId } from "./components/AppTabs";
import { ClassSelectionScreen } from "./screens/ClassSelectionScreen";
import { ClassScreen } from "./screens/ClassScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { MainQuestScreen } from "./screens/MainQuestScreen";
import { QuestsScreen } from "./screens/QuestsScreen";
import { useGameState } from "./state/useGameState";
import { colors } from "./theme/colors";
import { useEffect, useState } from "react";
import { getAssetBaseUrl } from "./lib/assetSource";

export default function App() {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [showTempCreation, setShowTempCreation] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showAssetDebugChip, setShowAssetDebugChip] = useState(__DEV__);
  const [towerModeActive, setTowerModeActive] = useState(false);
  const [showOpeningIntro, setShowOpeningIntro] = useState(false);
  const [showGuildArrival, setShowGuildArrival] = useState(false);
  const assetBaseUrl = getAssetBaseUrl();

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const timer = setTimeout(() => setShowAssetDebugChip(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (towerModeActive && activeTab !== "quests" && activeTab !== "inventory") {
      setActiveTab("quests");
    }
  }, [towerModeActive, activeTab]);

  useEffect(() => {
    if (!game.isHydrated) {
      return;
    }
    if (!game.character && !showTempCreation) {
      setShowOpeningIntro(true);
      setShowGuildArrival(false);
    }
  }, [game.character, game.isHydrated, showTempCreation]);

  const renderTabContent = () => {
    if (!game.character) {
      return null;
    }

    return (
      <>
        <View
          style={[styles.tabPanel, activeTab !== "home" ? styles.tabPanelHidden : null]}
          pointerEvents={activeTab === "home" ? "auto" : "none"}
        >
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
        </View>
        <View
          style={[styles.tabPanel, activeTab !== "quests" ? styles.tabPanelHidden : null]}
          pointerEvents={activeTab === "quests" ? "auto" : "none"}
        >
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
            onCraftRecipe={game.craftRecipe}
            onAppraiseItem={game.appraiseItem}
            onBuyFloorIntel={game.buyFloorIntel}
            requestGuildMageRecovery={game.requestGuildMageRecovery}
            onActivateBuff={game.activateBuff}
            onDeactivateBuff={game.deactivateBuff}
            onStartQuest={game.startQuest}
            onClaimQuest={game.claimQuest}
            onResolveLyraQuestChoice={game.resolveLyraQuestChoice}
            onResolveTowerWave={game.resolveTowerWave}
            onFinalizeTowerFloor={game.finalizeTowerFloor}
            onAttemptRankUp={game.attemptRankUp}
            storyState={game.storyState}
            onRecordNpcInteraction={game.recordNpcInteraction}
            rescueNpcStatus={game.storyState.rescueNpcStatus}
            npcUnreadCount={game.storyState.rescueNpcUnreadCount}
            onNpcTabOpened={game.markNpcTabOpened}
            onRespondRescueNpcRequest={game.respondRescueNpcRequest}
            onRespondThornRunnerIntroduction={game.respondThornRunnerIntroduction}
            onAcknowledgeThornRunnerFollowup={game.acknowledgeThornRunnerFollowup}
            climberLeaderboard={game.climberLeaderboard}
            activeFloorEncounter={game.activeFloorEncounter}
            onRespondFloorEncounter={game.respondFloorEncounter}
            onRespondTowerConditionalEncounter={game.respondTowerConditionalEncounter}
            encounteredNpcProfiles={game.encounteredNpcProfiles}
            towerStatusEffects={game.towerStatusEffects}
            towerPreparedItemIds={game.towerPreparedItemIds}
            onTowerModeChange={setTowerModeActive}
          />
        </View>
        <View
          style={[styles.tabPanel, activeTab !== "story" ? styles.tabPanelHidden : null]}
          pointerEvents={activeTab === "story" ? "auto" : "none"}
        >
          {game.mainQuestTracker ? (
            <MainQuestScreen
              tracker={game.mainQuestTracker}
              storyState={game.storyState}
              character={game.character}
              quests={game.quests}
              activeQuest={game.activeQuest}
              unreadCount={game.storyState.mainQuestUnreadCount}
              onAcknowledgeUpdates={game.markMainQuestViewed}
            />
          ) : null}
        </View>
        <View
          style={[styles.tabPanel, activeTab !== "inventory" ? styles.tabPanelHidden : null]}
          pointerEvents={activeTab === "inventory" ? "auto" : "none"}
        >
          <InventoryScreen
            character={game.character}
            towerModeActive={towerModeActive}
            towerPreparedItemIds={game.towerPreparedItemIds}
            onEquipWeapon={game.equipWeapon}
            onEquipBuff={game.equipBuff}
            onUnequipBuff={game.unequipBuff}
            onEquipTitle={game.equipTitle}
            onUnequipTitle={game.unequipTitle}
            onUseSkillResourceItem={game.useSkillResourceItem}
            onUseHealthRecoveryItem={game.useHealthRecoveryItem}
            onUseTowerConsumableItem={game.useTowerConsumableItem}
          />
        </View>
        <View
          style={[styles.tabPanel, activeTab !== "class" ? styles.tabPanelHidden : null]}
          pointerEvents={activeTab === "class" ? "auto" : "none"}
        >
          <ClassScreen
            character={game.character}
            classes={game.classes}
            onChooseWarriorPath={game.chooseWarriorPath}
            onSetActiveClassSkill={game.setActiveClassSkill}
            onTogglePassiveAbility={game.togglePassiveAbility}
          />
        </View>
      </>
    );
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
          </View>
          <View style={styles.content}>{renderTabContent()}</View>
          <AppTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            disabledTabIds={towerModeActive ? ["home", "story", "class"] : []}
            badgeCountByTab={{ story: game.storyState.mainQuestUnreadCount }}
          />
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
              setShowOpeningIntro(false);
              setShowGuildArrival(true);
            }}
          />
        </View>
      )}
      {showDevMenu ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowDevMenu(false)}>
          <View style={styles.devMenuOverlay}>
            <Pressable style={styles.devMenuBackdrop} onPress={() => setShowDevMenu(false)} />
            <View style={styles.devMenuModalWrap} pointerEvents="box-none">
              <View style={styles.devMenuPanel}>
                <View style={styles.devMenuHeader}>
                  <Text style={styles.devMenuHeaderTitle}>TEMP: Dev Menu</Text>
                  <Pressable onPress={() => setShowDevMenu(false)} style={styles.devMenuCloseButton}>
                    <MaterialCommunityIcons name="close" size={16} color="#f9e6b7" />
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.devMenuScroll}
                  contentContainerStyle={styles.devMenuPanelContent}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                >
                  <View style={styles.devMenuSection}>
                    <Text style={styles.devMenuSectionLabel}>Story</Text>
                    <Pressable
                      onPress={() => {
                        game.devTriggerLyraQuest();
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonTeal]}
                    >
                      <Text style={styles.devMenuButtonText}>Trigger Lyra</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devTriggerAldricQuest();
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonTeal]}
                    >
                      <Text style={styles.devMenuButtonText}>Trigger Aldric</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devTriggerTamsinQuest();
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonTeal]}
                    >
                      <Text style={styles.devMenuButtonText}>Trigger Tamsin</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetAldricOutcome("saved");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonGreen]}
                    >
                      <Text style={styles.devMenuButtonText}>Aldric Saved</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetAldricOutcome("too_late");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonOrange]}
                    >
                      <Text style={styles.devMenuButtonText}>Aldric Too Late</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetAffinity(100);
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonGreen]}
                    >
                      <Text style={styles.devMenuButtonText}>Affinity Good</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetAffinity(0);
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonBlue]}
                    >
                      <Text style={styles.devMenuButtonText}>Affinity Neutral</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetAffinity(-100);
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonRed]}
                    >
                      <Text style={styles.devMenuButtonText}>Affinity Evil</Text>
                    </Pressable>
                  </View>

                  <View style={styles.devMenuSection}>
                    <Text style={styles.devMenuSectionLabel}>Tower</Text>
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
                        game.devAdvanceTowerFloor();
                        setActiveTab("quests");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonPurple]}
                    >
                      <Text style={styles.devMenuButtonText}>Tower +1</Text>
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
                        game.devResetAppraisals();
                        setActiveTab("quests");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonPurple]}
                    >
                      <Text style={styles.devMenuButtonText}>Reset Appraisals</Text>
                    </Pressable>
                  </View>

                  <View style={styles.devMenuSection}>
                    <Text style={styles.devMenuSectionLabel}>Recovery / Reset</Text>
                    <Pressable
                      onPress={() => {
                        game.devRestoreAdventurer();
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonGreen]}
                    >
                      <Text style={styles.devMenuButtonText}>Restore All</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devFractureAdventurer();
                        setActiveTab("quests");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonOrange]}
                    >
                      <Text style={styles.devMenuButtonText}>Fracture State</Text>
                    </Pressable>
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

                  <View style={styles.devMenuSection}>
                    <Text style={styles.devMenuSectionLabel}>Warrior Combat</Text>
                    <Pressable
                      onPress={() => {
                        game.devSetupWarriorBattlePreset("shared");
                        setActiveTab("class");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonBlue]}
                    >
                      <Text style={styles.devMenuButtonText}>Warrior Shared Test</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetupWarriorBattlePreset("knight");
                        setActiveTab("class");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonGreen]}
                    >
                      <Text style={styles.devMenuButtonText}>Warrior Knight Test</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        game.devSetupWarriorBattlePreset("berserker");
                        setActiveTab("class");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonRed]}
                    >
                      <Text style={styles.devMenuButtonText}>Warrior Berserker Test</Text>
                    </Pressable>
                  </View>

                  <View style={styles.devMenuSection}>
                    <Text style={styles.devMenuSectionLabel}>Quest Board Preview</Text>
                    <Pressable
                      onPress={() => {
                        game.devPreviewQuestBoardContracts();
                        setActiveTab("quests");
                        setShowDevMenu(false);
                      }}
                      style={[styles.devMenuButton, styles.devMenuButtonPurple]}
                    >
                      <Text style={styles.devMenuButtonText}>Preview High-Level Contracts</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {showOpeningIntro && !game.character && !showTempCreation ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowOpeningIntro(false)}>
          <View style={styles.levelOverlay}>
            <View style={[styles.levelCard, styles.prologueCard]}>
              <LinearGradient
                colors={["rgba(91, 68, 28, 0.94)", "rgba(35, 26, 12, 0.96)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.prologueBanner}
              >
                <MaterialCommunityIcons name="tower-fire" size={22} color="#ffe2a0" />
                <Text style={styles.prologueBannerText}>The Tower Watches</Text>
              </LinearGradient>
              <Text style={styles.levelTitle}>A Distant Tower, A First Step</Text>
              <Text style={styles.prologueBody}>
                No one agrees on what the Tower is. Some call it a gate, some a wound, some the only ladder left in the world.
              </Text>
              <Text style={styles.prologueBody}>
                What everyone agrees on is simpler: lives change around it. Fortunes rise, names vanish, and every serious climber begins the same way.
              </Text>
              <View style={styles.prologueTag}>
                <MaterialCommunityIcons name="badge-account-horizontal-outline" size={16} color="#ffd487" />
                <Text style={styles.prologueTagText}>Register at the Adventurers Guild and prepare for Floor 1: Ashen Threshold.</Text>
              </View>
              <Pressable onPress={() => setShowOpeningIntro(false)} style={[styles.levelButton, styles.prologueButton]}>
                <Text style={styles.levelButtonText}>Enter Guild Registration</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {showGuildArrival && game.character && !showTempCreation ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowGuildArrival(false)}>
          <View style={styles.levelOverlay}>
            <View style={[styles.levelCard, styles.guildArrivalCard]}>
              <LinearGradient
                colors={["rgba(38, 68, 105, 0.96)", "rgba(18, 34, 52, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guildArrivalBanner}
              >
                <MaterialCommunityIcons name="badge-account-outline" size={21} color="#b8ebff" />
                <Text style={styles.guildArrivalBannerText}>Guild Intake Complete</Text>
              </LinearGradient>
              <Text style={styles.levelTitle}>License Issued</Text>
              <View style={styles.levelMainRow}>
                <MaterialCommunityIcons name="sword-cross" size={20} color="#ffd58f" />
                <Text style={styles.levelMainText}>{game.character.name}, your climb begins under the guild banner.</Text>
              </View>
              <Text style={styles.prologueBody}>
                New climbers are not sent blindly into the Tower. Work the board first, gather what you can carry, and learn what Floor 1 takes from the careless.
              </Text>
              <View style={styles.guildArrivalDirective}>
                <Text style={styles.guildArrivalDirectiveTitle}>First Directive</Text>
                <Text style={styles.guildArrivalDirectiveText}>Take your first guild quest, prepare supplies, then enter Floor 1: Ashen Threshold.</Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowGuildArrival(false);
                  setActiveTab("story");
                }}
                style={[styles.levelButton, styles.guildArrivalButton]}
              >
                <Text style={styles.levelButtonText}>Open Main Quest</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
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
            <View
              style={[
                styles.levelCard,
                styles.storyNoticeCard,
                game.storyNotification.variant === "tower-collapse" ? styles.towerCollapseCard : null,
                game.storyNotification.variant === "main-quest" ? styles.mainQuestCard : null,
              ]}
            >
              {game.storyNotification.variant === "main-quest" ? (
                <>
                  <View style={[styles.mainQuestCorner, styles.mainQuestCornerTopLeft]}>
                    <MaterialCommunityIcons name="ornament-variant" size={22} color="#f2cf88" />
                  </View>
                  <View style={[styles.mainQuestCorner, styles.mainQuestCornerTopRight]}>
                    <MaterialCommunityIcons name="ornament-variant" size={22} color="#f2cf88" />
                  </View>
                  <View style={[styles.mainQuestCorner, styles.mainQuestCornerBottomLeft]}>
                    <MaterialCommunityIcons name="ornament-variant" size={22} color="#f2cf88" />
                  </View>
                  <View style={[styles.mainQuestCorner, styles.mainQuestCornerBottomRight]}>
                    <MaterialCommunityIcons name="ornament-variant" size={22} color="#f2cf88" />
                  </View>
                  <LinearGradient
                    colors={["rgba(122, 88, 35, 0.95)", "rgba(55, 36, 14, 0.96)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainQuestBanner}
                  >
                    <View style={styles.mainQuestBannerIcon}>
                      <MaterialCommunityIcons name="book-open-page-variant-outline" size={22} color="#fff0c5" />
                    </View>
                    <View style={styles.mainQuestBannerTextWrap}>
                      <Text style={styles.mainQuestBannerEyebrow}>Main Quest Chronicle</Text>
                      <Text style={styles.mainQuestBannerTitle}>Story Progress Recorded</Text>
                    </View>
                  </LinearGradient>
                </>
              ) : null}
              <Text style={styles.levelTitle}>{game.storyNotification.title}</Text>
              <View style={styles.levelMainRow}>
                <MaterialCommunityIcons
                  name={
                    game.storyNotification.variant === "tower-collapse"
                      ? "tower-fire"
                      : game.storyNotification.variant === "main-quest"
                        ? "book-open-page-variant-outline"
                        : "bell-badge-outline"
                  }
                  size={20}
                  color={
                    game.storyNotification.variant === "tower-collapse"
                      ? "#ffcf98"
                      : game.storyNotification.variant === "main-quest"
                        ? "#9fe3ff"
                        : "#ffd58f"
                  }
                />
                <Text style={styles.levelMainText}>
                  {game.storyNotification.variant === "tower-collapse"
                    ? "Tower Mercy Triggered"
                    : game.storyNotification.variant === "main-quest"
                      ? "Main Quest Updated"
                    : game.storyNotification.id.startsWith("climber-")
                      ? "Climber Ranking Update"
                      : "New Guild Notice"}
                </Text>
              </View>
              <Text style={styles.levelSub}>{game.storyNotification.message}</Text>
              {game.storyNotification.variant === "main-quest" && game.mainQuestTracker ? (
                <View style={styles.mainQuestNoticeWrap}>
                  <LinearGradient
                    colors={["rgba(32, 53, 78, 0.96)", "rgba(18, 32, 52, 0.94)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainQuestNoticePanel}
                  >
                    <View style={styles.mainQuestNoticeHeader}>
                      <View style={styles.mainQuestNoticeSeal}>
                        <MaterialCommunityIcons name={game.mainQuestTracker.icon} size={20} color="#9fe3ff" />
                      </View>
                      <View style={styles.mainQuestNoticeHeaderText}>
                        <Text style={styles.mainQuestNoticeChapter}>{game.mainQuestTracker.chapter}</Text>
                        <Text style={styles.mainQuestNoticeDirective}>{game.mainQuestTracker.currentDirective}</Text>
                      </View>
                    </View>
                    <View style={styles.mainQuestNoticeObjectives}>
                      {game.mainQuestTracker.objectives.slice(0, 2).map((objective) => (
                        <View key={objective.id} style={styles.mainQuestNoticeObjective}>
                          <View style={[styles.mainQuestObjectiveGlyph, objective.done ? styles.mainQuestObjectiveGlyphDone : null]}>
                            <MaterialCommunityIcons
                              name={objective.done ? "check" : objective.icon}
                              size={14}
                              color={objective.done ? "#082016" : "#2d1d0f"}
                            />
                          </View>
                          <Text style={styles.mainQuestNoticeObjectiveText}>{objective.label}</Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                  <View style={styles.mainQuestRibbon}>
                    <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#ffdf95" />
                    <Text style={styles.mainQuestRibbonText}>Recorded in your chronicle for later review</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.storyNoticeActions}>
                <Pressable
                  onPress={game.dismissStoryNotification}
                  style={[styles.levelButton, styles.storyNoticeActionBtn, styles.storyNoticeLaterBtn]}
                >
                  <Text style={styles.levelButtonText}>
                    {game.storyNotification.variant === "tower-collapse" ? "Hold Steady" : "Later"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (towerModeActive && game.storyNotification?.variant !== "tower-collapse") {
                      return;
                    }
                    setActiveTab(game.storyNotification?.variant === "main-quest" ? "story" : "quests");
                    game.dismissStoryNotification();
                  }}
                  disabled={towerModeActive && game.storyNotification.variant !== "tower-collapse"}
                  style={[
                    styles.levelButton,
                    styles.storyNoticeActionBtn,
                    game.storyNotification.variant === "tower-collapse" ? styles.towerCollapseButton : null,
                    towerModeActive && game.storyNotification.variant !== "tower-collapse" ? styles.storyNoticeDisabledBtn : null,
                  ]}
                >
                  <Text style={styles.levelButtonText}>
                    {game.storyNotification.variant === "tower-collapse"
                      ? "Seek The Archmage"
                      : game.storyNotification.variant === "main-quest"
                        ? towerModeActive
                          ? "Inside Tower"
                          : "Open Main Quest"
                      : towerModeActive
                        ? "Inside Tower"
                        : "Go To Guild"}
                  </Text>
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
      {__DEV__ && showAssetDebugChip ? (
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
  tabPanel: {
    ...StyleSheet.absoluteFillObject,
  },
  tabPanelHidden: {
    display: "none",
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
  devMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
  },
  devMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 8, 16, 0.42)",
  },
  devMenuModalWrap: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 52,
    paddingRight: 12,
    paddingBottom: 92,
  },
  devMenuPanel: {
    width: 188,
    maxHeight: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8c6c3f",
    backgroundColor: "rgba(23, 19, 35, 0.96)",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  devMenuHeader: {
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(140, 108, 63, 0.72)",
    paddingLeft: 10,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(49, 31, 14, 0.96)",
  },
  devMenuHeaderTitle: {
    color: "#ffeaaf",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  devMenuCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 210, 122, 0.48)",
    backgroundColor: "rgba(91, 56, 16, 0.92)",
  },
  devMenuScroll: {
    maxHeight: 420,
  },
  devMenuPanelContent: {
    padding: 8,
    gap: 7,
    paddingBottom: 12,
  },
  devMenuSection: {
    gap: 5,
  },
  devMenuSectionLabel: {
    color: "#d9bf8b",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
  devMenuButtonPurple: {
    borderColor: "#c29cff",
    backgroundColor: "rgba(78, 42, 119, 0.96)",
  },
  devMenuButtonTeal: {
    borderColor: "#7de5d8",
    backgroundColor: "rgba(18, 90, 86, 0.95)",
  },
  devMenuButtonGreen: {
    borderColor: "#9fefb5",
    backgroundColor: "rgba(27, 97, 50, 0.95)",
  },
  devMenuButtonOrange: {
    borderColor: "#ffc28b",
    backgroundColor: "rgba(120, 62, 21, 0.95)",
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
  prologueCard: {
    borderColor: "#d6a65b",
    backgroundColor: "rgba(26, 21, 37, 0.98)",
  },
  prologueBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(241, 208, 133, 0.48)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prologueBannerText: {
    color: "#fff0ca",
    fontSize: 15,
    fontWeight: "900",
  },
  prologueBody: {
    color: "#d8c7e7",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  prologueTag: {
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(221, 175, 93, 0.48)",
    backgroundColor: "rgba(75, 52, 22, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  prologueTagText: {
    flex: 1,
    color: "#ffe6bb",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  prologueButton: {
    marginTop: 14,
  },
  guildArrivalCard: {
    borderColor: "#6fa3d2",
    backgroundColor: "rgba(22, 24, 41, 0.99)",
  },
  guildArrivalBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 218, 255, 0.42)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guildArrivalBannerText: {
    color: "#e8f6ff",
    fontSize: 15,
    fontWeight: "900",
  },
  guildArrivalDirective: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(122, 183, 222, 0.46)",
    backgroundColor: "rgba(20, 42, 63, 0.8)",
    padding: 12,
    gap: 5,
  },
  guildArrivalDirectiveTitle: {
    color: "#9fdfff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  guildArrivalDirectiveText: {
    color: "#edf8ff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  guildArrivalButton: {
    marginTop: 14,
    borderColor: "#83b4de",
    backgroundColor: "rgba(28, 76, 116, 0.95)",
  },
  mainQuestCard: {
    borderColor: "#d4ab61",
    backgroundColor: "rgba(28, 23, 46, 0.99)",
    overflow: "hidden",
    paddingTop: 16,
  },
  towerCollapseCard: {
    borderColor: "#d38a56",
    backgroundColor: "rgba(67, 28, 20, 0.98)",
  },
  mainQuestBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(246, 214, 138, 0.48)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mainQuestBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 234, 185, 0.4)",
    backgroundColor: "rgba(118, 84, 31, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainQuestBannerTextWrap: {
    flex: 1,
  },
  mainQuestBannerEyebrow: {
    color: "#f8d899",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  mainQuestBannerTitle: {
    color: "#fff3d4",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  mainQuestCorner: {
    position: "absolute",
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
  },
  mainQuestCornerTopLeft: {
    top: 8,
    left: 8,
    transform: [{ rotate: "180deg" }],
  },
  mainQuestCornerTopRight: {
    top: 8,
    right: 8,
    transform: [{ rotate: "-90deg" }],
  },
  mainQuestCornerBottomLeft: {
    bottom: 8,
    left: 8,
    transform: [{ rotate: "90deg" }],
  },
  mainQuestCornerBottomRight: {
    bottom: 8,
    right: 8,
  },
  mainQuestNoticeWrap: {
    marginTop: 10,
    gap: 8,
  },
  mainQuestNoticePanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(112, 169, 214, 0.58)",
    padding: 12,
    gap: 8,
  },
  mainQuestNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mainQuestNoticeSeal: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(170, 226, 255, 0.5)",
    backgroundColor: "rgba(33, 59, 81, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainQuestNoticeHeaderText: {
    flex: 1,
    gap: 3,
  },
  mainQuestNoticeChapter: {
    color: "#95dafd",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainQuestNoticeDirective: {
    color: "#e8f6ff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  mainQuestNoticeObjectives: {
    gap: 6,
  },
  mainQuestNoticeObjective: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainQuestObjectiveGlyph: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(220, 174, 91, 0.65)",
    backgroundColor: "#efc46f",
    alignItems: "center",
    justifyContent: "center",
  },
  mainQuestObjectiveGlyphDone: {
    borderColor: "rgba(118, 220, 163, 0.7)",
    backgroundColor: "#81e8b1",
  },
  mainQuestNoticeObjectiveText: {
    flex: 1,
    color: "#d0e6f3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  mainQuestRibbon: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(229, 190, 102, 0.5)",
    backgroundColor: "rgba(72, 50, 18, 0.76)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mainQuestRibbonText: {
    color: "#f6ddb0",
    fontSize: 11,
    fontWeight: "800",
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
  storyNoticeDisabledBtn: {
    opacity: 0.48,
  },
  towerCollapseButton: {
    borderColor: "#d59056",
    backgroundColor: "rgba(117, 58, 24, 0.96)",
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
