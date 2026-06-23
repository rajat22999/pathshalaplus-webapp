/** Typed wrappers over the backend onboarding + billing endpoints. */

import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope } from "@/types/auth";
import type {
  BillingCatalog,
  CodeCheck,
  OnboardingPayload,
  OnboardingResult,
  OnboardingStatus,
  Quote,
} from "@/types/onboarding";

/** GET /onboarding/status — progress + prefill for the wizard. */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const { data } = await apiClient.get<ApiEnvelope<OnboardingStatus>>(
    "/onboarding/status",
  );
  return data.data;
}

/** GET /onboarding/check-code — is an org/school slug available? */
export async function checkCode(
  type: "org" | "school",
  code: string,
): Promise<CodeCheck> {
  const { data } = await apiClient.get<ApiEnvelope<CodeCheck>>(
    "/onboarding/check-code",
    { params: { type, code } },
  );
  return data.data;
}

/** GET /billing/catalog — base plan + add-ons + tax. */
export async function getBillingCatalog(): Promise<BillingCatalog> {
  const { data } = await apiClient.get<ApiEnvelope<BillingCatalog>>(
    "/billing/catalog",
  );
  return data.data;
}

/** POST /billing/quote — server-computed pricing for the selected add-ons. */
export async function getQuote(addons: string[]): Promise<Quote> {
  const { data } = await apiClient.post<ApiEnvelope<Quote>>("/billing/quote", {
    addons,
  });
  return data.data;
}

/** POST /onboarding — finalize setup (creates org + school + subscription + payment). */
export async function submitOnboarding(
  payload: OnboardingPayload,
): Promise<OnboardingResult> {
  const { data } = await apiClient.post<ApiEnvelope<OnboardingResult>>(
    "/onboarding",
    payload,
  );
  return data.data;
}
