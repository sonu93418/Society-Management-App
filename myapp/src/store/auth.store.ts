import { create } from 'zustand';
import type { User, UserRole } from '../types/models';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) =>
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectRole = (state: AuthState): UserRole | null => state.user?.role ?? null;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
