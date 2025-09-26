import type { LatLng } from '@/types/domain';
import { useApiKeyStore } from '@/store/apiKey';

export type DirectionsProfile = 'driving' | 'cycling' | 'foot';

export type RouteLeg = {
  distanceMeters: number;
  durationSeconds: number;
  geometry?: string; // polyline or geojson depending on provider
};

export type DirectionsRoute = {
  profile: DirectionsProfile;
  legs: RouteLeg[];
  distanceMeters: number;
  durationSeconds: number;
};

export async function route(origin: LatLng, destination: LatLng, profile: DirectionsProfile = 'foot'): Promise<DirectionsRoute | null> {
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (!key) return null;
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://us1.locationiq.com/v1/directions/${profile}/route?key=${encodeURIComponent(key)}&overview=false&alternatives=false&steps=false&coordinates=${coords}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json() as any;
  const r = data?.routes?.[0];
  if (!r) return null;
  return {
    profile,
    legs: (r.legs ?? []).map((l: any) => ({ distanceMeters: l.distance, durationSeconds: l.duration })),
    distanceMeters: r.distance,
    durationSeconds: r.duration,
  };
}


