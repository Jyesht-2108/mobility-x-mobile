import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { charge, getWallet, topUp, type Transaction } from '@/services/payments';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<{ balanceCents: number; transactions: Transaction[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const w = await getWallet();
      setWallet({ balanceCents: w.balanceCents, transactions: w.transactions });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'credit') return <Ionicons name="add-circle" size={24} color="#22c55e" />;
    return <Ionicons name="remove-circle" size={24} color="#ef4444" />;
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
    >
      {/* Balance Card */}
      <View style={{ 
        margin: 16, 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        borderRadius: 20, 
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
      }}>
        <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>Current Balance</Text>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 8 }}>
          ₹{wallet ? (wallet.balanceCents / 100).toFixed(2) : '0.00'}
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            onPress={async () => {
              try {
                await topUp(1000, 'Card');
                await refresh();
                Alert.alert('Success', 'Added ₹10.00 to your wallet');
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Top-up failed');
              }
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.3)'
            }}
          >
            <Ionicons name="add" size={20} color="#22c55e" />
            <Text style={{ color: '#22c55e', fontWeight: '600', marginTop: 4 }}>Add ₹10</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={async () => {
              try {
                await topUp(5000, 'Card');
                await refresh();
                Alert.alert('Success', 'Added ₹50.00 to your wallet');
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Top-up failed');
              }
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <Ionicons name="card" size={20} color="#3b82f6" />
            <Text style={{ color: '#3b82f6', fontWeight: '600', marginTop: 4 }}>Add ₹50</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction History */}
      <View style={{ margin: 16, marginTop: 0 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Recent Transactions</Text>
        
        {wallet?.transactions.length === 0 ? (
          <View style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: 16, 
            padding: 24, 
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)'
          }}>
            <MaterialCommunityIcons name="receipt" size={48} color="#6b7280" />
            <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 16 }}>No transactions yet</Text>
            <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Your payment history will appear here</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {wallet?.transactions.slice(0, 10).map((tx) => (
              <View
                key={tx.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                {getTransactionIcon(tx.type)}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{tx.description}</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>{formatDate(tx.timestamp)}</Text>
                </View>
                <Text style={{ 
                  color: tx.type === 'credit' ? '#22c55e' : '#ef4444', 
                  fontWeight: '700', 
                  fontSize: 16 
                }}>
                  {tx.type === 'credit' ? '+' : '-'}₹{(tx.amountCents / 100).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}


