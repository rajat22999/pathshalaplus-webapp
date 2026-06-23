"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { updateProfile } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/**
 * Lightweight profile completion for non-super_admin roles (admin/staff/teacher)
 * who were provisioned by an admin and just need to set name + email. Super
 * admins go through the full organization wizard instead.
 */
export function ProfileCompletion() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [user]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSaving(true);
    try {
      const trimmedEmail = email.trim();
      await updateProfile({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(extractError(err, t("onboarding.save_error")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-12">
      <Card>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
            P+
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("onboarding.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("onboarding.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="name"
            label={t("onboarding.name_label")}
            placeholder={t("onboarding.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
            required
          />
          <Input
            id="email"
            type="email"
            label={t("onboarding.email_label")}
            placeholder={t("onboarding.email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            autoComplete="email"
          />
          <Button type="submit" loading={saving} disabled={!canSubmit}>
            {saving ? t("onboarding.saving") : t("onboarding.continue")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
