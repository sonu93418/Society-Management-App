import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme';
import { Platform, StyleSheet } from 'react-native';

export default function ResidentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* Main tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Hidden detail screens — accessible via router.push but not shown in tab bar */}
      <Tabs.Screen name="helpdesk" options={{ href: null }} />
      <Tabs.Screen name="notices" options={{ href: null }} />
      <Tabs.Screen name="polls" options={{ href: null }} />
      <Tabs.Screen name="amenities" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="pre-approve" options={{ href: null }} />
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
  tabItem: {
    paddingTop: 4,
  },
});
