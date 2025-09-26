import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import PlannerForm from '@/components/PlannerForm';
import { planItineraries, rankItineraries } from '@/services/routing';
import type { LatLng } from '@/types/domain';
import { usePreferencesStore } from '@/store/preferences';
import ItineraryCard from '@/components/ItineraryCard';

function geocodeMock(name: string): LatLng {
  // Simplified stable mock points
  const map: Record<string, LatLng> = {
    'City Center': { latitude: 40.7128, longitude: -74.0060 },
    'Airport': { latitude: 40.6413, longitude: -73.7781 },
    'Station': { latitude: 40.7506, longitude: -73.9935 },
  };
  return map[name] ?? map['City Center'];
}

export default function PlanScreen() {
  const { preferences } = usePreferencesStore();
  const [results, setResults] = useState([]);

  const onSubmit = async ({ origin, destination }: { origin: string; destination: string }) => {
    try {
      const originLoc = geocodeMock(origin);
      const destLoc = geocodeMock(destination);
      const options = await planItineraries(originLoc, destLoc, preferences);
      const ranked = rankItineraries(options, preferences);
      setResults(ranked as any);
    } catch (e: any) {
      Alert.alert('Planning failed', e?.message ?? 'Unknown error');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Plan a trip</Text>
      <PlannerForm onSubmit={onSubmit} />
      <View style={{ height: 1, backgroundColor: '#eee', width: '90%' }} />
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Results</Text>
      <View style={{ width: '90%', gap: 12 }}>
        {(results as any[]).map((it) => (
          <ItineraryCard key={it.id} itinerary={it} />
        ))}
      </View>
    </ScrollView>
  );
}


