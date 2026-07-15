"use client";

import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/ui/language-switcher";

/** Route prefixes that render the shared AppShell (which has its own switcher). */
const SHELL_PREFIXES = ["/superadmin", "/dashboard", "/users"];

/**
 * The app-wide floating language switcher (bottom-right). Hidden on the shared
 * navigation shell routes (the platform console and the school side), which
 * render their own switcher in the header. Login/onboarding keep the floating
 * one.
 */
export function FloatingLanguageSwitcher() {
  const pathname = usePathname();
  if (pathname && SHELL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <LanguageSwitcher />
    </div>
  );
}
