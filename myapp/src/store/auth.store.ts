import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User, UserRole } from '../types/models';

const isWeb = Platform.OS === 'web';

// Resilient storage wrapper (SecureStore for iOS/Android, localStorage for Web)
const storage = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        console.warn('localStorage read blocked or unavailable:', err);
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn('localStorage write blocked or unavailable:', err);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn('localStorage delete blocked or unavailable:', err);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// SecureStore keys
const KEYS = {
  ACCESS_TOKEN: 'portl_access_token',
  REFRESH_TOKEN: 'portl_refresh_token',
  USER: 'portl_user',
} as const;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // starts true — will be set false once session is restored

  /**
   * Called after a successful login.
   * Persists tokens and user to SecureStore so the session survives app restarts.
   */
  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await Promise.all([
        storage.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
        storage.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
        storage.setItemAsync(KEYS.USER, JSON.stringify(user)),
      ]);
    } catch (e) {
      console.error('[AuthStore] Failed to persist session to SecureStore:', e);
    }
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Called on token refresh. Updates in-memory tokens and SecureStore.
   */
  setTokens: (accessToken, refreshToken) => {
    storage.setItemAsync(KEYS.ACCESS_TOKEN, accessToken).catch(() => {});
    storage.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken).catch(() => {});
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    storage.setItemAsync(KEYS.USER, JSON.stringify(user)).catch(() => {});
    set({ user });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Called once on app startup (inside useEffect in _layout.tsx).
   * Reads persisted tokens from SecureStore and restores the session.
   * Always sets isLoading to false when done — even on failure.
   */
  restoreSession: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        storage.getItemAsync(KEYS.ACCESS_TOKEN),
        storage.getItemAsync(KEYS.REFRESH_TOKEN),
        storage.getItemAsync(KEYS.USER),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user: User = JSON.parse(userJson);

        // Validate the stored refresh token is still accepted by the backend.
        // This handles DB reseeds, server restarts, and token invalidation gracefully.
        try {
          const BASE_URL =
            process.env.EXPO_PUBLIC_API_URL ??
            'http://10.69.91.148:5000/api/v1';

          const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            const newAccessToken: string = data?.data?.accessToken ?? accessToken;
            const newRefreshToken: string = data?.data?.refreshToken ?? refreshToken;

            // Persist rotated tokens
            await Promise.all([
              storage.setItemAsync(KEYS.ACCESS_TOKEN, newAccessToken),
              storage.setItemAsync(KEYS.REFRESH_TOKEN, newRefreshToken),
            ]).catch(() => {});

            set({
              user,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token rejected by backend (stale after reseed/invalidation) — clear session
            console.warn('[AuthStore] Stored refresh token rejected by backend. Clearing session.');
            await Promise.all([
              storage.deleteItemAsync(KEYS.ACCESS_TOKEN),
              storage.deleteItemAsync(KEYS.REFRESH_TOKEN),
              storage.deleteItemAsync(KEYS.USER),
            ]).catch(() => {});
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
          }
        } catch (networkErr) {
          // Network unavailable — trust local session (offline resilience)
          console.warn('[AuthStore] Could not validate session with backend (offline?). Using local session.');
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        // No stored session — user must log in
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[AuthStore] Failed to restore session from SecureStore:', e);
      set({ isLoading: false });
    }
  },

  /**
   * Clears in-memory state AND removes all persisted tokens from SecureStore.
   */
  logout: async () => {
    try {
      await Promise.all([
        storage.deleteItemAsync(KEYS.ACCESS_TOKEN),
        storage.deleteItemAsync(KEYS.REFRESH_TOKEN),
        storage.deleteItemAsync(KEYS.USER),
      ]);
    } catch (e) {
      console.error('[AuthStore] Failed to clear SecureStore on logout:', e);
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectRole = (state: AuthState): UserRole | null => state.user?.role ?? null;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
