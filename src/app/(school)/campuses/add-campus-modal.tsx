"use client";

import { useMemo, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { SlugField } from "@/app/onboarding/slug-field";
import { academicSessions } from "@/app/onboarding/school-step";
import { addCampus } from "@/lib/api/school";
import { isValidEmail, slugify } from "@/lib/format";
import type { CodeStatus } from "@/app/onboarding/wizard-types";
import type { Campus } from "@/types/campus";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}


interface AddCampusModalProps {
  onClose: () => void;
  onCreated: (campus: Campus) => void;
}

/**
 * Create a new campus (school) under the admin's organization. Mirrors the
 * onboarding school-step form + validation; the code is checked live for
 * availability via <SlugField type="school">.
 */
export function AddCampusModal({ onClose, onCreated }: AddCampusModalProps) {
  const { t } = useTranslation();
  const sessions = useMemo(() => academicSessions(), []);
  const defaultSession = useMemo(() => sessions[1] ?? sessions[0] ?? "", [sessions]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [session, setSession] = useState(defaultSession);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedAddress = address.trim();
  const phoneValid = Boolean(phone && isValidPhoneNumber(phone));
  const emailValid = isValidEmail(trimmedEmail);

  const canSubmit =
    trimmedName.length > 0 &&
    codeStatus === "available" &&
    phoneValid &&
    emailValid &&
    trimmedAddress.length > 0 &&
    session.length > 0 &&
    !saving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmedName) {
      setError(t("campus.form.invalid_name"));
      return;
    }
    if (codeStatus !== "available") {
      setError(t("campus.form.invalid_code"));
      return;
    }
    if (!phone || !isValidPhoneNumber(phone)) {
      setError(t("campus.form.invalid_phone"));
      return;
    }
    if (!emailValid) {
      setError(t("campus.form.invalid_email"));
      return;
    }
    if (!trimmedAddress) {
      setError(t("campus.form.invalid_address"));
      return;
    }
    if (!session) {
      setError(t("campus.form.invalid_session"));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const created = await addCampus({
        name: trimmedName,
        code,
        phone,
        email: trimmedEmail,
        address: trimmedAddress,
        academic_session: session,
      });
      onCreated(created);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(t("campus.form.code_taken"));
      } else {
        setError(extractError(err, t("campus.form.create_error")));
      }
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
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t("campus.form.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("campus.form.subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="campus-name"
            label={t("campus.form.name_label")}
            placeholder={t("campus.form.name_placeholder")}
            value={name}
            disabled={saving}
            onChange={(e) => {
              const next = e.target.value;
              setName(next);
              if (!codeEdited) setCode(slugify(next));
            }}
            autoFocus
          />

          <SlugField
            id="campus-code"
            label={t("campus.form.code_label")}
            prefix="school/"
            type="school"
            value={code}
            disabled={saving}
            onStatusChange={setCodeStatus}
            onChange={(v) => {
              setCode(v);
              setCodeEdited(true);
            }}
          />

          <PhoneNumberInput
            id="campus-phone"
            label={t("campus.form.phone_label")}
            value={phone}
            disabled={saving}
            onChange={setPhone}
          />

          <Input
            id="campus-email"
            type="email"
            label={t("campus.form.email_label")}
            placeholder={t("campus.form.email_placeholder")}
            value={email}
            disabled={saving}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div className="w-full">
            <label
              htmlFor="campus-address"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {t("campus.form.address_label")}
            </label>
            <textarea
              id="campus-address"
              rows={2}
              placeholder={t("campus.form.address_placeholder")}
              value={address}
              disabled={saving}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("campus.form.session_label")}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {sessions.map((s) => {
                const active = session === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    onClick={() => setSession(s)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              {t("campus.form.cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={!canSubmit}>
              {saving ? t("campus.form.saving") : t("campus.form.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
