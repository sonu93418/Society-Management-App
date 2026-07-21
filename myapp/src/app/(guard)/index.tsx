import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';

import {
  useSocietyPendingVisitors,
  useInsideVisitors,
  useVisitorStats,
  useMyVisitors,
  useMarkVisitorExit,
  useApproveVisitor,
  useRejectVisitor,
} from '../../hooks/useVisitors';
import { router } from 'expo-router';

import * as Haptics from 'expo-haptics';

export default function GuardDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } = useVisitorStats();
  const { data: pendingRes, isLoading: pendingLoading, refetch: refetchPending } = useSocietyPendingVisitors();
  const { data: insideRes, isLoading: insideLoading, refetch: refetchInside } = useInsideVisitors();
  const { data: historyRes, isLoading: historyLoading, refetch: refetchHistory } = useMyVisitors({ page: 1 });

  const exitMutation = useMarkVisitorExit();
  const approveMutation = useApproveVisitor();
  const rejectMutation = useRejectVisitor();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'inside'>('all');

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Confirm Exit',
      `Mark exit for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Exit',
          style: 'destructive',
          onPress: () => {
            exitMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSelectedVisitor(null);
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

  const handleApprove = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    approveMutation.mutate(id, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelectedVisitor(null);
        onRefresh();
      },
      onError: (err: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', err?.message || 'Failed to approve visitor');
      },
    });
  };

  const handleReject = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reject Visitor',
      `Deny entry for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny Entry',
          style: 'destructive',
          onPress: () => {
            rejectMutation.mutate({ id }, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setSelectedVisitor(null);
                onRefresh();
              },
              onError: (err: any) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', err?.message || 'Failed to reject visitor');
              },
            });
          },
        },
      ]
    );
  };

  const makePhoneCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('No Contact', 'Phone number is not available for this visitor.');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call.');
    });
  };

  const getVisitorIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'delivery': return 'cube-outline';
      case 'cab': return 'car-outline';
      case 'service': return 'construct-outline';
      default: return 'person-outline';
    }
  };

  const getVisitorIconTheme = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'delivery': return { bg: '#FFF7ED', color: '#D97706' };
      case 'cab': return { bg: '#EFF6FF', color: '#2563EB' };
      case 'service': return { bg: '#F5F3FF', color: '#7C3AED' };
      default: return { bg: '#EEF2FF', color: '#4F46E5' };
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFlat = (flat: any) => {
    if (!flat) return 'General';
    if (typeof flat === 'object') {
      const towerName = flat.tower?.name || '';
      const flatNum = flat.flatNumber || '';
      return towerName ? `${towerName}-${flatNum}` : flatNum || 'General';
    }
    return String(flat);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.headerLabel}>GATE CONTROL</Text>
              <Text style={styles.headerName}>{user?.name || 'Gate Officer'}</Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>ON DUTY</Text>
          </View>
        </View>

        {/* Interactive Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, filterTab === 'all' && styles.statCardActive]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterTab('all');
            }}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="people" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <Text style={styles.statLabel}>Today Total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, filterTab === 'pending' && styles.statCardActive]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterTab('pending');
            }}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBadge, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="time" size={18} color="#D97706" />
              </View>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pending}</Text>
            </View>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, filterTab === 'inside' && styles.statCardActive]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterTab('inside');
            }}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="log-in" size={18} color="#2563EB" />
              </View>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.inside}</Text>
            </View>
            <Text style={styles.statLabel}>Inside</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button: Log New Visitor */}
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(guard)/register-visitor');
          }}
        >
          <View style={styles.actionBtnIconBox}>
            <Ionicons name="add-circle" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle}>Log New Visitor Entry</Text>
            <Text style={styles.actionBtnSub}>Tap to register visitor & request approval</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Waiting for Approval Section */}
        {(filterTab === 'all' || filterTab === 'pending') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Waiting for Approval</Text>
              <Badge label={`${pendingList.length} Pending`} variant="warning" />
            </View>

            {pendingLoading ? (
              <ActivityIndicator size="small" color={Colors.warning} style={styles.loader} />
            ) : pendingList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={32} color={Colors.success} />
                <Text style={styles.emptyTitle}>No Pending Visitors</Text>
                <Text style={styles.emptySub}>All visitor requests have been cleared.</Text>
              </View>
            ) : (
              pendingList.map((visitor) => {
                const iconTheme = getVisitorIconTheme(visitor.type);
                return (
                  <TouchableOpacity
                    key={visitor._id}
                    style={styles.visitorCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedVisitor(visitor);
                    }}
                  >
                    <View style={[styles.avatarBadge, { backgroundColor: iconTheme.bg }]}>
                      <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={iconTheme.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.visitorName} numberOfLines={1}>
                          {visitor.visitorName}
                        </Text>
                        <Badge label={visitor.type.toUpperCase()} variant={visitor.type as any} />
                      </View>

                      <Text style={styles.cardMetaText}>
                        Flat {formatFlat(visitor.flat)} {visitor.purpose ? `• ${visitor.purpose}` : ''}
                      </Text>

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.timeLabel}>Waiting since {formatTime(visitor.createdAt)}</Text>
                        <Text style={styles.tapPrompt}>Tap to manage ›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Currently Inside Section */}
        {(filterTab === 'all' || filterTab === 'inside') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Currently Inside Campus</Text>
              <Badge label={`${insideList.length} Inside`} variant="inside" />
            </View>

            {insideLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            ) : insideList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="exit-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No Visitors Inside</Text>
                <Text style={styles.emptySub}>No active visitors are currently inside the society.</Text>
              </View>
            ) : (
              insideList.map((visitor) => {
                const iconTheme = getVisitorIconTheme(visitor.type);
                return (
                  <TouchableOpacity
                    key={visitor._id}
                    style={styles.visitorCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedVisitor(visitor);
                    }}
                  >
                    <View style={[styles.avatarBadge, { backgroundColor: iconTheme.bg }]}>
                      <Ionicons name={getVisitorIcon(visitor.type) as any} size={20} color={iconTheme.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.visitorName} numberOfLines={1}>
                          {visitor.visitorName}
                        </Text>
                        <Badge label="INSIDE" variant="inside" />
                      </View>

                      <Text style={styles.cardMetaText}>
                        Flat {formatFlat(visitor.flat)} {visitor.visitorPhone ? `• ${visitor.visitorPhone}` : ''}
                      </Text>

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.timeLabelSuccess}>Entered at {formatTime(visitor.entryAt)}</Text>
                        <TouchableOpacity
                          style={styles.quickExitPill}
                          onPress={() => handleExit(visitor._id, visitor.visitorName)}
                        >
                          <Ionicons name="log-out-outline" size={13} color={Colors.danger} />
                          <Text style={styles.quickExitText}>Exit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Recent Activity Stream */}
        {filterTab === 'all' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Activity Log</Text>
            {historyLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            ) : historyList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptySub}>No activity logged today.</Text>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                {historyList.map((visitor, idx) => (
                  <View
                    key={visitor._id}
                    style={[
                      styles.historyRow,
                      idx === historyList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View
                      style={[
                        styles.historyDot,
                        {
                          backgroundColor:
                            visitor.status === 'exited'
                              ? Colors.textTertiary
                              : visitor.status === 'inside'
                              ? Colors.success
                              : Colors.warning,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName} numberOfLines={1}>{visitor.visitorName}</Text>
                      <Text style={styles.historySub}>
                        Flat {formatFlat(visitor.flat)} • {visitor.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>{formatTime(visitor.updatedAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>

      {/* Interactive Visitor Detail Modal */}
      <Modal
        visible={!!selectedVisitor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVisitor(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedVisitor(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selectedVisitor && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={[styles.avatarBadgeLarge, { backgroundColor: getVisitorIconTheme(selectedVisitor.type).bg }]}>
                    <Ionicons name={getVisitorIcon(selectedVisitor.type) as any} size={28} color={getVisitorIconTheme(selectedVisitor.type).color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.modalVisitorName}>{selectedVisitor.visitorName}</Text>
                    <Text style={styles.modalVisitorType}>
                      {selectedVisitor.type?.toUpperCase()} • Flat {formatFlat(selectedVisitor.flat)}
                    </Text>
                  </View>
                  <Badge label={selectedVisitor.status?.toUpperCase()} variant={selectedVisitor.status as any} />
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>Flat {formatFlat(selectedVisitor.flat)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>{selectedVisitor.purpose || 'No purpose listed'}</Text>
                  </View>
                  {selectedVisitor.visitorPhone && (
                    <TouchableOpacity
                      style={styles.detailItemInteractive}
                      onPress={() => makePhoneCall(selectedVisitor.visitorPhone)}
                    >
                      <Ionicons name="call-outline" size={16} color={Colors.primary} />
                      <Text style={[styles.detailText, { color: Colors.primary, fontWeight: '600' }]}>
                        {selectedVisitor.visitorPhone} (Tap to call)
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedVisitor.vehicleNumber && (
                    <View style={styles.detailItem}>
                      <Ionicons name="car-outline" size={16} color={Colors.primary} />
                      <Text style={styles.detailText}>Vehicle: {selectedVisitor.vehicleNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Modal Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedVisitor.status === 'pending' && (
                    <>
                      <Button
                        title="Approve Entry"
                        onPress={() => handleApprove(selectedVisitor._id, selectedVisitor.visitorName)}
                        fullWidth
                        size="md"
                        style={{ backgroundColor: Colors.success, marginBottom: 8 }}
                      />
                      <Button
                        title="Deny Entry"
                        variant="outline"
                        onPress={() => handleReject(selectedVisitor._id, selectedVisitor.visitorName)}
                        fullWidth
                        size="md"
                        style={{ borderColor: Colors.danger }}
                      />
                    </>
                  )}

                  {selectedVisitor.status === 'inside' && (
                    <Button
                      title="Mark Exit"
                      onPress={() => handleExit(selectedVisitor._id, selectedVisitor.visitorName)}
                      fullWidth
                      size="md"
                      style={{ backgroundColor: Colors.danger }}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedVisitor(null)}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.successDark,
    letterSpacing: 0.5,
  },

  // ── Interactive Stats Grid ──
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.xs,
  },
  statCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Action Banner Button ──
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: Spacing.xl,
    gap: 12,
    ...Shadows.sm,
  },
  actionBtnIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  actionBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },

  // ── Section Container ──
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  loader: {
    marginVertical: Spacing.md,
  },

  // ── Ultra-Polished Visitor Cards ──
  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Shadows.xs,
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  cardMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  timeLabelSuccess: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
  },
  tapPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickExitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  quickExitText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },

  // ── History Log Container ──
  historyContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 6,
    ...Shadows.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  historySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  historyTime: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },

  // ── Empty Cards ──
  emptyCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Interactive Modal Sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    paddingBottom: Spacing['3xl'],
    ...Shadows.lg,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalVisitorName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalVisitorType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailItemInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text,
  },
  modalActions: {
    gap: 4,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
