import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Itinerary } from '@/types/domain';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

function renderModeIcon(mode: string) {
  const size = 18;
  const color = '#1f2937';
  switch (mode) {
    case 'WALK':
      return <Ionicons name="walk" size={size} color={color} />;
    case 'BUS':
      return <FontAwesome name="bus" size={size} color={color} />;
    case 'METRO':
      return <MaterialCommunityIcons name="subway-variant" size={size} color={color} />;
    case 'RAIL':
      return <FontAwesome name="train" size={size} color={color} />;
    case 'BIKE':
      return <FontAwesome name="bicycle" size={size} color={color} />;
    case 'RIDE_HAIL':
      return <FontAwesome name="car" size={size} color={color} />;
    default:
      return <MaterialCommunityIcons name="chevron-right" size={size} color={color} />;
  }
}

function comfortColor(pct: number) {
  if (pct >= 0.75) return '#22c55e'; // green
  if (pct >= 0.5) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

type Props = {
  itinerary: Itinerary;
};

export default function ItineraryCard({ itinerary }: Props) {
  const navigation = useNavigation<any>();
  const comfortPct = itinerary.averageComfortScore;
  const pctText = Math.round(comfortPct * 100);
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('RouteMap', { itinerary })}
      activeOpacity={0.8}
      style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{Math.round(itinerary.totalTimeMin)} min</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>${(itinerary.totalCostCents / 100).toFixed(2)}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 9999, overflow: 'hidden' }}>
          <View style={{ width: `${pctText}%`, height: 8, backgroundColor: comfortColor(comfortPct) }} />
        </View>
        <Text style={{ fontSize: 12, color: '#374151' }}>Comfort: {pctText}%</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {itinerary.legs.map((l, idx) => (
          <View key={`${itinerary.id}-leg-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderModeIcon(l.mode)}
            {idx < itinerary.legs.length - 1 ? (
              <MaterialCommunityIcons name="chevron-right" size={16} color="#9ca3af" style={{ marginHorizontal: 4 }} />
            ) : null}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}


