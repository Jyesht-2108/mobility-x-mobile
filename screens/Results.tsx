import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useResultsStore } from '@/store/results';
import ItineraryCard from '@/components/ItineraryCard';

export default function ResultsScreen() {
  const { results } = useResultsStore();
  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Saved Results</Text>
      <View style={{ width: '90%', gap: 12 }}>
        {results.map((it) => (
          <ItineraryCard key={it.id} itinerary={it} />
        ))}
      </View>
    </ScrollView>
  );
}


