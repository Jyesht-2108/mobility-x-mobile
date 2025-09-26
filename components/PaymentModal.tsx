import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Itinerary } from '@/types/domain';
import { getWallet, processPayment } from '@/services/payments';

type Props = {
  visible: boolean;
  onClose: () => void;
  itinerary: Itinerary | null;
  onSuccess: () => void;
};

export default function PaymentModal({ visible, onClose, itinerary, onSuccess }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState<{ balanceCents: number } | null>(null);

  React.useEffect(() => {
    if (visible && itinerary) {
      getWallet().then(w => setWallet(w));
    }
  }, [visible, itinerary]);

  const handlePayment = async () => {
    if (!itinerary || !wallet) return;
    
    setIsProcessing(true);
    try {
      const result = await processPayment(
        itinerary.id,
        itinerary.totalCostCents,
        `Trip: ${itinerary.legs.map(l => l.mode).join(' + ')}`
      );
      
      if (result.success) {
        Alert.alert(
          'Payment Successful!',
          'Digital Pass Generated!',
          [
            {
              text: 'View Pass',
              onPress: () => {
                onClose();
                onSuccess();
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Insufficient balance');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!itinerary) return null;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'WALK': return <Ionicons name="walk" size={20} color="#6b7280" />;
      case 'BUS': return <MaterialCommunityIcons name="bus" size={20} color="#3b82f6" />;
      case 'METRO': return <MaterialCommunityIcons name="subway-variant" size={20} color="#ef4444" />;
      case 'RAIL': return <MaterialCommunityIcons name="train" size={20} color="#10b981" />;
      case 'BIKE': return <Ionicons name="bicycle" size={20} color="#f59e0b" />;
      case 'RIDE_HAIL': return <Ionicons name="car" size={20} color="#8b5cf6" />;
      default: return <Ionicons name="ellipse" size={20} color="#6b7280" />;
    }
  };

  const getProviderName = (mode: string) => {
    switch (mode) {
      case 'BUS': return 'BEST';
      case 'METRO': return 'MMOPL';
      case 'RAIL': return 'Indian Railways';
      case 'RIDE_HAIL': return 'Uber/Ola';
      default: return 'Local';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Book & Pay</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Wallet Balance */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>Current Balance</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 }}>
            ₹{wallet ? (wallet.balanceCents / 100).toFixed(2) : '0.00'}
          </Text>
        </View>

        {/* Trip Summary */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Trip Summary</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
            {Math.round(itinerary.totalTimeMin)} min • ₹{(itinerary.totalCostCents / 100).toFixed(2)}
          </Text>
          
          {/* Cost Breakdown */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Cost Breakdown:</Text>
            {itinerary.legs.map((leg, idx) => (
              <View key={idx} style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 6
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {getModeIcon(leg.mode)}
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
                    {leg.mode} ({getProviderName(leg.mode)})
                  </Text>
                </View>
                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>
                  ₹{(leg.costCents / 100).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={isProcessing || !wallet || wallet.balanceCents < itinerary.totalCostCents}
          style={{
            backgroundColor: isProcessing || !wallet || wallet.balanceCents < itinerary.totalCostCents 
              ? '#6b7280' 
              : '#3b82f6',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20
          }}
        >
          <Ionicons name="card" size={24} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {isProcessing ? 'Processing...' : `Confirm Multi-Modal Payment - ₹${(itinerary.totalCostCents / 100).toFixed(2)}`}
          </Text>
        </TouchableOpacity>

        {/* Digital Pass Preview */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 16, 
          padding: 20, 
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Digital Pass Preview</Text>
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 12, 
            padding: 16, 
            alignItems: 'center',
            width: '100%'
          }}>
            <View style={{ 
              width: 120, 
              height: 120, 
              backgroundColor: '#f3f4f6', 
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="qrcode" size={60} color="#6b7280" />
            </View>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600' }}>
              QR Code will be generated after payment
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
