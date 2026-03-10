import { ImageSourcePropType } from "react-native";

const DEFAULT_ASSET_BASE_URL = "https://the-tower-game-assets-v01.s3.us-west-1.amazonaws.com/mobile-assets";

const normalizedBaseUrl = (process.env.EXPO_PUBLIC_ASSET_BASE_URL ?? DEFAULT_ASSET_BASE_URL).replace(/\/+$/, "");

export const resolveAssetUrl = (assetPath: string): string => `${normalizedBaseUrl}/${assetPath.replace(/^\/+/, "")}`;
export const getAssetBaseUrl = (): string => normalizedBaseUrl;

export const s3Asset = (assetPath: string, fallback: ImageSourcePropType): ImageSourcePropType => ({
  uri: resolveAssetUrl(assetPath),
});

export const s3AssetWithFallback = (assetPath: string, fallback: ImageSourcePropType): ImageSourcePropType =>
  normalizedBaseUrl ? s3Asset(assetPath, fallback) : fallback;
