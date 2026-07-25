import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth.store';

// Read the API URL from process.env (Expo Public variable) or app.json extra config
// Falls back to local LAN IP for development
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://10.69.91.148:5000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token Refresh Mutex ────────────────────────────────────────────────────────
// Prevents multiple simultaneous 401s from each triggering their own refresh.
// When a refresh is in flight, all subsequent 401 handlers wait for the SAME
// promise instead of firing independent refresh requests (which triggers the
// backend's reuse-detection and kills the session).
let isRefreshing = false;
let pendingRefreshResolvers: Array<(token: string) => void> = [];
let pendingRefreshRejecters: Array<(err: any) => void> = [];

function waitForRefresh(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    pendingRefreshResolvers.push(resolve);
    pendingRefreshRejecters.push(reject);
  });
}

function broadcastRefreshSuccess(newToken: string) {
  pendingRefreshResolvers.forEach(resolve => resolve(newToken));
  pendingRefreshResolvers = [];
  pendingRefreshRejecters = [];
}

function broadcastRefreshFailure(err: any) {
  pendingRefreshRejecters.forEach(reject => reject(err));
  pendingRefreshResolvers = [];
  pendingRefreshRejecters = [];
}
// ──────────────────────────────────────────────────────────────────────────────

// Request interceptor — attach current JWT to every outgoing request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401s with a singleton token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401 Unauthorized errors that haven't been retried yet
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // A refresh is already in flight — wait for it and retry with the new token
      try {
        const newToken = await waitForRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    // This request is the first 401 — take ownership of the refresh
    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint directly (bypass apiClient to avoid interceptor loop)
      const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

      // Update store and SecureStore with the new tokens
      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

      // Unblock all waiting requests with the new access token
      broadcastRefreshSuccess(newAccessToken);
      isRefreshing = false;

      // Retry the original request with the fresh token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      broadcastRefreshFailure(refreshError);

      // Refresh failed — clear session and send to login
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

// Helper to extract error message from API errors
export const getApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  return 'An unexpected error occurred';
};
