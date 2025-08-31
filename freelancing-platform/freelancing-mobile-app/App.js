import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/auth/AuthScreen';
import ProfileCreationScreen from './src/screens/auth/ProfileCreationScreen';
import VerificationPendingScreen from './src/screens/auth/VerificationPendingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ClientProfileScreen from './src/screens/client/ClientProfileScreen';
import PostJobScreen from './src/screens/client/PostJobScreen';
import OffersScreen from './src/screens/client/OffersScreen';
import FreelancerProfileScreen from './src/screens/freelancer/FreelancerProfileScreen';
import MyWorkScreen from './src/screens/MyWorkScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
        <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
        <Stack.Screen name="PostJob" component={PostJobScreen} />
        <Stack.Screen name="OffersScreen" component={OffersScreen} />
        <Stack.Screen name="FreelancerProfile" component={FreelancerProfileScreen} />
        <Stack.Screen name="MyWork" component={MyWorkScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
