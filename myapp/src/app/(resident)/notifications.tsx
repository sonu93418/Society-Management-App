import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useCommunity';
import { NotificationManager } from '../../services/NotificationManager';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export default function NotificationsScreen() {
  const { data: notifRes, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications: NotificationItem[] = notifRes?.data?.notifications || [];
  const unreadCount: number = notifRes?.data?.unreadCount || 0;

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.isRead;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => refetch(),
    });
  };

  const handleTestLockScreenAlert = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });

    if (status !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'Please enable Notification permissions in system settings to receive lock screen alerts.'
      );
      return;
    }

    await NotificationManager.scheduleLockScreenNotification({
      title: '🛡️ Gate Clearance Alert — Visitor Arrival',
      body: 'Delivery Executive Rahul has arrived at Gate 1 with your package.',
      category: 'visitor',
      seconds: 5,
    });

    Alert.alert(
      'Lock Screen Alert Scheduled in 5s! 📱',
      'Please LOCK your phone screen or MINIMIZE the app right now to see the banner pop up live on your lock screen.',
      [{ text: 'OK, Locking Screen' }]
    );
  };

  const handleItemPress = (item: NotificationItem) => {
    Haptics.selectionAsync();
    setSelectedNotif(item);
    if (!item.isRead) {
      markReadMutation.mutate(item._id, {
        onSuccess: () => refetch(),
      });
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationCategoryInfo = (type: string, title: string) => {
    const lowerTitle = (title || '').toLowerCase();
    const lowerType = (type || '').toLowerCase();

    if (lowerType === 'emergency' || lowerTitle.includes('emergency') || lowerTitle.includes('📢') || lowerTitle.includes('broadcast')) {
      return {
        icon: 'alert-circle' as const,
        color: Colors.danger,
        bgColor: `${Colors.danger}15`,
        label: 'System Broadcast / Alert',
      };
    }
    if (lowerType.startsWith('visitor') || lowerTitle.includes('visitor') || lowerTitle.includes('gate')) {
      return {
        icon: 'log-in-outline' as const,
        color: Colors.warning,
        bgColor: `${Colors.warning}15`,
        label: 'Visitor Access',
      };
    }
    if (lowerType.startsWith('ticket') || lowerTitle.includes('complaint') || lowerTitle.includes('maintenance')) {
      return {
        icon: 'construct' as const,
        color: Colors.secondary,
        bgColor: `${Colors.secondary}15`,
        label: 'Maintenance Ticket',
      };
    }
    if (lowerType.startsWith('payment') || lowerTitle.includes('payment') || lowerTitle.includes('dues')) {
      return {
        icon: 'cash' as const,
        color: Colors.success,
        bgColor: `${Colors.success}15`,
        label: 'Payment & Billing',
      };
    }
    if (lowerType === 'notice_published' || lowerTitle.includes('notice') || lowerTitle.includes('announcement')) {
      return {
        icon: 'megaphone' as const,
        color: Colors.info,
        bgColor: `${Colors.info}15`,
        label: 'Society Notice',
      };
    }

    return {
      icon: 'notifications' as const,
      color: Colors.primary,
      bgColor: Colors.primaryGhost,
      label: 'Notification',
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark Read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testLockScreenBtn} onPress={handleTestLockScreenAlert}>
          <Ionicons name="phone-portrait-outline" size={13} color={Colors.primary} />
          <Text style={styles.testLockScreenText}>Test Lock Screen</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications Found"
            description={filter === 'unread' ? 'You are all caught up! No unread messages.' : 'You have no system or broadcast notifications.'}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const catInfo = getNotificationCategoryInfo(item.type, item.title);
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Card style={[styles.cardInner, { borderLeftColor: catInfo.color }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: catInfo.bgColor }]}>
                        <Ionicons name={catInfo.icon} size={20} color={catInfo.color} />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.categoryLabel}>{catInfo.label}</Text>
                        <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
                      {!item.isRead && <View style={styles.blueDot} />}
                    </View>
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail View Modal */}
      <Modal visible={!!selectedNotif} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotif && (
              <>
                <View style={styles.modalTopRow}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: getNotificationCategoryInfo(selectedNotif.type, selectedNotif.title).bgColor }]}>
                      <Ionicons
                        name={getNotificationCategoryInfo(selectedNotif.type, selectedNotif.title).icon}
                        size={24}
                        color={getNotificationCategoryInfo(selectedNotif.type, selectedNotif.title).color}
                      />
                    </View>
                    <View>
                      <Text style={styles.categoryLabel}>
                        {getNotificationCategoryInfo(selectedNotif.type, selectedNotif.title).label}
                      </Text>
                      <Text style={styles.modalTime}>{formatTime(selectedNotif.createdAt)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedNotif(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalNotifTitle}>{selectedNotif.title}</Text>

                <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalNotifBody}>{selectedNotif.body}</Text>
                </ScrollView>

                <TouchableOpacity style={styles.dismissBtn} onPress={() => setSelectedNotif(null)}>
                  <Text style={styles.dismissBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryGhost,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  testLockScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryGhost,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  testLockScreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  notifCard: {
    borderRadius: BorderRadius.lg,
  },
  notifCardUnread: {
    ...Shadows.sm,
  },
  cardInner: {
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  categoryLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notifTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
  },
  notifTitleBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifBody: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyScroll: {
    flexGrow: 1,   
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  /* Modal Details */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '75%',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalNotifTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  modalBodyScroll: {
    maxHeight: 250,
    marginBottom: Spacing.lg,
  },
  modalNotifBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  dismissBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dismissBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontWeight: '700',
  },
});
