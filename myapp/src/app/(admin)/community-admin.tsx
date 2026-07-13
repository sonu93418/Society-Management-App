import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { useNotices, usePolls, useAllTickets } from '../../hooks/useCommunity';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';

export default function CommunityAdmin() {
  const { data: noticesResponse, isLoading: noticesLoading, refetch: refetchNotices } = useNotices();
  const { data: pollsResponse, isLoading: pollsLoading, refetch: refetchPolls } = usePolls();
  const { data: ticketsResponse, isLoading: ticketsLoading, refetch: refetchTickets } = useAllTickets();

  const notices = noticesResponse?.data?.notices || [];
  const polls = pollsResponse?.data || [];
  const tickets = ticketsResponse?.data?.tickets || [];

  const handleRefresh = async () => {
    await Promise.all([refetchNotices(), refetchPolls(), refetchTickets()]);
  };

  const isAnyLoading = noticesLoading || pollsLoading || ticketsLoading;

  const formatFlat = (flat: any) => {
    if (!flat) return 'General';
    if (typeof flat === 'object') {
      return `${flat.tower?.name || ''}-${flat.flatNumber}`;
    }
    return String(flat);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isAnyLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {/* Quick Create */}
        <View style={styles.createRow}>
          <Button title="Post Notice" variant="primary" size="sm" onPress={() => {}} icon={<Ionicons name="megaphone-outline" size={16} color={Colors.white} />} />
          <Button title="Create Poll" variant="secondary" size="sm" onPress={() => {}} icon={<Ionicons name="bar-chart-outline" size={16} color={Colors.primary} />} />
        </View>

        {/* Complaints Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Complaints</Text>
          <Badge label={`${openTickets.length} open`} variant="warning" />
        </View>

        {ticketsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : tickets.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg, fontStyle: 'italic' }}>No complaints filed.</Text>
        ) : (
          tickets.slice(0, 3).map((ticket) => (
            <Card key={ticket._id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <Text style={styles.ticketMeta}>Flat {formatFlat(ticket.flat)} • {formatTime(ticket.createdAt)}</Text>
                </View>
                <Badge label={ticket.priority} variant={ticket.priority as any} size="sm" />
              </View>
              <View style={styles.ticketFooter}>
                <Badge label={ticket.status} variant={ticket.status as any} />
                <TouchableOpacity onPress={() => router.push(`/(resident)/helpdesk/${ticket._id}`)}>
                  <Text style={styles.viewLink}>View →</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Recent Notices */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Notices</Text>
        {noticesLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : notices.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg, fontStyle: 'italic' }}>No notices published.</Text>
        ) : (
          notices.slice(0, 3).map((notice) => (
            <Card key={notice._id} style={styles.noticeCard}>
              <View style={styles.noticeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeMeta}>{formatTime(notice.createdAt)}</Text>
                </View>
                {notice.isPinned && <Badge label="Pinned" variant="danger" size="sm" />}
              </View>
            </Card>
          ))
        )}

        {/* Polls */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Active Polls</Text>
        {pollsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : polls.length === 0 ? (
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic' }}>No active polls.</Text>
        ) : (
          polls.slice(0, 2).map((poll) => {
            const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + (opt.votes?.length || 0), 0);
            return (
              <Card key={poll._id} style={{ marginBottom: Spacing.sm }}>
                <Text style={styles.pollTitle}>{poll.title}</Text>
                <View style={styles.pollStats}>
                  <Text style={styles.pollStat}>{totalVotes} votes</Text>
                  <Text style={styles.pollDot}>•</Text>
                  <Text style={styles.pollStat}>Ends {new Date(poll.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              </Card>
            );
          })
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
  addBtn: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg },
  createRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  ticketCard: { marginBottom: Spacing.md },
  ticketHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  ticketTitle: { ...Typography.bodyMedium, color: Colors.text },
  ticketMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  viewLink: { ...Typography.captionMedium, color: Colors.primary },
  noticeCard: { marginBottom: Spacing.sm },
  noticeRow: { flexDirection: 'row', alignItems: 'center' },
  noticeTitle: { ...Typography.bodyMedium, color: Colors.text },
  noticeMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  pollTitle: { ...Typography.bodyMedium, color: Colors.text },
  pollStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  pollStat: { ...Typography.caption, color: Colors.textSecondary },
  pollDot: { color: Colors.textTertiary },
});
