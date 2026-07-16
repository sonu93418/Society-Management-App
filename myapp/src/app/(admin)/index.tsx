import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth.store';
import { router } from 'expo-router';

interface DashStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  trend?: string;
  onPress?: () => void;
}

const DashStat: React.FC<DashStatProps> = ({ icon, label, value, color, bgColor, trend, onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress}
  >
    <Card style={{ flex: 1 }}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={12} color={Colors.success} />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Card>
  </TouchableOpacity>
);

import { useAdminDashboard } from '../../hooks/useAdmin';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useCommunity';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  
  const { data: statsResponse, isLoading, refetch } = useAdminDashboard();
  const { data: notifRes, refetch: refetchNotifs } = useNotifications();

  const notifications = notifRes?.data?.notifications || [];
  const unreadCount = notifRes?.data?.unreadCount || 0;

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const stats = statsResponse?.data || {
    totalResidents: 0,
    totalGuards: 0,
    totalTowers: 0,
    totalFlats: 0,
    todayVisitors: 0,
    insideVisitors: 0,
    pendingApprovals: 0,
    openComplaints: 0,
    pendingPayments: 0,
    occupancyRate: 0,
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchNotifs()]);
    setRefreshing(false);
  }, [refetch, refetchNotifs]);

  const societyName = typeof user?.society === 'object' ? user.society.name : 'Portl Residency';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>ADMIN DASHBOARD</Text>
            <Text style={styles.headerName}>{societyName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifModalVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing['3xl'] }} />
        ) : (
          <>
            {/* Welcome Card */}
            <Card style={styles.welcomeCard}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeTitle}>Welcome, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
                <Text style={styles.welcomeSubtitle}>Here's your society overview for today</Text>
              </View>
              <View style={styles.welcomeStats}>
                <View style={styles.welcomeStat}>
                  <Text style={styles.welcomeStatValue}>{stats.occupancyRate}%</Text>
                  <Text style={styles.welcomeStatLabel}>Occupancy</Text>
                </View>
                <View style={styles.welcomeStatDivider} />
                <View style={styles.welcomeStat}>
                  <Text style={styles.welcomeStatValue}>{stats.totalResidents}</Text>
                  <Text style={styles.welcomeStatLabel}>Residents</Text>
                </View>
              </View>
            </Card>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <DashStat icon="people" label="Today's Visitors" value={stats.todayVisitors} color={Colors.primary} bgColor={Colors.primaryGhost} onPress={() => router.push('/(admin)/manage')} />
              <DashStat icon="enter" label="Inside Now" value={stats.insideVisitors} color="#3B82F6" bgColor={Colors.infoLight} onPress={() => router.push('/(admin)/manage')} />
              <DashStat icon="time" label="Pending Approvals" value={stats.pendingApprovals} color={Colors.warning} bgColor={Colors.warningLight} onPress={() => router.push('/(admin)/manage')} />
              <DashStat icon="chatbubble-ellipses" label="Open Complaints" value={stats.openComplaints} color={Colors.danger} bgColor={Colors.dangerLight} onPress={() => router.push('/(admin)/community-admin')} />
              <DashStat icon="wallet" label="Pending Payments" value={stats.pendingPayments} color="#EC4899" bgColor="rgba(236,72,153,0.12)" onPress={() => router.push('/(admin)/manage')} />
              <DashStat icon="business" label="Total Towers" value={stats.totalTowers} color={Colors.success} bgColor={Colors.successLight} onPress={() => router.push('/(admin)/towers')} />
            </View>
          </>
        )}

        {/* Revenue */}
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <Card>
          <View style={styles.revenueRow}>
            <View>
              <Text style={styles.revenueLabel}>Collected This Month</Text>
              <Text style={styles.revenueAmount}>₹2,45,000</Text>
            </View>
            <View style={styles.revenueRight}>
              <Text style={styles.revenueLabel}>Pending</Text>
              <Text style={[styles.revenueAmount, { color: Colors.danger }]}>₹55,000</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '82%' }]} />
          </View>
          <Text style={styles.progressText}>82% collection rate</Text>
        </Card>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing['2xl'] }]}>Recent Activity</Text>
        {[
          { icon: 'person-add' as const, text: 'New resident registered: Meera Nair (C-201)', time: '10m', color: Colors.primary },
          { icon: 'alert-circle' as const, text: 'Complaint raised: Water leakage in B-301', time: '25m', color: Colors.danger },
          { icon: 'cash' as const, text: 'Payment received: A-201 - ₹5,000', time: '1h', color: Colors.success },
          { icon: 'megaphone' as const, text: 'Notice published: Water Supply Maintenance', time: '2h', color: Colors.warning },
        ].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.activityText} numberOfLines={2}>{item.text}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={notifModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  let iconName: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
                  let iconColor: string = Colors.primary;
                  if (item.type === 'visitor' || item.title.toLowerCase().includes('visitor')) {
                    iconName = 'people-outline';
                    iconColor = Colors.warning;
                  } else if (item.type === 'complaint' || item.title.toLowerCase().includes('complaint')) {
                    iconName = 'alert-circle-outline';
                    iconColor = Colors.danger;
                  } else if (item.type === 'payment' || item.title.toLowerCase().includes('payment')) {
                    iconName = 'cash-outline';
                    iconColor = Colors.success;
                  } else if (item.type === 'notice' || item.title.toLowerCase().includes('notice')) {
                    iconName = 'megaphone-outline';
                    iconColor = Colors.info;
                  }

                  return (
                    <TouchableOpacity
                      style={[styles.notifItem, !item.isRead && styles.unreadNotif]}
                      onPress={() => !item.isRead && markReadMutation.mutate(item._id)}
                      activeOpacity={item.isRead ? 1 : 0.7}
                    >
                      <View style={[styles.notifIconContainer, { backgroundColor: `${iconColor}15` }]}>
                        <Ionicons name={iconName} size={20} color={iconColor} />
                      </View>
                      <View style={styles.notifTextContent}>
                        <View style={styles.notifRow}>
                          <Text style={[styles.notifItemTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
                          {!item.isRead && <View style={styles.unreadBadge} />}
                        </View>
                        <Text style={styles.notifBody}>{item.body}</Text>
                        <Text style={styles.notifDate}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  headerLabel: { ...Typography.captionMedium, color: Colors.primary, letterSpacing: 1.5 },
  headerName: { ...Typography.h3, color: Colors.text, marginTop: Spacing.xs },
  notifBtn: { position: 'relative', width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], padding: Spacing.lg, maxHeight: '80%', minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: { ...Typography.captionMedium, color: Colors.primary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['5xl'] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textTertiary, marginTop: Spacing.md },
  notifItem: { flexDirection: 'row', padding: Spacing.md, borderRadius: BorderRadius.xl, marginBottom: Spacing.sm },
  unreadNotif: { backgroundColor: Colors.primaryGhost },
  notifIconContainer: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  notifTextContent: { flex: 1 },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifItemTitle: { ...Typography.bodyMedium, color: Colors.textSecondary },
  unreadText: { color: Colors.text, fontWeight: '700' },
  unreadBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  notifBody: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 4 },
  notifDate: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },

  welcomeCard: { backgroundColor: Colors.primary, marginBottom: Spacing.xl },
  welcomeContent: { marginBottom: Spacing.xl },
  welcomeTitle: { ...Typography.h4, color: Colors.white },
  welcomeSubtitle: { ...Typography.bodySm, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs },
  welcomeStats: { flexDirection: 'row' },
  welcomeStat: { flex: 1 },
  welcomeStatValue: { ...Typography.h3, color: Colors.white },
  welcomeStatLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  welcomeStatDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: Spacing.lg },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: { width: '48%' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  statIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingVertical: 2, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full, gap: 2 },
  trendText: { ...Typography.captionMedium, color: Colors.success, fontSize: 10 },
  statValue: { ...Typography.h3, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },

  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  revenueLabel: { ...Typography.caption, color: Colors.textSecondary },
  revenueAmount: { ...Typography.h4, color: Colors.success, marginTop: Spacing.xs },
  revenueRight: { alignItems: 'flex-end' },
  progressBar: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 4 },
  progressText: { ...Typography.caption, color: Colors.textSecondary },

  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  activityIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  activityText: { ...Typography.bodySm, color: Colors.text, flex: 1, marginHorizontal: Spacing.md },
  activityTime: { ...Typography.captionMedium, color: Colors.textTertiary },
});
