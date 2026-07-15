"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { formatINR } from "@/lib/format";
import { getPlatformMetrics, listClients } from "@/lib/api/platform";
import type { ClientListItem, PlatformMetrics } from "@/types/platform";
import { ActiveBadge, SubscriptionStatusBadge } from "@/app/superadmin/badges";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

interface MetricSpec {
  key: string;
  label: string;
  value: string;
}

export default function SuperadminDashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [recent, setRecent] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, clients] = await Promise.all([
        getPlatformMetrics(),
        listClients({ page: 1, page_size: 5 }),
      ]);
      setMetrics(m);
      setRecent(clients.items);
    } catch (err) {
      setError(extractError(err, t("superadmin.dashboard.load_error")));
      setMetrics(null);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Initial fetch flips `loading` before the first await; that synchronous
    // setState inside the effect is intentional (mirrors the users page).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
        >
          {t("superadmin.retry")}
        </button>
      </div>
    );
  }

  const cards: MetricSpec[] = metrics
    ? [
        {
          key: "total_clients",
          label: t("superadmin.metric.total_clients"),
          value: metrics.total_clients.toLocaleString("en-IN"),
        },
        {
          key: "active_clients",
          label: t("superadmin.metric.active_clients"),
          value: metrics.active_clients.toLocaleString("en-IN"),
        },
        {
          key: "total_schools",
          label: t("superadmin.metric.total_schools"),
          value: metrics.total_schools.toLocaleString("en-IN"),
        },
        {
          key: "active_subscriptions",
          label: t("superadmin.metric.active_subscriptions"),
          value: metrics.active_subscriptions.toLocaleString("en-IN"),
        },
        {
          key: "total_revenue",
          label: t("superadmin.metric.total_revenue"),
          value: formatINR(metrics.total_revenue),
        },
        {
          key: "recent_signups",
          label: t("superadmin.metric.recent_signups"),
          value: metrics.recent_signups.toLocaleString("en-IN"),
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
        {t("superadmin.dashboard.title")}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {t("superadmin.dashboard.subtitle")}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("superadmin.dashboard.recent_clients")}
          </h2>
          <Link
            href="/superadmin/clients"
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
          >
            {t("superadmin.dashboard.view_all")}
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {t("superadmin.clients.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/superadmin/clients/${c.id}`)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {c.school?.name ?? c.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {c.code}
                      {c.owner?.name ? ` · ${c.owner.name}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.subscription && (
                      <SubscriptionStatusBadge status={c.subscription.status} />
                    )}
                    <ActiveBadge active={c.is_active} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
