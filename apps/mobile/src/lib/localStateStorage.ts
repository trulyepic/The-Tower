import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { ActiveQuestState, BaseClassId, CharacterState, DailyTask, StoryState } from "../types/game";

const STORAGE_KEY = "web-rpg-mobile-state-v1";

export interface PersistedGameState {
  selectedClass: BaseClassId | null;
  character: CharacterState | null;
  classSequenceByClass?: Record<BaseClassId, number>;
  activeQuest: ActiveQuestState | null;
  dailies: DailyTask[];
  completedQuestCount: number;
  storyState?: StoryState;
}

const getStateFilePath = (): string | null => {
  if (!FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}game-state.json`;
};

/**
 * Uses localStorage on web and a local file on native so this project can
 * persist without requiring additional npm packages in offline environments.
 */
export const loadPersistedState = async (): Promise<PersistedGameState | null> => {
  try {
    if (Platform.OS === "web") {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedGameState) : null;
    }

    const filePath = getStateFilePath();
    if (!filePath) {
      return null;
    }

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return null;
    }

    const raw = await FileSystem.readAsStringAsync(filePath);
    return raw ? (JSON.parse(raw) as PersistedGameState) : null;
  } catch {
    return null;
  }
};

export const savePersistedState = async (state: PersistedGameState): Promise<void> => {
  try {
    const raw = JSON.stringify(state);

    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(STORAGE_KEY, raw);
      return;
    }

    const filePath = getStateFilePath();
    if (!filePath) {
      return;
    }

    await FileSystem.writeAsStringAsync(filePath, raw);
  } catch {
    // Persistence failures should never crash gameplay.
  }
};
