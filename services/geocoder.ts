import type { LatLng, Place } from '@/types/domain';
import { useApiKeyStore } from '@/store/apiKey';

export type GeocodeResult = Place & { displayName?: string };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const LOCATIONIQ_URL = 'https://us1.locationiq.com/v1/search';

export async function geocode(query: string, limit = 5): Promise<GeocodeResult[]> {
  console.log('Geocoding query:', query);
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (key) {
    try {
      const url = `${LOCATIONIQ_URL}.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&limit=${limit}`;
      console.log('LocationIQ geocoding URL:', url);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      console.log('LocationIQ geocoding response status:', res.status);
      if (res.ok) {
        const data = (await res.json()) as any[];
        console.log('LocationIQ geocoding results:', data.length);
        return data.map((item) => ({
          name: item.display_name as string,
          displayName: item.display_name as string,
          location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
        }));
      } else {
        console.warn('LocationIQ geocoding failed:', res.status);
      }
    } catch (error) {
      console.warn('LocationIQ geocoding error:', error);
    }
  } else {
    console.log('No LocationIQ API key, using Nominatim fallback');
  }
  
  // Fallback to Nominatim
  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=${limit}`;
    console.log('Nominatim geocoding URL:', url);
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'multimodal-mobility-demo/1.0 (expo)'
      },
    });
    console.log('Nominatim geocoding response status:', res.status);
    if (!res.ok) {
      console.error('Nominatim geocoding failed:', res.status);
      throw new Error(`Geocoder error: ${res.status}`);
    }
    const data = (await res.json()) as any[];
    console.log('Nominatim geocoding results:', data.length);
    return data.map((item) => ({
      name: item.display_name as string,
      displayName: item.display_name as string,
      location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
    }));
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    throw error;
  }
}

export async function geocodeOne(query: string): Promise<GeocodeResult | null> {
  const results = await geocode(query, 1);
  return results[0] ?? null;
}

export async function autocomplete(query: string, limit = 5): Promise<GeocodeResult[]> {
  const key = useApiKeyStore.getState().locationiqApiKey;
  if (key) {
    try {
      const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = (await res.json()) as any[];
        return data.map((item) => ({
          name: item.display_place ? `${item.display_place}, ${item.display_address}` : item.display_name,
          displayName: item.display_name as string,
          location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) } as LatLng,
        }));
      } else {
        console.warn(`LocationIQ autocomplete failed: ${res.status}`);
      }
    } catch (error) {
      console.warn('LocationIQ autocomplete error:', error);
    }
  } else {
    console.warn('No LocationIQ API key found, using fallback');
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


