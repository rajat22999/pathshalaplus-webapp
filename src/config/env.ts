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
