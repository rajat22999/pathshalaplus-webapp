"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { AppShell } from "@/components/app-shell";
import { homeForRole, ROLE_SUPER_ADMIN } from "@/lib/roles";

const LOGIN_PATH = "/superadmin/login";

export default function SuperadminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoginRoute = pathname === LOGIN_PATH;
  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;

  // Route guard for every console page EXCEPT the standalone login route.
  useEffect(() => {
    if (isLoginRoute) return;
    if (status === "unauthenticated") {
      router.replace(LOGIN_PATH);
    } else if (status === "authenticated" && user && !isSuperAdmin) {
      // A signed-in non-platform user (e.g. a school admin) can't view the
      // console — send them to their own home.
      router.replace(homeForRole(user.role, user.onboarding_completed));
    }
  }, [isLoginRoute, status, user, isSuperAdmin, router]);

  // The login page renders standalone (it manages its own auth state).
  if (isLoginRoute) {
    return <>{children}</>;
  }

  // Block the shell until the guard has confirmed a super_admin session.
  if (status !== "authenticated" || !user || !isSuperAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </main>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace(LOGIN_PATH);
  }

  return (
    <AppShell
      brandTitle={t("superadmin.console_title")}
      navItems={[
        { href: "/superadmin", label: t("superadmin.nav.dashboard"), icon: "▦" },
        {
          href: "/superadmin/clients",
          label: t("superadmin.nav.clients"),
          icon: "◇",
        },
      ]}
      userName={user.name ?? user.mobile ?? "—"}
      onLogout={handleLogout}
      loggingOut={loggingOut}
    >
      {children}
    </AppShell>
  );
}
