import type { Translations } from "./types.js";

/**
 * Template for adding a new bot language.
 * 1. Copy this file to `xx.ts` where `xx` is the new locale code (e.g., `pt.ts`, `ja.ts`).
 * 2. Change `label` to the native language name (e.g., "Português", "日本語").
 * 3. Translate each value on the right side. Keep the keys (left side) in English.
 * 4. In `packages/bot/src/locales/index.ts`:
 *    - Add `import * as xx from "./xx.js";`
 *    - Add `xx` to `localeModules` object
 *    - Add `"xx"` to `SUPPORTED_LOCALES` in `types.ts` (or `index.ts` if derived)
 * 5. No other code changes needed — the bot will automatically use the new locale
 *    when a guild's `locale` is set to `xx` via `/server locale` or the dashboard.
 */

export const label = "Template — copy to xx.ts";

export const translations: Translations = {
  // Copy all keys from `en.ts` and translate values.
  // Example:
  // "AI is not configured": "IA no configurada",
  // "Admin command failed": "Comando de administración fallido",
};
