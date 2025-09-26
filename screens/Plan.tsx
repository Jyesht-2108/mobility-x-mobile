import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Button } from 'react-native';
import PlannerForm from '@/components/PlannerForm';
import { planItineraries, rankItineraries, planItinerariesWithLLM } from '@/services/routing';
import type { LatLng } from '@/types/domain';
import { usePreferencesStore } from '@/store/preferences';
import ItineraryCard from '@/components/ItineraryCard';
import { useResultsStore } from '@/store/results';
import { useApiKeyStore } from '@/store/apiKey';
import { llmRerank } from '@/services/llm';
import { geocodeOne } from '@/services/geocoder';

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
  const [results, setResults] = useState<any[]>([]);
  const { openaiApiKey } = useApiKeyStore();
  const { setResults: setGlobalResults } = useResultsStore();

  const onSubmit = async ({ origin, destination, originCoords, destinationCoords }: { origin: string; destination: string; originCoords?: LatLng; destinationCoords?: LatLng }) => {
    try {
      const [o, d] = originCoords && destinationCoords
        ? [null, null]
        : await Promise.all([geocodeOne(origin), geocodeOne(destination)]);
      const originLoc = originCoords ?? (o?.location ?? geocodeMock(origin));
      const destLoc = destinationCoords ?? (d?.location ?? geocodeMock(destination));
      const options = openaiApiKey
        ? await planItinerariesWithLLM(originLoc, destLoc, origin, destination, preferences, openaiApiKey)
        : await planItineraries(originLoc, destLoc, preferences);
      const ranked = rankItineraries(options, preferences);
      setResults(ranked as any);
      setGlobalResults(ranked as any);
    } catch (e: any) {
      Alert.alert('Planning failed', e?.message ?? 'Unknown error');
    }
  };

  const onRerankWithAI = async () => {
    try {
      if (!openaiApiKey) {
        Alert.alert('Missing API Key', 'Set your OpenAI API key in Profile');
        return;
      }
      const recs = await llmRerank(results as any, preferences, openaiApiKey);
      if (!recs.length) return;
      const map = new Map(recs.map((r) => [r.id, r]));
      const sorted = [...results].sort((a, b) => (map.get(b.id)?.score ?? 0) - (map.get(a.id)?.score ?? 0));
      setResults(sorted);
    } catch (e: any) {
      Alert.alert('LLM rerank failed', e?.message ?? 'Error');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Plan a trip</Text>
      <PlannerForm onSubmit={onSubmit} />
      <View style={{ height: 1, backgroundColor: '#eee', width: '90%' }} />
      <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Results</Text>
        <Button title="Rerank with AI" onPress={onRerankWithAI} />
      </View>
      <View style={{ width: '90%', gap: 12 }}>
        {(results as any[]).map((it) => (
          <ItineraryCard key={it.id} itinerary={it} />
        ))}
      </View>
    </ScrollView>
  );
}


