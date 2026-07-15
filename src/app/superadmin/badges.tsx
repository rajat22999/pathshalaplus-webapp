"use client";

import type { ReactNode } from "react";

import { useTranslation } from "@/hooks/use-translation";

type Tone = "emerald" | "amber" | "red" | "slate" | "indigo";

const TONE_CLASS: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

/** A small pill badge in one of a few semantic tones. */
export function Badge({
  tone = "slate",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** Active / inactive pill (organizations, schools, users). */
export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge tone={active ? "emerald" : "slate"}>
      {active
        ? t("superadmin.status.active")
        : t("superadmin.status.inactive")}
    </Badge>
  );
}

/**
 * Translate a `${prefix}.${status}` key, falling back to the raw status string
 * when there is no catalog entry (backend statuses are an open set). `t` returns
 * the key itself on a miss, which is how we detect an untranslated status.
 */
function useStatusLabel(): (prefix: string, status: string) => string {
  const { t } = useTranslation();
  return (prefix, status) => {
    const key = `${prefix}.${status.toLowerCase()}`;
    const label = t(key);
    return label === key ? status : label;
  };
}

/** Map a raw subscription status to a semantic tone. */
function subscriptionTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case "active":
    case "trialing":
      return "emerald";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "amber";
    case "canceled":
    case "cancelled":
    case "incomplete_expired":
      return "red";
    default:
      return "slate";
  }
}

/** Subscription status pill. Falls back to the raw status label if untranslated. */
export function SubscriptionStatusBadge({ status }: { status: string }) {
  const label = useStatusLabel();
  return (
    <Badge tone={subscriptionTone(status)}>
      {label("superadmin.sub_status", status)}
    </Badge>
  );
}

/** Map a raw payment status to a semantic tone. */
function paymentTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case "succeeded":
    case "paid":
    case "captured":
    case "completed":
      return "emerald";
    case "pending":
    case "processing":
      return "amber";
    case "failed":
    case "refunded":
      return "red";
    default:
      return "slate";
  }
}

/** Payment status pill. Falls back to the raw status label if untranslated. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const label = useStatusLabel();
  return (
    <Badge tone={paymentTone(status)}>
      {label("superadmin.pay_status", status)}
    </Badge>
  );
}
