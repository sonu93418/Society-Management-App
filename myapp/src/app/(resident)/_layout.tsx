import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { CustomTabBar } from '../../components/ui/CustomTabBar';

export default function ResidentLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
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
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
