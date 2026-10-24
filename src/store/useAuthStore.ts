import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/features/auth/types/auth.model';
import { setAccessToken, clearAccessToken } from '@/lib/auth-token';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: User | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setSession: (token, user) => {
        // Đồng bộ token vào memory để axios interceptor đọc 1 nơi duy nhất
        setAccessToken(token);
        set({
          token,
          user,
          isAuthenticated: !!token,
        });
      },
      setUser: (user) => set((state) => ({ user, isAuthenticated: !!state.token && !!user })),
      setToken: (token) => {
        if (token) setAccessToken(token);
        else clearAccessToken();
        set((state) => ({
          token,
          isAuthenticated: !!token && !!state.user,
        }));
      },
      logout: () => {
        clearAccessToken();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      // Chỉ persist user. Token chỉ giữ in-memory để tránh XSS + lệch với HttpOnly cookie.
      // Sau F5, AuthProvider sẽ silent-refresh để lấy lại token.
      partialize: (state) => ({ user: state.user }) as AuthState,
    }
  )
);
