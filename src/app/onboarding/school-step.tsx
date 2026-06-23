"use client";

import { useMemo } from "react";

import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { SlugField } from "@/app/onboarding/slug-field";
import { slugify } from "@/lib/format";
import type { CodeStatus, UpdateForm, WizardForm } from "@/app/onboarding/wizard-types";

/** Three academic sessions around the current one (India: year starts ~April). */
export function academicSessions(): string[] {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return [startYear - 1, startYear, startYear + 1].map((y) => `${y}-${y + 1}`);
}

interface SchoolStepProps {
  form: WizardForm;
  update: UpdateForm;
  onCodeStatusChange: (status: CodeStatus) => void;
  disabled?: boolean;
}

export function SchoolStep({
  form,
  update,
  onCodeStatusChange,
  disabled,
}: SchoolStepProps) {
  const { t } = useTranslation();
  const sessions = useMemo(() => academicSessions(), []);

  return (
    <div className="space-y-6">
      <Input
        id="school-name"
        label={t("wiz.school.name_label")}
        placeholder={t("wiz.school.name_placeholder")}
        value={form.schoolName}
        disabled={disabled}
        onChange={(e) => {
          const name = e.target.value;
          update({
            schoolName: name,
            ...(form.schoolCodeEdited ? {} : { schoolCode: slugify(name) }),
          });
        }}
        autoFocus
      />

      <SlugField
        id="school-code"
        label={t("wiz.school.code_label")}
        prefix="school/"
        type="school"
        value={form.schoolCode}
        disabled={disabled}
        onStatusChange={onCodeStatusChange}
        onChange={(v) => update({ schoolCode: v, schoolCodeEdited: true })}
      />

      <PhoneNumberInput
        id="school-phone"
        label={t("wiz.school.phone_label")}
        value={form.schoolPhone}
        disabled={disabled}
        onChange={(v) => update({ schoolPhone: v })}
      />

      <Input
        id="school-email"
        type="email"
        label={t("wiz.school.email_label")}
        placeholder={t("wiz.school.email_placeholder")}
        value={form.schoolEmail}
        disabled={disabled}
        onChange={(e) => update({ schoolEmail: e.target.value })}
        autoComplete="email"
      />

      <Input
        id="school-address"
        label={t("wiz.school.address_label")}
        placeholder={t("wiz.school.address_placeholder")}
        value={form.schoolAddress}
        disabled={disabled}
        onChange={(e) => update({ schoolAddress: e.target.value })}
      />

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("wiz.school.session_label")}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {sessions.map((session) => {
            const active = form.academicSession === session;
            return (
              <button
                key={session}
                type="button"
                disabled={disabled}
                onClick={() => update({ academicSession: session })}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {session}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
