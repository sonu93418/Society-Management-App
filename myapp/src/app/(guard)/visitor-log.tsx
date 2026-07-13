import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { VisitorStatus, VisitorType } from '../../types/models';

import { useMyVisitors } from '../../hooks/useVisitors';
import { ActivityIndicator } from 'react-native';

const typeIcons: Record<VisitorType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  guest: { icon: 'person', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  delivery: { icon: 'cube', color: Colors.warning, bg: Colors.warningLight },
  cab: { icon: 'car', color: '#3B82F6', bg: Colors.infoLight },
  service: { icon: 'construct', color: Colors.success, bg: Colors.successLight },
};

const filters: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'inside', label: 'Inside' },
  { key: 'exited', label: 'Exited' },
];

export default function VisitorLog() {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: response, isLoading, refetch } = useMyVisitors(
    activeFilter === 'all' ? undefined : { status: activeFilter }
  );

  const visitors = response?.data?.visitors || [];

  const formatFlat = (flat: any) => {
    if (!flat) return 'Unknown';
    if (typeof flat === 'object') {
      return `${flat.tower?.name || ''}-${flat.flatNumber}`;
    }
    return String(flat);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: any }) => {
    const typeInfo = typeIcons[item.type as VisitorType] || typeIcons.guest;
    return (
      <Card style={styles.logCard}>
        <View style={styles.logRow}>
          <View style={[styles.logIcon, { backgroundColor: typeInfo.bg }]}>
            <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logName}>{item.visitorName}</Text>
            <Text style={styles.logMeta}>Flat {formatFlat(item.flat)} • {item.visitorPhone}</Text>
          </View>
          <View style={styles.logRight}>
            <Badge label={item.status} variant={item.status as any} size="sm" />
            <Text style={styles.logTime}>{formatTime(item.updatedAt)}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Visitor Log</Text>
        <Text style={styles.subtitle}>Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={visitors}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <Text style={{ ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl }}>No visitors found matching filter.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  filters: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full, backgroundColor: Colors.white, ...Shadows.xs },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },
  logCard: { marginBottom: Spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  logIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  logInfo: { flex: 1, marginLeft: Spacing.md },
  logName: { ...Typography.bodyMedium, color: Colors.text },
  logMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  logRight: { alignItems: 'flex-end', gap: Spacing.xs },
  logTime: { ...Typography.caption, color: Colors.textTertiary },
});
