import { differenceInMinutes } from 'date-fns';
import type { Itinerary, LatLng, Leg, Preferences, TransportMode } from '@/types/domain';

function computeComfort(mode: TransportMode): number {
  switch (mode) {
    case 'WALK':
      return 0.6;
    case 'BIKE':
      return 0.7;
    case 'BUS':
      return 0.55;
    case 'METRO':
      return 0.65;
    case 'RAIL':
      return 0.75;
    case 'RIDE_HAIL':
      return 0.85;
    default:
      return 0.6;
  }
}

function leg(from: LatLng, to: LatLng, minutes: number, mode: TransportMode, costCents: number, start: Date): Leg {
  const end = new Date(start.getTime() + minutes * 60_000);
  return {
    id: `${mode}-${start.getTime()}`,
    mode,
    from,
    to,
    startTime: start.getTime(),
    endTime: end.getTime(),
    costCents,
    comfortScore: computeComfort(mode),
  };
}

function summarize(legs: Leg[]): Itinerary {
  const totalCostCents = legs.reduce((s, l) => s + l.costCents, 0);
  const totalTimeMin = differenceInMinutes(new Date(legs[legs.length - 1].endTime), new Date(legs[0].startTime));
  const averageComfortScore = legs.reduce((s, l) => s + l.comfortScore, 0) / legs.length;
  return {
    id: `itin-${legs[0].startTime}-${legs.length}`,
    legs,
    totalTimeMin,
    totalCostCents,
    averageComfortScore,
  };
}

export async function planItineraries(origin: LatLng, destination: LatLng, prefs: Preferences): Promise<Itinerary[]> {
  const now = new Date();
  // Mock distances/time roughly via straight-line (not accurate, placeholder)
  const baseMinutes = 35;
  const baseCost = 350;

  const options: Itinerary[] = [
    summarize([
      leg(origin, origin, 5, 'WALK', 0, now),
      leg(origin, destination, 20, 'METRO', 250, new Date(now.getTime() + 5 * 60_000)),
      leg(destination, destination, 10, 'WALK', 0, new Date(now.getTime() + 25 * 60_000)),
    ]),
    summarize([
      leg(origin, destination, baseMinutes, 'BUS', baseCost, now),
    ]),
    summarize([
      leg(origin, destination, 25, 'RIDE_HAIL', 1200, now),
    ]),
    summarize([
      leg(origin, origin, 3, 'WALK', 0, now),
      leg(origin, destination, 18, 'RAIL', 500, new Date(now.getTime() + 3 * 60_000)),
      leg(destination, destination, 6, 'WALK', 0, new Date(now.getTime() + 21 * 60_000)),
    ]),
  ];

  const filtered = options.filter((itin) => {
    if (prefs.maxTransfers !== undefined) {
      const transfers = Math.max(0, itin.legs.length - 1);
      if (transfers > prefs.maxTransfers) return false;
    }
    if (prefs.avoidModes && prefs.avoidModes.length > 0) {
      if (itin.legs.some((l) => prefs.avoidModes!.includes(l.mode))) return false;
    }
    return true;
  });

  return filtered;
}

export function scoreItinerary(itin: Itinerary, prefs: Preferences): number {
  const normalizedTime = 1 / (1 + itin.totalTimeMin);
  const normalizedCost = 1 / (1 + itin.totalCostCents / 100);
  const comfort = itin.averageComfortScore; // already 0-1
  return (
    prefs.weightTime * normalizedTime +
    prefs.weightCost * normalizedCost +
    prefs.weightComfort * comfort
  );
}

export function rankItineraries(itineraries: Itinerary[], prefs: Preferences): Itinerary[] {
  return [...itineraries].sort((a, b) => scoreItinerary(b, prefs) - scoreItinerary(a, prefs));
}


