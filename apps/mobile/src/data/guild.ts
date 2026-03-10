import { AdventurerRank } from "../types/game";

export interface GuildMasterProfile {
  id: string;
  name: string;
  title: string;
}

export const GUILD_MASTERS_BY_TIER: Array<{
  id: string;
  ranks: AdventurerRank[];
  master: GuildMasterProfile;
}> = [
  {
    id: "frontier-tier",
    ranks: ["F", "E"],
    master: { id: "elara-voss", name: "Elara Voss", title: "Guildmaster" },
  },
  {
    id: "vanguard-tier",
    ranks: ["D", "C"],
    master: { id: "caelum-reyne", name: "Caelum Reyne", title: "Senior Guildmaster" },
  },
  {
    id: "high-ward-tier",
    ranks: ["B", "A"],
    master: { id: "selene-ardent", name: "Selene Ardent", title: "High Guildmaster" },
  },
  {
    id: "apex-tier",
    ranks: ["S", "SS"],
    master: { id: "orion-valcrest", name: "Orion Valcrest", title: "Apex Guildmaster" },
  },
];

export const getGuildMasterForRank = (rank?: AdventurerRank): GuildMasterProfile => {
  const tier = GUILD_MASTERS_BY_TIER.find((entry) => (rank ? entry.ranks.includes(rank) : false));
  return tier?.master ?? GUILD_MASTERS_BY_TIER[0].master;
};
