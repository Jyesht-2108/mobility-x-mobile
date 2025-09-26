import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type ApiKeyState = {
  openaiApiKey: string | null;
  locationiqApiKey: string | null;
  googleMapsApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => Promise<void>;
  setLocationiqApiKey: (key: string | null) => Promise<void>;
  setGoogleMapsApiKey: (key: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
};

const STORAGE_KEY = 'openai_api_key_v1';
const GEO_KEY = 'locationiq_api_key_v1';
const GOOGLE_KEY = 'google_maps_api_key_v1';

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  openaiApiKey: null,
  locationiqApiKey: null,
  googleMapsApiKey: null,
  setOpenaiApiKey: async (key) => {
    if (key) {
      await SecureStore.setItemAsync(STORAGE_KEY, key);
      set({ openaiApiKey: key });
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      set({ openaiApiKey: null });
    }
  },
  setLocationiqApiKey: async (key) => {
    if (key) {
      await SecureStore.setItemAsync(GEO_KEY, key);
      set({ locationiqApiKey: key });
    } else {
      await SecureStore.deleteItemAsync(GEO_KEY);
      set({ locationiqApiKey: null });
    }
  },
  setGoogleMapsApiKey: async (key) => {
    if (key) {
      await SecureStore.setItemAsync(GOOGLE_KEY, key);
      set({ googleMapsApiKey: key });
    } else {
      await SecureStore.deleteItemAsync(GOOGLE_KEY);
      set({ googleMapsApiKey: null });
    }
  },
  hydrate: async () => {
    try {
      const key = await SecureStore.getItemAsync(STORAGE_KEY);
      const geo = await SecureStore.getItemAsync(GEO_KEY);
      const gkey = await SecureStore.getItemAsync(GOOGLE_KEY);
      set({ openaiApiKey: key ?? null, locationiqApiKey: geo ?? null, googleMapsApiKey: gkey ?? null });
    } catch {
      // ignore
    }
  },
}));


