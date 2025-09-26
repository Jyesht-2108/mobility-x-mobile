import { differenceInMinutes } from 'date-fns';
import type { Itinerary, LatLng, Leg, Preferences, TransportMode } from '@/types/domain';
import { route as fetchRoute, type DirectionsProfile } from '@/services/directions';
import { googleAllModes } from '@/services/google';
import { llmGenerateItineraries } from '@/services/llm';

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
  // Ensure unique, stable-ish id by including modes and total cost/time
  const modesKey = legs.map((l) => l.mode).join('_');
  return {
    id: `itin-${legs[0].startTime}-${legs.length}-${modesKey}-${totalCostCents}-${Math.round(totalTimeMin)}`,
    legs,
    totalTimeMin,
    totalCostCents,
    averageComfortScore,
  };
}

export async function planItineraries(origin: LatLng, destination: LatLng, prefs: Preferences): Promise<Itinerary[]> {
  const now = new Date();
  // Query directions API for realistic options when possible
  const profiles: Array<{ profile: DirectionsProfile; mode: TransportMode; costCentsPerKm: number }> = [
    { profile: 'foot', mode: 'WALK', costCentsPerKm: 0 },
    { profile: 'cycling', mode: 'BIKE', costCentsPerKm: 0 },
    { profile: 'driving', mode: 'RIDE_HAIL', costCentsPerKm: 150 },
  ];

  const apiOptions: Itinerary[] = [];
  for (const p of profiles) {
    try {
      const r = await fetchRoute(origin, destination, p.profile);
      if (r) {
        const distanceKm = r.distanceMeters / 1000;
        const cost = Math.round(distanceKm * p.costCentsPerKm);
        const minutes = Math.max(1, Math.round(r.durationSeconds / 60));
        apiOptions.push(
          summarize([
            leg(origin, destination, minutes, p.mode, cost, now),
          ]),
        );
      }
    } catch {}
  }

  // Keep at least one transit-like mixed itinerary as placeholder
  const mixedOption = summarize([
    leg(origin, origin, 5, 'WALK', 0, now),
    leg(origin, destination, 22, 'METRO', 250, new Date(now.getTime() + 5 * 60_000)),
    leg(destination, destination, 8, 'WALK', 0, new Date(now.getTime() + 27 * 60_000)),
  ]);

  // Prefer Google results when available (real transit fares/durations)
  let googleOptions: Itinerary[] = [];
  try {
    googleOptions = await googleAllModes(origin, destination);
  } catch {}

  const options: Itinerary[] = [...googleOptions, ...apiOptions, mixedOption];

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

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const la1 = a.latitude * Math.PI / 180;
  const la2 = b.latitude * Math.PI / 180;
  const sinDlat = Math.sin(dLat/2);
  const sinDlon = Math.sin(dLon/2);
  const h = sinDlat*sinDlat + Math.cos(la1)*Math.cos(la2)*sinDlon*sinDlon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function planItinerariesWithLLM(origin: LatLng, destination: LatLng, originText: string, destinationText: string, prefs: Preferences, apiKey: string): Promise<Itinerary[]> {
  const now = new Date();
  const distanceKm = haversineKm(origin, destination);
  const gen = await llmGenerateItineraries({ originText, destinationText, distanceKm, prefs, apiKey, count: 4 });
  const items = (gen.itineraries || []).slice(0, 6);
  const plans: Itinerary[] = items.map((it, idx) => {
    let currentStart = now;
    const legs: Leg[] = [];
    for (const gl of it.legs) {
      const l = leg(legs.length === 0 ? origin : destination, destination, Math.max(1, Math.round(gl.minutes)), gl.mode as TransportMode, Math.max(0, Math.round(gl.costCents)), currentStart);
      legs.push(l);
      currentStart = new Date(l.endTime);
    }
    return summarize(legs);
  }).filter((it) => it.legs.length > 0);

  return rankItineraries(plans, prefs);
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


