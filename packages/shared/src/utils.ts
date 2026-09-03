import type { WelcomeTemplateVars } from "./index.js";

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export function interpolateWelcome(
  template: string,
  vars: WelcomeTemplateVars
): string {
  return template
    .replace(/{server}/g, vars.server)
    .replace(/{user}/g, vars.user)
    .replace(/{mention}/g, vars.mention)
    .replace(/{channel}/g, vars.channel);
}

export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  // XP needed for level: level^2 * 100
  return level * level * 100;
}

export function getPermissions(permissions: bigint): string[] {
  const flags = [
    "Administrator",
    "ManageGuild",
    "ManageRoles",
    "ManageChannels",
    "KickMembers",
    "BanMembers",
    "ManageMessages",
    "MentionEveryone",
    "ManageWebhooks",
    "ManageEmojis",
    "SendMessages",
    "ReadMessageHistory",
    "Connect",
    "Speak",
  ];

  return flags.filter((flag) => {
    try {
      const perm = BigInt(1) << BigInt(flag);
      return (permissions & perm) !== 0n;
    } catch {
      return false;
    }
  });
}
