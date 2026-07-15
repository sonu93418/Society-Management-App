import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth.store';

export default function AdminProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
          <Text style={styles.societyName}>Portl Residency</Text>
          <Text style={styles.societyAddress}>123 Tech Park Road, Whitefield, Bangalore</Text>
          <View style={styles.societyStats}>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>3</Text>
              <Text style={styles.societyStatLabel}>Towers</Text>
            </View>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>12</Text>
              <Text style={styles.societyStatLabel}>Flats</Text>
            </View>
            <View style={styles.societyStat}>
              <Text style={styles.societyStatValue}>152</Text>
              <Text style={styles.societyStatLabel}>Residents</Text>
            </View>
          </View>
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius['3xl'], gap: Spacing.sm, marginBottom: Spacing.lg },
  logoutText: { ...Typography.button, color: Colors.danger },
  version: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center' },
});
