"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getStoredLanguage, setStoredLanguage } from "@/i18n/language-store";
import {
  DEFAULT_LANGUAGE,
  translations,
  type Language,
} from "@/i18n/translations";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Substitute {placeholders} in a template with values from `vars`. */
function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialise to DEFAULT_LANGUAGE so SSR and the first client render agree
  // (localStorage is unavailable during SSR). We reconcile on mount below.
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored !== language) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
    document.documentElement.lang = stored;
    // Only run on mount: this is the one-time hydration reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    setStoredLanguage(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const template =
        translations[language][key] ?? translations.en[key] ?? key;
      return interpolate(template, vars);
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
