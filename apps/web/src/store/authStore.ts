import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => {
        set({ token });
        // Guard: document is not available during SSR — only set cookie in browser
        if (typeof window !== 'undefined' && token) {
          document.cookie = `auth-token=${token}; path=/; max-age=604800`; // 7 days
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Guard: document is not available during SSR — only clear cookie in browser
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-token=; path=/; max-age=0';
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== 'undefined') {
          document.cookie = `auth-token=${state.token}; path=/; max-age=604800`;
        }
      },
    }
  )
);
