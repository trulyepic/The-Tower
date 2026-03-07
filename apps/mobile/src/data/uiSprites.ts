import { AvatarId, BaseClassId, QuestDefinition } from "../types/game";

interface AvatarOption {
  id: AvatarId;
  label: string;
  image: number;
}

const AVATAR_SPRITE_BY_ID: Record<AvatarId, number> = {
  "warrior-1": require("../../assets/game/characters/avatars/warrior/warrior-1.png"),
  "warrior-2": require("../../assets/game/characters/avatars/warrior/warrior-2.png"),
  "warrior-3": require("../../assets/game/characters/avatars/warrior/warrior-3.png"),
  "warrior-4": require("../../assets/game/characters/avatars/warrior/warrior-4.png"),
  "ranger-1": require("../../assets/game/characters/avatars/ranger/ranger-1.png"),
  "ranger-2": require("../../assets/game/characters/avatars/ranger/ranger-2.png"),
  "ranger-3": require("../../assets/game/characters/avatars/ranger/ranger-3.png"),
  "ranger-4": require("../../assets/game/characters/avatars/ranger/ranger-4.png"),
  "mage-1": require("../../assets/game/characters/avatars/mage/mage-1.png"),
  "mage-2": require("../../assets/game/characters/avatars/mage/mage-2.png"),
  "mage-3": require("../../assets/game/characters/avatars/mage/mage-3.png"),
  "mage-4": require("../../assets/game/characters/avatars/mage/mage-4.png"),
};

export const CLASS_AVATAR_OPTIONS: Record<BaseClassId, AvatarOption[]> = {
  warrior: [
    { id: "warrior-1", label: "Light Male", image: AVATAR_SPRITE_BY_ID["warrior-1"] },
    { id: "warrior-2", label: "Light Female", image: AVATAR_SPRITE_BY_ID["warrior-2"] },
    { id: "warrior-3", label: "Dark Male", image: AVATAR_SPRITE_BY_ID["warrior-3"] },
    { id: "warrior-4", label: "Dark Female", image: AVATAR_SPRITE_BY_ID["warrior-4"] },
  ],
  ranger: [
    { id: "ranger-1", label: "Light Male", image: AVATAR_SPRITE_BY_ID["ranger-1"] },
    { id: "ranger-2", label: "Light Female", image: AVATAR_SPRITE_BY_ID["ranger-2"] },
    { id: "ranger-3", label: "Dark Male", image: AVATAR_SPRITE_BY_ID["ranger-3"] },
    { id: "ranger-4", label: "Dark Female", image: AVATAR_SPRITE_BY_ID["ranger-4"] },
  ],
  mage: [
    { id: "mage-1", label: "Light Male", image: AVATAR_SPRITE_BY_ID["mage-1"] },
    { id: "mage-2", label: "Light Female", image: AVATAR_SPRITE_BY_ID["mage-2"] },
    { id: "mage-3", label: "Dark Male", image: AVATAR_SPRITE_BY_ID["mage-3"] },
    { id: "mage-4", label: "Dark Female", image: AVATAR_SPRITE_BY_ID["mage-4"] },
  ],
};

export const DEFAULT_AVATAR_BY_CLASS: Record<BaseClassId, AvatarId> = {
  warrior: "warrior-1",
  ranger: "ranger-1",
  mage: "mage-1",
};

export const CLASS_PORTRAIT_BY_ID: Record<BaseClassId, number> = {
  warrior: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.warrior],
  ranger: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.ranger],
  mage: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.mage],
};

export const getAvatarSprite = (avatarId: AvatarId | undefined, classId: BaseClassId): number => {
  if (avatarId && AVATAR_SPRITE_BY_ID[avatarId]) {
    return AVATAR_SPRITE_BY_ID[avatarId];
  }
  return AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS[classId]];
};

export const QUEST_TYPE_SPRITE: Record<QuestDefinition["type"], number> = {
  gather: require("../../assets/game/materials/common/ore-iron.png"),
  adventure: require("../../assets/game/materials/common/torch-lit.png"),
  dungeon: require("../../assets/game/weapons/class/warrior-emberblade.png"),
};

export const CURRENCY_SPRITES = {
  gold: require("../../assets/game/materials/utility/ingot-gold.png"),
  stamina: require("../../assets/game/materials/utility/firewood.png"),
};
