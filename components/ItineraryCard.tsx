import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Itinerary } from '@/types/domain';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { processPayment } from '@/services/payments';
import { useApiKeyStore } from '@/store/apiKey';
import { llmPredictCost } from '@/services/llm';

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
  const { openaiApiKey } = useApiKeyStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictedCost, setPredictedCost] = useState<number | null>(null);
  
  const comfortPct = itinerary.averageComfortScore;
  const pctText = Math.round(comfortPct * 100);

  const handlePayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const cost = predictedCost || itinerary.totalCostCents;
      const result = await processPayment(
        itinerary.id,
        cost,
        `Trip: ${itinerary.legs.map(l => l.mode).join(' + ')}`
      );
      
      if (result.success) {
        Alert.alert('Payment Successful', `Paid $${(cost / 100).toFixed(2)} for your trip!`);
        navigation.navigate('Wallet');
      } else {
        Alert.alert('Payment Failed', result.error || 'Insufficient balance');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const predictCost = async () => {
    if (!openaiApiKey || predictedCost) return;
    
    try {
      const origin = `${itinerary.legs[0].from.latitude},${itinerary.legs[0].from.longitude}`;
      const destination = `${itinerary.legs[itinerary.legs.length - 1].to.latitude},${itinerary.legs[itinerary.legs.length - 1].to.longitude}`;
      const modes = itinerary.legs.map(l => l.mode).join(' + ');
      
      const cost = await llmPredictCost({
        originText: origin,
        destinationText: destination,
        distanceKm: 5, // Approximate
        mode: modes,
        apiKey: openaiApiKey
      });
      
      setPredictedCost(cost);
    } catch (error) {
      console.log('Cost prediction failed:', error);
    }
  };

  React.useEffect(() => {
    if (openaiApiKey) {
      predictCost();
    }
  }, [openaiApiKey]);

  return (
    <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('RouteMap', { itinerary })}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{Math.round(itinerary.totalTimeMin)} min</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
              ${(itinerary.totalCostCents / 100).toFixed(2)}
            </Text>
            {predictedCost && predictedCost !== itinerary.totalCostCents && (
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                AI: ${(predictedCost / 100).toFixed(2)}
              </Text>
            )}
          </View>
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

      <TouchableOpacity
        onPress={handlePayment}
        disabled={isProcessing}
        style={{
          backgroundColor: isProcessing ? '#9ca3af' : '#3b82f6',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <Ionicons name="card" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


