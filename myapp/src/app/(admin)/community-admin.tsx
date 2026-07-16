import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

import { useNotices, usePolls, useAllTickets, useCreateNotice, useCreatePoll, useDeleteNotice } from '../../hooks/useCommunity';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { getApiError } from '../../api/client';

export default function CommunityAdmin() {
  const { data: noticesResponse, isLoading: noticesLoading, refetch: refetchNotices } = useNotices();
  const { data: pollsResponse, isLoading: pollsLoading, refetch: refetchPolls } = usePolls();
  const { data: ticketsResponse, isLoading: ticketsLoading, refetch: refetchTickets } = useAllTickets();

  const createNoticeMutation = useCreateNotice();
  const createPollMutation = useCreatePoll();
  const deleteNoticeMutation = useDeleteNotice();

  const handleDeleteNotice = (noticeId: string) => {
    Alert.alert(
      'Delete Notice',
      'Are you sure you want to delete this notice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteNoticeMutation.mutate(noticeId, {
               onSuccess: () => {
                 Alert.alert('Success', 'Notice deleted successfully');
                 refetchNotices();
               },
               onError: (err) => {
                 Alert.alert('Error', getApiError(err));
               }
            });
          }
        }
      ]
    );
  };

  const notices = noticesResponse?.data?.notices || [];
  const polls = pollsResponse?.data || [];
  const tickets = ticketsResponse?.data?.tickets || [];

  // Modals Visibility
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);

  // Poll Form State
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDays, setPollDays] = useState('7');

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

  // --- Submit Handlers ---
  const handleCreateNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      Alert.alert('Error', 'Please fill in notice title and content');
      return;
    }

    createNoticeMutation.mutate(
      {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        isPinned: noticePinned,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Notice published successfully!');
          setNoticeModalVisible(false);
          setNoticeTitle('');
          setNoticeContent('');
          setNoticePinned(false);
          refetchNotices();
        },
        onError: (err: any) => {
          Alert.alert('Error', getApiError(err));
        },
      }
    );
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  const addOptionField = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOptionField = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = () => {
    if (!pollTitle.trim()) {
      Alert.alert('Error', 'Please enter a poll question/title');
      return;
    }

    const filteredOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      Alert.alert('Error', 'Please enter at least 2 non-empty options');
      return;
    }

    const daysNum = parseInt(pollDays, 10);
    if (isNaN(daysNum) || daysNum <= 0) {
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }

    const endDate = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000).toISOString();

    createPollMutation.mutate(
      {
        title: pollTitle.trim(),
        description: pollDescription.trim() || undefined,
        options: filteredOptions,
        endDate,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Opinion poll created successfully!');
          setPollModalVisible(false);
          setPollTitle('');
          setPollDescription('');
          setPollOptions(['', '']);
          setPollDays('7');
          refetchPolls();
        },
        onError: (err: any) => {
          Alert.alert('Error', getApiError(err));
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Alert.alert(
              'Create New',
              'Choose what you want to publish to the community:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Post Notice 📢', onPress: () => setNoticeModalVisible(true) },
                { text: 'Create Poll 🗳️', onPress: () => setPollModalVisible(true) },
              ]
            );
          }}
        >
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
          <Button
            title="Post Notice"
            variant="primary"
            size="sm"
            onPress={() => setNoticeModalVisible(true)}
            icon={<Ionicons name="megaphone-outline" size={16} color={Colors.white} />}
            style={{ flex: 1 }}
          />
          <Button
            title="Create Poll"
            variant="primary"
            size="sm"
            onPress={() => setPollModalVisible(true)}
            icon={<Ionicons name="bar-chart-outline" size={16} color={Colors.white} />}
            style={{ flex: 1 }}
          />
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
                {notice.isPinned && <Badge label="Pinned" variant="danger" size="sm" style={{ marginRight: Spacing.sm }} />}
                <TouchableOpacity
                  onPress={() => handleDeleteNotice(notice._id)}
                  style={styles.deleteNoticeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
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

      {/* --- NOTICE CREATION MODAL --- */}
      <Modal visible={noticeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            style={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Post New Notice</Text>
                <TouchableOpacity onPress={() => setNoticeModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Input
                  label="Title *"
                  placeholder="Notice headline"
                  value={noticeTitle}
                  onChangeText={setNoticeTitle}
                  leftIcon="document-text-outline"
                />

                <Input
                  label="Content *"
                  placeholder="Write notice description..."
                  value={noticeContent}
                  onChangeText={setNoticeContent}
                  multiline
                  numberOfLines={5}
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />

                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchLabel}>Pin to Top</Text>
                    <Text style={styles.switchDesc}>Keep notice highlighted at community banner</Text>
                  </View>
                  <Switch
                    value={noticePinned}
                    onValueChange={setNoticePinned}
                    trackColor={{ false: Colors.border, true: Colors.danger }}
                    thumbColor={Colors.white}
                  />
                </View>

                <Button
                  title="Publish Notice"
                  onPress={handleCreateNotice}
                  loading={createNoticeMutation.isPending}
                  fullWidth
                  style={{ marginTop: Spacing['2xl'] }}
                  icon={<Ionicons name="send" size={20} color={Colors.white} />}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- POLL CREATION MODAL --- */}
      <Modal visible={pollModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            style={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Opinion Poll</Text>
                <TouchableOpacity onPress={() => setPollModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Input
                  label="Question / Title *"
                  placeholder="e.g. Should we install EV charging stations?"
                  value={pollTitle}
                  onChangeText={setPollTitle}
                  leftIcon="help-circle-outline"
                />

                <Input
                  label="Description (Optional)"
                  placeholder="Details or cost estimates of the proposal"
                  value={pollDescription}
                  onChangeText={setPollDescription}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 70, textAlignVertical: 'top' }}
                />

                <Text style={styles.fieldLabel}>Poll Options (Min. 2, Max. 5)</Text>
                {pollOptions.map((option, idx) => (
                  <View key={idx} style={styles.optionInputRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChangeText={(text) => handleOptionChange(text, idx)}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                    {pollOptions.length > 2 && (
                      <TouchableOpacity style={styles.optionRemoveBtn} onPress={() => removeOptionField(idx)}>
                        <Ionicons name="remove-circle-outline" size={24} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {pollOptions.length < 5 && (
                  <TouchableOpacity style={styles.addOptionBtn} onPress={addOptionField}>
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.addOptionText}>Add Option</Text>
                  </TouchableOpacity>
                )}

                <Input
                  label="Duration (in Days) *"
                  placeholder="e.g. 7"
                  keyboardType="numeric"
                  value={pollDays}
                  onChangeText={setPollDays}
                  leftIcon="time-outline"
                  containerStyle={{ marginTop: Spacing.md }}
                />

                <Button
                  title="Create Poll"
                  onPress={handleCreatePoll}
                  loading={createPollMutation.isPending}
                  fullWidth
                  style={{ marginTop: Spacing['2xl'] }}
                  icon={<Ionicons name="send" size={20} color={Colors.white} />}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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

  // Modals Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '85%', ...Shadows.lg },
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

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md, paddingVertical: Spacing.xs },
  switchLabel: { ...Typography.bodyMedium, color: Colors.text },
  switchDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  optionInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  optionRemoveBtn: { padding: Spacing.xs, justifyContent: 'center', alignItems: 'center' },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs, marginTop: Spacing.xs },
  addOptionText: { ...Typography.bodySm, color: Colors.primary, fontWeight: '600' },
  deleteNoticeBtn: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
