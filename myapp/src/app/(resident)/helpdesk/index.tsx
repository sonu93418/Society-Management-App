import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../theme';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuthStore } from '../../../store/auth.store';
import type { TicketCategory, TicketPriority } from '../../../types/models';

import { useMyTickets, useCreateTicket } from '../../../hooks/useCommunity';
import { ActivityIndicator } from 'react-native';

const categories: { key: TicketCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { key: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { key: 'carpentry', label: 'Carpentry', icon: 'hammer-outline' },
  { key: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
  { key: 'security', label: 'Security', icon: 'shield-outline' },
  { key: 'parking', label: 'Parking', icon: 'car-outline' },
  { key: 'noise', label: 'Noise', icon: 'volume-high-outline' },
  { key: 'common_area', label: 'Common Area', icon: 'business-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const priorities: { key: TicketPriority; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: '#64748B' },
  { key: 'medium', label: 'Medium', color: Colors.warning },
  { key: 'high', label: 'High', color: '#EA580C' },
  { key: 'urgent', label: 'Urgent', color: Colors.danger },
];

export default function HelpdeskScreen() {
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('medium');

  const { data: response, isLoading, refetch } = useMyTickets();
  const createTicketMutation = useCreateTicket();

  const tickets = response?.data?.tickets || [];

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const flatId = typeof user?.flat === 'object' ? user.flat?._id : user?.flat;
    if (!flatId) {
      Alert.alert('Error', 'No flat is associated with your account');
      return;
    }

    createTicketMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        flatId: flatId,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Complaint raised successfully! You will be notified of updates.');
          setShowCreate(false);
          setTitle('');
          setDescription('');
          setSelectedCategory(null);
          refetch();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to create ticket');
        },
      }
    );
  };

  if (showCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Raise Complaint</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Input label="Title *" placeholder="Brief description of the issue" value={title} onChangeText={setTitle} leftIcon="document-text-outline" />
          <Input label="Description *" placeholder="Provide details about the issue..." value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />

          {/* Category Selection */}
          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Ionicons name={cat.icon} size={16} color={selectedCategory === cat.key ? Colors.white : Colors.primary} />
                <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.priorityChip, selectedPriority === p.key && { backgroundColor: p.color, borderColor: p.color }]}
                onPress={() => setSelectedPriority(p.key)}
              >
                <Text style={[styles.priorityText, selectedPriority === p.key && { color: Colors.white }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Submit Complaint" onPress={handleCreate} loading={createTicketMutation.isPending} fullWidth size="lg" style={{ marginTop: Spacing['2xl'] }} icon={<Ionicons name="send" size={20} color={Colors.white} />} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    );
  }

  // Count statuses
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helpdesk</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Open', count: openCount, color: Colors.warning },
              { label: 'In Progress', count: inProgressCount, color: '#3B82F6' },
              { label: 'Resolved', count: resolvedCount, color: Colors.success },
            ].map((stat, i) => (
              <View key={i} style={[styles.statChip, { backgroundColor: `${stat.color}15` }]}>
                <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
                <Text style={[styles.statLabel, { color: stat.color }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Ticket List */}
          {tickets.length === 0 ? (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No Complaints Yet"
              description="Raise a helpdesk request if you need assistance with any maintenance or community issues."
            />
          ) : (
            tickets.map((ticket) => {
              const catInfo = categories.find((c) => c.key === ticket.category);
              return (
                <TouchableOpacity
                  key={ticket._id}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(resident)/helpdesk/${ticket._id}`)}
                >
                  <Card style={styles.ticketCard}>
                    <View style={styles.ticketRow}>
                      <View style={[styles.ticketIcon, { backgroundColor: Colors.primaryGhost }]}>
                        <Ionicons name={catInfo?.icon || 'help-outline'} size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.ticketInfo}>
                        <Text style={styles.ticketTitle}>{ticket.title}</Text>
                        <Text style={styles.ticketMeta}>{catInfo?.label || ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View style={styles.ticketFooter}>
                      <Badge label={ticket.status} variant={ticket.status as any} />
                      <Badge label={ticket.priority} variant={ticket.priority as any} size="sm" />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
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
  addBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  statChip: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  statCount: { ...Typography.h4 },
  statLabel: { ...Typography.caption, marginTop: 2 },
  ticketCard: { marginBottom: Spacing.md },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  ticketIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  ticketInfo: { flex: 1, marginLeft: Spacing.md },
  ticketTitle: { ...Typography.bodyMedium, color: Colors.text },
  ticketMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.xs },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { ...Typography.captionMedium, color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white },
  priorityRow: { flexDirection: 'row', gap: Spacing.md },
  priorityChip: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border },
  priorityText: { ...Typography.captionMedium, color: Colors.textSecondary },
});
