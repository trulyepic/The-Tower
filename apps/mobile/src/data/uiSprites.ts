import { ImageSourcePropType } from "react-native";
import { AvatarId, BaseClassId, QuestDefinition } from "../types/game";
import { s3AssetWithFallback } from "../lib/assetSource";

interface AvatarOption {
  id: AvatarId;
  label: string;
  image: ImageSourcePropType;
}

const AVATAR_SPRITE_BY_ID: Record<AvatarId, ImageSourcePropType> = {
  "warrior-1": s3AssetWithFallback("game/characters/avatars/warrior/warrior-1.png", require("../../assets/game/characters/avatars/warrior/warrior-1.png")),
  "warrior-2": s3AssetWithFallback("game/characters/avatars/warrior/warrior-2.png", require("../../assets/game/characters/avatars/warrior/warrior-2.png")),
  "warrior-3": s3AssetWithFallback("game/characters/avatars/warrior/warrior-3.png", require("../../assets/game/characters/avatars/warrior/warrior-3.png")),
  "warrior-4": s3AssetWithFallback("game/characters/avatars/warrior/warrior-4.png", require("../../assets/game/characters/avatars/warrior/warrior-4.png")),
  "ranger-1": s3AssetWithFallback("game/characters/avatars/ranger/ranger-1.png", require("../../assets/game/characters/avatars/ranger/ranger-1.png")),
  "ranger-2": s3AssetWithFallback("game/characters/avatars/ranger/ranger-2.png", require("../../assets/game/characters/avatars/ranger/ranger-2.png")),
  "ranger-3": s3AssetWithFallback("game/characters/avatars/ranger/ranger-3.png", require("../../assets/game/characters/avatars/ranger/ranger-3.png")),
  "ranger-4": s3AssetWithFallback("game/characters/avatars/ranger/ranger-4.png", require("../../assets/game/characters/avatars/ranger/ranger-4.png")),
  "mage-1": s3AssetWithFallback("game/characters/avatars/mage/mage-1.png", require("../../assets/game/characters/avatars/mage/mage-1.png")),
  "mage-2": s3AssetWithFallback("game/characters/avatars/mage/mage-2.png", require("../../assets/game/characters/avatars/mage/mage-2.png")),
  "mage-3": s3AssetWithFallback("game/characters/avatars/mage/mage-3.png", require("../../assets/game/characters/avatars/mage/mage-3.png")),
  "mage-4": s3AssetWithFallback("game/characters/avatars/mage/mage-4.png", require("../../assets/game/characters/avatars/mage/mage-4.png")),
};

export const CLASS_AVATAR_OPTIONS: Record<BaseClassId, AvatarOption[]> = {
  warrior: [
    { id: "warrior-1", label: "Light I", image: AVATAR_SPRITE_BY_ID["warrior-1"] },
    { id: "warrior-2", label: "Light II", image: AVATAR_SPRITE_BY_ID["warrior-2"] },
    { id: "warrior-3", label: "Dark I", image: AVATAR_SPRITE_BY_ID["warrior-3"] },
    { id: "warrior-4", label: "Dark II", image: AVATAR_SPRITE_BY_ID["warrior-4"] },
  ],
  ranger: [
    { id: "ranger-1", label: "Light I", image: AVATAR_SPRITE_BY_ID["ranger-1"] },
    { id: "ranger-2", label: "Light II", image: AVATAR_SPRITE_BY_ID["ranger-2"] },
    { id: "ranger-3", label: "Dark I", image: AVATAR_SPRITE_BY_ID["ranger-3"] },
    { id: "ranger-4", label: "Dark II", image: AVATAR_SPRITE_BY_ID["ranger-4"] },
  ],
  mage: [
    { id: "mage-1", label: "Light I", image: AVATAR_SPRITE_BY_ID["mage-1"] },
    { id: "mage-2", label: "Light II", image: AVATAR_SPRITE_BY_ID["mage-2"] },
    { id: "mage-3", label: "Dark I", image: AVATAR_SPRITE_BY_ID["mage-3"] },
    { id: "mage-4", label: "Dark II", image: AVATAR_SPRITE_BY_ID["mage-4"] },
  ],
};

const validateUniqueAvatarAssignments = () => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const classId of Object.keys(CLASS_AVATAR_OPTIONS) as BaseClassId[]) {
    for (const option of CLASS_AVATAR_OPTIONS[classId]) {
      const key = `${classId}:${option.id}`;
      if (seen.has(key)) {
        duplicates.push(`${classId}:${option.id}`);
      } else {
        seen.add(key);
      }
    }
  }
  if (duplicates.length > 0) {
    throw new Error(`Duplicate avatar image assignment detected: ${duplicates.join(", ")}`);
  }
};

if (__DEV__) {
  // Guard against accidental cross-class avatar reuse.
  validateUniqueAvatarAssignments();
}

export const DEFAULT_AVATAR_BY_CLASS: Record<BaseClassId, AvatarId> = {
  warrior: "warrior-1",
  ranger: "ranger-1",
  mage: "mage-1",
};

export const CLASS_PORTRAIT_BY_ID: Record<BaseClassId, ImageSourcePropType> = {
  warrior: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.warrior],
  ranger: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.ranger],
  mage: AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS.mage],
};

export const getAvatarSprite = (avatarId: AvatarId | undefined, classId: BaseClassId): ImageSourcePropType => {
  if (avatarId && AVATAR_SPRITE_BY_ID[avatarId]) {
    return AVATAR_SPRITE_BY_ID[avatarId];
  }
  return AVATAR_SPRITE_BY_ID[DEFAULT_AVATAR_BY_CLASS[classId]];
};

export const QUEST_TYPE_SPRITE: Record<QuestDefinition["type"], ImageSourcePropType> = {
  gather: s3AssetWithFallback("game/materials/common/ore-iron.png", require("../../assets/game/materials/common/ore-iron.png")),
  adventure: s3AssetWithFallback("game/materials/common/torch-lit.png", require("../../assets/game/materials/common/torch-lit.png")),
  dungeon: s3AssetWithFallback("game/weapons/class/warrior-emberblade.png", require("../../assets/game/weapons/class/warrior-emberblade.png")),
};

export const CURRENCY_SPRITES = {
  gold: s3AssetWithFallback("game/materials/utility/ingot-gold.png", require("../../assets/game/materials/utility/ingot-gold.png")),
  stamina: s3AssetWithFallback("game/materials/utility/rod-iron.png", require("../../assets/game/materials/utility/rod-iron.png")),
};
