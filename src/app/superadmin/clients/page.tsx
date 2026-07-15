"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { listClients, setClientActive } from "@/lib/api/platform";
import type { ClientListItem, ClientStatusFilter } from "@/types/platform";
import {
  ActiveBadge,
  SubscriptionStatusBadge,
} from "@/app/superadmin/badges";

const PAGE_SIZE = 20;

const STATUS_FILTERS: ClientStatusFilter[] = ["all", "active", "inactive"];

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export default function SuperadminClientsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Debounce the search input (setState runs in a timer, not inline).
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listClients({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter,
        ...(debouncedQuery ? { q: debouncedQuery } : {}),
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractError(err, t("superadmin.clients.load_error")));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedQuery, t]);

  useEffect(() => {
    // fetchClients flips `loading` before its first await; that synchronous
    // setState inside the effect is intentional (mirrors the users page).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchClients();
  }, [fetchClients]);

  // Auto-dismiss the success toast (setState runs in a timer, not inline).
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleToggleActive(target: ClientListItem) {
    setSavingId(target.id);
    setError(null);
    try {
      const updated = await setClientActive(target.id, !target.is_active);
      setItems((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      setToast(
        updated.is_active
          ? t("superadmin.clients.activated")
          : t("superadmin.clients.deactivated"),
      );
    } catch (err) {
      setError(extractError(err, t("superadmin.clients.update_error")));
    } finally {
      setSavingId(null);
    }
  }

  function statusLabel(value: ClientStatusFilter): string {
    return t(`superadmin.clients.filter_${value}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("superadmin.clients.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("superadmin.clients.subtitle")}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            id="clients-search"
            type="search"
            placeholder={t("superadmin.clients.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("superadmin.clients.search_placeholder")}
          />
        </div>
        <div
          role="group"
          aria-label={t("superadmin.clients.filter_label")}
          className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
        >
          {STATUS_FILTERS.map((value) => {
            const active = value === statusFilter;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {statusLabel(value)}
              </button>
            );
          })}
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("superadmin.clients.col_name")}</th>
                <th className="px-4 py-3">{t("superadmin.clients.col_code")}</th>
                <th className="px-4 py-3">
                  {t("superadmin.clients.col_owner")}
                </th>
                <th className="px-4 py-3">
                  {t("superadmin.clients.col_subscription")}
                </th>
                <th className="px-4 py-3">
                  {t("superadmin.clients.col_users")}
                </th>
                <th className="px-4 py-3">
                  {t("superadmin.clients.col_status")}
                </th>
                <th className="px-4 py-3 text-right">
                  {t("superadmin.clients.col_actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Spinner className="mx-auto h-6 w-6 text-indigo-600" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    {t("superadmin.clients.empty")}
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/superadmin/clients/${c.id}`)}
                    className="cursor-pointer bg-white hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {c.school?.name ?? c.name}
                      </p>
                      {c.school && c.school.name !== c.name && (
                        <p className="text-xs text-slate-500">{c.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.code}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.owner ? (
                        <>
                          <p>{c.owner.name ?? "—"}</p>
                          <p className="text-xs text-slate-500">
                            {c.owner.mobile ?? "—"}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.subscription ? (
                        <SubscriptionStatusBadge
                          status={c.subscription.status}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t("superadmin.clients.no_subscription")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.users_count.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={c.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleToggleActive(c);
                        }}
                        disabled={savingId === c.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === c.id && <Spinner className="h-3 w-3" />}
                        {c.is_active
                          ? t("superadmin.clients.deactivate")
                          : t("superadmin.clients.activate")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {t("superadmin.clients.page_of", { page, pages: totalPages })}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("superadmin.clients.prev")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("superadmin.clients.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
