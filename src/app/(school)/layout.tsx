"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import {
  canManageUsers,
  canViewStudents,
  homeForRole,
  ROLE_SUPER_ADMIN,
} from "@/lib/roles";

/**
 * Shared shell for the school-admin side (`/dashboard`, `/users`). This is a
 * route group, so it does NOT change the URLs of the pages nested under it.
 * Guards mirror the moved pages' own guards (harmless, defensive duplication).
 */
export default function SchoolLayout({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;

  // Route guard: send anyone who doesn't belong here to the right place.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user) {
      if (isSuperAdmin) {
        // A platform owner doesn't belong on the school side.
        router.replace(homeForRole(user.role, user.onboarding_completed));
      } else if (!user.onboarding_completed) {
        router.replace("/onboarding");
      }
    }
  }, [status, user, isSuperAdmin, router]);

  // Block the shell until the guard has confirmed an onboarded school session.
  if (
    status !== "authenticated" ||
    !user ||
    isSuperAdmin ||
    !user.onboarding_completed
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </main>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  // Campus management is admin-only (its endpoints require get_current_admin),
  // so the nav item only appears for users who can manage the org.
  const navItems: AppShellNavItem[] = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "▦" },
    ...(canManageUsers(user.role)
      ? [{ href: "/campuses", label: t("nav.campuses"), icon: "◈" }]
      : []),
    { href: "/users", label: t("nav.users"), icon: "◇" },
    ...(canViewStudents(user.role)
      ? [{ href: "/students", label: t("nav.students"), icon: "❖" }]
      : []),
  ];

  return (
    <AppShell
      brandTitle="PathShala+"
      navItems={navItems}
      userName={user.name ?? user.mobile ?? "—"}
      onLogout={handleLogout}
      loggingOut={loggingOut}
    >
      {children}
    </AppShell>
  );
}
