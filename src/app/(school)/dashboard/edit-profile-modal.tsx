"use client";

import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/format";
import { updateProfile } from "@/lib/api/auth";
import type { Profile } from "@/types/auth";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

interface EditProfileModalProps {
  user: Profile;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit the signed-in admin's own name + email (PUT /profile). */
export function EditProfileModal({
  user,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const { refreshUser } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.length === 0 || isValidEmail(trimmedEmail);
  const canSubmit = trimmedName.length > 0 && emailValid && !saving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmedName) {
      setError(t("sdash.profile.name_required"));
      return;
    }
    if (!emailValid) {
      setError(t("sdash.profile.invalid_email"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      await refreshUser();
      onSaved();
    } catch (err) {
      setError(extractError(err, t("sdash.profile.save_error")));
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
            {t("sdash.profile.edit_title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("sdash.profile.edit_subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="profile-name"
            label={t("sdash.profile.name_label")}
            placeholder={t("sdash.profile.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
            autoComplete="name"
            required
          />
          <Input
            id="profile-email"
            type="email"
            label={t("sdash.profile.email_label")}
            placeholder={t("sdash.profile.email_placeholder")}
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
              {t("sdash.profile.cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={!canSubmit}>
              {saving ? t("sdash.profile.saving") : t("sdash.profile.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
