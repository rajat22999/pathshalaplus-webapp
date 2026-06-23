"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { getBillingCatalog, submitOnboarding } from "@/lib/api/onboarding";
import { isValidEmail } from "@/lib/format";
import { Stepper } from "@/app/onboarding/stepper";
import { OrganizationStep } from "@/app/onboarding/organization-step";
import { SchoolStep, academicSessions } from "@/app/onboarding/school-step";
import { AdminStep } from "@/app/onboarding/admin-step";
import { BillingStep } from "@/app/onboarding/billing-step";
import { PaymentModal } from "@/app/onboarding/payment-modal";
import type { CodeStatus, WizardForm } from "@/app/onboarding/wizard-types";
import type { BillingCatalog, OnboardingPayload } from "@/types/onboarding";

const TOTAL_STEPS = 4;
const COUNTRY_CODE = "+91";

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function initialForm(name: string | null, email: string | null): WizardForm {
  const tokens = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = tokens;
  const [defaultSession] = academicSessions().slice(1); // the current session
  return {
    orgName: "",
    orgCode: "",
    orgCodeEdited: false,
    orgEmail: "",
    orgPhone: undefined,
    schoolName: "",
    schoolCode: "",
    schoolCodeEdited: false,
    schoolPhone: undefined,
    schoolEmail: "",
    schoolAddress: "",
    academicSession: defaultSession ?? "",
    firstName: first ?? "",
    lastName: rest.join(" "),
    adminEmail: email ?? "",
    addons: [],
  };
}

const STEP_TAGS = ["wiz.org.tag", "wiz.school.tag", "wiz.admin.tag", "wiz.billing.tag"];

export function OnboardingWizard() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(() =>
    initialForm(user?.name ?? null, user?.email ?? null),
  );
  const [orgCodeStatus, setOrgCodeStatus] = useState<CodeStatus>("idle");
  const [schoolCodeStatus, setSchoolCodeStatus] = useState<CodeStatus>("idle");
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<WizardForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const loadCatalog = useCallback(() => {
    getBillingCatalog()
      .then(setCatalog)
      .catch(() => setCatalogFailed(true));
  }, []);

  function retryCatalog() {
    setCatalogFailed(false);
    loadCatalog();
  }

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const phoneOk = (v: string | undefined) => Boolean(v && isValidPhoneNumber(v));

  const total = useMemo(() => {
    if (!catalog) return 0;
    const subtotal =
      catalog.base_plan.price +
      form.addons.reduce(
        (sum, code) =>
          sum + (catalog.addons.find((a) => a.code === code)?.price ?? 0),
        0,
      );
    const tax = Math.round((subtotal * catalog.tax_percent) / 100);
    return subtotal + tax;
  }, [catalog, form.addons]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return (
          form.orgName.trim().length > 0 &&
          orgCodeStatus === "available" &&
          isValidEmail(form.orgEmail) &&
          phoneOk(form.orgPhone)
        );
      case 2:
        return (
          form.schoolName.trim().length > 0 &&
          schoolCodeStatus === "available" &&
          phoneOk(form.schoolPhone) &&
          isValidEmail(form.schoolEmail) &&
          form.schoolAddress.trim().length > 0 &&
          form.academicSession.length > 0
        );
      case 3:
        return (
          form.firstName.trim().length > 0 &&
          form.lastName.trim().length > 0 &&
          isValidEmail(form.adminEmail)
        );
      default:
        return Boolean(catalog);
    }
  }, [step, form, orgCodeStatus, schoolCodeStatus, catalog]);

  function toggleAddon(code: string) {
    update({
      addons: form.addons.includes(code)
        ? form.addons.filter((c) => c !== code)
        : [...form.addons, code],
    });
  }

  function buildPayload(): OnboardingPayload {
    return {
      organization: {
        name: form.orgName.trim(),
        code: form.orgCode,
        business_email: form.orgEmail.trim(),
        contact_number: form.orgPhone ?? "",
        country_code: COUNTRY_CODE,
      },
      school: {
        name: form.schoolName.trim(),
        code: form.schoolCode,
        phone: form.schoolPhone ?? "",
        country_code: COUNTRY_CODE,
        email: form.schoolEmail.trim(),
        address: form.schoolAddress.trim(),
        academic_session: form.academicSession,
      },
      admin: {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.adminEmail.trim(),
      },
      addons: form.addons,
    };
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      await submitOnboarding(buildPayload());
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(extractError(err, t("wiz.submit_error")));
      setPayOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const primaryDisabled = step < TOTAL_STEPS ? !canContinue : !catalog;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
          <span className="text-xl font-extrabold italic tracking-tight text-indigo-600">
            PathShala+
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 transition hover:text-red-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {t("wiz.logout")}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28">
        <Stepper current={step} total={TOTAL_STEPS} tag={t(STEP_TAGS[step - 1])} />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8">
          {step === 1 && (
            <OrganizationStep
              form={form}
              update={update}
              onCodeStatusChange={setOrgCodeStatus}
              disabled={submitting}
            />
          )}
          {step === 2 && (
            <SchoolStep
              form={form}
              update={update}
              onCodeStatusChange={setSchoolCodeStatus}
              disabled={submitting}
            />
          )}
          {step === 3 && (
            <AdminStep
              form={form}
              update={update}
              lockedMobile={user?.mobile ?? null}
              disabled={submitting}
            />
          )}
          {step === 4 &&
            (catalog ? (
              <BillingStep
                catalog={catalog}
                selected={form.addons}
                onToggle={toggleAddon}
                disabled={submitting}
              />
            ) : catalogFailed ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-sm text-slate-500">{t("wiz.load_error")}</p>
                <button
                  type="button"
                  onClick={retryCatalog}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t("wiz.retry")}
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-16">
                <Spinner className="h-8 w-8 text-indigo-600" />
              </div>
            ))}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {t("wiz.back")}
            </button>
          )}
          <button
            type="button"
            disabled={primaryDisabled || submitting}
            onClick={() =>
              step < TOTAL_STEPS ? setStep((s) => s + 1) : setPayOpen(true)
            }
            className="flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step < TOTAL_STEPS ? t("wiz.continue") : t("wiz.billing.pay_confirm")}
          </button>
        </div>
      </footer>

      {payOpen && (
        <PaymentModal
          total={total}
          processing={submitting}
          onClose={() => {
            if (!submitting) setPayOpen(false);
          }}
          onConfirm={handlePay}
        />
      )}
    </div>
  );
}
