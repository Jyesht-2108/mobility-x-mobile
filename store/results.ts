import { create } from 'zustand';
import type { Itinerary } from '@/types/domain';

type ResultsState = {
  results: Itinerary[];
  selected: Itinerary | null;
  setResults: (items: Itinerary[]) => void;
  setSelected: (item: Itinerary | null) => void;
};

export const useResultsStore = create<ResultsState>((set) => ({
  results: [],
  selected: null,
  setResults: (items) => set({ results: items }),
  setSelected: (item) => set({ selected: item }),
}));


