import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { router } from 'expo-router';
import { usePendingVisitors, useMyVisitors, useApproveVisitor, useRejectVisitor } from '../../hooks/useVisitors';
import { ActivityIndicator, Alert } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';

import * as Haptics from 'expo-haptics';

export default function ResidentVisitors() {
  const { data: pendingResponse, isLoading: isPendingLoading } = usePendingVisitors();
  const { data: historyResponse, isLoading: isHistoryLoading } = useMyVisitors();
  
  const approveMutation = useApproveVisitor();
  const rejectMutation = useRejectVisitor();

  const pendingVisitors = pendingResponse?.data || [];
  const historyVisitors = historyResponse?.data?.visitors || [];

  const handleApprove = (id: string, name: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Approved entry for ${name}`);
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', err?.message || 'Failed to approve visitor');
      },
    });
  };

  const handleReject = (id: string, name: string) => {
    Alert.prompt(
      'Reject Visitor',
      `Specify a reason to reject ${name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: (reason?: string) => {
            rejectMutation.mutate(
              { id, reason: reason || 'Rejected by resident' },
              {
                onSuccess: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Success', `Rejected entry for ${name}`);
                },
                onError: (err: any) => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Alert.alert('Error', err?.message || 'Failed to reject visitor');
                },
              }
            );
          },
        },
      ],
      'plain-text'
    );
  };

  const getVisitorIcon = (type: string) => {
    switch (type) {
      case 'delivery': return 'cube-outline';
      case 'cab': return 'car-outline';
      case 'service': return 'construct-outline';
      default: return 'person-outline';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Visitors</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(resident)/pre-approve')}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Pending Tab */}
        <Text style={styles.sectionTitle}>Pending Approvals</Text>

        {isPendingLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
        ) : pendingVisitors.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xl, textAlign: 'center', fontStyle: 'italic' }}>No pending visitor approvals.</Text>
        ) : (
          pendingVisitors.map((visitor) => (
            <Card key={visitor._id} style={styles.visitorCard}>
              <View style={styles.visitorHeader}>
                <View style={[styles.typeIcon, { backgroundColor: getVisitorIconBg(visitor.type) }]}>
                  <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={getVisitorIconColor(visitor.type)} />
                </View>
                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                  <Text style={styles.visitorMeta}>{visitor.purpose} • {formatTime(visitor.createdAt)}</Text>
                </View>
                <Badge label={visitor.type} variant={visitor.type as any} />
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailText}>{visitor.visitorPhone}</Text>
                <View style={styles.detailDivider} />
                <Ionicons name="people-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailText}>{visitor.expectedCount} person(s)</Text>
              </View>
              <View style={styles.actionRow}>
                <Button
                  title="Reject"
                  variant="outline"
                  size="sm"
                  onPress={() => handleReject(visitor._id, visitor.visitorName)}
                  style={{ flex: 1 }}
                  icon={<Ionicons name="close" size={16} color={Colors.primary} />}
                />
                <Button
                  title="Approve"
                  variant="primary"
                  size="sm"
                  onPress={() => handleApprove(visitor._id, visitor.visitorName)}
                  style={{ flex: 1 }}
                  icon={<Ionicons name="checkmark" size={16} color={Colors.white} />}
                />
              </View>
            </Card>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: Spacing['2xl'] }]}>Visitor History</Text>

        {isHistoryLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
        ) : historyVisitors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Visitors"
            description="You will see a log of approved, rejected, and checked-in guests here."
          />
        ) : (
          historyVisitors.map((visitor) => (
            <Card key={visitor._id} style={styles.visitorCard}>
              <View style={styles.visitorHeader}>
                <View style={[styles.typeIcon, { backgroundColor: getVisitorIconBg(visitor.type) }]}>
                  <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={getVisitorIconColor(visitor.type)} />
                </View>
                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                  <Text style={styles.visitorMeta}>{visitor.purpose} • {visitor.expectedCount} people</Text>
                </View>
                <Badge label={visitor.status} variant={visitor.status as any} dot={visitor.status === 'inside'} />
              </View>
              <View style={styles.detailRow}>
                <Ionicons name={visitor.status === 'inside' ? 'enter-outline' : 'time-outline'} size={14} color={Colors.textTertiary} />
                <Text style={styles.detailText}>
                  {visitor.status === 'inside'
                    ? `Entered at ${formatTime(visitor.entryAt)}`
                    : visitor.status === 'exited'
                      ? `Exited at ${formatTime(visitor.exitAt)}`
                      : visitor.status === 'approved'
                        ? `Approved at ${formatTime(visitor.approvedAt)}`
                        : `Status changed at ${formatTime(visitor.updatedAt)}`
                  }
                </Text>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text },
  addBtn: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.fab },
  scrollContent: { paddingHorizontal: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  visitorCard: { marginBottom: Spacing.md },
  visitorHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  visitorInfo: { flex: 1, marginLeft: Spacing.md },
  visitorName: { ...Typography.bodyMedium, color: Colors.text },
  visitorMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.xs },
  detailText: { ...Typography.bodySm, color: Colors.textSecondary },
  detailDivider: { width: 1, height: 14, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});
