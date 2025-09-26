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

// ORS Profile mapping
const ORS_PROFILE_MAP: Record<DirectionsProfile, string> = {
  'foot': 'foot-walking',
  'cycling': 'cycling-road',
  'driving': 'driving-car'
};

export async function route(origin: LatLng, destination: LatLng, profile: DirectionsProfile = 'foot'): Promise<DirectionsRoute | null> {
  console.log(`Fetching route for ${profile}:`, { origin, destination });
  
  // Try ORS first if available
  const orsKey = useApiKeyStore.getState().openRouteServiceApiKey;
  if (orsKey) {
    try {
      console.log('Using ORS for routing...');
      return await routeWithORS(origin, destination, profile, orsKey);
    } catch (error) {
      console.warn('ORS routing failed, falling back to LocationIQ:', error);
    }
  }

  // Fallback to LocationIQ
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (!key) {
    console.log('No LocationIQ API key found');
    return null;
  }
  
  console.log('Using LocationIQ for routing...');
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://us1.locationiq.com/v1/directions/${profile}/route?key=${encodeURIComponent(key)}&overview=false&alternatives=false&steps=false&coordinates=${coords}`;
  console.log('LocationIQ URL:', url);
  
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  console.log('LocationIQ response status:', res.status);
  
  if (!res.ok) {
    console.log('LocationIQ request failed');
    return null;
  }
  
  const data = await res.json() as any;
  console.log('LocationIQ response data:', data);
  
  const r = data?.routes?.[0];
  if (!r) {
    console.log('No routes found in response');
    return null;
  }
  
  const result = {
    profile,
    legs: (r.legs ?? []).map((l: any) => ({ distanceMeters: l.distance, durationSeconds: l.duration })),
    distanceMeters: r.distance,
    durationSeconds: r.duration,
  };
  
  console.log('Route result:', result);
  return result;
}

async function routeWithORS(origin: LatLng, destination: LatLng, profile: DirectionsProfile, apiKey: string): Promise<DirectionsRoute | null> {
  const orsProfile = ORS_PROFILE_MAP[profile];
  const coordinates = [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude]
  ];

  const url = `https://api.openrouteservice.org/v2/directions/${orsProfile}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates,
      format: 'json',
      instructions: false,
      geometry: false,
      elevation: false,
      extra_info: [],
      options: {}
    })
  });

  if (!response.ok) {
    throw new Error(`ORS API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const route = data?.routes?.[0];
  if (!route) return null;

  return {
    profile,
    legs: [{
      distanceMeters: route.summary.distance,
      durationSeconds: route.summary.duration
    }],
    distanceMeters: route.summary.distance,
    durationSeconds: route.summary.duration,
  };
}


