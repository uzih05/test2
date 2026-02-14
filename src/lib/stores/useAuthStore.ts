/**
 * Auth Zustand Store
 * [BYOD] Manages user auth state with localStorage persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  setHasOpenaiKey: (has: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          localStorage.setItem('vs_token', res.access_token);
          set({
            user: res.user,
            token: res.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Fetch full user profile (includes has_openai_key)
          const fullUser = await authService.getMe(res.access_token);
          set({ user: fullUser });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      signup: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.signup(email, password, displayName);
          localStorage.setItem('vs_token', res.access_token);
          set({
            user: res.user,
            token: res.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Fetch full user profile (includes has_openai_key)
          const fullUser = await authService.getMe(res.access_token);
          set({ user: fullUser });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      logout: () => {
        localStorage.removeItem('vs_token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),

      setHasOpenaiKey: (has: boolean) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, has_openai_key: has } });
        }
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const user = await authService.getMe(token);
          set({ user, isAuthenticated: true });
        } catch {
          // Token expired or invalid
          localStorage.removeItem('vs_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'vectorsurfer-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
