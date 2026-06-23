"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Toggle } from "@/components/ui/toggle";
import { AddonIcon } from "@/app/onboarding/addon-icon";
import { formatINR } from "@/lib/format";
import type { BillingCatalog } from "@/types/onboarding";

interface BillingStepProps {
  catalog: BillingCatalog;
  selected: string[];
  onToggle: (code: string) => void;
  disabled?: boolean;
}

export function BillingStep({ catalog, selected, onToggle, disabled }: BillingStepProps) {
  const { t } = useTranslation();
  const { base_plan: base } = catalog;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("wiz.billing.title")}
        </h2>
        <p className="mt-2 text-slate-500">{t("wiz.billing.subtitle")}</p>
      </div>

      {/* Base plan — always included. */}
      <div className="rounded-2xl border-2 border-indigo-500 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.2 2.3a1.2 1.2 0 0 1 1.6 0l1.2 1.1 1.6-.2a1.2 1.2 0 0 1 1.3 1l.3 1.6 1.4.8a1.2 1.2 0 0 1 .5 1.5l-.6 1.5.6 1.5a1.2 1.2 0 0 1-.5 1.5l-1.4.8-.3 1.6a1.2 1.2 0 0 1-1.3 1l-1.6-.2-1.2 1.1a1.2 1.2 0 0 1-1.6 0l-1.2-1.1-1.6.2a1.2 1.2 0 0 1-1.3-1l-.3-1.6-1.4-.8a1.2 1.2 0 0 1-.5-1.5l.6-1.5-.6-1.5a1.2 1.2 0 0 1 .5-1.5l1.4-.8.3-1.6a1.2 1.2 0 0 1 1.3-1l1.6.2 1.2-1.1Zm4 5.4a.8.8 0 0 0-1.2-1l-3 3.6-1.2-1.1a.8.8 0 1 0-1 1.2l1.8 1.6a.8.8 0 0 0 1.1-.1l3.5-4.2Z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">{t("wiz.billing.base_title")}</h3>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            {formatINR(base.price)}
            {t("wiz.billing.per_month")}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-500">{base.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
          {base.features.map((feature) => (
            <span key={feature} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
              </svg>
              {t(`wiz.billing.feature.${feature}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Optional add-ons. */}
      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">{t("wiz.billing.optional")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalog.addons.map((addon) => {
            const checked = selected.includes(addon.code);
            return (
              <div
                key={addon.code}
                className={`rounded-2xl border p-4 transition ${
                  checked ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      checked ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <AddonIcon icon={addon.icon} />
                  </span>
                  <Toggle
                    checked={checked}
                    disabled={disabled}
                    ariaLabel={addon.name}
                    onChange={() => onToggle(addon.code)}
                  />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{addon.name}</p>
                <p className="text-sm text-slate-500">
                  +{formatINR(addon.price)}
                  {t("wiz.billing.per_month")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
