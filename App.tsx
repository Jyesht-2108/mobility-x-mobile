import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Screens
function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Welcome to Multimodal Mobility</Text>
      <Text>Plan a trip to see multimodal AI-powered routes.</Text>
    </View>
  );
}

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

function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Profile</Text>
      <Text>Preferences for cost, time, comfort.</Text>
    </View>
  );
}

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
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator>
        <Stack.Screen name="Root" options={{ headerShown: false }}>
          {() => (
            <Tab.Navigator screenOptions={{ headerShown: true }}>
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Plan" component={PlanScreen} />
              <Tab.Screen name="Results" component={ResultsScreen} />
              <Tab.Screen name="Trip" component={TripScreen} />
              <Tab.Screen name="Wallet" component={WalletScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
