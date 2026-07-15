"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { homeForRole } from "@/lib/roles";

type Step = "mobile" | "otp";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    // Backend returns a localized { success, message, data } envelope on errors.
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export default function LoginPage() {
  const { status, user, requestLogin, confirmOtp } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneValid = Boolean(mobile && isValidPhoneNumber(mobile));
  const showPhoneError = touched && Boolean(mobile) && !phoneValid;

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(homeForRole(user.role, user.onboarding_completed));
    }
  }, [status, user, router]);

  async function handleRequestLogin(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!mobile || !isValidPhoneNumber(mobile)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Country is locked to India, so the E.164 value already carries +91.
      const res = await requestLogin(mobile, "+91");
      setSessionId(res.session_id);
      setDevOtp(res.debug_otp);
      if (res.debug_otp) setOtp(res.debug_otp);
      setStep("otp");
    } catch (err) {
      setError(extractError(err, t("login.send_error")));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    setError(null);
    setLoading(true);
    try {
      const data = await confirmOtp(sessionId, otp);
      router.replace(
        homeForRole(data.user.role, data.onboarding_completed),
      );
    } catch (err) {
      setError(extractError(err, t("login.verify_error")));
    } finally {
      setLoading(false);
    }
  }

  function backToMobile() {
    setStep("mobile");
    setOtp("");
    setSessionId(null);
    setDevOtp(null);
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-12">
      <Card>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
            P+
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pathshala Plus
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === "mobile"
              ? t("login.subtitle_mobile")
              : t("login.subtitle_otp", { mobile: mobile ?? "" })}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "mobile" ? (
          <form onSubmit={handleRequestLogin} className="space-y-5" noValidate>
            <div>
              <PhoneNumberInput
                id="mobile"
                label={t("login.mobile_label")}
                value={mobile}
                onChange={setMobile}
                onBlur={() => setTouched(true)}
                invalid={showPhoneError}
                disabled={loading}
                autoFocus
              />
              {showPhoneError && (
                <p className="mt-1.5 text-sm text-red-600">
                  {t("login.invalid_mobile")}
                </p>
              )}
            </div>
            <Button type="submit" loading={loading} disabled={!phoneValid}>
              {loading ? t("login.sending") : t("login.send_otp")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <Input
              id="otp"
              label={t("login.otp_label")}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.4em]"
              required
            />
            {devOtp && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                {t("login.dev_otp", { otp: devOtp })}
              </p>
            )}
            <Button type="submit" loading={loading} disabled={otp.length !== 6}>
              {loading ? t("login.verifying") : t("login.verify")}
            </Button>
            <button
              type="button"
              onClick={backToMobile}
              className="w-full text-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              {t("login.change_number")}
            </button>
          </form>
        )}
      </Card>
    </main>
  );
}
