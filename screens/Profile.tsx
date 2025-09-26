import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useApiKeyStore } from '@/store/apiKey';

export default function ProfileScreen() {
  const { openaiApiKey, setOpenaiApiKey, locationiqApiKey, setLocationiqApiKey, googleMapsApiKey, setGoogleMapsApiKey, hydrate } = useApiKeyStore();
  const [localKey, setLocalKey] = useState('');
  const [geoKey, setGeoKey] = useState('');
  const [gKey, setGKey] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setLocalKey(openaiApiKey ?? '');
  }, [openaiApiKey]);

  useEffect(() => {
    setGeoKey(locationiqApiKey ?? '');
  }, [locationiqApiKey]);

  useEffect(() => {
    setGKey(googleMapsApiKey ?? '');
  }, [googleMapsApiKey]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Profile & API</Text>
      <TextInput
        value={localKey}
        onChangeText={setLocalKey}
        placeholder="OpenAI API Key"
        autoCapitalize="none"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, width: '90%' }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Save" onPress={async () => { await setOpenaiApiKey(localKey.trim()); Alert.alert('Saved'); }} />
        <Button title="Clear" onPress={async () => { await setOpenaiApiKey(null); setLocalKey(''); }} />
      </View>

      <Text style={{ marginTop: 16, fontWeight: '600' }}>LocationIQ API Key (optional)</Text>
      <TextInput
        value={geoKey}
        onChangeText={setGeoKey}
        placeholder="LocationIQ Key"
        autoCapitalize="none"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, width: '90%' }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Save" onPress={async () => { await setLocationiqApiKey(geoKey.trim()); Alert.alert('Saved'); }} />
        <Button title="Clear" onPress={async () => { await setLocationiqApiKey(null); setGeoKey(''); }} />
      </View>

      <Text style={{ marginTop: 16, fontWeight: '600' }}>Google Maps API Key (optional, for real transit)</Text>
      <TextInput
        value={gKey}
        onChangeText={setGKey}
        placeholder="Google Maps Key"
        autoCapitalize="none"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, width: '90%' }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Save" onPress={async () => { await setGoogleMapsApiKey(gKey.trim()); Alert.alert('Saved'); }} />
        <Button title="Clear" onPress={async () => { await setGoogleMapsApiKey(null); setGKey(''); }} />
      </View>
    </View>
  );
}


