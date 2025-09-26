import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Polyline, Marker, LatLng as RNLatLng } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Itinerary, LatLng } from '@/types/domain';
import { getRouteSegments } from '@/services/google';

export default function RouteMapScreen({ route }: any) {
  const { itinerary } = route.params;
  const [segments, setSegments] = useState<{ coords: RNLatLng[]; color: string; mode: string }[]>([]);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  const origin: LatLng = itinerary.legs[0].from;
  const destination: LatLng = itinerary.legs[itinerary.legs.length - 1].to;

  // Color coding for different transport modes
  const getModeColor = (mode: string): string => {
    switch (mode) {
      case 'WALK': return '#22c55e'; // Green
      case 'BIKE': return '#10b981'; // Emerald
      case 'BUS': return '#3b82f6'; // Blue
      case 'METRO': return '#ef4444'; // Red
      case 'RAIL': return '#8b5cf6'; // Purple
      case 'RIDE_HAIL': return '#f59e0b'; // Amber
      default: return '#6b7280'; // Gray
    }
  };

  // Get custom marker icon for different points
  const getMarkerIcon = (type: 'origin' | 'destination' | 'transfer', mode?: string) => {
    if (type === 'origin') {
      return <Ionicons name="home" size={24} color="#fff" />;
    } else if (type === 'destination') {
      return <Ionicons name="flag" size={24} color="#fff" />;
    } else {
      // Transfer point
      switch (mode) {
        case 'BUS': return <MaterialCommunityIcons name="bus" size={20} color="#fff" />;
        case 'METRO': return <MaterialCommunityIcons name="subway-variant" size={20} color="#fff" />;
        case 'RAIL': return <MaterialCommunityIcons name="train" size={20} color="#fff" />;
        default: return <Ionicons name="ellipse" size={16} color="#fff" />;
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Create segments for each leg with proper color coding
        const newSegments: { coords: RNLatLng[]; color: string; mode: string }[] = [];
        
        for (const leg of itinerary.legs) {
          const color = getModeColor(leg.mode);
          // Create a simple straight line segment for now (could be enhanced with real routing)
          const coords: RNLatLng[] = [
            { latitude: leg.from.latitude, longitude: leg.from.longitude },
            { latitude: leg.to.latitude, longitude: leg.to.longitude }
          ];
          newSegments.push({ coords, color, mode: leg.mode });
        }
        
        setSegments(newSegments);
        
        // Fit map to show all coordinates with padding
        if (mapRef.current && newSegments.length > 0) {
          const allCoords = newSegments.flatMap(s => s.coords);
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(allCoords, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true
            });
          }, 500);
        }
      } catch (e: any) {
        Alert.alert('Map error', e?.message ?? 'Failed to load route');
      } finally {
        setReady(true);
      }
    })();
  }, [itinerary]);

  const initialRegion = {
    latitude: origin.latitude,
    longitude: origin.longitude,
    latitudeDelta: Math.abs(destination.latitude - origin.latitude) * 2 + 0.05,
    longitudeDelta: Math.abs(destination.longitude - origin.longitude) * 2 + 0.05,
  };

  return (
    <View style={{ flex: 1 }}>
      {!ready ? (
        <View style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 8,
          padding: 8
        }}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      ) : null}
      
      <MapView 
        ref={mapRef}
        style={{ flex: 1 }} 
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Origin Marker */}
        <Marker 
          coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
          title="Origin"
          description="Starting point"
        >
          <View style={{
            backgroundColor: '#22c55e',
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            {getMarkerIcon('origin')}
          </View>
        </Marker>

        {/* Destination Marker */}
        <Marker 
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          title="Destination"
          description="End point"
        >
          <View style={{
            backgroundColor: '#ef4444',
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            {getMarkerIcon('destination')}
          </View>
        </Marker>

        {/* Transfer Points */}
        {itinerary.legs.slice(1, -1).map((leg: any, idx: number) => (
          <Marker 
            key={`transfer-${idx}`}
            coordinate={{ latitude: leg.from.latitude, longitude: leg.from.longitude }}
            title={`Transfer ${idx + 1}`}
            description={`Switch to ${leg.mode}`}
          >
            <View style={{
              backgroundColor: getModeColor(leg.mode),
              borderRadius: 16,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.22,
              shadowRadius: 2.22,
              elevation: 3
            }}>
              {getMarkerIcon('transfer', leg.mode)}
            </View>
          </Marker>
        ))}

        {/* Route Polylines */}
        {segments.map((s, idx) => (
          <Polyline 
            key={`seg-${idx}`} 
            coordinates={s.coords} 
            strokeColor={s.color} 
            strokeWidth={6}
            lineDashPattern={s.mode === 'WALK' ? [5, 5] : undefined}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </MapView>

      {/* Route Summary Overlay */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          {Math.round(itinerary.totalTimeMin)} min • ₹{(itinerary.totalCostCents / 100).toFixed(2)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {itinerary.legs.map((leg: any, idx: number) => (
            <View key={idx} style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: getModeColor(leg.mode),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {leg.mode} {Math.round((leg.endTime - leg.startTime) / 60000)}m
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}


