import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: () => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { access_token, user } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null });
    window.location.href = '/login';
  },

  fetchProfile: async () => {
    const res = await api.get('/auth/me');
    set({ user: res.data.data });
  },
}));
