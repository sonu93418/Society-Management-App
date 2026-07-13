import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count?: number;
  color: string;
  bgColor: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, count, color, bgColor, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    {count !== undefined && (
      <View style={styles.menuCount}>
        <Text style={styles.menuCountText}>{count}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
  </TouchableOpacity>
);

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notices */}
        <Card style={styles.menuCard}>
          <MenuItem icon="megaphone" label="Notices" count={4} color={Colors.warning} bgColor={Colors.warningLight} onPress={() => router.push('/(resident)/notices')} />
          <View style={styles.separator} />
          <MenuItem icon="bar-chart" label="Polls" count={2} color={Colors.primary} bgColor={Colors.primaryGhost} onPress={() => router.push('/(resident)/polls')} />
          <View style={styles.separator} />
          <MenuItem icon="chatbubble-ellipses" label="Helpdesk" count={1} color={Colors.danger} bgColor={Colors.dangerLight} onPress={() => router.push('/(resident)/helpdesk')} />
        </Card>

        {/* Amenities & Payments */}
        <Card style={styles.menuCard}>
          <MenuItem icon="fitness" label="Amenities" color={Colors.success} bgColor={Colors.successLight} onPress={() => router.push('/(resident)/amenities')} />
          <View style={styles.separator} />
          <MenuItem icon="calendar" label="My Bookings" count={3} color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" onPress={() => router.push('/(resident)/amenities')} />
          <View style={styles.separator} />
          <MenuItem icon="wallet" label="Payments" count={1} color="#EC4899" bgColor="rgba(236,72,153,0.12)" onPress={() => router.push('/(resident)/payments')} />
        </Card>

        {/* Directory */}
        <Card style={styles.menuCard}>
          <MenuItem icon="people" label="Staff Directory" color={Colors.info} bgColor={Colors.infoLight} onPress={() => router.push('/(resident)/staff')} />
          <View style={styles.separator} />
          <MenuItem icon="call" label="Emergency Contacts" color={Colors.danger} bgColor={Colors.dangerLight} onPress={() => router.push('/(resident)/staff')} />
        </Card>

        {/* Active Poll Preview */}
        <Text style={styles.sectionTitle}>Active Polls</Text>
        <Card>
          <Text style={styles.pollTitle}>Should we install EV charging stations?</Text>
          <Text style={styles.pollMeta}>Ends in 7 days • 16 votes</Text>
          <View style={styles.pollOptions}>
            {['Yes, definitely needed', 'No, not necessary', 'Yes, but only 2'].map((opt, i) => (
              <View key={i} style={styles.pollOption}>
                <View style={styles.pollBar}>
                  <View style={[styles.pollBarFill, { width: `${[50, 19, 31][i]}%` }]} />
                </View>
                <View style={styles.pollOptionRow}>
                  <Text style={styles.pollOptionText}>{opt}</Text>
                  <Text style={styles.pollPercent}>{[50, 19, 31][i]}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text },
  scrollContent: { paddingHorizontal: Spacing.lg },
  menuCard: { marginBottom: Spacing.lg, padding: Spacing.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...Typography.bodyMedium, color: Colors.text, flex: 1, marginLeft: Spacing.md },
  menuCount: { backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2, marginRight: Spacing.sm },
  menuCountText: { ...Typography.captionMedium, color: Colors.primary },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  pollTitle: { ...Typography.bodyMedium, color: Colors.text },
  pollMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  pollOptions: { gap: Spacing.sm },
  pollOption: {},
  pollBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xs },
  pollBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  pollOptionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pollOptionText: { ...Typography.bodySm, color: Colors.textSecondary },
  pollPercent: { ...Typography.captionMedium, color: Colors.primary },
});
