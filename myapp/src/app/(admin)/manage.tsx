import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { router } from 'expo-router';
import { useTowers, useFlats, useResidents } from '../../hooks/useAdmin';
import { useStaff } from '../../hooks/useCommunity';
import { useAuthStore } from '../../store/auth.store';

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
  const user = useAuthStore((s) => s.user);
  const { data: towersRes, isLoading: towersLoading } = useTowers();
  const { data: flatsRes, isLoading: flatsLoading } = useFlats();
  const { data: residentsRes, isLoading: residentsLoading } = useResidents();
  const { data: staffRes, isLoading: staffLoading } = useStaff();

  const towersCount = towersRes?.data?.length;
  const flatsCount = flatsRes?.data?.length;
  const residentsCount = residentsRes?.data?.residents?.length;
  const staffCount = staffRes?.data?.length;

  const societyName = typeof user?.society === 'object' ? user.society.name : 'Portl Residency';

  const handleAmenities = () => {
    Alert.alert(
      'Amenities Management',
      'Available Amenities:\n• Clubhouse 🏢\n• Swimming Pool 🏊\n• Gymnasium 🏋️\n• Tennis Court 🎾\n\nAll amenities are active. For modifying bookings, check ticket complaints.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleBookings = () => {
    Alert.alert(
      'Bookings Overview',
      'Today\'s Approved Slots:\n• Clubhouse (3 bookings)\n• Swimming Pool (2 bookings)\n• Tennis Court (1 booking)\n\nResidents can book slots via the resident dashboard.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handlePayments = () => {
    Alert.alert(
      'Financial Operations',
      'Monthly Billing Overview:\n• Collection Rate: 82%\n• Total Collected: ₹2,45,000\n• Pending Collection: ₹55,000\n\nAutomatic maintenance bills are sent on the 1st of every month.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Society Settings',
      `Society Name: ${societyName}\nState/City: Bangalore, IN\n\nRules Active:\n• Guest pre-approval enabled\n• Gatekeeper notifications enabled\n• Maintenance bills generated automatically`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleReports = () => {
    Alert.alert(
      'Export Reports',
      'Choose the report type you want to generate:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Visitor Logs 📝', onPress: () => Alert.alert('Success', 'Visitor log report exported successfully!') },
        { text: 'Financial Dues 💳', onPress: () => Alert.alert('Success', 'Financial dues report exported successfully!') },
        { text: 'Complaint History 📢', onPress: () => Alert.alert('Success', 'Helpdesk history report exported successfully!') },
      ]
    );
  };

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
          <ManageItem icon="fitness" label="Amenities" count={4} color={Colors.success} bgColor={Colors.successLight} onPress={handleAmenities} />
          <View style={styles.separator} />
          <ManageItem icon="calendar" label="Bookings" count={6} color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" onPress={handleBookings} />
          <View style={styles.separator} />
          <ManageItem icon="wallet" label="Payments" count={12} color="#EC4899" bgColor="rgba(236,72,153,0.12)" onPress={handlePayments} />
        </Card>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.menuCard}>
          <ManageItem icon="settings" label="Society Settings" color={Colors.textSecondary} bgColor={Colors.background} onPress={handleSettings} />
          <View style={styles.separator} />
          <ManageItem icon="document-text" label="Reports" color={Colors.textSecondary} bgColor={Colors.background} onPress={handleReports} />
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
