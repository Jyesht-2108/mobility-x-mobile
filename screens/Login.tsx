import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen({ navigation }: any) {
  const { login, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => { void hydrate(); }, [hydrate]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, backgroundColor: '#0f172a' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Welcome back</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={{ backgroundColor: '#fff', width: '90%', borderRadius: 10, padding: 12 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ backgroundColor: '#fff', width: '90%', borderRadius: 10, padding: 12 }} />
      <Button title="Login" onPress={async () => { try { await login(email.trim(), password); } catch (e: any) { Alert.alert('Login failed', e?.message ?? 'Error'); } }} />
      <TouchableOpacity onPress={() => navigation.replace('Signup')}>
        <Text style={{ color: '#93c5fd', marginTop: 8 }}>No account? Create one</Text>
      </TouchableOpacity>
    </View>
  );
}


