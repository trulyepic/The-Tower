import { CharacterState, MainQuestStageId, MainQuestTracker, StoryState } from "../types/game";

interface MainQuestContext {
  character: CharacterState;
  completedQuestCount: number;
  storyState: StoryState;
}

const TOTAL_STAGES = 8;

const hasEnteredFloorOne = (storyState: StoryState) => (storyState.floorAttemptByNumber["1"] ?? 0) > 0;
const hasEnteredFloorTwo = (storyState: StoryState) => (storyState.floorAttemptByNumber["2"] ?? 0) > 0;

export const deriveMainQuestTracker = ({
  character,
  completedQuestCount,
  storyState,
}: MainQuestContext): MainQuestTracker => {
  const clearedFloorOne = (character.towerProgress?.highestFloorCleared ?? 0) >= 1;
  const clearedFloorTwo = (character.towerProgress?.highestFloorCleared ?? 0) >= 2;
  const floorOneEntered = hasEnteredFloorOne(storyState);
  const floorTwoEntered = hasEnteredFloorTwo(storyState);
  if (clearedFloorTwo) {
    return {
      stageId: "mq-beyond-beginnings",
      chapter: "Chapter II · Beyond Beginnings",
      title: "Carry The Climb Beyond The Snare",
      summary:
        "You have survived both the threshold and the first snare. The guild no longer sees your climb as a beginner's gamble, and the Tower has begun testing whether your rise can hold shape beyond early floors.",
      currentDirective: "Turn your Floor 2 momentum into a stable route upward by strengthening your intel network, refining your sigils, and preparing for the next tier of tower pressure.",
      stakes:
        "After Floor 2, the climb stops being about proving that you can begin. It becomes about proving that you can continue without breaking your own pace.",
      icon: "stairs-up",
      accent: "#ffd36f",
      progressIndex: 8,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Advanced",
      notificationMessage:
        "Floor 2: Thorn Corridor is behind you. The early climb is over, and a harder ascent begins from here.",
      objectives: [
        {
          id: "mq-floor2-clear",
          label: "Clear Floor 2: Thorn Corridor",
          detail: "Completed. You outlived the Tower's first true snare.",
          done: true,
          icon: "sprout-outline",
        },
        {
          id: "mq-build-next-route",
          label: "Stabilize your next route upward",
          detail: "Strengthen intel, supplies, and sigils before the next floor turns pressure into punishment.",
          done: false,
          icon: "map-marker-path",
        },
      ],
    };
  }

  if (floorTwoEntered) {
    const needsTamsinReport =
      storyState.thornRunnerCorridorReportReady && !storyState.thornRunnerCorridorReportReviewed;
    const needsDeepLaneWarning =
      storyState.thornRunnerDeepLaneWarningReady && !storyState.thornRunnerDeepLaneWarningReviewed;
    const needsFloorTwoAftermath =
      storyState.thornRunnerFloorTwoAftermathReady && !storyState.thornRunnerFloorTwoAftermathReviewed;
    return {
      stageId: "mq-thorn-corridor",
      chapter: "Chapter II · Thorn Corridor",
      title: "Break The First Snare",
      summary:
        "The second floor is no mere deeper copy of Floor 1. Thorn Corridor slows, binds, and bleeds climbers until panic does the Tower's work for it.",
      currentDirective: needsFloorTwoAftermath
        ? "Return to Tamsin and close the Thorn Corridor ledger so Floor 2 lands as a real chapter, not just another cleared lane."
        : needsDeepLaneWarning
        ? "Return to Tamsin and review her deeper corridor warning before you commit harder into Floor 2's lower lane."
        : needsTamsinReport
        ? "Return to Tamsin with your first Thorn Corridor report, then keep adapting your loadout and route discipline to the floor's bind-and-bleed pressure."
        : "Study Floor 2: Thorn Corridor, prepare a thorn-ready loadout, and survive its opening pressure without letting attrition decide the run.",
      stakes:
        "If Floor 2 teaches the Tower that you can be trapped into bad decisions, later floors will only refine that lesson against you.",
      icon: "sprout-outline",
      accent: "#a6d87f",
      progressIndex: 7,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Advanced",
      notificationMessage:
        "You have entered Floor 2: Thorn Corridor. The climb has changed from endurance to restraint.",
      objectives: [
        {
          id: "mq-floor2-enter",
          label: "Enter Floor 2: Thorn Corridor",
          detail: "Completed. The Tower's first real snare is now part of your climb.",
          done: true,
          icon: "door-open",
        },
        {
          id: "mq-floor2-learn",
          label: needsFloorTwoAftermath
            ? "Close Thorn Corridor with Tamsin"
            : needsDeepLaneWarning
            ? "Review Tamsin's deeper corridor warning"
            : needsTamsinReport
              ? "Report your first thorn-lane run to Tamsin"
              : "Adapt to thorn pressure",
          detail: needsFloorTwoAftermath
            ? "You cleared Floor 2. Return to Tamsin so the guild-side aftermath lands and the climb turns cleanly toward what comes next."
            : needsDeepLaneWarning
            ? "Tamsin has marked a change in the deeper corridor after your sub-boss push. Hear her warning before you treat the lower lane like more of the same."
            : needsTamsinReport
            ? "Bring Tamsin your first real report from inside Thorn Corridor so her runner's ledger can sharpen the climb ahead."
            : "Use guild intel, salves, rope, and recovery planning to answer Floor 2's bind and bleed identity.",
          done: needsFloorTwoAftermath ? false : needsDeepLaneWarning ? false : needsTamsinReport ? false : Boolean(storyState.thornRunnerCorridorReportReviewed),
          icon: "book-search-outline",
        },
        {
          id: "mq-floor2-clear",
          label: "Push toward your first Floor 2 clear",
          detail: "Survive Thorn Corridor well enough to prove your climb can continue past raw beginner momentum.",
          done: (character.towerProgress?.highestFloorCleared ?? 0) >= 2,
          icon: "sword-cross",
        },
      ],
    };
  }

  if (clearedFloorOne) {
    return {
      stageId: "mq-thorn-corridor",
      chapter: "Chapter II · Thorn Corridor",
      title: "Prepare For The First Snare",
      summary:
        "You have outlived the threshold. Thorn Corridor waits as the first floor that punishes poor preparation, impatience, and weak recovery planning harder than raw beginner mistakes.",
      currentDirective:
        "Buy or earn Floor 2 intel if you want safer odds, prepare Thorn Salve and recovery support, then enter Floor 2: Thorn Corridor whenever you are ready to risk it.",
      stakes:
        "The guild can advise you, but it cannot climb for you. If you force Thorn Corridor early, the Tower will punish the decision instead of stopping you from making it.",
      icon: "sprout-outline",
      accent: "#a6d87f",
      progressIndex: 7,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Advanced",
      notificationMessage:
        "E-rank footing is enough to face Floor 2: Thorn Corridor. The first snare is now open to you.",
      objectives: [
        {
          id: "mq-floor2-footing",
          label: "Improve your footing for Floor 2",
          detail: "Recommended, not required. Rank progress and Level 5+ make Thorn Corridor less punishing, but you may challenge it early if you choose.",
          done: character.adventurerRank !== "F" && character.progression.level >= 5,
          icon: "medal-outline",
        },
        {
          id: "mq-floor2-intel",
          label: "Gather Floor 2 intelligence",
          detail: "Use Bran, board work, or trusted field notes to learn what Thorn Corridor hides.",
          done: (character.purchasedFloorIntelNumbers ?? []).includes(2),
          icon: "book-search-outline",
        },
        {
          id: "mq-enter-floor2",
          label: "Enter Floor 2: Thorn Corridor",
          detail: "Take your first real step into the corridor when you decide the risk is worth it.",
          done: false,
          icon: "stairs-up",
        },
      ],
    };
  }

  if (storyState.lyraQuestResolution === "unresolved") {
    return {
      stageId: "mq-lyra-judgment",
      chapter: "Chapter I · Ember Judgment",
      title: "Decide The Fate Of The Satchel",
      summary:
        "You recovered Lyra's ember satchel, but the climb has not answered the harder question: what do you do with a truth that can reshape who trusts you?",
      currentDirective: "Choose whether to return the satchel unopened, study it in secret, or hand it over to guild command.",
      stakes:
        "This choice decides how Lyra reads your character and sets the tone for every ash-route secret that follows.",
      icon: "scale-balance",
      accent: "#ffaf6c",
      progressIndex: 5,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Decision",
      notificationMessage:
        "The ember satchel is in your hands now. Lyra's path will split according to what you do next.",
      objectives: [
        {
          id: "mq-lyra-choice",
          label: "Choose the satchel's fate",
          detail: "Resolve Lyra's request from the quest result window or the guild follow-up prompt.",
          done: false,
          icon: "map-search-outline",
        },
        {
          id: "mq-judge-trust",
          label: "Shape Lyra's trust",
          detail: "Your choice will alter her disposition, future quests, and how much she risks for you later.",
          done: false,
          icon: "account-heart-outline",
        },
      ],
    };
  }

  if (storyState.lyraQuestStatus === "available" || storyState.lyraQuestStatus === "completed") {
    return {
      stageId: "mq-ember-map",
      chapter: "Chapter I · Ember Trails",
      title: "Recover Lyra's Ember Map",
      summary:
        "Lyra has tested you with ash-lane guidance. Now she wants proof you can retrieve what the Tower buries without wasting it.",
      currentDirective: "Take Lyra's Ember Map Recovery from the quest board and bring the satchel back alive after surviving Floor 1.",
      stakes:
        "If you earn Lyra's confidence, you gain more than route hints. You gain a witness to the lower floors who understands what the guild misses.",
      icon: "map-marker-path",
      accent: "#ff9f78",
      progressIndex: 4,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Updated",
      notificationMessage:
        "Lyra's trail has opened. Her ember satchel is now part of your climb, not just a rumor in the ash.",
      objectives: [
        {
          id: "mq-unlock-lyra-quest",
          label: "Find Lyra's request on the quest board",
          detail: "Her contract appears as a special board posting after her contact or later reconciliation.",
          done: true,
          icon: "clipboard-text-search-outline",
        },
        {
          id: "mq-clear-lyra-quest",
          label: "Recover the ember satchel",
          detail: "Complete the special quest and keep enough health to carry the decision that follows.",
          done: storyState.lyraQuestStatus === "completed",
          icon: "package-variant-closed",
        },
      ],
    };
  }

  if (storyState.lyraMet) {
    return {
      stageId: "mq-lyra-contact",
      chapter: "Chapter I · The Scout In Ash",
      title: "Answer Lyra's Ash-Marked Offer",
      summary:
        "A scout has stepped out of the Tower's soot and chosen to intervene. That alone means your climb is already being watched.",
      currentDirective: "Decide whether to trust Lyra's guidance and keep moving through Floor 1 with her warning in mind.",
      stakes:
        "Ignoring a lower-floor scout may protect you from entanglement, but it may also close the only voice currently speaking honestly about the ash lanes.",
      icon: "account-search-outline",
      accent: "#7fd9ff",
      progressIndex: 3,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Updated",
      notificationMessage:
        "A scout named Lyra Ashstep has crossed your route. Her presence means the Tower is no longer faceless.",
      objectives: [
        {
          id: "mq-respond-lyra",
          label: "Respond to Lyra's offer",
          detail: "Accepting her aid opens one route. Refusal does not end her thread forever, but it changes the tone.",
          done: storyState.lyraHelpAccepted > 0 || storyState.lyraHelpDeclined > 0,
          icon: "handshake-outline",
        },
        {
          id: "mq-survive-ash-lanes",
          label: "Keep climbing the ash lanes",
          detail: "Survive the early tower hazards well enough to prove whether her warning was worth trusting.",
          done: false,
          icon: "weather-windy",
        },
      ],
    };
  }

  if (floorOneEntered || completedQuestCount >= 1 || character.progression.level >= 2) {
    return {
      stageId: "mq-ashen-threshold",
      chapter: "Chapter I · Ashen Threshold",
      title: "Step Into The Tower's First Gate",
      summary:
        "The guild has taken your measure. Supplies, board work, and your first climb now converge at Ashen Threshold, where real adventurers stop pretending and start surviving.",
      currentDirective: "Use the quest board to gather supplies, then enter Floor 1: Ashen Threshold and break open the first wave.",
      stakes:
        "The Tower only respects prepared climbers for a moment. After that, it starts testing what you did not bring.",
      icon: "tower-fire",
      accent: "#f8bf71",
      progressIndex: 2,
      totalStages: TOTAL_STAGES,
      notificationTitle: "Main Quest Updated",
      notificationMessage:
        "The guild has pointed you toward Ashen Threshold. Floor 1 is now the heart of your climb.",
      objectives: [
        {
          id: "mq-board-work",
          label: "Work the guild board",
          detail: "Complete early quests so you can stock rope, torchlight, herbs, and tower counters.",
          done: completedQuestCount >= 1,
          icon: "clipboard-list-outline",
        },
        {
          id: "mq-enter-floor1",
          label: "Enter Floor 1: Ashen Threshold",
          detail: "Step into Floor 1 and test the first wave instead of relying on guild rumor.",
          done: floorOneEntered,
          icon: "door-open",
        },
      ],
    };
  }

  return {
    stageId: "mq-guild-banner",
    chapter: "Chapter I · Under The Guild Banner",
    title: "Earn Your First Climber's Footing",
    summary:
      "You have taken a guild license, but the Tower does not yet know your name. Before you chase its heights, you need board work, coin, and the discipline to survive your first real push.",
    currentDirective: "Take your first guild quest and begin preparing for Floor 1: Ashen Threshold.",
    stakes:
      "Every climber begins with a license. Only the ones who move with purpose survive long enough to matter.",
    icon: "sword-cross",
    accent: "#8bd0ff",
    progressIndex: 1,
    totalStages: TOTAL_STAGES,
    notificationTitle: "Main Quest Begun",
    notificationMessage:
      "Your guild license is only the beginning. Take your first quest and prepare for Floor 1: Ashen Threshold.",
    objectives: [
      {
        id: "mq-first-quest",
        label: "Clear your first guild quest",
        detail: "The quest board is your first source of gold, supplies, and proof that you can act under pressure.",
        done: completedQuestCount >= 1,
        icon: "map-marker-radius-outline",
      },
      {
        id: "mq-prepare-first-climb",
        label: "Prepare for the first tower push",
        detail: "Gather enough gear and recovery to survive the opening floor instead of stumbling into it blind.",
        done: false,
        icon: "bag-personal-outline",
      },
    ],
  };
};
