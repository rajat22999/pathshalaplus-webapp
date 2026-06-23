/**
 * SSR-safe persistence for the chosen language.
 *
 * This module is the single source the axios interceptor reads, so the API
 * always receives the current language even outside React (no context needed).
 */

import { DEFAULT_LANGUAGE, type Language } from "@/i18n/translations";

const LANGUAGE_KEY = "psp.lang";

const isBrowser = (): boolean => typeof window !== "undefined";

const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "hi";

export function getStoredLanguage(): Language {
  if (!isBrowser()) return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export function setStoredLanguage(lang: Language): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(LANGUAGE_KEY, lang);
}
