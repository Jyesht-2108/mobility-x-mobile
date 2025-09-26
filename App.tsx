import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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
                tabBarIcon: ({ color, size }) => {
                  if (route.name === 'Home') return <Ionicons name="home" size={size} color={color} />;
                  if (route.name === 'Plan') return <MaterialCommunityIcons name="map-search" size={size} color={color} />;
                  if (route.name === 'Results') return <MaterialCommunityIcons name="routes" size={size} color={color} />;
                  if (route.name === 'Trip') return <Ionicons name="navigate" size={size} color={color} />;
                  if (route.name === 'Wallet') return <Ionicons name="wallet" size={size} color={color} />;
                  if (route.name === 'Profile') return <Ionicons name="person" size={size} color={color} />;
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
        <Stack.Screen name="RouteMap" component={RouteMapScreen} options={{ title: 'Route Map' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
