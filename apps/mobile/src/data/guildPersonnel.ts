import { ImageSourcePropType } from "react-native";
import { AdventurerRank, AvatarId, BaseClassId } from "../types/game";
import { s3AssetWithFallback } from "../lib/assetSource";

export type GuildNpcDepartment = "command" | "frontdesk" | "rank-office" | "support" | "story";

export interface GuildNpcProfile {
  id: string;
  name: string;
  title: string;
  role: string;
  level: number;
  avatarId: AvatarId;
  classId: BaseClassId;
  sequenceId: number;
  department: GuildNpcDepartment;
  licenseLabel: string;
  authBody: string;
  signature: string;
  avatarOverride?: ImageSourcePropType;
  rankOfficeFor?: AdventurerRank[];
}

export const GUILD_CORE_NPCS: GuildNpcProfile[] = [
  {
    id: "npc-mage-seraphine",
    name: "Archmage Seraphine",
    title: "Warden of the 10th Circle",
    role: "Revival Specialist",
    level: 99,
    avatarId: "mage-2",
    classId: "mage",
    sequenceId: 1,
    department: "support",
    licenseLabel: "Revival Specialist License",
    authBody: "Arcane Council • Emergency Response Division",
    signature: "S. Arcanum",
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00045.png", require("../../assets/game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00045.png")),
  },
  {
    id: "npc-guildmaster-elara",
    name: "Elara Voss",
    title: "Frontier Guildmaster",
    role: "Guild Command",
    level: 62,
    avatarId: "warrior-4",
    classId: "warrior",
    sequenceId: 2,
    department: "command",
    licenseLabel: "Guildmaster Authority License",
    authBody: "Grand Guild Council • Frontier Charter",
    signature: "E. Voss",
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00147.png", require("../../assets/game/characters/source/epicfantasy/pack-1-150/Tex_EFHaV1_00147.png")),
  },
  {
    id: "npc-receptionist-liora",
    name: "Liora Quill",
    title: "Senior Receptionist",
    role: "Adventurer Intake & Registry",
    level: 18,
    avatarId: "mage-3",
    classId: "mage",
    sequenceId: 3,
    department: "frontdesk",
    licenseLabel: "Guild Front Desk License",
    authBody: "Guild Hall Operations • Intake Desk",
    signature: "L. Quill",
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00189.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00189.png")),
  },
  {
    id: "npc-quartermaster-bran",
    name: "Bran Kest",
    title: "Quartermaster",
    role: "Supply & Store Logistics",
    level: 27,
    avatarId: "ranger-3",
    classId: "ranger",
    sequenceId: 4,
    department: "support",
    licenseLabel: "Quartermaster Supply License",
    authBody: "Guild Logistics Bureau",
    signature: "B. Kest",
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00239.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00239.png")),
  },
];

