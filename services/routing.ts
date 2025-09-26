import { differenceInMinutes } from 'date-fns';
import type { Itinerary, LatLng, Leg, Preferences, TransportMode } from '@/types/domain';
import { route as fetchRoute, type DirectionsProfile } from '@/services/directions';
import { googleAllModes } from '@/services/google';
import { llmGenerateItineraries } from '@/services/llm';
import { calculateFare } from '@/services/fareCalculator';

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

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

function legWithRealisticFare(from: LatLng, to: LatLng, minutes: number, mode: TransportMode, start: Date, isACBus: boolean = false): Leg {
  const end = new Date(start.getTime() + minutes * 60_000);
  const distanceKm = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  const fare = calculateFare(mode, distanceKm, isACBus);
  const costCents = Math.round(fare.finalFare * 100);
  
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
  // Add a random suffix to avoid duplicate IDs when time/cost match
  const uniq = Math.random().toString(36).slice(2, 6);
  return {
    id: `itin-${legs[0].startTime}-${legs.length}-${modesKey}-${totalCostCents}-${Math.round(totalTimeMin)}-${uniq}`,
    legs,
    totalTimeMin,
    totalCostCents,
    averageComfortScore,
  };
}

export async function planItineraries(origin: LatLng, destination: LatLng, prefs: Preferences): Promise<Itinerary[]> {
  console.log('planItineraries called with:', { origin, destination, prefs });
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
      console.log(`Fetching route for ${p.mode}...`);
      const r = await fetchRoute(origin, destination, p.profile);
      if (r) {
        const distanceKm = r.distanceMeters / 1000;
        const cost = Math.round(distanceKm * p.costCentsPerKm);
        const minutes = Math.max(1, Math.round(r.durationSeconds / 60));
        const newItinerary = summarize([
          leg(origin, destination, minutes, p.mode, cost, now),
        ]);
        apiOptions.push(newItinerary);
        console.log(`Added ${p.mode} itinerary:`, newItinerary);
      } else {
        console.log(`No route found for ${p.mode}`);
      }
    } catch (error) {
      console.log(`Error fetching ${p.mode} route:`, error);
    }
  }

  // Create realistic mixed itinerary with ORS data for walking legs
  let walkToStation: Leg | null = null;
  let walkFromStation: Leg | null = null;
  
  try {
    // Get realistic walk times to/from a hypothetical station
    const stationOffset = 0.01; // ~1km offset for station location
    const walkToStationCoords = { 
      latitude: origin.latitude + stationOffset, 
      longitude: origin.longitude + stationOffset 
    };
    const walkFromStationCoords = { 
      latitude: destination.latitude - stationOffset, 
      longitude: destination.longitude - stationOffset 
    };
    
    const walkToRoute = await fetchRoute(origin, walkToStationCoords, 'foot');
    const walkFromRoute = await fetchRoute(walkFromStationCoords, destination, 'foot');
    
    if (walkToRoute) {
      const walkToMinutes = Math.max(1, Math.round(walkToRoute.durationSeconds / 60));
      walkToStation = leg(origin, walkToStationCoords, walkToMinutes, 'WALK', 0, now);
    }
    
    if (walkFromRoute) {
      const walkFromMinutes = Math.max(1, Math.round(walkFromRoute.durationSeconds / 60));
      const walkFromStart = new Date(now.getTime() + (walkToStation ? walkToStation.endTime - walkToStation.startTime : 0) + 22 * 60_000); // 22 min metro
      walkFromStation = leg(walkFromStationCoords, destination, walkFromMinutes, 'WALK', 0, walkFromStart);
    }
  } catch (error) {
    console.warn('Failed to get ORS data for walking legs, using fallback:', error);
  }

  // Fallback to mock data if ORS failed
  if (!walkToStation) {
    walkToStation = legWithRealisticFare(origin, origin, 5, 'WALK', now);
  }
  if (!walkFromStation) {
    const walkFromStart = new Date(now.getTime() + (walkToStation.endTime - walkToStation.startTime) + 22 * 60_000);
    walkFromStation = legWithRealisticFare(destination, destination, 8, 'WALK', walkFromStart);
  }

  // Create metro leg with realistic fare based on distance
  const metroStart = new Date(walkToStation.endTime);
  const metroLeg = legWithRealisticFare(walkToStation.to, walkFromStation.from, 22, 'METRO', metroStart);

  const mixedOption = summarize([
    walkToStation,
    metroLeg,
    walkFromStation,
  ]);

  // Prefer Google results when available (real transit fares/durations)
  let googleOptions: Itinerary[] = [];
  try {
    googleOptions = await googleAllModes(origin, destination);
  } catch {}

  const options: Itinerary[] = [...googleOptions, ...apiOptions, mixedOption];
  console.log('Total options before filtering:', options.length);
  console.log('Google options:', googleOptions.length);
  console.log('API options:', apiOptions.length);
  console.log('Mixed option:', mixedOption);

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

  console.log('Filtered options:', filtered.length);
  
  // Ensure we always return at least one option
  if (filtered.length === 0) {
    console.log('No options after filtering, creating fallback option');
    const fallbackOption = summarize([
      legWithRealisticFare(origin, destination, 30, 'WALK', now),
    ]);
    return [fallbackOption];
  }
  
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
  
  const plans: Itinerary[] = [];
  for (const it of items) {
    let currentStart = now;
    const legs: Leg[] = [];
    
    for (const gl of it.legs) {
      let legOrigin = legs.length === 0 ? origin : legs[legs.length - 1].to;
      let legDestination = destination;
      
      // For multi-leg trips, create intermediate waypoints
      if (it.legs.length > 1 && gl !== it.legs[it.legs.length - 1]) {
        const progress = it.legs.indexOf(gl) / (it.legs.length - 1);
        legDestination = {
          latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
          longitude: origin.longitude + (destination.longitude - origin.longitude) * progress
        };
      }
      
      let minutes = Number.isFinite(gl.minutes) ? Math.max(1, Math.round(gl.minutes)) : NaN as any;
      
      // Use ORS for realistic walk/cycle/drive data
      if (['WALK', 'BIKE', 'RIDE_HAIL'].includes(gl.mode)) {
        try {
          const profile = gl.mode === 'WALK' ? 'foot' : gl.mode === 'BIKE' ? 'cycling' : 'driving';
          const route = await fetchRoute(legOrigin, legDestination, profile);
          if (route) {
            minutes = Math.max(1, Math.round(route.durationSeconds / 60));
          }
        } catch (error) {
          console.warn(`Failed to get ORS data for ${gl.mode} leg:`, error);
        }
      }
      // Fallback duration estimate if minutes is NaN or invalid
      if (!Number.isFinite(minutes)) {
        const distKm = calculateDistance(legOrigin.latitude, legOrigin.longitude, legDestination.latitude, legDestination.longitude);
        const speedKmph = (
          gl.mode === 'WALK' ? 4.5 :
          gl.mode === 'BIKE' ? 16 :
          gl.mode === 'BUS' ? 18 :
          gl.mode === 'METRO' ? 32 :
          gl.mode === 'RIDE_HAIL' ? 25 :
          10
        );
        minutes = Math.max(1, Math.round((distKm / speedKmph) * 60));
      }
      
      // Use realistic fare calculation instead of LLM cost
      const l = legWithRealisticFare(legOrigin, legDestination, minutes, gl.mode as TransportMode, currentStart);
      legs.push(l);
      currentStart = new Date(l.endTime);
    }
    
    if (legs.length > 0) {
      plans.push(summarize(legs));
    }
  }

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


