export type AffinityAlignment = "good" | "evil" | "neutral";

export const EXTREME_GOOD_THRESHOLD = 90;
export const EXTREME_EVIL_THRESHOLD = -90;

export const clampAffinity = (value: number): number => Math.max(-100, Math.min(100, Math.round(value)));

export const getAffinityExtremity = (affinity: number): "extreme_good" | "extreme_evil" | "open" => {
  if (affinity >= EXTREME_GOOD_THRESHOLD) {
    return "extreme_good";
  }
  if (affinity <= EXTREME_EVIL_THRESHOLD) {
    return "extreme_evil";
  }
  return "open";
};

export const isChoiceAllowedByAffinity = (affinity: number, alignment: AffinityAlignment): boolean => {
  const extremity = getAffinityExtremity(affinity);
  if (alignment === "neutral") {
    return true;
  }
  if (extremity === "extreme_good") {
    return alignment !== "evil";
  }
  if (extremity === "extreme_evil") {
    return alignment !== "good";
  }
  return true;
};

export const getChoiceLockedReason = (affinity: number, alignment: AffinityAlignment): string | null => {
  if (isChoiceAllowedByAffinity(affinity, alignment)) {
    return null;
  }
  const extremity = getAffinityExtremity(affinity);
  if (extremity === "extreme_good") {
    return alignment === "evil" ? "Your Aetherbound affinity will not let you choose this path." : null;
  }
  if (extremity === "extreme_evil") {
    return alignment === "good" ? "Your Abyssworn affinity will not let you choose this path." : null;
  }
  return null;
};
