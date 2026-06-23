"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { canManageUsers } from "@/lib/roles";

export default function DashboardPage() {
  const { user, status, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || !user || !user.onboarding_completed) {
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

  const yesNo = (value: boolean): string =>
    value ? t("dashboard.yes") : t("dashboard.no");

  const fields: { key: string; label: string; value: string }[] = [
    { key: "name", label: t("dashboard.name"), value: user.name ?? "—" },
    { key: "role", label: t("dashboard.role"), value: user.role },
    {
      key: "organization",
      label: t("dashboard.organization_id"),
      value: user.organization_id ?? "—",
    },
    { key: "mobile", label: t("dashboard.mobile"), value: user.mobile ?? "—" },
    { key: "email", label: t("dashboard.email"), value: user.email ?? "—" },
    { key: "school", label: t("dashboard.school_id"), value: user.school_id ?? "—" },
    { key: "active", label: t("dashboard.active"), value: yesNo(user.is_active) },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-12">
      <Card className="max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t("dashboard.signed_in_as")}</p>
            <h1 className="text-xl font-bold text-slate-900">
              {user.name ?? user.mobile ?? user.email ?? "—"}
            </h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
            P+
          </div>
        </div>

        <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
          {fields.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between gap-4 bg-white px-4 py-3"
            >
              <dt className="text-sm text-slate-500">{f.label}</dt>
              <dd className="max-w-[60%] truncate text-right text-sm font-medium text-slate-900">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 space-y-3">
          {canManageUsers(user.role) && (
            <Button onClick={() => router.push("/users")}>
              {t("dashboard.manage_users")}
            </Button>
          )}
          <Button onClick={handleLogout} loading={loggingOut} className="bg-slate-900 hover:bg-slate-800">
            {t("dashboard.logout")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
