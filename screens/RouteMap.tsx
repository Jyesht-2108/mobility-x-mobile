import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker, LatLng as RNLatLng } from 'react-native-maps';
import type { Itinerary, LatLng } from '@/types/domain';
import { getRouteSegments } from '@/services/google';

export default function RouteMapScreen({ route }: any) {
  const { itinerary } = route.params;
  const [segments, setSegments] = useState<{ coords: RNLatLng[]; color: string }[]>([]);
  const [ready, setReady] = useState(false);

  const origin: LatLng = itinerary.legs[0].from;
  const destination: LatLng = itinerary.legs[itinerary.legs.length - 1].to;

  useEffect(() => {
    (async () => {
      try {
        // For now, fetch per overall dominant mode; could refine per leg
        const dominant = itinerary.legs[0].mode;
        const mode = dominant === 'WALK' ? 'walking' : dominant === 'BIKE' ? 'bicycling' : dominant === 'RIDE_HAIL' ? 'driving' : 'transit';
        const segs = await getRouteSegments(origin, destination, mode as any);
        setSegments(segs.map((s) => ({ coords: s.coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })), color: s.color })));
      } catch (e: any) {
        Alert.alert('Map error', e?.message ?? 'Failed to load route');
      } finally {
        setReady(true);
      }
    })();
  }, [itinerary]);

  const initialRegion = {
    latitude: origin.latitude,
    longitude: origin.longitude,
    latitudeDelta: Math.abs(destination.latitude - origin.latitude) * 2 + 0.05,
    longitudeDelta: Math.abs(destination.longitude - origin.longitude) * 2 + 0.05,
  };

  return (
    <View style={{ flex: 1 }}>
      {!ready ? (
        <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <ActivityIndicator />
        </View>
      ) : null}
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        <Marker coordinate={{ latitude: origin.latitude, longitude: origin.longitude }} />
        <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }} />
        {segments.map((s, idx) => (
          <Polyline key={`seg-${idx}`} coordinates={s.coords} strokeColor={s.color} strokeWidth={5} />
        ))}
      </MapView>
    </View>
  );
}


