import type { Itinerary, LatLng, Leg, TransportMode } from '@/types/domain';
import { useApiKeyStore } from '@/store/apiKey';

type GoogleLeg = {
  distance: { value: number };
  duration: { value: number };
  steps?: any[];
};

type GoogleRoute = {
  legs: GoogleLeg[];
  fare?: { value: number; currency: string };
  overview_polyline?: { points: string };
};

type Mode = 'driving' | 'walking' | 'bicycling' | 'transit';

function toMode(mode: Mode): TransportMode {
  switch (mode) {
    case 'walking': return 'WALK';
    case 'bicycling': return 'BIKE';
    case 'driving': return 'RIDE_HAIL';
    case 'transit': return 'BUS';
    default: return 'WALK';
  }
}

function comfortFor(mode: TransportMode): number {
  switch (mode) {
    case 'WALK': return 0.6;
    case 'BIKE': return 0.7;
    case 'BUS': return 0.6;
    case 'METRO': return 0.7;
    case 'RAIL': return 0.75;
    case 'RIDE_HAIL': return 0.85;
    default: return 0.6;
  }
}

export async function googleDirections(origin: LatLng, destination: LatLng, mode: Mode): Promise<Itinerary | null> {
  const key = useApiKeyStore.getState().googleMapsApiKey;
  if (!key) {
    console.log('No Google Maps API key for directions');
    return null;
  }
  
  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&mode=${mode}&alternatives=false&departure_time=now&key=${encodeURIComponent(key)}`;
  console.log(`Google Directions URL for ${mode}:`, url);
  
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  console.log(`Google Directions response status for ${mode}:`, res.status);
  
  if (!res.ok) {
    console.log(`Google Directions request failed for ${mode}:`, res.status);
    return null;
  }
  
  const data = await res.json();
  console.log(`Google Directions response for ${mode}:`, data);
  
  const r: GoogleRoute | undefined = data?.routes?.[0];
  if (!r) {
    console.log(`No routes found in Google response for ${mode}`);
    return null;
  }

  const totalDurationSec = r.legs?.reduce((s: number, l: GoogleLeg) => s + (l.duration?.value ?? 0), 0) ?? 0;
  const totalMinutes = Math.max(1, Math.round(totalDurationSec / 60));
  const fareCents = r.fare ? Math.round((r.fare.value ?? 0) * 100) : 0;
  const m = toMode(mode);
  const now = new Date();
  const leg: Leg = {
    id: `${m}-${now.getTime()}`,
    mode: m,
    from: origin,
    to: destination,
    startTime: now.getTime(),
    endTime: new Date(now.getTime() + totalMinutes * 60_000).getTime(),
    costCents: fareCents,
    comfortScore: comfortFor(m),
  };
  return {
    id: `g-${m}-${now.getTime()}`,
    legs: [leg],
    totalTimeMin: totalMinutes,
    totalCostCents: fareCents,
    averageComfortScore: leg.comfortScore,
  };
}

export async function googleAllModes(origin: LatLng, destination: LatLng): Promise<Itinerary[]> {
  console.log('Google All Modes called with:', { origin, destination });
  const key = useApiKeyStore.getState().googleMapsApiKey;
  if (!key) {
    console.log('No Google Maps API key found');
    return [];
  }
  
  const modes: Mode[] = ['transit', 'walking', 'bicycling', 'driving'];
  const results: Itinerary[] = [];
  for (const m of modes) {
    try {
      console.log(`Fetching Google directions for ${m}...`);
      const it = await googleDirections(origin, destination, m);
      if (it) {
        results.push(it);
        console.log(`Added Google ${m} itinerary:`, it);
      } else {
        console.log(`No Google ${m} route found`);
      }
    } catch (error) {
      console.log(`Error fetching Google ${m} route:`, error);
    }
  }
  console.log('Google All Modes results:', results.length);
  return results;
}

// --- Mapping helpers ---

function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const path: LatLng[] = [];
  while (index < len) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    path.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return path;
}

export type RouteSegment = { coords: LatLng[]; mode: TransportMode; color: string };

export async function getRouteSegments(origin: LatLng, destination: LatLng, mode: Mode): Promise<RouteSegment[]> {
  const key = useApiKeyStore.getState().googleMapsApiKey;
  if (!key) return [];
  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&mode=${mode}&alternatives=false&departure_time=now&key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const data = await res.json();
  const route: GoogleRoute | undefined = data?.routes?.[0];
  if (!route) return [];
  const steps: any[] = route.legs?.[0]?.steps ?? [];
  const segments: RouteSegment[] = [];
  for (const s of steps) {
    const poly = s?.polyline?.points as string | undefined;
    if (!poly) continue;
    const travelMode: string = (s.travel_mode || '').toLowerCase();
    const tm: TransportMode = travelMode === 'walking' ? 'WALK'
      : travelMode === 'bicycling' ? 'BIKE'
      : travelMode === 'driving' ? 'RIDE_HAIL'
      : travelMode === 'transit' ? 'BUS'
      : toMode(mode);
    const color = tm === 'WALK' ? '#10b981' : tm === 'BIKE' ? '#3b82f6' : tm === 'RIDE_HAIL' ? '#ef4444' : '#f59e0b';
    segments.push({ coords: decodePolyline(poly), mode: tm, color });
  }
  // Fallback to overview polyline
  if (segments.length === 0 && route.overview_polyline?.points) {
    segments.push({ coords: decodePolyline(route.overview_polyline.points), mode: toMode(mode), color: '#6366f1' });
  }
  return segments;
}


