import { AdventurerRank } from "../types/game";

export interface RankBand {
  rank: AdventurerRank;
  minLevel: number;
  maxLevel: number;
}

// Canonical adventurer rank-by-level map.
export const RANK_BANDS: RankBand[] = [
  { rank: "F", minLevel: 1, maxLevel: 4 },
  { rank: "E", minLevel: 5, maxLevel: 9 },
  { rank: "D", minLevel: 10, maxLevel: 14 },
  { rank: "C", minLevel: 15, maxLevel: 24 },
  { rank: "B", minLevel: 25, maxLevel: 39 },
  { rank: "A", minLevel: 40, maxLevel: 59 },
  { rank: "S", minLevel: 60, maxLevel: 79 },
  { rank: "SS", minLevel: 80, maxLevel: Number.POSITIVE_INFINITY },
];

const RANK_ORDER: AdventurerRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];

export const getMaxRankForLevel = (level: number): AdventurerRank => {
  const normalizedLevel = Math.max(1, level);
  const matched = RANK_BANDS.find((band) => normalizedLevel >= band.minLevel && normalizedLevel <= band.maxLevel);
  return matched?.rank ?? "F";
};

export const getRankOrderIndex = (rank: AdventurerRank): number => RANK_ORDER.indexOf(rank);

export const getRankUpMinLevel = (fromRank: AdventurerRank): number => {
  const fromIndex = RANK_ORDER.indexOf(fromRank);
  const nextRank = fromIndex >= 0 ? RANK_ORDER[fromIndex + 1] : undefined;
  if (!nextRank) {
    return Number.POSITIVE_INFINITY;
  }
  const nextBand = RANK_BANDS.find((band) => band.rank === nextRank);
  return nextBand?.minLevel ?? Number.POSITIVE_INFINITY;
};

