import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';

import { useSocietyPendingVisitors, useInsideVisitors, useVisitorStats, useMyVisitors, useMarkVisitorExit } from '../../hooks/useVisitors';
import { ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

import * as Haptics from 'expo-haptics';

export default function GuardDashboard() {
  const user = useAuthStore((s) => s.user);
  
  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } = useVisitorStats();
  const { data: pendingRes, isLoading: pendingLoading, refetch: refetchPending } = useSocietyPendingVisitors();
  const { data: insideRes, isLoading: insideLoading, refetch: refetchInside } = useInsideVisitors();
  const { data: historyRes, isLoading: historyLoading, refetch: refetchHistory } = useMyVisitors({ page: 1 });

  const exitMutation = useMarkVisitorExit();

  const [refreshing, setRefreshing] = useState(false);

  const stats = statsRes?.data || { total: 0, pending: 0, inside: 0, approved: 0 };
  const pendingList = pendingRes?.data || [];
  const insideList = insideRes?.data || [];
  const historyList = historyRes?.data?.visitors?.slice(0, 5) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchPending(),
      refetchInside(),
      refetchHistory(),
    ]);
    setRefreshing(false);
  }, [refetchStats, refetchPending, refetchInside, refetchHistory]);

  const handleExit = (id: string, name: string) => {
    Alert.alert(
      'Confirm Exit',
      `Mark exit for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Exit',
          onPress: () => {
            exitMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', `${name} marked as exited.`);
                onRefresh();
              },
              onError: (err: any) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', err?.message || 'Failed to mark exit');
              },
            });
          },
        },
      ]
    );
  };

  const getVisitorIcon = (type: string) => {
    switch (type) {
      case 'delivery': return 'cube';
      case 'cab': return 'car';
      case 'service': return 'construct';
      default: return 'person';
    }
  };

  const getVisitorIconBg = (type: string) => {
    switch (type) {
      case 'delivery': return Colors.warningLight;
      case 'cab': return Colors.infoLight;
      case 'service': return 'rgba(139,92,246,0.12)';
      default: return Colors.primaryGhost;
    }
  };

  const getVisitorIconColor = (type: string) => {
    switch (type) {
      case 'delivery': return Colors.warning;
      case 'cab': return '#3B82F6';
      case 'service': return '#8B5CF6';
      default: return Colors.primary;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFlat = (flat: any) => {
    if (!flat) return 'Unknown';
    if (typeof flat === 'object') {
      return `${flat.tower?.name || ''}-${flat.flatNumber}`;
    }
    return String(flat);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.success} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>SECURITY DASHBOARD</Text>
            <Text style={styles.headerName}>{user?.name || 'Guard'}</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>On Duty</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: Colors.primaryGhost }]}>
            <Ionicons name="people" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Today's Visitors</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="time" size={28} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: Colors.infoLight }]}>
            <Ionicons name="enter" size={28} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.inside}</Text>
            <Text style={styles.statLabel}>Inside</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="exit" size={28} color={Colors.success} />
            <Text style={styles.statValue}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </Card>
        </View>

        {/* Emergency */}
        <TouchableOpacity style={styles.emergencyBtn} activeOpacity={0.8} onPress={() => router.push('/(guard)/register-visitor')}>
          <Ionicons name="alert-circle" size={24} color={Colors.white} />
          <Text style={styles.emergencyText}>New Visitor Entry</Text>
        </TouchableOpacity>

        {/* Waiting Visitors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waiting for Approval</Text>
          <Badge label={String(pendingList.length)} variant="warning" />
        </View>

        {pendingLoading ? (
          <ActivityIndicator size="small" color={Colors.warning} style={{ marginVertical: Spacing.md }} />
        ) : pendingList.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xl, fontStyle: 'italic' }}>No visitors waiting for approval.</Text>
        ) : (
          pendingList.map((visitor) => (
            <Card key={visitor._id} style={styles.waitingCard}>
              <View style={styles.waitingHeader}>
                <View style={[styles.typeIcon, { backgroundColor: getVisitorIconBg(visitor.type) }]}>
                  <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={getVisitorIconColor(visitor.type)} />
                </View>
                <View style={styles.waitingInfo}>
                  <Text style={styles.waitingName}>{visitor.visitorName} ({visitor.type})</Text>
                  <Text style={styles.waitingFlat}>Flat {formatFlat(visitor.flat)} • {visitor.purpose}</Text>
                </View>
                <Badge label={visitor.status === 'pending' ? 'Pending Approval' : visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)} variant="pending" />
              </View>
              <Text style={styles.waitingTime}>Created at {formatTime(visitor.createdAt)}</Text>
            </Card>
          ))
        )}

        {/* Inside Visitors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Currently Inside</Text>
          <Badge label={String(insideList.length)} variant="inside" />
        </View>

        {insideLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : insideList.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xl, fontStyle: 'italic' }}>No visitors inside the campus.</Text>
        ) : (
          insideList.map((visitor) => (
            <Card key={visitor._id} style={styles.insideCard}>
              <View style={styles.insideHeader}>
                <View style={[styles.typeIcon, { backgroundColor: getVisitorIconBg(visitor.type) }]}>
                  <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={getVisitorIconColor(visitor.type)} />
                </View>
                <View style={styles.waitingInfo}>
                  <Text style={styles.waitingName}>{visitor.visitorName}</Text>
                  <Text style={styles.waitingFlat}>Flat {formatFlat(visitor.flat)} • Entered {formatTime(visitor.entryAt)}</Text>
                </View>
                <Button title="Exit" variant="outline" size="sm" onPress={() => handleExit(visitor._id, visitor.visitorName)} />
              </View>
            </Card>
          ))
        )}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Recent Activity</Text>
        {historyLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : historyList.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic' }}>No recent activity logged.</Text>
        ) : (
          historyList.map((visitor) => (
            <View key={visitor._id} style={styles.activityItem}>
              <Ionicons
                name={visitor.status === 'exited' ? 'exit-outline' : visitor.status === 'inside' ? 'enter-outline' : 'checkmark-circle-outline'}
                size={20}
                color={visitor.status === 'exited' ? Colors.textSecondary : visitor.status === 'inside' ? Colors.success : Colors.primary}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{visitor.visitorName}</Text>
                <Text style={styles.activityAction}>{visitor.status === 'pending' ? 'Pending Approval' : visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)} • Flat {formatFlat(visitor.flat)}</Text>
              </View>
              <Text style={styles.activityTime}>{formatTime(visitor.updatedAt)}</Text>
            </View>
          ))
        )}

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['2xl'] },
  headerLabel: { ...Typography.captionMedium, color: Colors.success, letterSpacing: 1.5 },
  headerName: { ...Typography.h3, color: Colors.text, marginTop: Spacing.xs },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, gap: Spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { ...Typography.captionMedium, color: Colors.successDark },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { width: '47%', alignItems: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.xl },
  statValue: { ...Typography.h2, color: Colors.text, marginTop: Spacing.sm },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },

  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.danger, borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing['2xl'], ...Shadows.lg },
  emergencyText: { ...Typography.button, color: Colors.white, fontSize: 16 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },

  waitingCard: { marginBottom: Spacing.md },
  waitingHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  waitingInfo: { flex: 1, marginLeft: Spacing.md },
  waitingName: { ...Typography.bodyMedium, color: Colors.text },
  waitingFlat: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  waitingTime: { ...Typography.caption, color: Colors.warning, marginTop: Spacing.md, fontWeight: '500' },

  insideCard: { marginBottom: Spacing.md },
  insideHeader: { flexDirection: 'row', alignItems: 'center' },

  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  activityInfo: { flex: 1, marginLeft: Spacing.md },
  activityName: { ...Typography.bodyMedium, color: Colors.text },
  activityAction: { ...Typography.caption, color: Colors.textSecondary },
  activityTime: { ...Typography.captionMedium, color: Colors.textTertiary },
});
