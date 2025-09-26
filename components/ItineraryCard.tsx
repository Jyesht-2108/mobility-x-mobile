import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { Itinerary } from '@/types/domain';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { processPayment } from '@/services/payments';
import { useApiKeyStore } from '@/store/apiKey';
import { llmPredictCost } from '@/services/llm';
import { usePreferencesStore } from '@/store/preferences';
import PaymentModal from './PaymentModal';

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
  allItineraries?: Itinerary[];
};

export default function ItineraryCard({ itinerary, allItineraries = [] }: Props) {
  const navigation = useNavigation<any>();
  const { openaiApiKey } = useApiKeyStore();
  const { learnFromSelection } = usePreferencesStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictedCost, setPredictedCost] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const comfortPct = itinerary.averageComfortScore;
  const pctText = Math.round(comfortPct * 100);

  const handlePaymentSuccess = async () => {
    // AI Learning from user selection
    if (allItineraries.length > 0) {
      try {
        const message = await learnFromSelection(itinerary, allItineraries);
        Alert.alert('AI Update', message);
      } catch (error) {
        console.log('AI learning failed:', error);
      }
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Wallet');
  };

  const handleCardPress = () => {
    // Ripple effect animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('RouteMap', { itinerary });
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
    <Animated.View style={{ 
      borderWidth: 1, 
      borderColor: '#e5e7eb', 
      borderRadius: 12, 
      padding: 14, 
      gap: 10, 
      backgroundColor: '#fff', 
      shadowColor: '#000', 
      shadowOpacity: 0.05, 
      shadowRadius: 6,
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
      elevation: 5
    }}>
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{Math.round(itinerary.totalTimeMin)} min</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
              ₹{(itinerary.totalCostCents / 100).toFixed(2)}
            </Text>
            {predictedCost && predictedCost !== itinerary.totalCostCents && (
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                AI: ₹{(predictedCost / 100).toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 9999, overflow: 'hidden' }}>
              <View style={{ width: `${pctText}%`, height: 8, backgroundColor: comfortColor(comfortPct) }} />
            </View>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600', minWidth: 60 }}>
              Comfort: {pctText}%
            </Text>
          </View>

          {/* Cost Breakdown */}
          <View style={{ backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, marginVertical: 4 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 }}>Fare Breakdown:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {itinerary.legs.map((l, idx) => {
                if (l.costCents === 0) return null;
                return (
                  <View key={`${itinerary.id}-cost-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {renderModeIcon(l.mode)}
                    <Text style={{ fontSize: 11, color: '#374151' }}>
                      {l.mode === 'METRO' ? 'BMRCL' : l.mode === 'BUS' ? 'BMTC' : l.mode}: ₹{(l.costCents / 100).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
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
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowPaymentModal(true);
        }}
        style={{
          backgroundColor: '#3b82f6',
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
          Book & Pay ₹{(itinerary.totalCostCents / 100).toFixed(2)}
        </Text>
      </TouchableOpacity>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        itinerary={itinerary}
        onSuccess={handlePaymentSuccess}
      />
    </Animated.View>
  );
}


