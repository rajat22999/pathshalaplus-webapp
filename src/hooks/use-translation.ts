"use client";

import { useContext } from "react";

import {
  LanguageContext,
  type LanguageContextValue,
} from "@/providers/language-provider";

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a <LanguageProvider>");
  }
  return ctx;
}
