"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/components/ui/input";
import type { UpdateForm, WizardForm } from "@/app/onboarding/wizard-types";

interface AdminStepProps {
  form: WizardForm;
  update: UpdateForm;
  /** The signed-in user's mobile — shown read-only (you signed up with it). */
  lockedMobile: string | null;
  disabled?: boolean;
}

export function AdminStep({ form, update, lockedMobile, disabled }: AdminStepProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("wiz.admin.title")}
        </h2>
        <p className="mt-2 text-slate-500">{t("wiz.admin.subtitle")}</p>
      </div>

      <Input
        id="admin-first"
        label={t("wiz.admin.first_name_label")}
        placeholder={t("wiz.admin.first_name_placeholder")}
        value={form.firstName}
        disabled={disabled}
        onChange={(e) => update({ firstName: e.target.value })}
        autoComplete="given-name"
        autoFocus
      />

      <Input
        id="admin-last"
        label={t("wiz.admin.last_name_label")}
        placeholder={t("wiz.admin.last_name_placeholder")}
        value={form.lastName}
        disabled={disabled}
        onChange={(e) => update({ lastName: e.target.value })}
        autoComplete="family-name"
      />

      <Input
        id="admin-email"
        type="email"
        label={t("wiz.admin.email_label")}
        placeholder={t("wiz.admin.email_placeholder")}
        value={form.adminEmail}
        disabled={disabled}
        onChange={(e) => update({ adminEmail: e.target.value })}
        autoComplete="email"
      />

      <div className="w-full">
        <label
          htmlFor="admin-mobile"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {t("wiz.admin.mobile_label")}
        </label>
        <input
          id="admin-mobile"
          value={lockedMobile ?? ""}
          readOnly
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 shadow-sm"
        />
      </div>
    </div>
  );
}
