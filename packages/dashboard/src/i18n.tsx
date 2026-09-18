import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "hi", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  hi: "हिन्दी",
  ru: "Русский",
};

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

export const DASHBOARD_EXTRA = {
  en: { welcome: "Welcome back", manage: "Manage Servers", yourServers: "Your Servers", status: "Aeris status", operational: "Operational", attention: "Needs attention", members: "Members", viewAll: "View all →", noServers: "No servers yet", serverManagement: "Server management", selectServer: "Select a server to manage its settings" },
  es: { welcome: "Bienvenido de nuevo", manage: "Administrar servidores", yourServers: "Tus servidores", status: "Estado de Aeris", operational: "Operativo", attention: "Requiere atención", members: "Miembros", viewAll: "Ver todos →", noServers: "Aún no hay servidores", serverManagement: "Administración de servidores", selectServer: "Selecciona un servidor para administrar su configuración" },
  de: { welcome: "Willkommen zurück", manage: "Server verwalten", yourServers: "Deine Server", status: "Aeris-Status", operational: "Betriebsbereit", attention: "Aufmerksamkeit erforderlich", members: "Mitglieder", viewAll: "Alle anzeigen →", noServers: "Noch keine Server", serverManagement: "Serververwaltung", selectServer: "Wähle einen Server, um seine Einstellungen zu verwalten" },
  fr: { welcome: "Bon retour", manage: "Gérer les serveurs", yourServers: "Vos serveurs", status: "État d’Aeris", operational: "Opérationnel", attention: "Attention requise", members: "Membres", viewAll: "Tout voir →", noServers: "Aucun serveur pour le moment", serverManagement: "Gestion des serveurs", selectServer: "Sélectionnez un serveur pour gérer ses réglages" },
  hi: { welcome: "वापसी पर स्वागत है", manage: "सर्वर प्रबंधित करें", yourServers: "आपके सर्वर", status: "Aeris स्थिति", operational: "सक्रिय", attention: "ध्यान आवश्यक", members: "सदस्य", viewAll: "सभी देखें →", noServers: "अभी कोई सर्वर नहीं", serverManagement: "सर्वर प्रबंधन", selectServer: "सेटिंग प्रबंधित करने के लिए सर्वर चुनें" },
  ru: { welcome: "С возвращением", manage: "Управлять серверами", yourServers: "Ваши серверы", status: "Статус Aeris", operational: "Работает", attention: "Требуется внимание", members: "Участники", viewAll: "Показать все →", noServers: "Серверов пока нет", serverManagement: "Управление серверами", selectServer: "Выберите сервер для управления настройками" },
} satisfies Record<Locale, Record<string, string>>;

