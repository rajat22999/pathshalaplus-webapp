/**
 * Axios instance with auth wiring:
 *  - request interceptor attaches the Bearer access token
 *  - response interceptor transparently refreshes on a 401 and retries once,
 *    using a single-flight guard so concurrent 401s share one refresh call.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_V1_URL } from "@/config/env";
import { getStoredLanguage } from "@/i18n/language-store";
import { tokenStore } from "@/lib/tokens";
import type { ApiEnvelope, TokenResponse } from "@/types/auth";

export const apiClient = axios.create({
  baseURL: API_V1_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  // Accept-Language is CORS-safelisted, so this adds no preflight overhead.
  config.headers.set("Accept-Language", getStoredLanguage());
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  // Bare axios call (no interceptors) to avoid a refresh loop. We still pass
  // Accept-Language manually so any refresh-error message is localized too.
  const { data } = await axios.post<ApiEnvelope<TokenResponse>>(
    `${API_V1_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { "Accept-Language": getStoredLanguage() } },
  );
  const tokens = data.data;
  tokenStore.set(tokens.access_token, tokens.refresh_token);
  return tokens.access_token;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = Boolean(original?.url?.includes("/auth/refresh"));

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isRefreshCall &&
      tokenStore.getRefresh()
    ) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccess = await refreshPromise;
        original.headers.set("Authorization", `Bearer ${newAccess}`);
        return apiClient(original);
      } catch (refreshError) {
        tokenStore.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
