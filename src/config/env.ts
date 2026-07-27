/** Public runtime configuration (safe to expose to the browser). */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

/** Versioned API root, e.g. http://localhost:8000/api/v1 */
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

/**
 * The client application type sent on /auth/login. The backend uses it to
 * enforce which roles may sign in here. This web app is the CRM console.
 */
export const APP_TYPE = process.env.NEXT_PUBLIC_APP_TYPE ?? "crm";

/**
 * Firebase web config. These values are public by design — they identify the
 * project, they do not authorize anything. Access is controlled by the
 * authorized-domain allowlist and the security rules, not by hiding these.
 *
 * NOTE: NEXT_PUBLIC_* are inlined at build time, so the machine (or CI job)
 * running `next build` must have them set — a runtime env var is too late.
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/**
 * Firebase sign-in is used only when the project is actually configured. When
 * false the app falls back to the legacy backend OTP flow, which is what keeps
 * local development working with no Firebase project and no SMS spend.
 */
export const FIREBASE_ENABLED = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId,
);

/**
 * Element id the invisible reCAPTCHA widget mounts into. Lives here rather than
 * in lib/firebase so a page can render the container without importing the
 * Firebase SDK.
 */
export const RECAPTCHA_CONTAINER_ID = "psp-recaptcha-container";
