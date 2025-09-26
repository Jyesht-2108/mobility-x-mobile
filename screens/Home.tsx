import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Image, ImageBackground, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { gradientBackgrounds } from '@/services/unsplash';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [currentGradient, setCurrentGradient] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Cycle through gradients
    const interval = setInterval(() => {
      setCurrentGradient((prev) => (prev + 1) % gradientBackgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  const currentBg = gradientBackgrounds[currentGradient];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <Animated.View
        style={{
          height: height * 0.6,
          justifyContent: 'flex-end',
          position: 'relative',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Dynamic gradient background */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: currentBg.colors[0],
          }}
        />
        
        {/* Overlay pattern */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        />
        
        {/* Floating elements */}
        <View style={{ position: 'absolute', top: 60, right: 20, opacity: 0.6 }}>
          <Ionicons name="airplane" size={24} color="#fff" />
        </View>
        <View style={{ position: 'absolute', top: 100, left: 30, opacity: 0.5 }}>
          <MaterialCommunityIcons name="bus" size={20} color="#fff" />
        </View>
        <View style={{ position: 'absolute', top: 140, right: 40, opacity: 0.4 }}>
          <Ionicons name="bicycle" size={18} color="#fff" />
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
            Multimodal
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, marginTop: -8 }}>
            Mobility
          </Text>
          <Text style={{ marginTop: 12, fontSize: 18, color: '#e2e8f0', fontWeight: '500', lineHeight: 24 }}>
            Seamlessly connect walking, transit, bikes, and ride-hail in one intelligent journey.
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Plan')}
            activeOpacity={0.8}
            style={{
              marginTop: 24,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Ionicons name="map" size={22} color="#1e293b" />
            <Text style={{ color: '#1e293b', fontWeight: '800', fontSize: 18 }}>Start Planning</Text>
            <Ionicons name="arrow-forward" size={20} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: 20, marginTop: -20, gap: 16 }}>
        {/* Feature cards with glassmorphism effect */}
        <Animated.View
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 12, padding: 12 }}>
            <MaterialCommunityIcons name="transit-connection-variant" size={28} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>True Multimodal</Text>
            <Text style={{ marginTop: 4, color: '#e2e8f0', fontSize: 15, lineHeight: 20 }}>
              Mix walking, bus, metro, rail, bikes and ride-hail in one intelligent plan.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 12, padding: 12 }}>
            <Ionicons name="time" size={28} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>Live Travel Data</Text>
            <Text style={{ marginTop: 4, color: '#e2e8f0', fontSize: 15, lineHeight: 20 }}>
              Real-time Google Directions and geocoding for accurate times and distances.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 12, padding: 12 }}>
            <Ionicons name="cash" size={28} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>Smart Costs</Text>
            <Text style={{ marginTop: 4, color: '#e2e8f0', fontSize: 15, lineHeight: 20 }}>
              Real fares with AI-powered preference-based ranking and optimization.
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 20 }}>
          Ready to Transform Your Commute?
        </Text>
        
        <Animated.View
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: 8, padding: 8 }}>
              <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', flex: 1 }}>
              Add API keys in Profile (Google Maps, optional OpenAI/LocationIQ)
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 8, padding: 8 }}>
              <Ionicons name="options" size={20} color="#22c55e" />
            </View>
            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', flex: 1 }}>
              Set your preferences (time/cost/comfort) in Plan
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 8, padding: 8 }}>
              <Ionicons name="mic" size={20} color="#f59e0b" />
            </View>
            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', flex: 1 }}>
              Try voice input on web or type to use autocomplete
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 40, alignItems: 'center' }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
          <Image
            source={require('@/assets/icon.png') as any}
            resizeMode="contain"
            style={{ width: 60, height: 60, marginBottom: 12, opacity: 0.9 }}
          />
          <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
            Powered by AI • Real-time Data • Seamless Integration
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}


