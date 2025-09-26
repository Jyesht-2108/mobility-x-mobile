import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { charge, getWallet, topUp } from '@/services/payments';

export default function WalletScreen() {
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = async () => {
    const w = await getWallet();
    setBalance(w.balanceCents);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Wallet</Text>
      <Text>Balance: {balance !== null ? `$${(balance / 100).toFixed(2)}` : 'Loading...'}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Top up $5" onPress={async () => { await topUp(500); await refresh(); }} />
        <Button title="Charge $2" onPress={async () => {
          try { await charge(200); await refresh(); } catch (e: any) { Alert.alert('Charge failed', e?.message ?? 'Error'); }
        }} />
      </View>
    </View>
  );
}


