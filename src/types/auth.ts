/** Types mirroring the backend auth contract v2 (/api/v1). */

/** Standard API response envelope returned by every endpoint. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** The authenticated user profile (single role per user). */
export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  country_code: string | null;
  role: string;
  organization_id: string | null;
  school_id: string | null;
  profile_picture: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** `data` payload of POST /auth/login (an OTP challenge was created). */
export interface LoginData {
  session_id: string;
  expires_in: number;
  /** Present only when the backend runs with DEBUG=true. */
  debug_otp: string | null;
}

/** `data` payload of POST /auth/login/verify (tokens + profile). */
export interface VerifyData extends TokenResponse {
  user: Profile;
  onboarding_completed: boolean;
}

/** Request body for PUT /profile — all fields optional. */
export interface ProfileUpdate {
  name?: string;
  email?: string;
  mobile?: string;
  country_code?: string;
  profile_picture?: string;
}
