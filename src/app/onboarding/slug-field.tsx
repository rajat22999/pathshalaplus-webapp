"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/hooks/use-translation";
import { checkCode } from "@/lib/api/onboarding";
import type { CodeStatus } from "@/app/onboarding/wizard-types";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function isValidSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 64 && SLUG_RE.test(value);
}

/** Sanitize a keystroke into slug characters (keeps a trailing hyphen while typing). */
function sanitizeTyping(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface SlugFieldProps {
  id: string;
  label: string;
  /** Non-editable prefix, e.g. "org/" or "school/". */
  prefix: string;
  type: "org" | "school";
  value: string;
  /** Receives the already-sanitized slug when the user types. */
  onChange: (value: string) => void;
  /** Stable setter; reports availability so the parent can gate "Continue". */
  onStatusChange: (status: CodeStatus) => void;
  disabled?: boolean;
}

export function SlugField({
  id,
  label,
  prefix,
  type,
  value,
  onChange,
  onStatusChange,
  disabled,
}: SlugFieldProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<CodeStatus>("idle");

  useEffect(() => {
    // `cancelled` flips on cleanup (value change OR unmount) so a late response
    // never writes status back into the parent for a step that's gone.
    let cancelled = false;
    const apply = (s: CodeStatus) => {
      if (cancelled) return;
      setStatus(s);
      onStatusChange(s);
    };

    if (!value) {
      apply("idle");
      return;
    }
    if (!isValidSlug(value)) {
      apply("invalid");
      return;
    }

    apply("checking");
    const handle = window.setTimeout(async () => {
      try {
        const res = await checkCode(type, value);
        apply(res.available ? "available" : res.valid ? "taken" : "invalid");
      } catch {
        apply("idle");
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [value, type, onStatusChange]);

  const isError = status === "taken" || status === "invalid";

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div
        className={`flex items-center gap-1.5 rounded-xl border bg-white px-4 py-3 shadow-sm transition focus-within:ring-2 ${
          isError
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/20"
            : "border-slate-300 focus-within:border-indigo-500 focus-within:ring-indigo-500/30"
        }`}
      >
        <span className="shrink-0 text-sm font-semibold text-indigo-600">{prefix}</span>
        <input
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(sanitizeTyping(e.target.value))}
          className="w-full border-none bg-transparent p-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          placeholder="your-code"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        {status === "available" && (
          <svg className="h-5 w-5 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {status === "checking" && (
        <p className="mt-1.5 text-xs text-slate-400">{t("wiz.code.checking")}</p>
      )}
      {status === "available" && (
        <p className="mt-1.5 text-xs text-green-600">{t("wiz.code.available")}</p>
      )}
      {status === "taken" && (
        <p className="mt-1.5 text-xs text-red-600">{t("wiz.code.taken")}</p>
      )}
      {status === "invalid" && (
        <p className="mt-1.5 text-xs text-red-600">{t("wiz.code.invalid")}</p>
      )}
    </div>
  );
}
