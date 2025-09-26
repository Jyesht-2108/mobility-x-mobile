import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
  user: { id: string; email: string } | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_KEY = 'auth_user_v1';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(AUTH_KEY);
      if (raw) set({ user: JSON.parse(raw) });
    } catch {}
  },
  login: async (email, _password) => {
    const user = { id: `u-${Date.now()}`, email };
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(user));
    set({ user });
  },
  signup: async (email, _password) => {
    const user = { id: `u-${Date.now()}`, email };
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(AUTH_KEY);
    set({ user: null });
  },
}));


