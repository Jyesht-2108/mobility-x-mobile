import type { LatLng, Place } from '@/types/domain';
import { useApiKeyStore } from '@/store/apiKey';

export type GeocodeResult = Place & { displayName?: string };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const LOCATIONIQ_URL = 'https://us1.locationiq.com/v1/search';

export async function geocode(query: string, limit = 5): Promise<GeocodeResult[]> {
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (key) {
    const url = `${LOCATIONIQ_URL}.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as any[];
      return data.map((item) => ({
        name: item.display_name as string,
        displayName: item.display_name as string,
        location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
      }));
    }
  }
  // Fallback to Nominatim
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'multimodal-mobility-demo/1.0 (expo)'
    },
  });
  if (!res.ok) throw new Error(`Geocoder error: ${res.status}`);
  const data = (await res.json()) as any[];
  return data.map((item) => ({
    name: item.display_name as string,
    displayName: item.display_name as string,
    location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
  }));
}

export async function geocodeOne(query: string): Promise<GeocodeResult | null> {
  const results = await geocode(query, 1);
  return results[0] ?? null;
}

export async function autocomplete(query: string, limit = 5): Promise<GeocodeResult[]> {
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (key) {
    const url = `${LOCATIONIQ_URL}.php?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&limit=${limit}`.replace('/v1/search', '/v1/autocomplete');
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as any[];
      return data.map((item) => ({
        name: item.display_place ? `${item.display_place}, ${item.display_address}` : item.display_name,
        displayName: item.display_name as string,
        location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
      }));
    }
  }
  // Basic fallback via Nominatim search as pseudo-autocomplete
  return geocode(query, limit);
}

export async function reverse(location: LatLng): Promise<GeocodeResult | null> {
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (key) {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${encodeURIComponent(key)}&lat=${location.latitude}&lon=${location.longitude}&format=json`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json() as any;
      return {
        name: data.display_name as string,
        displayName: data.display_name as string,
        location,
      };
    }
  }
  // Fallback to Nominatim
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'multimodal-mobility-demo/1.0 (expo)' } });
  if (!res.ok) return null;
  const data = await res.json() as any;
  return {
    name: data.display_name as string,
    displayName: data.display_name as string,
    location,
  };
}


