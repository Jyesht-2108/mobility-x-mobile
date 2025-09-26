import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Preferences, Itinerary } from '@/types/domain';

type PreferencesState = {
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
  hydrate: () => Promise<void>;
  learnFromSelection: (selectedItinerary: Itinerary, allItineraries: Itinerary[]) => string;
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
  learnFromSelection: (selectedItinerary, allItineraries) => {
    const current = get().preferences;
    const others = allItineraries.filter(it => it.id !== selectedItinerary.id);
    
    if (others.length === 0) return '';
    
    // Calculate averages of non-selected options
    const avgTime = others.reduce((sum, it) => sum + it.totalTimeMin, 0) / others.length;
    const avgCost = others.reduce((sum, it) => sum + it.totalCostCents, 0) / others.length;
    const avgComfort = others.reduce((sum, it) => sum + it.averageComfortScore, 0) / others.length;
    
    // Determine what the user prioritized
    const timeFaster = selectedItinerary.totalTimeMin < avgTime;
    const costHigher = selectedItinerary.totalCostCents > avgCost;
    const comfortHigher = selectedItinerary.averageComfortScore > avgComfort;
    
    // Adjust weights based on user choice (small increments)
    const adjustment = 0.05;
    let newWeights = { ...current };
    let feedback = '';
    
    if (timeFaster && costHigher) {
      // User prioritized speed over cost
      newWeights.weightTime = Math.min(1, current.weightTime + adjustment);
      newWeights.weightCost = Math.max(0, current.weightCost - adjustment);
      feedback = 'We noticed you prioritized speed over cost and have adjusted your preferences for future planning.';
    } else if (comfortHigher && costHigher) {
      // User prioritized comfort over cost
      newWeights.weightComfort = Math.min(1, current.weightComfort + adjustment);
      newWeights.weightCost = Math.max(0, current.weightCost - adjustment);
      feedback = 'We noticed you prioritized comfort over cost and have adjusted your preferences for future planning.';
    } else if (timeFaster && comfortHigher) {
      // User prioritized both speed and comfort
      newWeights.weightTime = Math.min(1, current.weightTime + adjustment * 0.5);
      newWeights.weightComfort = Math.min(1, current.weightComfort + adjustment * 0.5);
      newWeights.weightCost = Math.max(0, current.weightCost - adjustment);
      feedback = 'We noticed you prioritized speed and comfort and have adjusted your preferences for future planning.';
    } else if (selectedItinerary.totalCostCents < avgCost) {
      // User prioritized cost savings
      newWeights.weightCost = Math.min(1, current.weightCost + adjustment);
      newWeights.weightTime = Math.max(0, current.weightTime - adjustment * 0.5);
      newWeights.weightComfort = Math.max(0, current.weightComfort - adjustment * 0.5);
      feedback = 'We noticed you prioritized cost savings and have adjusted your preferences for future planning.';
    }
    
    // Normalize weights to sum to 1
    const total = newWeights.weightTime + newWeights.weightCost + newWeights.weightComfort;
    newWeights.weightTime = newWeights.weightTime / total;
    newWeights.weightCost = newWeights.weightCost / total;
    newWeights.weightComfort = newWeights.weightComfort / total;
    
    get().setPreferences(newWeights);
    return feedback;
  },
}));


