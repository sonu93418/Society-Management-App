import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { router } from 'expo-router';
import { useTowers, useFlats, useResidents } from '../../hooks/useAdmin';
import { useStaff } from '../../hooks/useCommunity';

interface ManageItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count?: number;
  loading?: boolean;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

const ManageItem: React.FC<ManageItemProps> = ({ icon, label, count, loading, color, bgColor, onPress }) => (
  <TouchableOpacity style={styles.manageItem} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.manageIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.manageLabel}>{label}</Text>
    {loading ? (
      <ActivityIndicator size="small" color={color} style={{ marginRight: Spacing.sm }} />
    ) : count !== undefined ? (
      <Text style={styles.manageCount}>{count}</Text>
    ) : null}
    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
  </TouchableOpacity>
);

export default function ManageScreen() {
  const { data: towersRes, isLoading: towersLoading } = useTowers();
  const { data: flatsRes, isLoading: flatsLoading } = useFlats();
  const { data: residentsRes, isLoading: residentsLoading } = useResidents();
  const { data: staffRes, isLoading: staffLoading } = useStaff();

  const towersCount = towersRes?.data?.length;
  const flatsCount = flatsRes?.data?.length;
  const residentsCount = residentsRes?.data?.residents?.length;
  const staffCount = staffRes?.data?.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Society</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Infrastructure */}
        <Text style={styles.sectionTitle}>Infrastructure</Text>
        <Card style={styles.menuCard}>
          <ManageItem
            icon="business"
            label="Towers"
            count={towersCount}
            loading={towersLoading}
            color={Colors.primary}
            bgColor={Colors.primaryGhost}
            onPress={() => router.push('/(admin)/towers')}
          />
          <View style={styles.separator} />
          <ManageItem
            icon="home"
            label="Flats"
            count={flatsCount}
            loading={flatsLoading}
            color="#8B5CF6"
            bgColor="rgba(139,92,246,0.12)"
            onPress={() => router.push('/(admin)/flats')}
          />
        </Card>

        {/* People */}
        <Text style={styles.sectionTitle}>People</Text>
        <Card style={styles.menuCard}>
          <ManageItem
            icon="people"
            label="Residents"
            count={residentsCount}
            loading={residentsLoading}
            color={Colors.success}
            bgColor={Colors.successLight}
            onPress={() => router.push('/(admin)/residents')}
          />
          <View style={styles.separator} />
          <ManageItem
            icon="construct"
            label="Staff & Services"
            count={staffCount}
            loading={staffLoading}
            color="#3B82F6"
            bgColor={Colors.infoLight}
            onPress={() => router.push('/(admin)/staff')}
          />
        </Card>

        {/* Operations */}
        <Text style={styles.sectionTitle}>Operations</Text>
        <Card style={styles.menuCard}>
          <ManageItem icon="fitness" label="Amenities" count={4} color={Colors.success} bgColor={Colors.successLight} />
          <View style={styles.separator} />
          <ManageItem icon="calendar" label="Bookings" count={6} color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" />
          <View style={styles.separator} />
          <ManageItem icon="wallet" label="Payments" count={12} color="#EC4899" bgColor="rgba(236,72,153,0.12)" />
        </Card>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.menuCard}>
          <ManageItem icon="settings" label="Society Settings" color={Colors.textSecondary} bgColor={Colors.background} />
          <View style={styles.separator} />
          <ManageItem icon="document-text" label="Reports" color={Colors.textSecondary} bgColor={Colors.background} />
        </Card>

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text },
  scrollContent: { paddingHorizontal: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.lg },
  menuCard: { padding: Spacing.xs },
  manageItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  manageIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  manageLabel: { ...Typography.bodyMedium, color: Colors.text, flex: 1, marginLeft: Spacing.md },
  manageCount: { ...Typography.bodyMedium, color: Colors.textTertiary, marginRight: Spacing.sm },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
});