export const RANK_EXAMINERS_BY_FROM_RANK: Record<AdventurerRank, GuildNpcProfile> = {
  F: {
    id: "npc-examiner-cyrus",
    name: "Cyrus Halden",
    title: "Promotion Examiner",
    role: "F -> E Trial Administration",
    level: 25,
    avatarId: "warrior-2",
    classId: "warrior",
    sequenceId: 5,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Frontier Tier",
    signature: "C. Halden",
    rankOfficeFor: ["F"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00171.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00171.png")),
  },
  E: {
    id: "npc-examiner-nyra",
    name: "Nyra Sol",
    title: "Promotion Examiner",
    role: "E -> D Trial Administration",
    level: 34,
    avatarId: "mage-4",
    classId: "mage",
    sequenceId: 6,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Vanguard Tier",
    signature: "N. Sol",
    rankOfficeFor: ["E"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00172.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00172.png")),
  },
  D: {
    id: "npc-examiner-thorne",
    name: "Thorne Veld",
    title: "Promotion Examiner",
    role: "D -> C Trial Administration",
    level: 41,
    avatarId: "ranger-1",
    classId: "ranger",
    sequenceId: 7,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Vanguard Tier",
    signature: "T. Veld",
    rankOfficeFor: ["D"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00175.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00175.png")),
  },
  C: {
    id: "npc-examiner-virel",
    name: "Virel Dawn",
    title: "Promotion Examiner",
    role: "C -> B Trial Administration",
    level: 50,
    avatarId: "mage-1",
    classId: "mage",
    sequenceId: 8,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • High-Ward Tier",
    signature: "V. Dawn",
    rankOfficeFor: ["C"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00177.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00177.png")),
  },
  B: {
    id: "npc-examiner-lyss",
    name: "Lyss Argent",
    title: "Promotion Examiner",
    role: "B -> A Trial Administration",
    level: 59,
    avatarId: "ranger-4",
    classId: "ranger",
    sequenceId: 9,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • High-Ward Tier",
    signature: "L. Argent",
    rankOfficeFor: ["B"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00188.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00188.png")),
  },
  A: {
    id: "npc-examiner-orin",
    name: "Orin Crest",
    title: "Promotion Examiner",
    role: "A -> S Trial Administration",
    level: 70,
    avatarId: "warrior-1",
    classId: "warrior",
    sequenceId: 10,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Apex Tier",
    signature: "O. Crest",
    rankOfficeFor: ["A"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00200.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00200.png")),
  },
  S: {
    id: "npc-examiner-celeste",
    name: "Celeste Noir",
    title: "Promotion Examiner",
    role: "S -> SS Trial Administration",
    level: 84,
    avatarId: "mage-2",
    classId: "mage",
    sequenceId: 11,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Apex Tier",
    signature: "C. Noir",
    rankOfficeFor: ["S"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00204.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00204.png")),
  },
  SS: {
    id: "npc-examiner-none",
    name: "No Active Examiner",
    title: "Apex Complete",
    role: "No further rank promotion available",
    level: 100,
    avatarId: "warrior-1",
    classId: "warrior",
    sequenceId: 12,
    department: "rank-office",
    licenseLabel: "Rank Office License",
    authBody: "Rank Office • Apex Tier",
    signature: "Council",
    rankOfficeFor: ["SS"],
    avatarOverride: s3AssetWithFallback("game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00229.png", require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00229.png")),
  },
};

export const E_RANK_DUELIST_PROFILE: GuildNpcProfile = {
  id: "npc-riven-hale",
  name: "Riven Hale",
  title: "Hall Duelist",
  role: "E-Rank Trial Challenger",
  level: 12,
  avatarId: "warrior-4",
  classId: "warrior",
  sequenceId: 6.5,
  department: "story",
  licenseLabel: "Sanctioned Duelist License",
  authBody: "Rank Office • Vanguard Duel Circuit",
  signature: "R. Hale",
  avatarOverride: s3AssetWithFallback(
    "game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00200.png",
    require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00200.png"),
  ),
};

export const C_RANK_AUDITOR_PROFILE: GuildNpcProfile = {
  id: "npc-kestrel-marr",
  name: "Kestrel Marr",
  title: "Field Auditor",
  role: "D -> C Assessment Target",
  level: 18,
  avatarId: "ranger-2",
  classId: "ranger",
  sequenceId: 7.5,
  department: "story",
  licenseLabel: "Field Audit License",
  authBody: "Rank Office • Contract Audit Circuit",
  signature: "K. Marr",
  avatarOverride: s3AssetWithFallback(
    "game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00186.png",
    require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00186.png"),
  ),
};

export const B_RANK_FIELD_CAPTAIN_PROFILE: GuildNpcProfile = {
  id: "npc-sable-renn",
  name: "Sable Renn",
  title: "Field Captain",
  role: "C -> B Command Assessment Lead",
  level: 24,
  avatarId: "warrior-1",
  classId: "warrior",
  sequenceId: 8.5,
  department: "story",
  licenseLabel: "Field Command License",
  authBody: "Rank Office • High-Ward Field Circuit",
  signature: "S. Renn",
  avatarOverride: s3AssetWithFallback(
    "game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00182.png",
    require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00182.png"),
  ),
};

export const A_RANK_CHARTER_WITNESS_PROFILE: GuildNpcProfile = {
  id: "npc-serin-vael",
  name: "Serin Vael",
  title: "Ascent Marshal",
  role: "High Ascent Witness",
  level: 42,
  avatarId: "warrior-1",
  classId: "warrior",
  sequenceId: 9.5,
  department: "story",
  licenseLabel: "High Ascent License",
  authBody: "Rank Office • Charter Route Authority",
  signature: "S. Vael",
  avatarOverride: s3AssetWithFallback(
    "game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00195.png",
    require("../../assets/game/characters/source/epicfantasy/pack-151-300/Tex_EFHaV1_00195.png"),
  ),
};

export const getExaminerForRank = (rank: AdventurerRank): GuildNpcProfile =>
  RANK_EXAMINERS_BY_FROM_RANK[rank] ?? RANK_EXAMINERS_BY_FROM_RANK.F;
