import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Alert, Button, ActivityIndicator, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isReranking, setIsReranking] = useState(false);
  const { openaiApiKey } = useApiKeyStore();
  const { setResults: setGlobalResults } = useResultsStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onSubmit = async ({ origin, destination, originCoords, destinationCoords }: { origin: string; destination: string; originCoords?: LatLng; destinationCoords?: LatLng }) => {
    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Planning trip:', { origin, destination, originCoords, destinationCoords });
      
      let originLoc: LatLng;
      let destLoc: LatLng;
      
      if (originCoords && destinationCoords) {
        // Use provided coordinates
        originLoc = originCoords;
        destLoc = destinationCoords;
        console.log('Using provided coordinates');
      } else {
        // Geocode the addresses
        console.log('Geocoding addresses...');
        try {
          const [o, d] = await Promise.all([geocodeOne(origin), geocodeOne(destination)]);
          console.log('Geocoding results:', { o, d });
          originLoc = o?.location ?? geocodeMock(origin);
          destLoc = d?.location ?? geocodeMock(destination);
          console.log('Geocoded locations:', { originLoc, destLoc });
        } catch (geocodeError) {
          console.error('Geocoding failed, using mock locations:', geocodeError);
          originLoc = geocodeMock(origin);
          destLoc = geocodeMock(destination);
          console.log('Using mock locations:', { originLoc, destLoc });
        }
      }
      
      console.log('Planning itineraries...');
      const options = openaiApiKey
        ? await planItinerariesWithLLM(originLoc, destLoc, origin, destination, preferences, openaiApiKey)
        : await planItineraries(originLoc, destLoc, preferences);
      
      console.log('Generated options:', options.length);
      const ranked = rankItineraries(options, preferences);
      console.log('Ranked options:', ranked.length);
      console.log('Setting results state with:', ranked);
      
      setResults(ranked as any);
      setGlobalResults(ranked as any);
      
      // Reset animation and then animate results appearance
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
    } catch (e: any) {
      console.error('Planning error:', e);
      Alert.alert('Planning failed', e?.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const [aiRationale, setAiRationale] = useState<string>('');

  const onRerankWithAI = async () => {
    try {
      if (!openaiApiKey) {
        Alert.alert('Missing API Key', 'Set your OpenAI API key in Profile');
        return;
      }
      setIsReranking(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const recs = await llmRerank(results as any, preferences, openaiApiKey);
      if (!recs.length) return;
      const map = new Map(recs.map((r) => [r.id, r]));
      const sorted = [...results].sort((a, b) => (map.get(b.id)?.score ?? 0) - (map.get(a.id)?.score ?? 0));
      setResults(sorted);
      setAiRationale(recs[0]?.fullRationale || '');
      
      // Animate AI rationale appearance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (e: any) {
      Alert.alert('LLM rerank failed', e?.message ?? 'Error');
    } finally {
      setIsReranking(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Plan a trip</Text>
      <PlannerForm onSubmit={onSubmit} />
      <View style={{ height: 1, backgroundColor: '#eee', width: '90%' }} />
      <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Results</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isReranking && <ActivityIndicator size="small" color="#3b82f6" />}
          <Button 
            title={isReranking ? "Reranking..." : "Rerank with AI"} 
            onPress={onRerankWithAI}
            disabled={isReranking || results.length === 0}
          />
        </View>
      </View>
      {aiRationale ? (
        <Animated.View style={{ 
          width: '90%', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: 12, 
          padding: 16, 
          borderWidth: 1, 
          borderColor: 'rgba(59, 130, 246, 0.2)',
          marginBottom: 8,
          opacity: fadeAnim
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e40af', marginBottom: 8 }}>AI Rationale:</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>{aiRationale}</Text>
        </Animated.View>
      ) : null}

      {isLoading ? (
        <View style={{ width: '90%', alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>Planning your journey...</Text>
        </View>
      ) : (
        <Animated.View style={{ width: '90%', gap: 12, opacity: fadeAnim }}>
          {(() => {
            console.log('Rendering results:', results.length, results);
            return null;
          })()}
          {(results as any[]).map((it) => (
            <ItineraryCard key={it.id} itinerary={it} allItineraries={results} />
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}


