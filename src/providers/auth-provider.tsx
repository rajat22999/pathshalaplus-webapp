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

import { APP_TYPE, FIREBASE_ENABLED } from "@/config/env";
import {
  confirmPhoneOtp,
  firebaseSignOut,
  sendPhoneOtp,
  setPasswordForCurrentUser,
  signInWithPassword,
} from "@/lib/firebase";
import { getStoredLanguage } from "@/i18n/language-store";
import {
  firebaseLogin as apiFirebaseLogin,
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
  /**
   * Step 1: send an OTP. Under Firebase the returned `session_id` is the
   * Firebase `verificationId`; under the legacy flow it is the backend session
   * id. Callers pass it straight back to {@link confirmOtp} either way.
   */
  requestLogin: (
    mobile: string,
    countryCode: string,
    appType?: string,
  ) => Promise<LoginData>;
  /** Step 2: verify the OTP, store tokens, set the user. */
  confirmOtp: (
    sessionId: string,
    otp: string,
    appType?: string,
  ) => Promise<VerifyData>;
  /** Sign in with an email/password previously set on a phone-verified account. */
  loginWithPassword: (
    email: string,
    password: string,
    appType?: string,
  ) => Promise<VerifyData>;
  /** Attach an email/password to the just-verified account and email a link. */
  setPassword: (email: string, password: string) => Promise<void>;
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

  /** Adopt a completed login: persist tokens and publish the profile. */
  const adopt = useCallback((data: VerifyData) => {
    tokenStore.set(data.access_token, data.refresh_token);
    setUser(data.user);
    setStatus("authenticated");
    return data;
  }, []);

  const requestLogin = useCallback(
    async (
      mobile: string,
      countryCode: string,
      appType: string = APP_TYPE,
    ): Promise<LoginData> => {
      if (!FIREBASE_ENABLED) {
        return apiLogin(mobile, countryCode, appType);
      }
      // PhoneNumberInput already emits E.164, which is what Firebase wants.
      const verificationId = await sendPhoneOtp(mobile, getStoredLanguage());
      return {
        session_id: verificationId,
        // Firebase owns the code's lifetime; it is not ours to report.
        expires_in: 0,
        // Never a dev shortcut under Firebase — a real SMS was sent.
        debug_otp: null,
      };
    },
    [],
  );

  const confirmOtp = useCallback(
    async (sessionId: string, otp: string, appType: string = APP_TYPE) => {
      if (!FIREBASE_ENABLED) {
        return adopt(await apiVerifyOtp(sessionId, otp));
      }
      const idToken = await confirmPhoneOtp(sessionId, otp);
      return adopt(await apiFirebaseLogin(idToken, appType));
    },
    [adopt],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string, appType: string = APP_TYPE) => {
      const idToken = await signInWithPassword(email, password);
      return adopt(await apiFirebaseLogin(idToken, appType));
    },
    [adopt],
  );

  const setPassword = useCallback(
    async (email: string, password: string) => {
      await setPasswordForCurrentUser(email, password);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await apiLogout(refresh);
    } catch {
      // Ignore network/logout errors — we clear local state regardless.
    } finally {
      // Drop the Firebase session too: leaving it live would let the next
      // visitor mint a fresh ID token and sign straight back in.
      await firebaseSignOut();
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
        loginWithPassword,
        setPassword,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
