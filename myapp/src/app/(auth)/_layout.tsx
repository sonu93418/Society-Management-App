import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: Colors.primary },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-society" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
