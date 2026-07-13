import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme';
import { Platform, StyleSheet } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
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
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'apps' : 'apps-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community-admin"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="towers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="flats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="residents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          href: null,
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
