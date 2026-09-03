// Re-export Prisma client
export { PrismaClient } from "@prisma/client";
export type {
  Guild,
  User,
  GuildMember,
  AutomodRule,
  LevelingConfig,
  EconomyConfig,
  InventoryItem,
  MusicConfig,
  VoicemasterConfig,
  TicketConfig,
  WelcomeConfig,
  Ticket,
  ModerationLog,
} from "@prisma/client";

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GuildConfig {
  guild: Guild;
  leveling: LevelingConfig | null;
  economy: EconomyConfig | null;
  music: MusicConfig | null;
  voicemaster: VoicemasterConfig | null;
  tickets: TicketConfig | null;
  welcome: WelcomeConfig | null;
  automodRules: AutomodRule[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  xp: number;
  level: number;
  rank: number;
}

export interface EconomyLeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  balance: number;
  rank: number;
}

export interface GuildStats {
  memberCount: number;
  onlineCount: number;
  messagesToday: number;
  commandsToday: number;
  activeTickets: number;
}

export interface DocArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  updatedAt: string;
}

export interface SearchResults {
  hits: DocArticle[];
  estimatedTotalHits: number;
  processingTimeMs: number;
}

// Utility Types
export interface WelcomeTemplateVars {
  server: string;
  user: string;
  mention: string;
  channel: string;
}
