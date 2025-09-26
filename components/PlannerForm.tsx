import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Switch } from 'react-native';
import { usePreferencesStore } from '@/store/preferences';

type Props = {
  onSubmit: (data: { origin: string; destination: string }) => void;
};

export default function PlannerForm({ onSubmit }: Props) {
  const { preferences, setPreferences, hydrate } = usePreferencesStore();
  const [origin, setOrigin] = useState('City Center');
  const [destination, setDestination] = useState('Airport');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View style={{ gap: 12, width: '90%' }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Trip</Text>
      <TextInput value={origin} onChangeText={setOrigin} placeholder="Origin" style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
      <TextInput value={destination} onChangeText={setDestination} placeholder="Destination" style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />

      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 8 }}>Preferences</Text>
      <Text>Weights (time/cost/comfort): {preferences.weightTime}/{preferences.weightCost}/{preferences.weightComfort}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text>Avoid Ride-hail</Text>
        <Switch
          value={preferences.avoidModes?.includes('RIDE_HAIL') ?? false}
          onValueChange={(v) => {
            const modes = new Set(preferences.avoidModes);
            if (v) modes.add('RIDE_HAIL'); else modes.delete('RIDE_HAIL');
            setPreferences({ avoidModes: Array.from(modes) });
          }}
        />
      </View>

      <Button title="Plan Journey" onPress={() => onSubmit({ origin, destination })} />
    </View>
  );
}


