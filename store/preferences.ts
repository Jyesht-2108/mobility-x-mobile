import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Preferences } from '@/types/domain';

type PreferencesState = {
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
  hydrate: () => Promise<void>;
};

const DEFAULT_PREFS: Preferences = {
  weightTime: 0.5,
  weightCost: 0.3,
  weightComfort: 0.2,
  avoidModes: [],
  maxTransfers: 3,
};

const STORAGE_KEY = 'preferences_v1';

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFS,
  setPreferences: (prefs) => {
    const next = { ...get().preferences, ...prefs };
    set({ preferences: next });
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  },
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Preferences;
        set({ preferences: parsed });
      }
    } catch {
      // ignore
    }
  },
}));


