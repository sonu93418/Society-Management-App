import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNotices } from '../../hooks/useCommunity';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NoticesScreen() {
  const params = useLocalSearchParams();
  const targetId = params.id as string | undefined;

  const [expanded, setExpanded] = React.useState<string | null>(null);
  const { data: response, isLoading } = useNotices();

  React.useEffect(() => {
    if (targetId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(targetId);
    }
  }, [targetId]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const notices = response?.data?.notices || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getAuthorName = (author: any) => {
    if (!author) return 'Admin';
    if (typeof author === 'object') return author.name || 'Admin';
    return 'Admin';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notices</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={[styles.noticeCard, { padding: Spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton width={40} height={40} borderRadius={BorderRadius.md} />
                <View style={{ flex: 1, marginLeft: Spacing.md, gap: Spacing.xs }}>
                  <Skeleton width="70%" height={16} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : notices.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
          <EmptyState
            icon="megaphone-outline"
            title="No Notices Yet"
            description="You will see notices and announcements here when the committee posts them."
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Pinned notices */}
          {notices.filter((n) => n.isPinned).map((notice) => (
            <Card key={notice._id} style={styles.pinnedCard}>
              <View style={styles.pinnedHeader}>
                <View style={styles.pinnedIcon}>
                  <Ionicons name="pin" size={16} color={Colors.danger} />
                </View>
                <Text style={styles.pinnedLabel}>PINNED</Text>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeContent}>{notice.content}</Text>
              <View style={styles.noticeMeta}>
                <Ionicons name="person-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.noticeAuthor}>{getAuthorName(notice.author)}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
              </View>
            </Card>
          ))}

          {/* Regular notices */}
          {notices.filter((n) => !n.isPinned).map((notice) => (
            <TouchableOpacity key={notice._id} activeOpacity={0.7} onPress={() => toggleExpand(notice._id)}>
              <Card style={styles.noticeCard}>
                <View style={styles.noticeRow}>
                  <View style={[styles.noticeIcon, { backgroundColor: Colors.primaryGhost }]}>
                    <Ionicons name="megaphone" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.noticeInfo}>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    <Text style={styles.noticeTimeAgo}>{getTimeAgo(notice.createdAt)}</Text>
                  </View>
                  <Ionicons name={expanded === notice._id ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
                </View>
                {expanded === notice._id && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.noticeContent}>{notice.content}</Text>
                    <View style={styles.noticeMeta}>
                      <Ionicons name="person-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.noticeAuthor}>{getAuthorName(notice.author)}</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                    </View>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },
  pinnedCard: { marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  pinnedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  pinnedIcon: { marginRight: Spacing.xs },
  pinnedLabel: { ...Typography.captionMedium, color: Colors.danger, letterSpacing: 1 },
  noticeCard: { marginBottom: Spacing.md },
  noticeRow: { flexDirection: 'row', alignItems: 'center' },
  noticeIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  noticeInfo: { flex: 1, marginLeft: Spacing.md },
  noticeTitle: { ...Typography.bodyMedium, color: Colors.text },
  noticeTimeAgo: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  expandedContent: { marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  noticeContent: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  noticeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.xs },
  noticeAuthor: { ...Typography.caption, color: Colors.textTertiary },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary },
  noticeDate: { ...Typography.caption, color: Colors.textTertiary },
});
