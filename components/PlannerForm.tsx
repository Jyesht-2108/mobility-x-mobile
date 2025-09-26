import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Button, Switch, FlatList, TouchableOpacity } from 'react-native';
import VoiceSearch from '@/components/VoiceSearch';
import { autocomplete, geocodeOne } from '@/services/geocoder';
import { usePreferencesStore } from '@/store/preferences';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type Props = {
  onSubmit: (data: { origin: string; destination: string; originCoords?: { latitude: number; longitude: number }; destinationCoords?: { latitude: number; longitude: number } }) => void;
};

export default function PlannerForm({ onSubmit }: Props) {
  const { preferences, setPreferences, hydrate } = usePreferencesStore();
  const [origin, setOrigin] = useState('City Center');
  const [destination, setDestination] = useState('Airport');
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const originTimerRef = useRef<NodeJS.Timeout | null>(null);
  const destTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View style={{ gap: 12, width: '90%' }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Trip</Text>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="locate" size={18} color="#6b7280" />
        <TextInput
          value={origin}
          onChangeText={(t) => {
            setOrigin(t);
            setOriginCoords(undefined);
            if (originTimerRef.current) clearTimeout(originTimerRef.current);
            originTimerRef.current = setTimeout(async () => {
              if (t.length >= 3) {
                try { 
                  console.log('Fetching autocomplete for origin:', t);
                  const res = await autocomplete(t, 5); 
                  console.log('Origin autocomplete results:', res);
                  setOriginSuggestions(res); 
                } catch (error) { 
                  console.error('Origin autocomplete error:', error);
                  setOriginSuggestions([]); 
                }
              } else setOriginSuggestions([]);
            }, 250);
          }}
          placeholder="Origin"
          style={{ flex: 1 }}
        />
        {origin ? (
          <TouchableOpacity onPress={() => { setOrigin(''); setOriginCoords(undefined); setOriginSuggestions([]); }}>
            <MaterialIcons name="clear" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>
      {originSuggestions.length > 0 && (
        <FlatList
          data={originSuggestions}
          keyExtractor={(item, idx) => `${item.displayName}-${idx}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setOrigin(item.name); setOriginCoords(item.location); setOriginSuggestions([]); }}
              style={{ paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}
            >
              <Text numberOfLines={1}>{item.displayName || item.name}</Text>
            </TouchableOpacity>
          )}
          style={{ maxHeight: 150, borderWidth: 1, borderColor: '#eee', borderRadius: 8 }}
          scrollEnabled={false}
        />
      )}
      <VoiceSearch onResult={(t) => setOrigin(t)} />
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="flag" size={18} color="#6b7280" />
        <TextInput
          value={destination}
          onChangeText={(t) => {
            setDestination(t);
            setDestinationCoords(undefined);
            if (destTimerRef.current) clearTimeout(destTimerRef.current);
            destTimerRef.current = setTimeout(async () => {
              if (t.length >= 3) {
                try { 
                  console.log('Fetching autocomplete for destination:', t);
                  const res = await autocomplete(t, 5); 
                  console.log('Destination autocomplete results:', res);
                  setDestSuggestions(res); 
                } catch (error) { 
                  console.error('Destination autocomplete error:', error);
                  setDestSuggestions([]); 
                }
              } else setDestSuggestions([]);
            }, 250);
          }}
          placeholder="Destination"
          style={{ flex: 1 }}
        />
        {destination ? (
          <TouchableOpacity onPress={() => { setDestination(''); setDestinationCoords(undefined); setDestSuggestions([]); }}>
            <MaterialIcons name="clear" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>
      {destSuggestions.length > 0 && (
        <FlatList
          data={destSuggestions}
          keyExtractor={(item, idx) => `${item.displayName}-${idx}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setDestination(item.name); setDestinationCoords(item.location); setDestSuggestions([]); }}
              style={{ paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}
            >
              <Text numberOfLines={1}>{item.displayName || item.name}</Text>
            </TouchableOpacity>
          )}
          style={{ maxHeight: 150, borderWidth: 1, borderColor: '#eee', borderRadius: 8 }}
          scrollEnabled={false}
        />
      )}
      <VoiceSearch onResult={(t) => setDestination(t)} />

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

      <Button title="Plan Journey" onPress={() => onSubmit({ origin, destination, originCoords, destinationCoords })} />
    </View>
  );
}