export const LANDING_MESSAGES: Record<Locale, LandingMessages> = {
  en: { eyebrow: "Discord bot built for aesthetics and control", title: "The Discord bot with", highlight: "clean CV2 interfaces", description: "Automod, leveling, economy, music, voicemaster, tickets, and welcome messages — all surfaced through a minimal dashboard and search-powered docs.", launch: "Launch Aeris", readDocs: "Read the docs", features: [{ title: "Automod", text: "Word filters, link filters, spam detection, and raid protection." }, { title: "Leveling", text: "XP tracking, level-up image cards, role rewards, and leaderboards." }, { title: "Economy", text: "Daily rewards, work, shop, inventory, blackjack, and trades." }, { title: "Music", text: "Voice playback with queue management and now-playing." }, { title: "Tickets", text: "Ticket creation, transcripts, staff assignment, and close/archive." }, { title: "Docs Center", text: "Search-powered documentation for setup, permissions, and troubleshooting." }], builtTitle: "Built for a clean aesthetic", builtText: "CV2 containers, minimal cards, and a dashboard that stays out of your way while still giving you full control.", checklist: ["Discord Components v2 containers instead of legacy embeds", "Image cards for levelup, leaderboard, economy, and blackjack", "Light and dark themes that respect your system preference", "Search-powered documentation center"] },
  es: { eyebrow: "Bot de Discord creado para la estética y el control", title: "El bot de Discord con", highlight: "interfaces CV2 limpias", description: "Automod, niveles, economía, música, voicemaster, tickets y mensajes de bienvenida, todo desde un panel minimalista y documentación con búsqueda.", launch: "Abrir Aeris", readDocs: "Leer documentación", features: [{ title: "Automod", text: "Filtros de palabras y enlaces, detección de spam y protección contra raids." }, { title: "Niveles", text: "XP, tarjetas de nivel, recompensas de roles y clasificaciones." }, { title: "Economía", text: "Recompensas diarias, trabajos, tienda, inventario, blackjack e intercambios." }, { title: "Música", text: "Reproducción de voz con cola y canción actual." }, { title: "Tickets", text: "Creación de tickets, transcripciones, asignación y archivado." }, { title: "Documentación", text: "Documentación con búsqueda para configuración, permisos y solución de problemas." }], builtTitle: "Diseñado para una estética limpia", builtText: "Contenedores CV2, tarjetas minimalistas y un panel que no estorba, pero te da el control total.", checklist: ["Contenedores Discord Components v2 en lugar de embeds antiguos", "Tarjetas de imagen para niveles, clasificaciones, economía y blackjack", "Temas claro y oscuro que respetan tu sistema", "Centro de documentación con búsqueda"] },
  de: { eyebrow: "Discord-Bot für Ästhetik und Kontrolle", title: "Der Discord-Bot mit", highlight: "sauberen CV2-Oberflächen", description: "Automod, Leveling, Wirtschaft, Musik, Voicemaster, Tickets und Willkommensnachrichten — in einem minimalistischen Dashboard mit durchsuchbarer Dokumentation.", launch: "Aeris starten", readDocs: "Dokumentation lesen", features: [{ title: "Automod", text: "Wort- und Linkfilter, Spam-Erkennung und Raid-Schutz." }, { title: "Leveling", text: "XP-Tracking, Levelkarten, Rollenbelohnungen und Ranglisten." }, { title: "Wirtschaft", text: "Tägliche Belohnungen, Arbeit, Shop, Inventar, Blackjack und Handel." }, { title: "Musik", text: "Sprachwiedergabe mit Warteschlange und aktuellem Titel." }, { title: "Tickets", text: "Ticket-Erstellung, Transkripte, Teamzuweisung und Archivierung." }, { title: "Dokumentation", text: "Durchsuchbare Hilfe für Einrichtung, Berechtigungen und Fehlerbehebung." }], builtTitle: "Für eine klare Ästhetik gebaut", builtText: "CV2-Container, minimale Karten und ein Dashboard, das nicht im Weg steht und dennoch volle Kontrolle bietet.", checklist: ["Discord Components v2 statt veralteter Embeds", "Bildkarten für Level, Rangliste, Wirtschaft und Blackjack", "Helle und dunkle Themen nach Systemeinstellung", "Durchsuchbares Dokumentationszentrum"] },
  fr: { eyebrow: "Un bot Discord pensé pour l’esthétique et le contrôle", title: "Le bot Discord avec des", highlight: "interfaces CV2 épurées", description: "Automod, niveaux, économie, musique, voicemaster, tickets et messages de bienvenue dans un tableau de bord minimaliste avec documentation recherchable.", launch: "Lancer Aeris", readDocs: "Lire la documentation", features: [{ title: "Automod", text: "Filtres de mots et de liens, détection du spam et protection anti-raid." }, { title: "Niveaux", text: "XP, cartes de niveau, récompenses de rôles et classements." }, { title: "Économie", text: "Récompenses quotidiennes, travail, boutique, inventaire, blackjack et échanges." }, { title: "Musique", text: "Lecture vocale avec file d’attente et titre en cours." }, { title: "Tickets", text: "Création de tickets, transcriptions, attribution et archivage." }, { title: "Documentation", text: "Documentation recherchable pour la configuration, les permissions et le dépannage." }], builtTitle: "Pensé pour une esthétique épurée", builtText: "Conteneurs CV2, cartes minimalistes et tableau de bord discret qui vous laisse le contrôle.", checklist: ["Conteneurs Discord Components v2 au lieu des anciens embeds", "Cartes d’image pour les niveaux, classements, économie et blackjack", "Thèmes clair et sombre selon vos préférences système", "Centre de documentation avec recherche"] },
  hi: { eyebrow: "सुंदरता और नियंत्रण के लिए बनाया गया Discord बॉट", title: "साफ़ CV2 इंटरफेस वाला", highlight: "Discord बॉट", description: "Automod, लेवलिंग, अर्थव्यवस्था, संगीत, voicemaster, tickets और welcome संदेश — एक सरल डैशबोर्ड और खोज योग्य दस्तावेज़ों के साथ।", launch: "Aeris शुरू करें", readDocs: "दस्तावेज़ पढ़ें", features: [{ title: "Automod", text: "शब्द और लिंक फ़िल्टर, स्पैम डिटेक्शन और raid सुरक्षा।" }, { title: "लेवलिंग", text: "XP ट्रैकिंग, लेवल कार्ड, रोल रिवॉर्ड और लीडरबोर्ड।" }, { title: "अर्थव्यवस्था", text: "दैनिक पुरस्कार, काम, दुकान, इन्वेंटरी, blackjack और ट्रेड।" }, { title: "संगीत", text: "क्यू और वर्तमान गाने के साथ voice playback।" }, { title: "Tickets", text: "Ticket बनाना, transcripts, staff assignment और archive।" }, { title: "दस्तावेज़ केंद्र", text: "सेटअप, permissions और समस्या समाधान के लिए खोज योग्य दस्तावेज़।" }], builtTitle: "साफ़ डिज़ाइन के लिए बनाया गया", builtText: "CV2 containers, minimal cards और ऐसा dashboard जो रास्ते में नहीं आता, फिर भी पूरा नियंत्रण देता है।", checklist: ["पुराने embeds की जगह Discord Components v2 containers", "लेवल, लीडरबोर्ड, economy और blackjack के लिए image cards", "सिस्टम preference के अनुसार light और dark themes", "खोज योग्य documentation center"] },
  ru: { eyebrow: "Discord-бот для эстетики и полного контроля", title: "Discord-бот с", highlight: "чистыми CV2-интерфейсами", description: "Автомодерация, уровни, экономика, музыка, voicemaster, тикеты и приветствия — в минималистичной панели с документацией и поиском.", launch: "Запустить Aeris", readDocs: "Открыть документацию", features: [{ title: "Автомодерация", text: "Фильтры слов и ссылок, защита от спама и рейдов." }, { title: "Уровни", text: "XP, карточки уровней, награды ролями и рейтинги." }, { title: "Экономика", text: "Ежедневные награды, работа, магазин, инвентарь, blackjack и обмен." }, { title: "Музыка", text: "Воспроизведение с очередью и текущим треком." }, { title: "Тикеты", text: "Создание тикетов, транскрипты, назначение сотрудников и архивирование." }, { title: "Документация", text: "Поиск по настройке, разрешениям и устранению проблем." }], builtTitle: "Создан для чистой эстетики", builtText: "CV2-контейнеры, минималистичные карточки и панель, которая не мешает, но даёт полный контроль.", checklist: ["Discord Components v2 вместо устаревших embeds", "Карточки изображений для уровней, рейтингов, экономики и blackjack", "Светлая и тёмная темы с учётом настроек системы", "Центр документации с поиском"] },
};

