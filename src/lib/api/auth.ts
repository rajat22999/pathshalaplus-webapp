/** Typed wrappers over the backend auth endpoints (unwraps the {data} envelope). */

import { APP_TYPE } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import type {
  ApiEnvelope,
  LoginData,
  Profile,
  ProfileUpdate,
  TokenResponse,
  VerifyData,
} from "@/types/auth";

/**
 * Step 1 of login: authenticate a pre-existing user and create an OTP
 * challenge. `app_type` lets the backend enforce which roles may sign in here.
 *
 * `appType` defaults to the build-time {@link APP_TYPE} (this CRM console). The
 * superadmin console overrides it with "admin" so the backend role-gates the
 * platform owner onto a distinct app.
 */
export async function login(
  mobile: string,
  countryCode: string,
  appType: string = APP_TYPE,
): Promise<LoginData> {
  const { data } = await apiClient.post<ApiEnvelope<LoginData>>("/auth/login", {
    mobile,
    country_code: countryCode,
    app_type: appType,
  });
  return data.data;
}

/**
 * Exchange a Firebase ID token for our own tokens + profile.
 *
 * Covers both Firebase sign-in methods — phone OTP and email/password — because
 * the backend reads the provider from the verified token, not from us.
 */
export async function firebaseLogin(
  idToken: string,
  appType: string = APP_TYPE,
): Promise<VerifyData> {
  const { data } = await apiClient.post<ApiEnvelope<VerifyData>>(
    "/auth/firebase",
    { id_token: idToken, app_type: appType },
  );
  return data.data;
}

/** Step 2 of login: verify the OTP and receive tokens + the user profile. */
export async function verifyOtp(
  sessionId: string,
  otp: string,
): Promise<VerifyData> {
  const { data } = await apiClient.post<ApiEnvelope<VerifyData>>(
    "/auth/login/verify",
    { session_id: sessionId, otp },
  );
  return data.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TokenResponse>>(
    "/auth/refresh",
    { refresh_token: refreshToken },
  );
  return data.data;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await apiClient.get<ApiEnvelope<Profile>>("/profile");
  return data.data;
}

export async function updateProfile(
  payload: ProfileUpdate,
): Promise<{ id: string }> {
  const { data } = await apiClient.put<ApiEnvelope<{ id: string }>>(
    "/profile",
    payload,
  );
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post<ApiEnvelope<null>>("/auth/logout", {
    refresh_token: refreshToken,
  });
}
