"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";

import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { formatINR } from "@/lib/format";
import { getClient } from "@/lib/api/platform";
import type { ClientDetail } from "@/types/platform";
import {
  ActiveBadge,
  PaymentStatusBadge,
  SubscriptionStatusBadge,
} from "@/app/superadmin/badges";

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

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
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

export default function SuperadminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { t } = useTranslation();

  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await getClient(id);
      setDetail(data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(extractError(err, t("superadmin.detail.load_error")));
      }
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    // Initial fetch flips `loading` before the first await; that synchronous
    // setState inside the effect is intentional (mirrors the users page).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const backLink = (
    <Link
      href="/superadmin/clients"
      className="mb-4 inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700"
    >
      {t("superadmin.detail.back")}
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {backLink}
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {backLink}
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-12 text-center">
          <p className="text-sm text-slate-600">
            {t("superadmin.detail.not_found")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {backLink}
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
          <p className="text-sm text-red-700">
            {error ?? t("superadmin.detail.load_error")}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
          >
            {t("superadmin.retry")}
          </button>
        </div>
      </div>
    );
  }

  const { organization, schools, subscription, payments, users, counts } =
    detail;

  const orgFields: { key: string; label: string; value: string }[] = [
    {
      key: "code",
      label: t("superadmin.detail.org_code"),
      value: organization.code,
    },
    {
      key: "email",
      label: t("superadmin.detail.org_email"),
      value: organization.business_email ?? "—",
    },
    {
      key: "phone",
      label: t("superadmin.detail.org_phone"),
      value: organization.contact_number
        ? // The stored number may already be E.164 (+91…); only prepend the
          // country code when it isn't, to avoid a doubled "+91 +91…".
          organization.contact_number.startsWith("+")
          ? organization.contact_number
          : `${organization.country_code ?? ""} ${organization.contact_number}`.trim()
        : "—",
    },
    {
      key: "created",
      label: t("superadmin.detail.created"),
      value: formatDate(organization.created_at),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      {backLink}

      {/* Organization header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {organization.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{organization.code}</p>
        </div>
        <ActiveBadge active={organization.is_active} />
      </div>

      {/* Counts row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { key: "schools", label: t("superadmin.detail.count_schools"), value: counts.schools },
          { key: "users", label: t("superadmin.detail.count_users"), value: counts.users },
          { key: "payments", label: t("superadmin.detail.count_payments"), value: counts.payments },
        ].map((c) => (
          <div
            key={c.key}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm"
          >
            <p className="text-xl font-bold text-slate-900">
              {c.value.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Organization info */}
        <SectionCard title={t("superadmin.detail.organization")}>
          <dl className="divide-y divide-slate-100">
            {orgFields.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <dt className="text-sm text-slate-500">{f.label}</dt>
                <dd className="max-w-[60%] truncate text-right text-sm font-medium text-slate-900">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        {/* Subscription */}
        <SectionCard
          title={t("superadmin.detail.subscription")}
          action={
            subscription ? (
              <SubscriptionStatusBadge status={subscription.status} />
            ) : undefined
          }
        >
          {subscription ? (
            <dl className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-slate-500">
                  {t("superadmin.detail.plan")}
                </dt>
                <dd className="text-sm font-medium text-slate-900">
                  {subscription.plan_code}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-slate-500">
                  {t("superadmin.detail.amount")}
                </dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatINR(subscription.total_amount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-slate-500">
                  {t("superadmin.detail.period_end")}
                </dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatDate(subscription.current_period_end)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {t("superadmin.detail.no_subscription")}
            </p>
          )}
        </SectionCard>

        {/* Schools */}
        <SectionCard title={t("superadmin.detail.schools")}>
          {schools.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {t("superadmin.detail.no_schools")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {schools.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {s.code}
                      {s.address ? ` · ${s.address}` : ""}
                    </p>
                  </div>
                  <ActiveBadge active={s.is_active} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Payments */}
        <SectionCard title={t("superadmin.detail.payments")}>
          {payments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {t("superadmin.detail.no_payments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.pay_date")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.pay_amount")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.pay_method")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.pay_status")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.pay_reference")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-slate-700">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatINR(p.amount)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {p.method ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="max-w-[12rem] truncate px-5 py-3 text-slate-500">
                        {p.reference ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Users */}
        <SectionCard title={t("superadmin.detail.users")}>
          {users.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {t("superadmin.detail.no_users")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.user_name")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.user_mobile")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.user_role")}
                    </th>
                    <th className="px-5 py-3">
                      {t("superadmin.detail.user_status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {u.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {u.mobile ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {t(`role.${u.role}`)}
                      </td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={u.is_active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
