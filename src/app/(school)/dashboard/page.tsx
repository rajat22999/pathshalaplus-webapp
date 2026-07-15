"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatINR } from "@/lib/format";
import { canManageUsers, homeForRole, ROLE_SUPER_ADMIN } from "@/lib/roles";
import { getSchoolOverview } from "@/lib/api/school";
import type { SchoolInfo, SchoolOverview } from "@/types/school";
import {
  ActiveBadge,
  PaymentStatusBadge,
  SubscriptionStatusBadge,
} from "@/app/superadmin/badges";
import { EditSchoolModal } from "@/app/(school)/dashboard/edit-school-modal";
import { EditProfileModal } from "@/app/(school)/dashboard/edit-profile-modal";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** Format an ISO timestamp as a short human date, or a dash when absent. */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------- small presentational helpers ----------

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[60%] truncate text-right text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm">
      <p className="text-xl font-bold text-slate-900">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

/** A compact outlined button used for section-level "Edit" affordances. */
function EditPill({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

export default function DashboardPage() {
  const { user, status, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;
  // A stable "may view the dashboard" flag. Keeping the fetch keyed on this
  // boolean (rather than the `user` object) means an in-place profile refresh
  // won't re-trigger a full reload and flash the spinner over the toast.
  const eligible =
    status === "authenticated" &&
    !!user &&
    !isSuperAdmin &&
    !!user.onboarding_completed;

  // ----- access guards -----
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user) {
      if (isSuperAdmin) {
        // A platform owner doesn't belong on the school dashboard.
        router.replace(homeForRole(user.role, user.onboarding_completed));
      } else if (!user.onboarding_completed) {
        router.replace("/onboarding");
      }
    }
  }, [status, user, isSuperAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchoolOverview();
      setOverview(data);
    } catch (err) {
      setError(extractError(err, t("sdash.load_error")));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Only fetch once we hold a valid, onboarded, non-platform session.
    if (!eligible) return;
    // The fetch flips `loading` before its first await; that synchronous
    // setState inside the effect is intentional (mirrors the superadmin dash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [eligible, load]);

  // auto-dismiss the success toast (setState runs in a timer, not inline)
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  function handleSchoolSaved(updated: SchoolInfo) {
    setOverview((prev) => (prev ? { ...prev, school: updated } : prev));
    setSchoolModalOpen(false);
    setToast(t("sdash.school.save_success"));
  }

  function handleProfileSaved() {
    setProfileModalOpen(false);
    setToast(t("sdash.profile.save_success"));
  }

  // Block render until the guards have resolved a valid school-admin session.
  if (
    status !== "authenticated" ||
    !user ||
    isSuperAdmin ||
    !user.onboarding_completed
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  const school = overview?.school ?? null;
  const subscription = overview?.subscription ?? null;
  const lastPayment = overview?.last_payment ?? null;
  const counts = overview?.counts;

  const billingCycleLabel = (cycle: string): string => {
    const key = `sdash.cycle.${cycle.toLowerCase()}`;
    const label = t(key);
    return label === key ? cycle : label;
  };

  return (
    <>
      <div className="mx-auto w-full max-w-6xl">
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : error || !overview ? (
          <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
            <p className="text-sm text-red-700">
              {error ?? t("sdash.load_error")}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
            >
              {t("sdash.retry")}
            </button>
          </div>
        ) : (
          <>
            {toast && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {toast}
              </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-2">
              {/* Section 1 — School overview */}
              <SectionCard
                title={t("sdash.school.title")}
                action={
                  school ? (
                    <div className="flex items-center gap-2">
                      <ActiveBadge active={school.is_active} />
                      <EditPill onClick={() => setSchoolModalOpen(true)}>
                        {t("sdash.school.edit")}
                      </EditPill>
                    </div>
                  ) : undefined
                }
              >
                {school ? (
                  <>
                    <div className="px-5 py-4">
                      <p className="text-lg font-bold text-slate-900">
                        {school.name}
                      </p>
                      <p className="text-xs text-slate-500">{school.code}</p>
                    </div>
                    <dl className="divide-y divide-slate-100 border-t border-slate-100">
                      <InfoRow
                        label={t("sdash.school.session")}
                        value={school.academic_session ?? "—"}
                      />
                      <InfoRow
                        label={t("sdash.school.phone")}
                        value={school.phone ?? "—"}
                      />
                      <InfoRow
                        label={t("sdash.school.email")}
                        value={school.email ?? "—"}
                      />
                      <InfoRow
                        label={t("sdash.school.address")}
                        value={school.address ?? "—"}
                      />
                      <InfoRow
                        label={t("sdash.school.member_since")}
                        value={formatDate(school.created_at)}
                      />
                    </dl>
                  </>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    {t("sdash.school.none")}
                  </p>
                )}
              </SectionCard>

              {/* Section 2 — Subscription & billing */}
              <SectionCard
                title={t("sdash.sub.title")}
                action={
                  subscription ? (
                    <SubscriptionStatusBadge status={subscription.status} />
                  ) : undefined
                }
              >
                {subscription ? (
                  <>
                    <dl className="divide-y divide-slate-100">
                      <InfoRow
                        label={t("sdash.sub.plan")}
                        value={subscription.plan_name}
                      />
                      <InfoRow
                        label={t("sdash.sub.billing_cycle")}
                        value={billingCycleLabel(subscription.billing_cycle)}
                      />
                      <InfoRow
                        label={t("sdash.sub.total")}
                        value={formatINR(subscription.total_amount)}
                      />
                      <InfoRow
                        label={t("sdash.sub.renews")}
                        value={formatDate(subscription.current_period_end)}
                      />
                    </dl>
                    <div className="border-t border-slate-100 px-5 py-4">
                      <p className="mb-2 text-sm font-medium text-slate-500">
                        {t("sdash.sub.addons")}
                      </p>
                      {subscription.addons.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          {t("sdash.sub.no_addons")}
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {subscription.addons.map((a) => (
                            <li
                              key={a.code}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <span className="truncate text-slate-700">
                                {a.name}
                              </span>
                              <span className="shrink-0 font-medium text-slate-900">
                                {formatINR(a.price)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    {t("sdash.sub.none")}
                  </p>
                )}

                {/* Last payment (always shown, even without a subscription) */}
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="mb-2 text-sm font-medium text-slate-500">
                    {t("sdash.sub.last_payment")}
                  </p>
                  {lastPayment ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatINR(lastPayment.amount)}
                        </span>
                        <PaymentStatusBadge status={lastPayment.status} />
                      </div>
                      <span className="truncate text-xs text-slate-500">
                        {lastPayment.reference ??
                          formatDate(lastPayment.created_at)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      {t("sdash.sub.no_payments")}
                    </p>
                  )}
                </div>
              </SectionCard>

              {/* Section 3 — People & quick actions */}
              <SectionCard title={t("sdash.people.title")}>
                <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-4">
                  <StatCard
                    label={t("sdash.people.staff")}
                    value={counts?.staff ?? 0}
                  />
                  <StatCard
                    label={t("sdash.people.teachers")}
                    value={counts?.teacher ?? 0}
                  />
                  <StatCard
                    label={t("sdash.people.students")}
                    value={counts?.student ?? 0}
                  />
                  <StatCard
                    label={t("sdash.people.parents")}
                    value={counts?.parent ?? 0}
                  />
                </div>
                {canManageUsers(user.role) && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <Button
                      type="button"
                      onClick={() => router.push("/users")}
                      className="w-auto px-5"
                    >
                      {t("sdash.people.manage_users")}
                    </Button>
                  </div>
                )}
              </SectionCard>

              {/* Section 4 — Profile & settings */}
              <SectionCard
                title={t("sdash.profile.title")}
                action={
                  <EditPill onClick={() => setProfileModalOpen(true)}>
                    {t("sdash.profile.edit")}
                  </EditPill>
                }
              >
                <dl className="divide-y divide-slate-100">
                  <InfoRow
                    label={t("sdash.profile.name")}
                    value={user.name ?? "—"}
                  />
                  <InfoRow
                    label={t("sdash.profile.mobile")}
                    value={user.mobile ?? "—"}
                  />
                  <InfoRow
                    label={t("sdash.profile.email")}
                    value={user.email ?? "—"}
                  />
                </dl>
                <div className="border-t border-slate-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loggingOut && <Spinner className="h-3.5 w-3.5" />}
                    {t("sdash.profile.logout")}
                  </button>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>

      {schoolModalOpen && school && (
        <EditSchoolModal
          school={school}
          onClose={() => setSchoolModalOpen(false)}
          onSaved={handleSchoolSaved}
        />
      )}
      {profileModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setProfileModalOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </>
  );
}
