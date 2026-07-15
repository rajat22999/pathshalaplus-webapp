"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { canManageUsers, ROLE_SUPER_ADMIN } from "@/lib/roles";
import { listCampuses, setActiveCampus } from "@/lib/api/school";
import type { Campus } from "@/types/campus";
import { ActiveBadge, Badge } from "@/app/superadmin/badges";
import { AddCampusModal } from "@/app/(school)/campuses/add-campus-modal";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** A single campus card: identity, meta, active marker + switch action. */
function CampusCard({
  campus,
  switching,
  onSwitch,
}: {
  campus: Campus;
  switching: boolean;
  onSwitch: () => void;
}) {
  const { t } = useTranslation();
  const isActive = campus.is_active_campus;

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-3xl border bg-white/90 shadow-sm backdrop-blur transition ${
        isActive ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">
            {campus.name}
          </p>
          <p className="truncate text-xs text-slate-500">{campus.code}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isActive && <Badge tone="indigo">{t("campus.active_marker")}</Badge>}
          <ActiveBadge active={campus.is_active} />
        </div>
      </div>

      <dl className="flex-1 divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <dt className="text-sm text-slate-500">{t("campus.session")}</dt>
          <dd className="max-w-[60%] truncate text-right text-sm font-medium text-slate-900">
            {campus.academic_session ?? "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <dt className="text-sm text-slate-500">{t("campus.address")}</dt>
          <dd className="max-w-[60%] truncate text-right text-sm font-medium text-slate-900">
            {campus.address ?? "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <dt className="text-sm text-slate-500">{t("campus.users")}</dt>
          <dd className="text-right text-sm font-medium text-slate-900">
            {campus.user_count.toLocaleString("en-IN")}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-100 px-5 py-4">
        {isActive ? (
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            {t("campus.active_current")}
          </div>
        ) : (
          <button
            type="button"
            onClick={onSwitch}
            disabled={switching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {switching && <Spinner className="h-3.5 w-3.5" />}
            {switching ? t("campus.switching") : t("campus.switch")}
          </button>
        )}
      </div>
    </section>
  );
}

export default function CampusesPage() {
  const { user, status, refreshUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const manage = canManageUsers(user?.role);
  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const eligible =
    status === "authenticated" &&
    !!user &&
    !isSuperAdmin &&
    !!user.onboarding_completed &&
    manage;

  // ----- access guards -----
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user) {
      if (isSuperAdmin) {
        router.replace("/superadmin");
      } else if (!user.onboarding_completed) {
        router.replace("/onboarding");
      } else if (!manage) {
        // Campus management is an admin-only capability (get_current_admin).
        router.replace("/dashboard");
      }
    }
  }, [status, user, isSuperAdmin, manage, router]);

  const load = useCallback(async () => {
    if (!eligible) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listCampuses();
      setCampuses(data.campuses);
    } catch (err) {
      setError(extractError(err, t("campus.load_error")));
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  }, [eligible, t]);

  useEffect(() => {
    // load flips `loading` before its first await; that synchronous setState
    // inside the effect is intentional (mirrors the dashboard/users pages).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // auto-dismiss the success toast (setState runs in a timer, not inline)
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  async function handleSwitch(campus: Campus) {
    setSwitchingId(campus.id);
    setError(null);
    try {
      await setActiveCampus(campus.id);
      // Refresh the auth profile so admin.school_id (hence the dashboard/users
      // scope) is consistent with the newly-selected campus, then refetch.
      await refreshUser();
      await load();
      setToast(t("campus.switch_success", { name: campus.name }));
    } catch (err) {
      setError(extractError(err, t("campus.switch_error")));
    } finally {
      setSwitchingId(null);
    }
  }

  function handleCreated() {
    setAddOpen(false);
    setToast(t("campus.form.create_success"));
    void load();
  }

  // Block render until guards have resolved a valid admin session.
  if (
    status !== "authenticated" ||
    !user ||
    isSuperAdmin ||
    !user.onboarding_completed ||
    !manage
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("campus.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("campus.subtitle")}</p>
          </div>
          <div className="w-auto">
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-auto px-5"
            >
              {t("campus.add")}
            </Button>
          </div>
        </div>

        {toast && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : campuses.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/90 px-5 py-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">{t("campus.empty")}</p>
            <div className="mt-4 inline-flex">
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
                className="w-auto px-5"
              >
                {t("campus.add")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campuses.map((campus) => (
              <CampusCard
                key={campus.id}
                campus={campus}
                switching={switchingId === campus.id}
                onSwitch={() => handleSwitch(campus)}
              />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddCampusModal
          onClose={() => setAddOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
