'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export interface UserProfile {
  displayName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  reputationScore: number;
  profileCompleteness: number;
  skills?: { skill: { id: string; name: string }; proficiency: number }[];
}

export interface User {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profile?: UserProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  removeCookie('accessToken');
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof Error && err.message.includes('Failed to fetch'));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,
  initialized: false,
  error: null,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('accessToken', token);
      setCookie('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
      removeCookie('accessToken');
    }
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setCookie('accessToken', accessToken);
    set({ token: accessToken });
  },

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login', { email, password },
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setCookie('accessToken', data.accessToken);
      set({ user: data.user, token: data.accessToken, loading: false, initialized: true, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ loading: false, error: message });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register', { name, email, password },
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setCookie('accessToken', data.accessToken);
      set({ user: data.user, token: data.accessToken, loading: false, initialized: true, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearAuthStorage();
    set({ user: null, token: null, loading: false, initialized: true, error: null });
  },

  refresh: async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        clearAuthStorage();
        set({ user: null, token: null, loading: false, initialized: true, error: null });
        return;
      }
      const data = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh', { refreshToken: storedRefreshToken },
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setCookie('accessToken', data.accessToken);
      set({ token: data.accessToken });
      const me = await api.get<User>('/users/me', data.accessToken);
      set({ user: me, token: data.accessToken, loading: false, initialized: true, error: null });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ loading: false, initialized: true });
        return;
      }
      clearAuthStorage();
      set({ user: null, token: null, loading: false, initialized: true, error: null });
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ loading: false, initialized: true });
      return;
    }
    setCookie('accessToken', token);
    set({ token });
    try {
      const me = await api.get<User>('/users/me', token);
      set({ user: me, loading: false, initialized: true, error: null });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ loading: false, initialized: true });
        return;
      }
      await get().refresh();
    }
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'accessToken') {
      const state = useAuthStore.getState();
      if (!e.newValue && state.token) {
        state.logout();
      } else if (e.newValue && e.newValue !== state.token) {
        state.initialize();
      }
    }
  });
}
