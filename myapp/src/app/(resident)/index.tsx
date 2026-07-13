import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/auth.store';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, bgColor, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, bgColor }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ResidentDashboard() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name || 'Resident'}</Text>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="people" label="Pending Visitors" value="2" color={Colors.warning} bgColor={Colors.warningLight} />
          <StatCard icon="receipt" label="Open Complaints" value="1" color={Colors.danger} bgColor={Colors.dangerLight} />
          <StatCard icon="calendar" label="Upcoming Bookings" value="3" color={Colors.primary} bgColor={Colors.primaryGhost} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction icon="person-add-outline" label="Pre-approve" color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" onPress={() => router.push('/(resident)/pre-approve')} />
          <QuickAction icon="document-text-outline" label="Raise Ticket" color={Colors.danger} bgColor={Colors.dangerLight} onPress={() => router.push('/(resident)/helpdesk')} />
          <QuickAction icon="fitness-outline" label="Book Amenity" color={Colors.success} bgColor={Colors.successLight} onPress={() => router.push('/(resident)/amenities')} />
          <QuickAction icon="megaphone-outline" label="Notices" color={Colors.warning} bgColor={Colors.warningLight} onPress={() => router.push('/(resident)/notices')} />
          <QuickAction icon="bar-chart-outline" label="Polls" color={Colors.primary} bgColor={Colors.primaryGhost} onPress={() => router.push('/(resident)/polls')} />
          <QuickAction icon="wallet-outline" label="Payments" color="#EC4899" bgColor="rgba(236,72,153,0.12)" onPress={() => router.push('/(resident)/payments')} />
        </View>

        {/* Pending Visitors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          <TouchableOpacity onPress={() => router.push('/(resident)/visitors')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.visitorCard}>
          <View style={styles.visitorRow}>
            <View style={[styles.visitorAvatar, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="cube-outline" size={20} color={Colors.warning} />
            </View>
            <View style={styles.visitorInfo}>
              <Text style={styles.visitorName}>Rahul Delivery</Text>
              <Text style={styles.visitorPurpose}>Amazon Package</Text>
            </View>
            <Badge label="pending" variant="pending" size="sm" />
          </View>
          <View style={styles.visitorActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
              <Ionicons name="close" size={18} color={Colors.danger} />
              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={[styles.actionBtnText, { color: Colors.white }]}>Approve</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Notices */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notices</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <View style={[styles.noticeIcon, { backgroundColor: Colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            </View>
            <View style={styles.noticeInfo}>
              <Text style={styles.noticeTitleText}>Water Supply Maintenance</Text>
              <Text style={styles.noticeDate}>July 14, 2026</Text>
            </View>
            <Badge label="Pinned" variant="danger" size="sm" />
          </View>
        </Card>

        <Card style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <View style={[styles.noticeIcon, { backgroundColor: Colors.primaryGhost }]}>
              <Ionicons name="calendar" size={18} color={Colors.primary} />
            </View>
            <View style={styles.noticeInfo}>
              <Text style={styles.noticeTitleText}>Annual General Meeting</Text>
              <Text style={styles.noticeDate}>July 25, 2026</Text>
            </View>
          </View>
        </Card>

        {/* Maintenance Due */}
        <Text style={styles.sectionTitle}>Maintenance Due</Text>
        <Card>
          <View style={styles.paymentRow}>
            <View>
              <Text style={styles.paymentMonth}>July 2026</Text>
              <Text style={styles.paymentDesc}>Monthly Maintenance</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>₹5,000</Text>
              <Badge label="overdue" variant="overdue" size="sm" />
            </View>
          </View>
          <TouchableOpacity style={styles.payNowBtn}>
            <Text style={styles.payNowText}>Pay Now</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </Card>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['2xl'] },
  headerLeft: {},
  greeting: { ...Typography.bodySm, color: Colors.textSecondary },
  userName: { ...Typography.h3, color: Colors.text, marginTop: 2 },
  notifButton: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  notifDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },

  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', ...Shadows.xs },
  statIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { ...Typography.h4, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  viewAll: { ...Typography.bodySm, color: Colors.primary, fontWeight: '600' },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  quickAction: { width: '30%', alignItems: 'center' },
  quickActionIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  quickActionLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },

  visitorCard: { marginBottom: Spacing.lg },
  visitorRow: { flexDirection: 'row', alignItems: 'center' },
  visitorAvatar: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  visitorInfo: { flex: 1, marginLeft: Spacing.md },
  visitorName: { ...Typography.bodyMedium, color: Colors.text },
  visitorPurpose: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  visitorActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, gap: Spacing.xs },
  rejectBtn: { backgroundColor: Colors.dangerLight },
  approveBtn: { backgroundColor: Colors.success },
  actionBtnText: { ...Typography.buttonSm },

  noticeCard: { marginBottom: Spacing.md },
  noticeRow: { flexDirection: 'row', alignItems: 'center' },
  noticeIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  noticeInfo: { flex: 1, marginLeft: Spacing.md },
  noticeTitleText: { ...Typography.bodyMedium, color: Colors.text },
  noticeDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMonth: { ...Typography.bodyMedium, color: Colors.text },
  paymentDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: Spacing.xs },
  paymentAmount: { ...Typography.h4, color: Colors.text },
  payNowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.md, gap: Spacing.xs },
  payNowText: { ...Typography.buttonSm, color: Colors.primary },
});
