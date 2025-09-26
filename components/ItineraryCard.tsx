import React from 'react';
import { View, Text } from 'react-native';
import type { Itinerary } from '@/types/domain';

type Props = {
  itinerary: Itinerary;
};

export default function ItineraryCard({ itinerary }: Props) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Total: {Math.round(itinerary.totalTimeMin)} min · ${(itinerary.totalCostCents / 100).toFixed(2)}</Text>
      <Text>Comfort: {Math.round(itinerary.averageComfortScore * 100)}%</Text>
      <Text>Legs: {itinerary.legs.map((l) => l.mode).join(' → ')}</Text>
    </View>
  );
}


