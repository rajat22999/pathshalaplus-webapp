"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export interface AppShellNavItem {
  href: string;
  label: string;
  /** Optional glyph shown before the label (the design uses no icon library). */
  icon?: ReactNode;
}

interface AppShellProps {
  /** Brand text shown next to the P+ mark in the sidebar. */
  brandTitle: string;
  /** Sidebar / mobile nav links, in order. The first is the brand home link. */
  navItems: AppShellNavItem[];
  /** Display name for the "Signed in as" block. */
  userName: string;
  onLogout: () => void;
  loggingOut: boolean;
  children: ReactNode;
}

/**
 * The shared navigation shell (sidebar + top header) used by both the platform
 * console and the school-admin side so the app feels unified. Extracted from the
 * original superadmin layout — the chrome here is intentionally identical.
 */
export function AppShell({
  brandTitle,
  navItems,
  userName,
  onLogout,
  loggingOut,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const homeHref = navItems[0]?.href ?? "/";

  /**
   * A link is active when the route matches. A href is treated as an "index"
   * (exact match only) when another nav item is nested beneath it — e.g.
   * `/superadmin` stays inactive on `/superadmin/clients`. Otherwise nested
   * child paths keep their parent link highlighted (startsWith).
   */
  const isActive = (href: string): boolean => {
    const hasNestedSibling = navItems.some(
      (n) => n.href !== href && n.href.startsWith(`${href}/`),
    );
    if (hasNestedSibling) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        {/* Left sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur md:flex md:flex-col">
          <Link href={homeHref} className="flex items-center gap-2.5 px-5 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              P+
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              {brandTitle}
            </span>
          </Link>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.icon != null && (
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-5 py-3.5 backdrop-blur">
            {/* Sidebar collapses on mobile; show inline nav links instead. */}
            <div className="flex items-center gap-4 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <LanguageSwitcher />
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-500">
                  {t("shell.signed_in_as")}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {userName}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut && <Spinner className="h-3.5 w-3.5" />}
                {t("shell.logout")}
              </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-5 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
