import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

export default function AdminProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  useEffect(() => {
    // Refresh user profile details from the server to ensure latest society details are shown
    const fetchLatestProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch latest profile:', err);
      }
    };
    fetchLatestProfile();
  }, []);

  const handleTogglePreference = async (key: string) => {
    if (!user) return;
    const currentPrefs = user.notificationPreferences || {
      visitor: true,
      complaint: true,
      notice: true,
      booking: true,
      payment: true,
      poll: true,
      marketing: true,
      emergency: true,
    };
    const updatedValue = !(currentPrefs as any)[key];
    const newPrefs = { ...currentPrefs, [key]: updatedValue };

    // Update local store immediately for instant UI feedback
    setUser({
      ...user,
      notificationPreferences: newPrefs,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await authApi.updateNotificationPreferences({ [key]: updatedValue });
    } catch (err) {
      // Revert on error
      setUser({
        ...user,
        notificationPreferences: currentPrefs,
      });
      Alert.alert('Error', 'Failed to update preferences. Please check your network connection.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => { logout().catch(console.error); },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="settings" size={36} color={Colors.white} />
          </View>
          <Text style={styles.name}>{user?.name || 'Admin'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.roleText}>Society Admin</Text>
          </View>
        </Card>

        <Card style={styles.societyCard}>
          <Text style={styles.societyName}>
            {typeof user?.society === 'object' && user.society ? (user.society as any).name : 'Portl Residency'}
          </Text>
          <Text style={styles.societyAddress}>
            {typeof user?.society === 'object' && user.society 
              ? `${(user.society as any).address || ''}, ${(user.society as any).city || ''}, ${(user.society as any).state || ''} - ${(user.society as any).pincode || ''}`
              : '123 Tech Park Road, Whitefield, Bangalore'}
          </Text>
          <View style={styles.societyStats}>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>
                {typeof user?.society === 'object' && user.society && (user.society as any).totalTowers !== undefined
                  ? (user.society as any).totalTowers 
                  : '3'}
              </Text>
              <Text style={styles.societyStatLabel}>Towers</Text>
            </View>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>
                {typeof user?.society === 'object' && user.society && (user.society as any).totalFlats !== undefined
                  ? (user.society as any).totalFlats 
                  : '12'}
              </Text>
              <Text style={styles.societyStatLabel}>Flats</Text>
            </View>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>152</Text>
              <Text style={styles.societyStatLabel}>Residents</Text>
            </View>
          </View>
        </Card>

        {/* Notification Preferences */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowNotificationPreferences(!showNotificationPreferences);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md }}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text} />
              <Text style={styles.settingsLabel}>Notification Preferences</Text>
            </View>
            <Ionicons
              name={showNotificationPreferences ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>

          {showNotificationPreferences && (
            <View style={styles.preferencesContainer}>
              <View style={styles.separator} />
              
              {/* Visitor Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Visitor Requests</Text>
                  <Text style={styles.prefDesc}>Visitor entry notifications & logs</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.visitor !== false}
                  onValueChange={() => handleTogglePreference('visitor')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.visitor !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Helpdesk Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Complaint Alerts</Text>
                  <Text style={styles.prefDesc}>New complaints filed by residents</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.complaint !== false}
                  onValueChange={() => handleTogglePreference('complaint')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.complaint !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Notice Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Notice Broadcaster</Text>
                  <Text style={styles.prefDesc}>Broadcast alerts for published notices</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.notice !== false}
                  onValueChange={() => handleTogglePreference('notice')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.notice !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Emergency Toggle (Always Enabled) */}
              <View style={[styles.prefRow, { opacity: 0.8 }]}>
                <View style={styles.prefTextContainer}>
                  <Text style={[styles.prefLabel, { color: Colors.danger }]}>🚨 Emergency broadcast</Text>
                  <Text style={styles.prefDesc}>Security panic buttons and emergencies</Text>
                </View>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: '#CBD5E1', true: '#FDA4AF' }}
                  thumbColor={Colors.danger}
                />
              </View>
            </View>
          )}
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Portl v1.0.0</Text>
        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.xl },
  profileCard: { alignItems: 'center', paddingVertical: Spacing['2xl'], marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  name: { ...Typography.h3, color: Colors.text },
  email: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.md, gap: Spacing.xs },
  roleText: { ...Typography.captionMedium, color: Colors.warningDark },
  societyCard: { marginBottom: Spacing.lg },
  societyName: { ...Typography.h4, color: Colors.text },
  societyAddress: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  societyStats: { flexDirection: 'row', marginTop: Spacing.xl },
  societyStat: { flex: 1, alignItems: 'center' },
  societyStatValue: { ...Typography.h3, color: Colors.primary },
  societyStatLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius['3xl'], gap: Spacing.sm, marginBottom: Spacing.lg, marginTop: Spacing.md },
  logoutText: { ...Typography.button, color: Colors.danger },
  version: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center' },
  
  // Settings & Toggles Styling
  settingsCard: { marginBottom: Spacing.lg, padding: Spacing.xs },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, justifyContent: 'space-between' },
  settingsLabel: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  preferencesContainer: {
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  prefTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  prefLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  prefDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
