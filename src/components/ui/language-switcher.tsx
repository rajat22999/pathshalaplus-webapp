"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Compact segmented language toggle (a rounded-full pill group). Highlights the
 * active language and switches instantly on click. Designed to sit unobtrusively
 * at the top-right of a card.
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-lg"
    >
      {LANGUAGES.map(({ code, label }) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
