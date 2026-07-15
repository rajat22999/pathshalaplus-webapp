"use client";

import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { createUser } from "@/lib/api/users";
import type { UserRecord } from "@/types/users";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    // Backend returns a localized { success, message, data } envelope on errors.
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

interface AddUserModalProps {
  /** Roles the current user may assign (from creatableRoles). */
  roles: string[];
  onClose: () => void;
  onCreated: (user: UserRecord) => void;
}

export function AddUserModal({ roles, onClose, onCreated }: AddUserModalProps) {
  const { t } = useTranslation();

  const [mobile, setMobile] = useState<string | undefined>(undefined);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneValid = Boolean(mobile && isValidPhoneNumber(mobile));
  const showPhoneError = mobileTouched && Boolean(mobile) && !phoneValid;
  const canSubmit = phoneValid && role.length > 0 && !saving;

  function roleLabel(value: string): string {
    return t(`role.${value}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMobileTouched(true);
    if (!mobile || !isValidPhoneNumber(mobile)) {
      setError(t("users.form_invalid_mobile"));
      return;
    }
    if (!role) {
      setError(t("users.form_role_required"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const created = await createUser({
        mobile,
        country_code: "+91",
        role,
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      onCreated(created);
    } catch (err) {
      setError(extractError(err, t("users.create_error")));
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
            {t("users.form_title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("users.form_subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <PhoneNumberInput
              id="new-user-mobile"
              label={t("users.form_mobile_label")}
              value={mobile}
              onChange={setMobile}
              onBlur={() => setMobileTouched(true)}
              invalid={showPhoneError}
              disabled={saving}
              autoFocus
            />
            {showPhoneError && (
              <p className="mt-1.5 text-sm text-red-600">
                {t("users.form_invalid_mobile")}
              </p>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="new-user-role"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {t("users.form_role_label")}
            </label>
            <select
              id="new-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>
                {t("users.form_role_placeholder")}
              </option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="new-user-name"
            label={t("users.form_name_label")}
            placeholder={t("users.form_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoComplete="name"
          />

          <Input
            id="new-user-email"
            type="email"
            label={t("users.form_email_label")}
            placeholder={t("users.form_email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            autoComplete="email"
          />

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              {t("users.form_cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={!canSubmit}>
              {saving ? t("users.form_saving") : t("users.form_create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
