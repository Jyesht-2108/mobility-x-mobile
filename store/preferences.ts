import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Preferences, Itinerary } from '@/types/domain';

type PreferencesState = {
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
  hydrate: () => Promise<void>;
  learnFromSelection: (selectedItinerary: Itinerary, allItineraries: Itinerary[]) => Promise<string>;
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
  learnFromSelection: async (selectedItinerary: Itinerary, allItineraries: Itinerary[]) => {
    const currentPrefs = get().preferences;
    const otherItineraries = allItineraries.filter(it => it.id !== selectedItinerary.id);
    
    if (otherItineraries.length === 0) return 'No other options to learn from';
    
    // Calculate average metrics of non-selected itineraries
    const avgTime = otherItineraries.reduce((sum, it) => sum + it.totalTimeMin, 0) / otherItineraries.length;
    const avgCost = otherItineraries.reduce((sum, it) => sum + it.totalCostCents, 0) / otherItineraries.length;
    const avgComfort = otherItineraries.reduce((sum, it) => sum + it.averageComfortScore, 0) / otherItineraries.length;
    
    // Determine what the user prioritized
    const timeDiff = selectedItinerary.totalTimeMin - avgTime;
    const costDiff = selectedItinerary.totalCostCents - avgCost;
    const comfortDiff = selectedItinerary.averageComfortScore - avgComfort;
    
    // Learning rate (small adjustments)
    const learningRate = 0.05;
    let message = '';
    
    // Adjust weights based on user choice
    if (timeDiff < -5) {
      // User chose faster option
      const newWeightTime = Math.min(1, currentPrefs.weightTime + learningRate);
      const newWeightCost = Math.max(0, currentPrefs.weightCost - learningRate * 0.5);
      const newWeightComfort = Math.max(0, currentPrefs.weightComfort - learningRate * 0.5);
      get().setPreferences({ weightTime: newWeightTime, weightCost: newWeightCost, weightComfort: newWeightComfort });
      message = 'We noticed you prioritized speed on this trip and have adjusted your preferences for future planning.';
    } else if (costDiff < -50) {
      // User chose cheaper option
      const newWeightCost = Math.min(1, currentPrefs.weightCost + learningRate);
      const newWeightTime = Math.max(0, currentPrefs.weightTime - learningRate * 0.5);
      const newWeightComfort = Math.max(0, currentPrefs.weightComfort - learningRate * 0.5);
      get().setPreferences({ weightTime: newWeightTime, weightCost: newWeightCost, weightComfort: newWeightComfort });
      message = 'We noticed you prioritized cost savings on this trip and have adjusted your preferences for future planning.';
    } else if (comfortDiff > 0.1) {
      // User chose more comfortable option
      const newWeightComfort = Math.min(1, currentPrefs.weightComfort + learningRate);
      const newWeightTime = Math.max(0, currentPrefs.weightTime - learningRate * 0.5);
      const newWeightCost = Math.max(0, currentPrefs.weightCost - learningRate * 0.5);
      get().setPreferences({ weightTime: newWeightTime, weightCost: newWeightCost, weightComfort: newWeightComfort });
      message = 'We noticed you prioritized comfort on this trip and have adjusted your preferences for future planning.';
    } else {
      message = 'Your selection has been noted for future recommendations.';
    }
    
    return message;
  },
}));


