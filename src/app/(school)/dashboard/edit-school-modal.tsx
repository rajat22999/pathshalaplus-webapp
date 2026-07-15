"use client";

import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/format";
import { updateSchool } from "@/lib/api/school";
import type { SchoolInfo, UpdateSchoolPayload } from "@/types/school";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

interface EditSchoolModalProps {
  school: SchoolInfo;
  onClose: () => void;
  onSaved: (updated: SchoolInfo) => void;
}

/** Edit the school's name / phone / email / address / academic session. */
export function EditSchoolModal({
  school,
  onClose,
  onSaved,
}: EditSchoolModalProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(school.name ?? "");
  const [phone, setPhone] = useState(school.phone ?? "");
  const [email, setEmail] = useState(school.email ?? "");
  const [address, setAddress] = useState(school.address ?? "");
  const [session, setSession] = useState(school.academic_session ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.length === 0 || isValidEmail(trimmedEmail);
  const canSubmit = trimmedName.length > 0 && emailValid && !saving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmedName) {
      setError(t("sdash.school.name_required"));
      return;
    }
    if (!emailValid) {
      setError(t("sdash.school.invalid_email"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload: UpdateSchoolPayload = { name: trimmedName };
      const p = phone.trim();
      if (p) payload.phone = p;
      if (trimmedEmail) payload.email = trimmedEmail;
      const a = address.trim();
      if (a) payload.address = a;
      const s = session.trim();
      if (s) payload.academic_session = s;

      const updated = await updateSchool(payload);
      onSaved(updated);
    } catch (err) {
      setError(extractError(err, t("sdash.school.save_error")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t("sdash.school.edit_title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("sdash.school.edit_subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="school-name"
            label={t("sdash.school.name_label")}
            placeholder={t("sdash.school.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
            required
          />
          <Input
            id="school-phone"
            label={t("sdash.school.phone_label")}
            placeholder={t("sdash.school.phone_placeholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            autoComplete="tel"
          />
          <Input
            id="school-email"
            type="email"
            label={t("sdash.school.email_label")}
            placeholder={t("sdash.school.email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            autoComplete="email"
          />
          <div className="w-full">
            <label
              htmlFor="school-address"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {t("sdash.school.address_label")}
            </label>
            <textarea
              id="school-address"
              rows={2}
              placeholder={t("sdash.school.address_placeholder")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <Input
            id="school-session"
            label={t("sdash.school.session_label")}
            placeholder={t("sdash.school.session_placeholder")}
            value={session}
            onChange={(e) => setSession(e.target.value)}
            disabled={saving}
          />

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              {t("sdash.school.cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={!canSubmit}>
              {saving ? t("sdash.school.saving") : t("sdash.school.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