type Messages = {
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

const messages: Record<Locale, Messages> = {
  en: { overview: "Overview", servers: "Servers", integrations: "Integrations", docs: "Docs", signOut: "Sign out", signingOut: "Signing out…", toggleMenu: "Toggle menu", language: "Language", chooseLanguage: "Choose language", madeWithCare: "Aeris · Discord Bot · Made with care", dashboard: "Dashboard", manageServers: "Manage your servers and Aeris settings", serverConfiguration: "Server configuration", saveChanges: "Save changes", saving: "Saving…", saved: "Saved", languageSetting: "Language", languageDescription: "Choose the language Aeris uses for this server's bot responses.", botLanguage: "Bot language", botLanguageDescription: "This setting applies to commands and automated messages in this server.", selectLanguage: "Select a language", backToServers: "Back to servers" },
  es: { overview: "Resumen", servers: "Servidores", integrations: "Integraciones", docs: "Documentación", signOut: "Cerrar sesión", signingOut: "Cerrando sesión…", toggleMenu: "Mostrar menú", language: "Idioma", chooseLanguage: "Elegir idioma", madeWithCare: "Aeris · Bot de Discord · Hecho con cuidado", dashboard: "Panel", manageServers: "Administra tus servidores y la configuración de Aeris", serverConfiguration: "Configuración del servidor", saveChanges: "Guardar cambios", saving: "Guardando…", saved: "Guardado", languageSetting: "Idioma", languageDescription: "Elige el idioma de las respuestas del bot en este servidor.", botLanguage: "Idioma del bot", botLanguageDescription: "Esta opción se aplica a los comandos y mensajes automáticos de este servidor.", selectLanguage: "Selecciona un idioma", backToServers: "Volver a servidores" },
  de: { overview: "Übersicht", servers: "Server", integrations: "Integrationen", docs: "Dokumentation", signOut: "Abmelden", signingOut: "Abmeldung…", toggleMenu: "Menü umschalten", language: "Sprache", chooseLanguage: "Sprache wählen", madeWithCare: "Aeris · Discord-Bot · Mit Sorgfalt erstellt", dashboard: "Dashboard", manageServers: "Verwalte deine Server und Aeris-Einstellungen", serverConfiguration: "Serverkonfiguration", saveChanges: "Änderungen speichern", saving: "Speichern…", saved: "Gespeichert", languageSetting: "Sprache", languageDescription: "Wähle die Sprache für Bot-Antworten auf diesem Server.", botLanguage: "Bot-Sprache", botLanguageDescription: "Diese Einstellung gilt für Befehle und automatische Nachrichten auf diesem Server.", selectLanguage: "Sprache auswählen", backToServers: "Zurück zu Servern" },
  fr: { overview: "Aperçu", servers: "Serveurs", integrations: "Intégrations", docs: "Documentation", signOut: "Se déconnecter", signingOut: "Déconnexion…", toggleMenu: "Afficher le menu", language: "Langue", chooseLanguage: "Choisir la langue", madeWithCare: "Aeris · Bot Discord · Fait avec soin", dashboard: "Tableau de bord", manageServers: "Gérez vos serveurs et les réglages d'Aeris", serverConfiguration: "Configuration du serveur", saveChanges: "Enregistrer", saving: "Enregistrement…", saved: "Enregistré", languageSetting: "Langue", languageDescription: "Choisissez la langue des réponses du bot sur ce serveur.", botLanguage: "Langue du bot", botLanguageDescription: "Ce réglage s'applique aux commandes et messages automatiques de ce serveur.", selectLanguage: "Choisir une langue", backToServers: "Retour aux serveurs" },
  hi: { overview: "अवलोकन", servers: "सर्वर", integrations: "इंटीग्रेशन", docs: "दस्तावेज़", signOut: "साइन आउट", signingOut: "साइन आउट हो रहा है…", toggleMenu: "मेनू बदलें", language: "भाषा", chooseLanguage: "भाषा चुनें", madeWithCare: "Aeris · Discord बॉट · सावधानी से बनाया गया", dashboard: "डैशबोर्ड", manageServers: "अपने सर्वर और Aeris सेटिंग प्रबंधित करें", serverConfiguration: "सर्वर कॉन्फ़िगरेशन", saveChanges: "बदलाव सहेजें", saving: "सहेजा जा रहा है…", saved: "सहेजा गया", languageSetting: "भाषा", languageDescription: "इस सर्वर में बॉट प्रतिक्रियाओं की भाषा चुनें।", botLanguage: "बॉट भाषा", botLanguageDescription: "यह सेटिंग इस सर्वर के कमांड और स्वचालित संदेशों पर लागू होती है।", selectLanguage: "भाषा चुनें", backToServers: "सर्वर पर वापस जाएँ" },
  ru: { overview: "Обзор", servers: "Серверы", integrations: "Интеграции", docs: "Документация", signOut: "Выйти", signingOut: "Выход…", toggleMenu: "Открыть меню", language: "Язык", chooseLanguage: "Выбрать язык", madeWithCare: "Aeris · Бот Discord · Сделано с заботой", dashboard: "Панель управления", manageServers: "Управляйте серверами и настройками Aeris", serverConfiguration: "Настройки сервера", saveChanges: "Сохранить изменения", saving: "Сохранение…", saved: "Сохранено", languageSetting: "Язык", languageDescription: "Выберите язык ответов бота на этом сервере.", botLanguage: "Язык бота", botLanguageDescription: "Настройка применяется к командам и автоматическим сообщениям этого сервера.", selectLanguage: "Выберите язык", backToServers: "Назад к серверам" },
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

const docsBase: DocsMessages = {
  eyebrow: "Aeris knowledge base",
  title: "Documentation",
  intro: "Practical guides for setup, configuration, permissions, and everyday server operations.",
  searchPlaceholder: "Search guides, commands, or topics…",
  allArticles: "All articles",
  backHome: "Back home",
  noResults: "No guides matched your search. Try a broader term or choose another category.",
  signInCta: "Ready to manage your server? Sign in →",
  readTime: "min read",
  updated: "Updated for the current Aeris dashboard",
  quickReference: "Quick reference",
  implementationChecklist: "Implementation checklist",
  permissionMatrix: "Permission matrix",
  capability: "Capability",
  requiredPermission: "Required permission",
  whyItMatters: "Why it matters",
  coverage: "Coverage",
  sections: [
    { name: "Basics", description: "Launch Aeris, invite it safely, and understand the dashboard." },
    { name: "Moderation", description: "Build a reliable moderation baseline for your community." },
    { name: "Features", description: "Configure engagement, economy, music, tickets, and welcome tools." },
    { name: "Troubleshooting", description: "Resolve permissions, voice, and configuration issues quickly." },
  ],
  articles: [
    { id: "getting-started", title: "Getting started", category: "Basics", summary: "Go from a fresh invite to a configured server in a few minutes.", content: "1. Sign in with Discord and select a server you manage.\n2. Invite Aeris from the server overview and review the requested permissions.\n3. Open Server settings to choose the bot language, prefix, log channel, welcome behavior, and module defaults.\n4. Run /bot info in Discord, then test one command from each enabled module.\n\nRecommended first checks\n• Confirm Aeris can view and send messages in your intended command channels.\n• Put the Aeris role above any roles it needs to assign or moderate.\n• Configure a private moderation-log channel before enabling automated actions.\n• Use the dashboard Integrations page to validate external providers without exposing keys to Discord." },
    { id: "invite-permissions", title: "Invite and permissions", category: "Basics", summary: "Choose the smallest permission set that still supports your enabled modules.", content: "Aeris works best with explicit permissions rather than blindly granting Administrator. At minimum, moderation requires View Channel, Send Messages, Manage Messages, Moderate Members, and (where used) Kick Members, Ban Members, and Manage Roles. Music requires Connect, Speak, and Use Voice Activity. Tickets and welcome tools need permission to create channels, manage permissions, and send messages.\n\nRole hierarchy matters: Discord will not let Aeris edit, assign, timeout, kick, or ban a member whose highest role is equal to or above Aeris's highest role. Channel overrides can also remove a permission that is granted at the server level." },
    { id: "moderation-baseline", title: "Moderation baseline", category: "Moderation", summary: "Set up automod, logs, and escalation rules before your community grows.", content: "Start in Server settings by selecting a moderation log channel. Enable only the automod protections your team is ready to review: word filters, link filters, spam detection, invite blocking, and raid protection. Use /automod status to verify the active configuration.\n\nUse /moderation history and /moderation cases to review actions. Keep reasons specific and consistent; they become useful audit context for staff. Test changes in a private channel first, and make sure the bot role can act on the members and roles you expect it to moderate." },
    { id: "leveling-economy", title: "Leveling and economy", category: "Features", summary: "Create healthy engagement loops with XP, rewards, and an economy that is easy to understand.", content: "Members earn XP through normal activity and can inspect progress with /leveling profile. Use /leveling leaderboard for a quick ranking view and configure level-up messaging and role rewards from the dashboard.\n\nThe economy includes balance, daily, work, pay, shop, inventory, and blackjack flows. Set clear reward expectations for your community, avoid excessive payouts, and review economy data regularly. Admin shop changes should be announced so members understand pricing and availability." },
    { id: "music-tickets-welcome", title: "Music, tickets, and welcome flows", category: "Features", summary: "Configure the high-touch modules that shape a member's daily experience.", content: "For music, join a voice channel and use /music play with a URL or search query. Check /music queue and /music nowplaying before changing playback. Lavalink nodes are tried in failover order; verify Connect and Speak permissions if playback cannot start.\n\nUse /ticket setup to publish a support panel, then set staff access and transcript behavior in the dashboard. For onboarding, configure a welcome channel, message variables such as {user}, {server}, and {mention}, and an optional automatic role." },
    { id: "permission-troubleshooting", title: "Troubleshooting permissions", category: "Troubleshooting", summary: "A systematic checklist for the most common Discord permission failures.", content: "When Aeris reports Missing Permissions, check in this order:\n1. The bot is still a member of the server and can see the channel.\n2. The Aeris role is above every role it must manage.\n3. Channel-specific overwrites are not denying the action.\n4. The required server permission is enabled for the relevant command.\n5. The target member is below Aeris in the role hierarchy.\n\nAfter correcting permissions, retry the command rather than re-inviting immediately. If the issue persists, use /admin permissions and the dashboard server health view to identify the missing capability." },
    { id: "dashboard-integrations", title: "Dashboard integrations", category: "Basics", summary: "Use provider-backed lookups and local image tools without sharing secrets with the bot.", content: "The Integrations page provides Minecraft player and server lookups, Roblox user lookups, and movie or TV search. Results are fetched through the API, so provider credentials remain server-side.\n\nImage Studio performs preview filters in the browser. Images are not uploaded by the preview workflow; download the result when you are ready to use it. External providers such as TMDB or Tenor must be configured by an administrator in the environment before their features can return provider data." },
    { id: "dashboard-overview", title: "Reading the server overview", category: "Basics", summary: "Understand health signals, provider status, member counts, and the difference between synced and managed servers.", content: "The overview is a live operational snapshot, not a replacement for Discord's own server settings. Member counts and provider status are loaded independently, so a delayed provider should not make a healthy bot appear offline.\n\nUse the health cards as a triage sequence: confirm the bot is connected, confirm the guild is synced, then inspect the module and provider cards. A server can be managed by your Discord account while still waiting for its first bot synchronization; refresh after the bot's ready event completes." },
    { id: "command-design", title: "Command design and response patterns", category: "Features", summary: "Choose slash commands, prefix commands, and context actions deliberately so staff can work quickly.", content: "Slash commands provide discoverable options, validation, and permission metadata. Prefix commands are useful for fast, familiar actions, while context menu commands keep moderation close to the object being acted on.\n\nPrefer read-only status commands before destructive actions. For bulk operations, verify the target, role hierarchy, and scope first; review the result summary afterward. Aeris reports skipped and failed targets separately when Discord cannot apply an operation." },
    { id: "data-and-privacy", title: "Data, privacy, and provider boundaries", category: "Basics", summary: "Know what Aeris stores, what Discord supplies, and which credentials remain server-side.", content: "Aeris stores server configuration, selected module state, moderation records, and feature data needed to operate the bot. Discord remains the source of truth for membership, roles, permissions, and message events.\n\nProvider keys are read by the API or bot process and are never sent to the browser as dashboard configuration. Lookups return provider results, not provider credentials. Remove unused integrations and rotate credentials through your deployment environment rather than placing them in commands or dashboard text." },
    { id: "voice-and-lavalink", title: "Voice diagnostics and Lavalink failover", category: "Troubleshooting", summary: "Diagnose voice playback with a repeatable node, permission, and query checklist.", content: "First confirm the bot can Connect and Speak in the voice channel and that the user invoking playback is in a voice channel. Then run /music status and inspect the active node. A failed search does not always mean the node is unavailable; test a direct URL and a short search query separately.\n\nAeris tries configured Lavalink nodes in order and can move to the next healthy node. If every node fails, verify node URLs, credentials, secure transport settings, and the node's source managers. Clear stale queues only after recording the current now-playing track." },
    { id: "release-checklist", title: "Production launch checklist", category: "Troubleshooting", summary: "A preflight checklist for deploying the bot, API, dashboard, and database together.", content: "Before launch, run typechecks, generate Prisma client types, and apply the schema to the production database. Verify the bot token, OAuth redirect, session secret, API origin, and provider keys through the deployment environment.\n\nAfter deployment, check the API health endpoint, sign in with Discord, confirm the managed server list, run /bot info, and test one moderation action in a private channel. Confirm logs are writable, Lavalink has a healthy node, and the dashboard can save a guild language setting before announcing the release." },
    { id: "automod-tuning", title: "Automod tuning without false positives", category: "Moderation", summary: "Roll out filters gradually and use logs to tune protection around real community behavior.", content: "Begin with logging and conservative thresholds. Add one word or domain rule at a time, test it against legitimate messages, and document an exception process for moderators. Spam and raid protection should be enabled alongside a clear log channel so staff can distinguish a rule match from a rate-limit event.\n\nReview false positives weekly. Keep rules specific, avoid broad fragments that match normal words, and use the dashboard to make changes traceable rather than editing production values during an active incident." },
  ],
};

const translatedDocs: Partial<Record<Locale, DocsMessages>> = {
  es: { ...docsBase, eyebrow: "Base de conocimiento de Aeris", title: "Documentación", intro: "Guías prácticas para configurar, proteger y administrar tu servidor.", searchPlaceholder: "Busca guías, comandos o temas…", allArticles: "Todos los artículos", backHome: "Volver al inicio", noResults: "No encontramos guías. Prueba un término más amplio o elige otra categoría.", signInCta: "¿Listo para administrar tu servidor? Inicia sesión →", updated: "Actualizado para el panel actual de Aeris" },
  de: { ...docsBase, eyebrow: "Aeris-Wissensdatenbank", title: "Dokumentation", intro: "Praktische Anleitungen für Einrichtung, Konfiguration, Berechtigungen und Serverbetrieb.", searchPlaceholder: "Anleitungen, Befehle oder Themen suchen…", allArticles: "Alle Artikel", backHome: "Zur Startseite", noResults: "Keine Anleitung gefunden. Versuche einen allgemeineren Begriff.", signInCta: "Bereit, deinen Server zu verwalten? Anmelden →", updated: "Für das aktuelle Aeris-Dashboard aktualisiert" },
  fr: { ...docsBase, eyebrow: "Base de connaissances Aeris", title: "Documentation", intro: "Guides pratiques pour configurer, sécuriser et administrer votre serveur.", searchPlaceholder: "Rechercher des guides, commandes ou sujets…", allArticles: "Tous les articles", backHome: "Retour à l’accueil", noResults: "Aucun guide ne correspond. Essayez un terme plus général.", signInCta: "Prêt à gérer votre serveur ? Se connecter →", updated: "Mis à jour pour le tableau de bord Aeris actuel" },
  hi: { ...docsBase, eyebrow: "Aeris ज्ञान केंद्र", title: "दस्तावेज़", intro: "सेटअप, कॉन्फ़िगरेशन, permissions और server management के लिए उपयोगी guides।", searchPlaceholder: "गाइड, कमांड या विषय खोजें…", allArticles: "सभी लेख", backHome: "होम पर जाएँ", noResults: "कोई guide नहीं मिला। व्यापक शब्द से खोजें।", signInCta: "सर्वर प्रबंधित करने के लिए तैयार हैं? साइन इन करें →", updated: "वर्तमान Aeris dashboard के लिए अपडेट किया गया" },
  ru: { ...docsBase, eyebrow: "База знаний Aeris", title: "Документация", intro: "Практические руководства по настройке, разрешениям и ежедневному управлению сервером.", searchPlaceholder: "Поиск руководств, команд или тем…", allArticles: "Все статьи", backHome: "На главную", noResults: "Руководства не найдены. Попробуйте более общий запрос.", signInCta: "Готовы управлять сервером? Войти →", updated: "Обновлено для текущей панели Aeris" },
};

const articleOverrides: Partial<Record<Locale, Record<string, Partial<DocsMessages["articles"][number]>>>> = {
  es: {
    "getting-started": { title: "Primeros pasos", summary: "Configura un servidor nuevo y valida cada módulo con una lista de comprobación clara.", content: "1. Inicia sesión con Discord y selecciona un servidor que administras.\n2. Invita Aeris desde el resumen del servidor y revisa los permisos solicitados.\n3. Abre Ajustes del servidor para elegir idioma, prefijo, canal de registros y módulos.\n4. Ejecuta /bot info y prueba un comando de cada módulo activo.\n\nLista de comprobación\n• Confirma que Aeris puede ver y escribir en los canales de comandos.\n• Coloca el rol de Aeris por encima de los roles que debe administrar.\n• Configura un canal privado de moderación antes de activar acciones automáticas.\n• Usa Integraciones para comprobar proveedores sin mostrar claves en Discord." },
    "invite-permissions": { title: "Invitación y permisos", summary: "Elige los permisos mínimos que necesitan tus módulos sin conceder acceso excesivo.", content: "Aeris funciona mejor con permisos explícitos que con Administrator. Moderación necesita Manage Messages, Moderate Members y, según la acción, Kick Members, Ban Members y Manage Roles. Música necesita Connect y Speak; tickets necesitan Manage Channels.\n\nLa jerarquía importa: Discord no permite que Aeris edite, asigne, silencie o sancione miembros cuyo rol más alto sea igual o superior al del bot. Revisa también las excepciones de permisos del canal." },
    "release-checklist": { title: "Lista de lanzamiento", summary: "Comprueba el bot, la API, el panel y la base de datos antes de publicar.", content: "Antes de publicar, ejecuta los typechecks, genera Prisma y aplica el esquema a la base de datos. Verifica token, OAuth, sesión, origen de la API y proveedores en el entorno de despliegue.\n\nDespués, abre el endpoint de salud, inicia sesión, confirma los servidores administrables, ejecuta /bot info y prueba una moderación en un canal privado. Comprueba también los registros, Lavalink y el guardado del idioma del servidor." },
  },
  de: {
    "getting-started": { title: "Erste Schritte", summary: "Richte einen neuen Server ein und prüfe jedes Modul mit einer klaren Checkliste.", content: "1. Melde dich mit Discord an und wähle einen Server, den du verwaltest.\n2. Lade Aeris aus der Serverübersicht ein und prüfe die angeforderten Berechtigungen.\n3. Wähle in den Servereinstellungen Sprache, Präfix, Log-Kanal und Module.\n4. Führe /bot info aus und teste je einen Befehl der aktivierten Module.\n\nCheckliste\n• Aeris muss in den vorgesehenen Kanälen sehen und schreiben können.\n• Das Aeris-Rolle muss über allen verwalteten Rollen stehen.\n• Richte vor automatischen Aktionen einen privaten Moderationskanal ein.\n• Prüfe externe Anbieter über Integrationen, ohne Schlüssel in Discord zu teilen." },
    "invite-permissions": { title: "Einladung und Berechtigungen", summary: "Gib nur die Berechtigungen frei, die deine aktivierten Module tatsächlich benötigen.", content: "Aeris funktioniert zuverlässiger mit einzelnen Berechtigungen als mit Administrator. Moderation benötigt Manage Messages, Moderate Members und je nach Aktion Kick Members, Ban Members und Manage Roles. Musik benötigt Connect und Speak; Tickets benötigen Manage Channels.\n\nDie Rollen-Hierarchie ist entscheidend: Discord blockiert Änderungen an Mitgliedern und Rollen, die gleich hoch oder höher als die Aeris-Rolle sind. Prüfe zusätzlich kanalbezogene Überschreibungen." },
    "release-checklist": { title: "Produktions-Checkliste", summary: "Prüfe Bot, API, Dashboard und Datenbank vor dem Start gemeinsam.", content: "Führe vor dem Start Typechecks aus, generiere Prisma-Typen und wende das Schema auf die Produktionsdatenbank an. Prüfe Token, OAuth-Weiterleitung, Sitzung, API-Ursprung und Provider im Deployment-Umfeld.\n\nNach dem Start: Health-Endpunkt prüfen, mit Discord anmelden, verwaltete Server bestätigen, /bot info ausführen und eine Moderationsaktion privat testen. Danach Logs, Lavalink und das Speichern der Serversprache prüfen." },
  },
  fr: {
    "getting-started": { title: "Bien démarrer", summary: "Configurez un serveur et validez chaque module avec une checklist claire.", content: "1. Connectez-vous avec Discord et choisissez un serveur que vous gérez.\n2. Invitez Aeris depuis le résumé du serveur et vérifiez les permissions.\n3. Dans les réglages, choisissez la langue, le préfixe, le canal de logs et les modules.\n4. Lancez /bot info puis testez une commande de chaque module actif.\n\nChecklist\n• Aeris doit pouvoir voir et écrire dans les canaux concernés.\n• Placez son rôle au-dessus des rôles qu’il doit gérer.\n• Configurez un canal de modération privé avant les actions automatiques.\n• Validez les fournisseurs depuis Intégrations sans exposer de clés dans Discord." },
    "invite-permissions": { title: "Invitation et permissions", summary: "Accordez les permissions nécessaires sans donner un accès excessif.", content: "Aeris est plus sûr avec des permissions précises qu’avec Administrator. La modération utilise Manage Messages, Moderate Members et selon l’action Kick Members, Ban Members ou Manage Roles. La musique utilise Connect et Speak; les tickets utilisent Manage Channels.\n\nLa hiérarchie des rôles est obligatoire: Discord bloque les actions sur les membres et rôles placés au même niveau ou au-dessus d’Aeris. Vérifiez aussi les permissions propres au canal." },
    "release-checklist": { title: "Checklist de mise en production", summary: "Validez le bot, l’API, le tableau de bord et la base avant la publication.", content: "Avant la mise en ligne, lancez les vérifications TypeScript, générez Prisma et appliquez le schéma à la base de production. Vérifiez le token, OAuth, la session, l’origine API et les fournisseurs dans l’environnement de déploiement.\n\nAprès publication, testez la santé de l’API, la connexion Discord, la liste des serveurs, /bot info, une action de modération privée, les logs, Lavalink et l’enregistrement de la langue du serveur." },
  },
  hi: {
    "getting-started": { title: "शुरुआत कैसे करें", summary: "नए सर्वर को सेट करें और स्पष्ट checklist से हर module की जाँच करें।", content: "1. Discord से sign in करके अपना managed server चुनें।\n2. Server overview से Aeris को invite करें और permissions जाँचें।\n3. Server settings में language, prefix, log channel और modules चुनें।\n4. /bot info चलाएँ और हर enabled module का एक command test करें।\n\nChecklist\n• Aeris को command channels में view और send permissions दें।\n• Aeris role को managed roles से ऊपर रखें।\n• Automatic actions से पहले private moderation log channel बनाएँ।\n• Keys Discord में दिखाए बिना Integrations से providers जाँचें।" },
    "invite-permissions": { title: "Invite और permissions", summary: "सिर्फ वही permissions दें जिनकी enabled modules को आवश्यकता है।", content: "Administrator देने के बजाय Aeris को स्पष्ट permissions दें। Moderation के लिए Manage Messages, Moderate Members और जरूरत के अनुसार Kick Members, Ban Members, Manage Roles चाहिए। Music के लिए Connect और Speak तथा tickets के लिए Manage Channels चाहिए।\n\nRole hierarchy आवश्यक है: Aeris समान या ऊपर के roles वाले members या roles को बदल नहीं सकता। Channel-specific permission overwrites भी जाँचें।" },
    "release-checklist": { title: "Production launch checklist", summary: "Publish करने से पहले bot, API, dashboard और database की जाँच करें।", content: "Launch से पहले typechecks चलाएँ, Prisma types generate करें और production database में schema लागू करें। Deployment environment में token, OAuth redirect, session, API origin और provider keys जाँचें।\n\nLaunch के बाद health endpoint, Discord login, managed server list, /bot info और private moderation action test करें। Logs, Lavalink और server language save भी verify करें।" },
  },
  ru: {
    "getting-started": { title: "Начало работы", summary: "Настройте сервер и проверьте каждый модуль по понятному списку действий.", content: "1. Войдите через Discord и выберите сервер, которым управляете.\n2. Пригласите Aeris из обзора сервера и проверьте разрешения.\n3. В настройках выберите язык, префикс, канал журналов и модули.\n4. Выполните /bot info и проверьте по одной команде каждого модуля.\n\nЧеклист\n• Aeris должен видеть и отправлять сообщения в нужных каналах.\n• Роль Aeris должна быть выше ролей, которыми она управляет.\n• Создайте закрытый канал модерации до включения автоматических действий.\n• Проверяйте провайдеров через Интеграции, не публикуя ключи в Discord." },
    "invite-permissions": { title: "Приглашение и разрешения", summary: "Выдайте только те разрешения, которые нужны включённым модулям.", content: "Точные разрешения безопаснее, чем Administrator. Модерации нужны Manage Messages, Moderate Members и, в зависимости от действия, Kick Members, Ban Members и Manage Roles. Музыке нужны Connect и Speak, тикетам — Manage Channels.\n\nИерархия ролей обязательна: Discord не разрешит Aeris менять участников и роли на том же или более высоком уровне. Проверьте также ограничения конкретного канала." },
    "release-checklist": { title: "Чеклист запуска", summary: "Проверьте бота, API, панель и базу данных перед публикацией.", content: "Перед запуском выполните typecheck, сгенерируйте Prisma и примените схему к production-базе. Проверьте token, OAuth redirect, session, API origin и провайдеров в окружении деплоя.\n\nПосле запуска проверьте health endpoint, вход через Discord, список серверов, /bot info, приватное действие модерации, логи, Lavalink и сохранение языка сервера." },
  },
};

export function getDocsMessages(locale: Locale): DocsMessages {
  const base = translatedDocs[locale] ?? docsBase;
  const overrides = articleOverrides[locale];
  const labels: Partial<DocsMessages> = locale === "es" ? { quickReference: "Referencia rápida", implementationChecklist: "Lista de implementación", permissionMatrix: "Matriz de permisos", capability: "Capacidad", requiredPermission: "Permiso requerido", whyItMatters: "Por qué importa" } : locale === "de" ? { quickReference: "Kurzübersicht", implementationChecklist: "Umsetzungscheckliste", permissionMatrix: "Berechtigungsmatrix", capability: "Funktion", requiredPermission: "Benötigte Berechtigung", whyItMatters: "Warum wichtig" } : locale === "fr" ? { quickReference: "Référence rapide", implementationChecklist: "Checklist de mise en œuvre", permissionMatrix: "Matrice des permissions", capability: "Fonction", requiredPermission: "Permission requise", whyItMatters: "Pourquoi c’est important" } : locale === "hi" ? { quickReference: "त्वरित संदर्भ", implementationChecklist: "Implementation checklist", permissionMatrix: "Permission matrix", capability: "Capability", requiredPermission: "Required permission", whyItMatters: "क्यों ज़रूरी है" } : locale === "ru" ? { quickReference: "Краткая справка", implementationChecklist: "Чеклист внедрения", permissionMatrix: "Матрица разрешений", capability: "Возможность", requiredPermission: "Требуемое разрешение", whyItMatters: "Зачем это нужно" } : {};
  return { ...base, ...labels, articles: base.articles.map((article) => ({ ...article, ...overrides?.[article.id] })) };
}

export const INTEGRATION_MESSAGES: Record<Locale, IntegrationMessages> = {
  en: { eyebrow: "Connected tools", title: "Integrations", intro: "Run provider-backed lookups and browser-safe media tools from one workspace.", minecraftPlayer: "Minecraft player", minecraftServer: "Minecraft server", robloxUser: "Roblox user", movie: "Movie or TV", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "Look up", checkStatus: "Check status", search: "Search", imageStudio: "Image Studio", imageIntro: "Apply a local preview filter without uploading your image.", chooseImage: "Choose image", original: "Original", grayscale: "Grayscale", sepia: "Sepia", invert: "Invert", download: "Download", selectImage: "Select an image to preview it here.", lookupFailed: "Lookup failed. Please try again.", imageAlt: "Image preview", resultTitle: "Lookup result" },
  es: { eyebrow: "Herramientas conectadas", title: "Integraciones", intro: "Usa búsquedas con proveedores y herramientas multimedia seguras desde un solo espacio.", minecraftPlayer: "Jugador de Minecraft", minecraftServer: "Servidor de Minecraft", robloxUser: "Usuario de Roblox", movie: "Película o serie", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "Buscar", checkStatus: "Comprobar estado", search: "Buscar", imageStudio: "Estudio de imágenes", imageIntro: "Aplica filtros locales sin subir tu imagen.", chooseImage: "Elegir imagen", original: "Original", grayscale: "Escala de grises", sepia: "Sepia", invert: "Invertir", download: "Descargar", selectImage: "Selecciona una imagen para previsualizarla.", lookupFailed: "La búsqueda falló. Inténtalo de nuevo.", imageAlt: "Vista previa", resultTitle: "Resultado" },
  de: { eyebrow: "Verbundene Werkzeuge", title: "Integrationen", intro: "Nutze providerbasierte Abfragen und sichere Medienwerkzeuge an einem Ort.", minecraftPlayer: "Minecraft-Spieler", minecraftServer: "Minecraft-Server", robloxUser: "Roblox-Nutzer", movie: "Film oder Serie", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "Suchen", checkStatus: "Status prüfen", search: "Suchen", imageStudio: "Bildstudio", imageIntro: "Lokale Filter anwenden, ohne das Bild hochzuladen.", chooseImage: "Bild auswählen", original: "Original", grayscale: "Graustufen", sepia: "Sepia", invert: "Invertieren", download: "Herunterladen", selectImage: "Wähle ein Bild zur Vorschau aus.", lookupFailed: "Suche fehlgeschlagen. Bitte erneut versuchen.", imageAlt: "Bildvorschau", resultTitle: "Suchergebnis" },
  fr: { eyebrow: "Outils connectés", title: "Intégrations", intro: "Lancez des recherches avec fournisseurs et outils média sécurisés depuis un seul espace.", minecraftPlayer: "Joueur Minecraft", minecraftServer: "Serveur Minecraft", robloxUser: "Utilisateur Roblox", movie: "Film ou série", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "Rechercher", checkStatus: "Vérifier l’état", search: "Rechercher", imageStudio: "Studio d’image", imageIntro: "Appliquez un filtre local sans envoyer votre image.", chooseImage: "Choisir une image", original: "Original", grayscale: "Niveaux de gris", sepia: "Sépia", invert: "Inverser", download: "Télécharger", selectImage: "Sélectionnez une image pour la prévisualiser.", lookupFailed: "Échec de la recherche. Réessayez.", imageAlt: "Aperçu de l’image", resultTitle: "Résultat" },
  hi: { eyebrow: "कनेक्टेड टूल्स", title: "इंटीग्रेशन", intro: "एक ही workspace से provider lookups और सुरक्षित media tools चलाएँ।", minecraftPlayer: "Minecraft खिलाड़ी", minecraftServer: "Minecraft सर्वर", robloxUser: "Roblox उपयोगकर्ता", movie: "फिल्म या TV", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "खोजें", checkStatus: "स्थिति जाँचें", search: "खोजें", imageStudio: "इमेज स्टूडियो", imageIntro: "इमेज अपलोड किए बिना local filter लगाएँ।", chooseImage: "इमेज चुनें", original: "मूल", grayscale: "ग्रेस्केल", sepia: "सेपिया", invert: "इनवर्ट", download: "डाउनलोड", selectImage: "Preview के लिए इमेज चुनें।", lookupFailed: "Lookup विफल हुआ। फिर प्रयास करें।", imageAlt: "इमेज preview", resultTitle: "Lookup परिणाम" },
  ru: { eyebrow: "Подключённые инструменты", title: "Интеграции", intro: "Запускайте запросы к провайдерам и безопасные медиа-инструменты из одного рабочего пространства.", minecraftPlayer: "Игрок Minecraft", minecraftServer: "Сервер Minecraft", robloxUser: "Пользователь Roblox", movie: "Фильм или сериал", usernamePlaceholder: "Notch", serverPlaceholder: "play.example.com", moviePlaceholder: "Interstellar", lookup: "Найти", checkStatus: "Проверить статус", search: "Поиск", imageStudio: "Студия изображений", imageIntro: "Применяйте локальные фильтры без загрузки изображения.", chooseImage: "Выбрать изображение", original: "Оригинал", grayscale: "Оттенки серого", sepia: "Сепия", invert: "Инверсия", download: "Скачать", selectImage: "Выберите изображение для предпросмотра.", lookupFailed: "Поиск не удался. Попробуйте ещё раз.", imageAlt: "Предпросмотр изображения", resultTitle: "Результат поиска" },
};

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.map((value) => value.toLowerCase().split("-")[0]).find((value): value is Locale => SUPPORTED_LOCALES.includes(value as Locale)) ?? "en";
}

type I18nContext = { locale: Locale; setLocale: (locale: Locale) => void; t: Messages };
const Context = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("aeris-locale");
    return stored && SUPPORTED_LOCALES.includes(stored as Locale) ? stored as Locale : detectLocale();
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("aeris-locale", next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t: messages[locale] }), [locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
