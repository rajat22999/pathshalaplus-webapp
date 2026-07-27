/**
 * Turning auth failures into messages a user can act on.
 *
 * Two very different error shapes reach the login screens:
 *  - our API's localized `{success, message, data}` envelope (axios errors)
 *  - Firebase SDK errors, which carry a machine-readable `code` like
 *    "auth/too-many-requests"
 *
 * Collapsing the second kind into a generic "could not send the OTP" hides the
 * only useful information there is. A rate limit, an unverified email and a
 * misconfigured project each need a different response from the user, and
 * telling them all three to "check the number" sends them down the wrong path.
 */

import { isAxiosError } from "axios";

/** Firebase error code -> translation key. */
const FIREBASE_ERROR_KEYS: Record<string, string> = {
  "auth/too-many-requests": "login.err.too_many_requests",
  "auth/invalid-phone-number": "login.err.invalid_phone",
  "auth/missing-phone-number": "login.err.invalid_phone",
  "auth/quota-exceeded": "login.err.quota_exceeded",
  "auth/invalid-app-credential": "login.err.app_credential",
  "auth/captcha-check-failed": "login.err.app_credential",
  "auth/invalid-verification-code": "login.err.invalid_code",
  "auth/code-expired": "login.err.code_expired",
  "auth/invalid-verification-id": "login.err.code_expired",
  "auth/user-disabled": "login.err.user_disabled",
  "auth/network-request-failed": "login.err.network",
  "auth/operation-not-allowed": "login.err.operation_not_allowed",
  "auth/unverified-email": "login.err.unverified_email",
  "auth/wrong-password": "login.err.wrong_password",
  "auth/invalid-credential": "login.err.wrong_password",
  "auth/user-not-found": "login.err.wrong_password",
  "auth/email-already-in-use": "login.err.email_in_use",
  "auth/weak-password": "login.err.weak_password",
  "auth/requires-recent-login": "login.err.requires_recent_login",
};

function firebaseCode(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("auth/") ? code : null;
}

/**
 * Resolve any auth error to a user-facing string.
 *
 * `t` is the caller's translator; `fallback` is used for errors we do not
 * recognise. Our API's own message wins when present, since it is already
 * localized server-side.
 */
export function authErrorMessage(
  err: unknown,
  t: (key: string) => string,
  fallback: string,
): string {
  const code = firebaseCode(err);
  if (code) {
    const key = FIREBASE_ERROR_KEYS[code];
    if (key) return t(key);
    // Unmapped Firebase error: surface the code rather than swallow it, so a
    // support conversation has something concrete to go on.
    return `${fallback} (${code})`;
  }

  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message) return message;
  }

  return fallback;
}
