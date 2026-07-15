import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth.store';

export default function GuardProfile() {
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
            <Ionicons name="shield-checkmark" size={36} color={Colors.white} />
          </View>
          <Text style={styles.name}>{user?.name || 'Guard'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield" size={14} color={Colors.success} />
            <Text style={styles.roleText}>Security Guard</Text>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Total Visitors</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>28</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
          </View>
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  name: { ...Typography.h3, color: Colors.text },
  email: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.md, gap: Spacing.xs },
  roleText: { ...Typography.captionMedium, color: Colors.successDark },
  statsCard: { marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.borderLight },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius['3xl'], gap: Spacing.sm },
  logoutText: { ...Typography.button, color: Colors.danger },
});
