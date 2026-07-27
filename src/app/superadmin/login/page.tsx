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
import { Spinner } from "@/components/ui/spinner";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import { RECAPTCHA_CONTAINER_ID } from "@/config/env";
import { authErrorMessage } from "@/lib/auth-errors";
import { ROLE_SUPER_ADMIN } from "@/lib/roles";

// The platform console signs in against a distinct backend app so the backend
// role-gates the platform owner separately from the school CRM.
const SUPERADMIN_APP_TYPE = "admin";

type Step = "mobile" | "otp";

export default function SuperadminLoginPage() {
  const { status, user, requestLogin, confirmOtp, logout } = useAuth();
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
  const [loggingOut, setLoggingOut] = useState(false);

  const phoneValid = Boolean(mobile && isValidPhoneNumber(mobile));
  const showPhoneError = touched && Boolean(mobile) && !phoneValid;

  const isSuperAdmin = user?.role === ROLE_SUPER_ADMIN;
  // Someone already signed in here but not as the platform owner (e.g. a school
  // admin who navigated to the console URL).
  const wrongRole =
    status === "authenticated" && Boolean(user) && !isSuperAdmin;

  // A super_admin (freshly verified or already signed in) lands on the console.
  useEffect(() => {
    if (status === "authenticated" && isSuperAdmin) {
      router.replace("/superadmin");
    }
  }, [status, isSuperAdmin, router]);

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
      const res = await requestLogin(mobile, "+91", SUPERADMIN_APP_TYPE);
      setSessionId(res.session_id);
      setDevOtp(res.debug_otp);
      if (res.debug_otp) setOtp(res.debug_otp);
      setStep("otp");
    } catch (err) {
      // A 403 here means the mobile's role may not sign in to the platform app.
      const fallback =
        isAxiosError(err) && err.response?.status === 403
          ? t("superadmin.login.unauthorized")
          : t("login.send_error");
      setError(authErrorMessage(err, t, fallback));
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
      const data = await confirmOtp(sessionId, otp, SUPERADMIN_APP_TYPE);
      if (data.user.role === ROLE_SUPER_ADMIN) {
        router.replace("/superadmin");
      }
      // A non-super_admin who verified successfully falls through: `wrongRole`
      // now renders the "not authorized" panel below.
    } catch (err) {
      const fallback =
        isAxiosError(err) && err.response?.status === 403
          ? t("superadmin.login.unauthorized")
          : t("login.verify_error");
      setError(authErrorMessage(err, t, fallback));
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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      backToMobile();
    }
  }

  // While auth is resolving, or a super_admin is being redirected to the
  // console, show a spinner rather than the login form.
  if (status === "loading" || (status === "authenticated" && isSuperAdmin)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4 py-12">
      <Card>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
            P+
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("superadmin.console_title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {wrongRole
              ? t("superadmin.login.unauthorized")
              : step === "mobile"
                ? t("superadmin.login.subtitle_mobile")
                : t("login.subtitle_otp", { mobile: mobile ?? "" })}
          </p>
        </div>

        {wrongRole ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("superadmin.login.unauthorized_detail")}
            </div>
            <Button
              onClick={handleLogout}
              loading={loggingOut}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {t("superadmin.login.switch_account")}
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {step === "mobile" ? (
              <form
                onSubmit={handleRequestLogin}
                className="space-y-5"
                noValidate
              >
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
                <Button
                  type="submit"
                  loading={loading}
                  disabled={otp.length !== 6}
                >
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
          </>
        )}

        {/* Invisible reCAPTCHA mount point (see the CRM login page). */}
        <div id={RECAPTCHA_CONTAINER_ID} />
      </Card>
    </main>
  );
}
