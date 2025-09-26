import type { Itinerary, Preferences } from '@/types/domain';
import { rankItineraries, scoreItinerary } from '@/services/routing';

export type Recommendation = {
  itinerary: Itinerary;
  score: number;
  rationale: string[];
};

export function recommend(itineraries: Itinerary[], prefs: Preferences): Recommendation[] {
  const ranked = rankItineraries(itineraries, prefs);
  return ranked.map((it) => ({
    itinerary: it,
    score: scoreItinerary(it, prefs),
    rationale: buildRationale(it, prefs),
  }));
}

function buildRationale(it: Itinerary, prefs: Preferences): string[] {
  const lines: string[] = [];
  if (prefs.weightTime > 0.4) lines.push(`Favors time: ${Math.round(it.totalTimeMin)} min total`);
  if (prefs.weightCost > 0.4) lines.push(`Favors cost: $${(it.totalCostCents / 100).toFixed(2)}`);
  if (prefs.weightComfort > 0.4) lines.push(`Favors comfort: ${Math.round(it.averageComfortScore * 100)}%`);
  if (it.legs.length - 1 > 0) lines.push(`${it.legs.length - 1} transfers`);
  return lines;
}


