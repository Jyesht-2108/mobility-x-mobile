import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function SignupScreen({ navigation }: any) {
  const { signup, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => { void hydrate(); }, [hydrate]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, backgroundColor: '#0f172a' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Create account</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={{ backgroundColor: '#fff', width: '90%', borderRadius: 10, padding: 12 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ backgroundColor: '#fff', width: '90%', borderRadius: 10, padding: 12 }} />
      <Button title="Sign up" onPress={async () => { try { await signup(email.trim(), password); } catch (e: any) { Alert.alert('Signup failed', e?.message ?? 'Error'); } }} />
      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={{ color: '#93c5fd', marginTop: 8 }}>Have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}


