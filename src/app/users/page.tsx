"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { listUsers, updateUser } from "@/lib/api/users";
import { canManageUsers, canViewUsers, creatableRoles } from "@/lib/roles";
import type { UserRecord } from "@/types/users";
import { AddUserModal } from "@/app/users/add-user-modal";

const PAGE_SIZE = 20;

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export default function UsersPage() {
  const { user, status } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const manage = canManageUsers(user?.role);
  const view = canViewUsers(user?.role);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // ----- access guards -----
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    } else if (status === "authenticated" && user && !view) {
      router.replace("/dashboard");
    }
  }, [status, user, view, router]);

  // ----- debounce the search input (setState runs in a timer, not inline) -----
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const fetchUsers = useCallback(async () => {
    if (status !== "authenticated" || !view) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({
        page,
        page_size: PAGE_SIZE,
        ...(debouncedQuery ? { q: debouncedQuery } : {}),
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractError(err, t("users.load_error")));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, view, page, debouncedQuery, t]);

  useEffect(() => {
    // fetchUsers flips `loading` before its first await; that synchronous
    // setState inside the effect is intentional (loading the list on mount and
    // whenever the page/filter changes), mirroring the auth bootstrap pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  // auto-dismiss the success toast (setState runs in a timer, not inline)
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const creatable = useMemo(() => creatableRoles(user?.role), [user?.role]);

  async function handleToggleActive(target: UserRecord) {
    setSavingId(target.id);
    setError(null);
    try {
      const updated = await updateUser(target.id, {
        is_active: !target.is_active,
      });
      setItems((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
      setToast(t("users.update_success"));
    } catch (err) {
      setError(extractError(err, t("users.update_error")));
    } finally {
      setSavingId(null);
    }
  }

  function handleCreated() {
    setAddOpen(false);
    setToast(t("users.create_success"));
    void fetchUsers();
  }

  // Block render until guards have resolved.
  if (status !== "authenticated" || !user || !user.onboarding_completed || !view) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </main>
    );
  }

  const roleLabel = (value: string): string => t(`role.${value}`);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          {t("users.back_to_dashboard")}
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("users.title")}
          </h1>
          {manage && (
            <div className="w-auto">
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
                className="w-auto px-5"
              >
                {t("users.add_user")}
              </Button>
            </div>
          )}
        </div>

        <div className="mb-4 max-w-sm">
          <Input
            id="users-search"
            type="search"
            placeholder={t("users.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("users.search_placeholder")}
          />
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
                  <th className="px-4 py-3">{t("users.col_name")}</th>
                  <th className="px-4 py-3">{t("users.col_role")}</th>
                  <th className="px-4 py-3">{t("users.col_mobile")}</th>
                  <th className="px-4 py-3">{t("users.col_email")}</th>
                  <th className="px-4 py-3">{t("users.col_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Spinner className="mx-auto h-6 w-6 text-indigo-600" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {t("users.empty")}
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u.id} className="bg-white hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {u.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {roleLabel(u.role)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {u.mobile ?? "—"}
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-slate-700">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                            }`}
                          >
                            {u.is_active
                              ? t("users.status_active")
                              : t("users.status_inactive")}
                          </span>
                          {manage && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={savingId === u.id}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingId === u.id && (
                                <Spinner className="h-3 w-3" />
                              )}
                              {u.is_active
                                ? t("users.deactivate")
                                : t("users.activate")}
                            </button>
                          )}
                        </div>
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
            {t("users.page_of", { page, pages: totalPages })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("users.prev")}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("users.next")}
            </button>
          </div>
        </div>
      </div>

      {manage && addOpen && (
        <AddUserModal
          roles={creatable}
          onClose={() => setAddOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
