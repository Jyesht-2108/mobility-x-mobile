import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import { useApiKeyStore } from '@/store/apiKey';
import { ensureDidKey, getDidDocument } from '@/services/did';

export default function ProfileScreen() {
  const { openaiApiKey, setOpenaiApiKey, locationiqApiKey, setLocationiqApiKey, googleMapsApiKey, setGoogleMapsApiKey, openRouteServiceApiKey, setOpenRouteServiceApiKey, hydrate } = useApiKeyStore();
  const [localKey, setLocalKey] = useState('');
  const [geoKey, setGeoKey] = useState('');
  const [gKey, setGKey] = useState('');
  const [orsKey, setOrsKey] = useState('');
  const [did, setDid] = useState('');
  const [didDoc, setDidDoc] = useState<any>(null);

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

  useEffect(() => {
    setOrsKey(openRouteServiceApiKey ?? '');
  }, [openRouteServiceApiKey]);

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
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

      <Text style={{ marginTop: 16, fontWeight: '600' }}>OpenRouteService API Key (for realistic walk/cycle/drive data)</Text>
      <TextInput
        value={orsKey}
        onChangeText={setOrsKey}
        placeholder="OpenRouteService Key"
        autoCapitalize="none"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, width: '90%' }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Save" onPress={async () => { await setOpenRouteServiceApiKey(orsKey.trim()); Alert.alert('Saved'); }} />
        <Button title="Clear" onPress={async () => { await setOpenRouteServiceApiKey(null); setOrsKey(''); }} />
      </View>

      {/* DID Section */}
      <View style={{ marginTop: 24, width: '90%', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Decentralized Identity (DID)</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Button title="Generate DID" onPress={async () => {
            try {
              const res = await ensureDidKey();
              setDid(res.did);
              Alert.alert('DID Created', res.did);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to create DID');
            }
          }} />
          <Button title="View DID Document" onPress={async () => {
            try {
              const doc = await getDidDocument();
              setDid(doc.id);
              setDidDoc(doc);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to fetch DID document');
            }
          }} />
        </View>
        {did ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>Your DID</Text>
            <Text selectable>{did}</Text>
          </View>
        ) : null}
        {didDoc ? (
          <View>
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>DID Document</Text>
            <Text selectable style={{ fontSize: 12 }}>{JSON.stringify(didDoc, null, 2)}</Text>
          </View>
        ) : null}
      </View>

    </ScrollView>
  );
}


