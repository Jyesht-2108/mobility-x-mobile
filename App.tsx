import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

// Screens
import HomeScreen from '@/screens/Home';

import PlanScreen from '@/screens/Plan';

function ResultsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Results</Text>
      <Text>AI-ranked route options will appear here.</Text>
    </View>
  );
}

function TripScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Trip</Text>
      <Text>Live trip guidance and transfers.</Text>
    </View>
  );
}

import WalletScreen from '@/screens/Wallet';
import ProfileScreen from '@/screens/Profile';
import RouteMapScreen from '@/screens/RouteMap';
import ResultsScreenReal from '@/screens/Results';
import LoginScreen from '@/screens/Login';
import SignupScreen from '@/screens/Signup';
import { useAuthStore } from '@/store/auth';

type RootTabParamList = {
  Home: undefined;
  Plan: undefined;
  Results: undefined;
  Trip: undefined;
  Wallet: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
    primary: '#3b82f6',
    card: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
    notification: '#ef4444',
  },
};

export default function App() {
  const { user, hydrate } = useAuthStore();
  React.useEffect(() => { void hydrate(); }, [hydrate]);
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        ) : null}
        <Stack.Screen name="Root" options={{ headerShown: false }}>
          {() => (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: true,
                tabBarStyle: {
                  backgroundColor: '#ffffff',
                  borderTopColor: '#e5e7eb',
                  borderTopWidth: 1,
                  paddingBottom: Platform.OS === 'ios' ? 20 : 5,
                  paddingTop: 5,
                  height: Platform.OS === 'ios' ? 85 : 60,
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                tabBarLabelStyle: {
                  fontSize: 12,
                  fontWeight: '600',
                },
                headerStyle: {
                  backgroundColor: '#ffffff',
                  borderBottomColor: '#e5e7eb',
                  borderBottomWidth: 1,
                },
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#111827',
                },
                tabBarIcon: ({ color, size }) => {
                  if (route.name === 'Home') return <Ionicons name="home" size={24} color={color} />;
                  if (route.name === 'Plan') return <MaterialCommunityIcons name="map-search" size={24} color={color} />;
                  if (route.name === 'Results') return <MaterialCommunityIcons name="routes" size={24} color={color} />;
                  if (route.name === 'Trip') return <Ionicons name="navigate" size={24} color={color} />;
                  if (route.name === 'Wallet') return <Ionicons name="wallet" size={24} color={color} />;
                  if (route.name === 'Profile') return <Ionicons name="person" size={24} color={color} />;
                  return null;
                },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Plan" component={PlanScreen} />
              <Tab.Screen name="Results" component={ResultsScreenReal} />
              <Tab.Screen name="Trip" component={TripScreen} />
              <Tab.Screen name="Wallet" component={WalletScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="RouteMap" 
          component={RouteMapScreen} 
          options={{ 
            title: 'Route Map',
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
            },
            headerTintColor: '#3b82f6',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
