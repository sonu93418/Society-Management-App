import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, UserRole } from '../types/models';

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
        SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
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
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken).catch(() => {});
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken).catch(() => {});
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)).catch(() => {});
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
        SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(KEYS.USER),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user: User = JSON.parse(userJson);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
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
        SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEYS.USER),
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
