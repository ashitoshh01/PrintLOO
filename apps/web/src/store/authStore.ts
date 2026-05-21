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
        document.cookie = `auth-token=${token}; path=/; max-age=900`; // 15 min
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        document.cookie = 'auth-token=; path=/; max-age=0';
      },
    }),
    { name: 'auth-storage' }
  )
);
