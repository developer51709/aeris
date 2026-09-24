export type LandingMessages = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  launch: string;
  readDocs: string;
  features: Array<{ title: string; text: string }>;
  builtTitle: string;
  builtText: string;
  checklist: string[];
};

export type DashboardExtra = {
  welcome: string;
  manage: string;
  yourServers: string;
  status: string;
  operational: string;
  attention: string;
  members: string;
  viewAll: string;
  noServers: string;
  serverManagement: string;
  selectServer: string;
};

export type Messages = {
  overview: string;
  servers: string;
  integrations: string;
  docs: string;
  signOut: string;
  signingOut: string;
  toggleMenu: string;
  language: string;
  chooseLanguage: string;
  madeWithCare: string;
  dashboard: string;
  manageServers: string;
  serverConfiguration: string;
  saveChanges: string;
  saving: string;
  saved: string;
  languageSetting: string;
  languageDescription: string;
  botLanguage: string;
  botLanguageDescription: string;
  selectLanguage: string;
  backToServers: string;
};

export type DocsMessages = {
  eyebrow: string;
  title: string;
  intro: string;
  searchPlaceholder: string;
  allArticles: string;
  backHome: string;
  noResults: string;
  signInCta: string;
  readTime: string;
  updated: string;
  quickReference: string;
  implementationChecklist: string;
  permissionMatrix: string;
  capability: string;
  requiredPermission: string;
  whyItMatters: string;
  coverage: string;
  sections: Array<{ name: string; description: string }>;
  articles: Array<{ id: string; title: string; category: string; summary: string; content: string }>;
};

export type IntegrationMessages = {
  eyebrow: string;
  title: string;
  intro: string;
  minecraftPlayer: string;
  minecraftServer: string;
  robloxUser: string;
  movie: string;
  usernamePlaceholder: string;
  serverPlaceholder: string;
  moviePlaceholder: string;
  lookup: string;
  checkStatus: string;
  search: string;
  imageStudio: string;
  imageIntro: string;
  chooseImage: string;
  original: string;
  grayscale: string;
  sepia: string;
  invert: string;
  download: string;
  selectImage: string;
  lookupFailed: string;
  imageAlt: string;
  resultTitle: string;
};

export type DocsLabels = Pick<DocsMessages, "quickReference" | "implementationChecklist" | "permissionMatrix" | "capability" | "requiredPermission" | "whyItMatters">;

export const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "hi", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
