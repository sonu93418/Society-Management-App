import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme';
import { Platform, StyleSheet } from 'react-native';

export default function GuardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.success,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register-visitor"
        options={{
          title: 'Register',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-add' : 'person-add-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitor-log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guard-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingTop: 8,
    ...Shadows.md,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
  },
});
