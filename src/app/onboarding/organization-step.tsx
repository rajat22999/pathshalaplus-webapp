"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { SlugField } from "@/app/onboarding/slug-field";
import { slugify } from "@/lib/format";
import type { CodeStatus, UpdateForm, WizardForm } from "@/app/onboarding/wizard-types";

interface OrganizationStepProps {
  form: WizardForm;
  update: UpdateForm;
  onCodeStatusChange: (status: CodeStatus) => void;
  disabled?: boolean;
}

export function OrganizationStep({
  form,
  update,
  onCodeStatusChange,
  disabled,
}: OrganizationStepProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("wiz.org.title")}
        </h2>
        <p className="mt-2 text-slate-500">{t("wiz.org.subtitle")}</p>
      </div>

      <Input
        id="org-name"
        label={t("wiz.org.name_label")}
        placeholder={t("wiz.org.name_placeholder")}
        value={form.orgName}
        disabled={disabled}
        onChange={(e) => {
          const name = e.target.value;
          update({
            orgName: name,
            ...(form.orgCodeEdited ? {} : { orgCode: slugify(name) }),
          });
        }}
        autoFocus
      />

      <SlugField
        id="org-code"
        label={t("wiz.org.code_label")}
        prefix="org/"
        type="org"
        value={form.orgCode}
        disabled={disabled}
        onStatusChange={onCodeStatusChange}
        onChange={(v) => update({ orgCode: v, orgCodeEdited: true })}
      />

      <Input
        id="org-email"
        type="email"
        label={t("wiz.org.email_label")}
        placeholder={t("wiz.org.email_placeholder")}
        value={form.orgEmail}
        disabled={disabled}
        onChange={(e) => update({ orgEmail: e.target.value })}
        autoComplete="email"
      />

      <PhoneNumberInput
        id="org-phone"
        label={t("wiz.org.phone_label")}
        value={form.orgPhone}
        disabled={disabled}
        onChange={(v) => update({ orgPhone: v })}
      />
    </div>
  );
}
