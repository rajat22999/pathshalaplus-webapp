/**
 * Token storage abstraction backed by localStorage.
 *
 * NOTE: localStorage is convenient for this stage but is readable by JS (XSS
 * surface). For production hardening, consider httpOnly cookies for the refresh
 * token. The rest of the app only talks to this module, so swapping the backing
 * store later is a localized change.
 */

const ACCESS_KEY = "psp.access_token";
const REFRESH_KEY = "psp.refresh_token";

const isBrowser = (): boolean => typeof window !== "undefined";

export const tokenStore = {
  getAccess(): string | null {
    return isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefresh(): string | null {
    return isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null;
  },
  set(access: string, refresh: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
