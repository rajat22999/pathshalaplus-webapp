"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  getProfile,
  login as apiLogin,
  logout as apiLogout,
  verifyOtp as apiVerifyOtp,
} from "@/lib/api/auth";
import { tokenStore } from "@/lib/tokens";
import type { LoginData, Profile, VerifyData } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: Profile | null;
  status: AuthStatus;
  /** Step 1: open an OTP challenge (auto-creates the account if it's a new mobile). */
  requestLogin: (mobile: string, countryCode: string) => Promise<LoginData>;
  /** Step 2: verify OTP, store tokens, set the user. */
  confirmOtp: (sessionId: string, otp: string) => Promise<VerifyData>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Exposed so onboarding can update the profile in place after a save. */
  setUser: Dispatch<SetStateAction<Profile | null>>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshUser = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const profile = await getProfile();
      setUser(profile);
      setStatus("authenticated");
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // Mount-time auth bootstrap: we must start in "loading" (localStorage isn't
    // available during SSR) and resolve the session after calling /profile. The
    // synchronous setState inside refreshUser is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const requestLogin = useCallback(
    (mobile: string, countryCode: string) => apiLogin(mobile, countryCode),
    [],
  );

  const confirmOtp = useCallback(async (sessionId: string, otp: string) => {
    const data = await apiVerifyOtp(sessionId, otp);
    tokenStore.set(data.access_token, data.refresh_token);
    setUser(data.user);
    setStatus("authenticated");
    return data;
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await apiLogout(refresh);
    } catch {
      // Ignore network/logout errors — we clear local state regardless.
    } finally {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        requestLogin,
        confirmOtp,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
