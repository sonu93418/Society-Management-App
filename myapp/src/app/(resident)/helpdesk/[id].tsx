import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../theme';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useTicketDetails, useAddTicketReply, useUpdateTicketStatus } from '../../../hooks/useCommunity';
import { useAuthStore } from '../../../store/auth.store';
import { useSuccessModal } from '../../../components/ui/SuccessModal';

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: detailsRes, isLoading, refetch } = useTicketDetails(id);
  const addReplyMutation = useAddTicketReply();
  const updateStatusMutation = useUpdateTicketStatus();

  const [replyMessage, setReplyMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const ticket = detailsRes?.data?.ticket;
  const replies = detailsRes?.data?.replies || [];

  const { showSuccess } = useSuccessModal();

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(
      { ticketId: id, status: newStatus },
      {
        onSuccess: () => {
          refetch();
          
          if (newStatus === 'resolved') {
            showSuccess({
              title: '🎉 Issue Resolved',
              message: 'Your maintenance complaint has been successfully resolved! Thank you for your feedback.',
              taskType: 'ticket_resolved',
              details: [
                { label: 'Ticket ID', value: id?.slice(-6).toUpperCase() || '' },
                { label: 'Issue Title', value: ticket?.title || 'Helpdesk Request' },
                { label: 'Category', value: getCategoryLabel(ticket?.category || '') },
                { label: 'New Status', value: 'RESOLVED (FIXED) ✅' }
              ],
            });
          } else {
            showSuccess({
              title: '🔄 Status Updated',
              message: `The ticket status has been updated to "${newStatus.replace('_', ' ')}".`,
              taskType: 'ticket_created',
              details: [
                { label: 'Ticket ID', value: id?.slice(-6).toUpperCase() || '' },
                { label: 'Issue Title', value: ticket?.title || 'Helpdesk Request' },
                { label: 'New Status', value: newStatus.toUpperCase() }
              ],
            });
          }
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to update status');
        },
      }
    );
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;

    addReplyMutation.mutate(
      { ticketId: id, message: replyMessage.trim() },
      {
        onSuccess: () => {
          setReplyMessage('');
          refetch();
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 300);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to send reply');
        },
      }
    );
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          <Card style={{ padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="40%" height={20} />
              <Skeleton width="20%" height={20} borderRadius={BorderRadius.md} />
            </View>
            <Skeleton width="100%" height={16} />
            <Skeleton width="85%" height={16} />
            <View style={{ height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.xs }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="30%" height={12} />
              <Skeleton width="35%" height={12} />
            </View>
          </Card>
          <Text style={{ ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md }}>Replies</Text>
          {[1, 2].map((i) => (
            <Card key={i} style={{ padding: Spacing.md, gap: Spacing.sm, width: '80%', alignSelf: i === 1 ? 'flex-end' : 'flex-start', marginBottom: Spacing.md }}>
              <Skeleton width="100%" height={14} />
              <Skeleton width="60%" height={12} />
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <Text style={styles.errorText}>Ticket not found.</Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Complaint Details</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Ionicons name="refresh" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Main Ticket Summary Card */}
          <Card style={styles.ticketCard}>
            <View style={styles.ticketMetaHeader}>
              <Badge label={ticket.status} variant={ticket.status as any} />
              <Badge label={ticket.priority} variant={ticket.priority as any} size="sm" />
            </View>

            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketDesc}>{ticket.description}</Text>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaVal}>{getCategoryLabel(ticket.category)}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Raised On</Text>
                <Text style={styles.metaVal}>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
            </View>

            {user?.role === 'admin' && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.metaLabel, { marginBottom: Spacing.sm }]}>Admin Status Controls</Text>
                <View style={styles.adminActionRow}>
                  {ticket.status === 'open' && (
                    <Button
                      title="Start Progress"
                      onPress={() => handleStatusChange('in_progress')}
                      size="sm"
                      variant="primary"
                      style={{ flex: 1 }}
                      icon={<Ionicons name="play-outline" size={16} color={Colors.white} />}
                    />
                  )}
                  {ticket.status === 'in_progress' && (
                    <Button
                      title="Resolve"
                      onPress={() => handleStatusChange('resolved')}
                      size="sm"
                      variant="success"
                      style={{ flex: 1 }}
                      icon={<Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />}
                    />
                  )}
                  {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                    <Button
                      title="Close Ticket"
                      onPress={() => handleStatusChange('closed')}
                      size="sm"
                      variant="danger"
                      style={{ flex: 1 }}
                      icon={<Ionicons name="close-circle-outline" size={16} color={Colors.white} />}
                    />
                  )}
                </View>
              </>
            )}
          </Card>

          {/* Ticket Replies / Activity Logs */}
          <Text style={styles.sectionTitle}>Activity & Replies</Text>

          {replies.length === 0 ? (
            <View style={styles.emptyReplies}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyRepliesText}>No replies yet. Type below to write a message.</Text>
            </View>
          ) : (
            replies.map((reply) => {
              const isMe = reply.user?._id === user?.id || reply.user?._id === user?._id;
              const initial = reply.user?.name ? reply.user.name.charAt(0).toUpperCase() : 'U';

              return (
                <View key={reply._id} style={[styles.replyWrapper, isMe ? styles.replyRight : styles.replyLeft]}>
                  {!isMe && (
                    <View style={styles.replyAvatar}>
                      <Text style={styles.replyAvatarText}>{initial}</Text>
                    </View>
                  )}
                  <View style={[styles.replyBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.senderName, isMe ? styles.senderRight : styles.senderLeft]}>
                      {reply.user?.name || 'User'}
                    </Text>
                    <Text style={[styles.replyText, isMe && styles.textRight]}>{reply.message}</Text>
                    <Text style={[styles.replyTime, isMe && styles.timeRight]}>
                      {new Date(reply.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {isMe && (
                    <View style={[styles.replyAvatar, { backgroundColor: Colors.primary, marginLeft: Spacing.sm, marginRight: 0 }]}>
                      <Text style={[styles.replyAvatarText, { color: Colors.white }]}>{initial}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Type a message..."
            value={replyMessage}
            onChangeText={setReplyMessage}
            style={styles.chatInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyMessage.trim() && styles.sendBtnDisabled]}
            disabled={!replyMessage.trim() || addReplyMutation.isPending}
            onPress={handleSendReply}
          >
            {addReplyMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text, flex: 1, marginLeft: Spacing.md, marginRight: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  refreshBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },

  ticketCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  ticketMetaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  ticketTitle: { ...Typography.h3, color: Colors.text },
  ticketDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 22 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaCol: { flex: 1 },
  metaLabel: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  metaVal: { ...Typography.bodySm, color: Colors.text, marginTop: 2, fontWeight: '500' },

  sectionTitle: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: Spacing.md },
  emptyReplies: { alignItems: 'center', paddingVertical: Spacing['3xl'], opacity: 0.8 },
  emptyRepliesText: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', marginHorizontal: Spacing.xl },

  replyWrapper: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end', width: '100%' },
  replyLeft: { justifyContent: 'flex-start' },
  replyRight: { justifyContent: 'flex-end' },
  replyAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  replyAvatarText: { ...Typography.captionMedium, color: Colors.primary, fontWeight: 'bold' },
  replyBubble: { padding: Spacing.md, borderRadius: BorderRadius.lg, maxWidth: '80%' },
  bubbleLeft: { backgroundColor: Colors.white, borderBottomLeftRadius: 2, ...Shadows.xs },
  bubbleRight: { backgroundColor: Colors.primaryGhost, borderBottomRightRadius: 2 },
  senderName: { ...Typography.caption, fontWeight: '600', marginBottom: 2 },
  senderLeft: { color: Colors.textSecondary },
  senderRight: { color: Colors.primary, textAlign: 'right' },
  replyText: { ...Typography.bodySm, color: Colors.text, lineHeight: 18 },
  textRight: { textAlign: 'right' },
  replyTime: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing.xs, fontSize: 9 },
  timeRight: { textAlign: 'right' },

  inputContainer: { flexDirection: 'row', padding: Spacing.sm, backgroundColor: Colors.white, borderTopWidth: 1, borderColor: Colors.borderLight, alignItems: 'center' },
  chatInput: { flex: 1, minHeight: 40, maxHeight: 80, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Typography.bodySm, color: Colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  sendBtnDisabled: { backgroundColor: Colors.primaryGhost, opacity: 0.5 },
  adminActionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
});
