import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface PollOption {
  text: string;
  votes: number;
}

interface PollData {
  _id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  isAnonymous: boolean;
  endDate: string;
  hasVoted: boolean;
  votedIndex?: number;
}

import { usePolls, useVote } from '../../hooks/useCommunity';
import { ActivityIndicator } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';

export default function PollsScreen() {
  const { data: response, isLoading, refetch } = usePolls();
  const voteMutation = useVote();

  const polls = response?.data || [];

  const handleVote = (pollId: string, optionIndex: number) => {
    voteMutation.mutate(
      { pollId, optionIndex },
      {
        onSuccess: () => {
          Alert.alert('Vote Recorded', 'Your vote has been submitted successfully!');
          refetch();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to submit vote');
        },
      }
    );
  };

  const getDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Ended';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Polls</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : polls.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
          <EmptyState
            icon="bar-chart-outline"
            title="No Active Polls"
            description="You will see active society opinion polls here when they are published."
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {polls.map((poll) => (
          <Card key={poll._id} style={styles.pollCard}>
            <View style={styles.pollHeader}>
              <Text style={styles.pollTitle}>{poll.title}</Text>
              <Badge label={getDaysLeft(poll.endDate)} variant="info" size="sm" />
            </View>
            <Text style={styles.pollDesc}>{poll.description}</Text>

            {poll.isAnonymous && (
              <View style={styles.anonBadge}>
                <Ionicons name="eye-off-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.anonText}>Anonymous</Text>
              </View>
            )}

            {/* Options */}
            <View style={styles.optionsList}>
              {poll.options.map((option, i) => {
                const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                const isVoted = poll.votedIndex === i;
                const canVote = !poll.hasVoted;

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionItem, isVoted && styles.optionItemVoted]}
                    onPress={() => canVote && handleVote(poll._id, i)}
                    disabled={!canVote}
                    activeOpacity={canVote ? 0.7 : 1}
                  >
                    <View style={styles.optionBar}>
                      <View style={[styles.optionBarFill, { width: `${percentage}%` }, isVoted && styles.optionBarVoted]} />
                    </View>
                    <View style={styles.optionContent}>
                      <View style={styles.optionLeft}>
                        {canVote ? (
                          <View style={styles.radio} />
                        ) : isVoted ? (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        ) : (
                          <View style={styles.radioDisabled} />
                        )}
                        <Text style={[styles.optionText, isVoted && styles.optionTextVoted]}>{option.text}</Text>
                      </View>
                      <Text style={[styles.optionPercent, isVoted && { color: Colors.primary }]}>{percentage}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.pollFooter}>
              <Text style={styles.pollVotes}>{poll.totalVotes} votes</Text>
              {poll.hasVoted && <Badge label="Voted" variant="success" size="sm" />}
            </View>
          </Card>
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
  pollCard: { marginBottom: Spacing.lg },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pollTitle: { ...Typography.h4, color: Colors.text, flex: 1, marginRight: Spacing.md },
  pollDesc: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.md },
  anonBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  anonText: { ...Typography.caption, color: Colors.textTertiary },
  optionsList: { gap: Spacing.sm },
  optionItem: { borderRadius: BorderRadius.md, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.borderLight },
  optionItemVoted: { borderColor: Colors.primary },
  optionBar: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  optionBarFill: { height: '100%', backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.md },
  optionBarVoted: { backgroundColor: Colors.primarySoft },
  optionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
  radioDisabled: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.borderLight },
  optionText: { ...Typography.bodySm, color: Colors.text, flex: 1 },
  optionTextVoted: { fontWeight: '600', color: Colors.primary },
  optionPercent: { ...Typography.captionMedium, color: Colors.textSecondary },
  pollFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  pollVotes: { ...Typography.captionMedium, color: Colors.textTertiary },
});
