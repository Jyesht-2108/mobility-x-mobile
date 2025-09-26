import React from 'react';
import { ScrollView, View, Text, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ImageBackground
        source={require('@/assets/splash-icon.png') as any}
        resizeMode="cover"
        style={{ height: 220, justifyContent: 'flex-end' }}
        imageStyle={{ opacity: 0.15 }}
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>Multimodal Mobility</Text>
          <Text style={{ marginTop: 6, fontSize: 16, color: '#334155' }}>Plan seamless trips across walking, transit, bikes, and ride-hail.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Plan')}
            activeOpacity={0.85}
            style={{ marginTop: 14, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Ionicons name="map" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Planning</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MaterialCommunityIcons name="transit-connection-variant" size={26} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>True Multimodal</Text>
            <Text style={{ marginTop: 2, color: '#475569' }}>Mix walking, bus, metro, rail, bikes and ride-hail in one plan.</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="time" size={24} color="#16a34a" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Live Travel Data</Text>
            <Text style={{ marginTop: 2, color: '#475569' }}>Uses Google Directions and geocoding for live times and distances.</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="cash" size={24} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Smart Costs</Text>
            <Text style={{ marginTop: 2, color: '#475569' }}>Shows fares when available, with personalized preference-based ranking.</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Get Started</Text>
        <View style={{ marginTop: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="person" size={18} color="#6b7280" />
            <Text style={{ color: '#334155' }}>Add API keys in Profile (Google Maps, optional OpenAI/LocationIQ).</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="options" size={18} color="#6b7280" />
            <Text style={{ color: '#334155' }}>Set your preferences (time/cost/comfort) in Plan.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="mic" size={18} color="#6b7280" />
            <Text style={{ color: '#334155' }}>Try voice input on web or type to use autocomplete.</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 24 }}>
        <Image
          source={require('@/assets/icon.png') as any}
          resizeMode="contain"
          style={{ width: '100%', height: 80, opacity: 0.8 }}
        />
      </View>
    </ScrollView>
  );
}


