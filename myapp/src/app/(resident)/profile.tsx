import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth.store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        // logout() is async — clears SecureStore then updates state.
        // AuthGate in _layout.tsx automatically navigates to login
        // when isAuthenticated becomes false, so no manual navigation needed.
        onPress: () => { logout().catch(console.error); },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="home" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>Resident</Text>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Flat</Text>
              <Text style={styles.infoValue}>A-101</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Society</Text>
              <Text style={styles.infoValue}>Portl Residency</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="people-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Family Members</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Logout */}
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
  avatarContainer: { marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  profileName: { ...Typography.h3, color: Colors.text },
  profileEmail: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.md, gap: Spacing.xs },
  roleText: { ...Typography.captionMedium, color: Colors.primary },
  infoCard: { marginBottom: Spacing.lg, padding: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  infoContent: { flex: 1, marginLeft: Spacing.md },
  infoLabel: { ...Typography.caption, color: Colors.textTertiary },
  infoValue: { ...Typography.bodyMedium, color: Colors.text, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  settingsCard: { marginBottom: Spacing.lg, padding: Spacing.sm },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  settingsLabel: { ...Typography.bodyMedium, color: Colors.text, flex: 1, marginLeft: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius['3xl'], gap: Spacing.sm, marginBottom: Spacing.lg },
  logoutText: { ...Typography.button, color: Colors.danger },
  version: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center' },
});
