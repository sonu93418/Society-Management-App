import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const categoryIcons: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  electrician: { icon: 'flash', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  plumber: { icon: 'water', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  housekeeping: { icon: 'sparkles', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  gardener: { icon: 'leaf', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  security: { icon: 'shield', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  maintenance: { icon: 'construct', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  other: { icon: 'person', color: '#64748B', bg: '#F1F5F9' },
};

import { useStaff } from '../../hooks/useCommunity';
import { ActivityIndicator } from 'react-native';

const emergencyContacts = [
  { name: 'Society Manager', phone: '9876543210', icon: 'business' as const },
  { name: 'Fire Department', phone: '101', icon: 'flame' as const },
  { name: 'Ambulance', phone: '102', icon: 'medkit' as const },
  { name: 'Police', phone: '100', icon: 'shield-checkmark' as const },
];

export default function StaffDirectory() {
  const { data: response, isLoading } = useStaff();
  const staffList = response?.data || [];

  const handleCall = (phone: string, name: string) => {
    Alert.alert(`Call ${name}?`, phone, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff & Emergency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <View style={styles.emergencyGrid}>
          {emergencyContacts.map((contact, i) => (
            <TouchableOpacity
              key={i}
              style={styles.emergencyCard}
              onPress={() => handleCall(contact.phone, contact.name)}
              activeOpacity={0.7}
            >
              <View style={styles.emergencyIcon}>
                <Ionicons name={contact.icon} size={22} color={Colors.danger} />
              </View>
              <Text style={styles.emergencyName}>{contact.name}</Text>
              <Text style={styles.emergencyPhone}>{contact.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Staff Directory */}
        <Text style={styles.sectionTitle}>Staff Directory</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : staffList.length === 0 ? (
          <Text style={{ ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl }}>No staff members registered.</Text>
        ) : (
          staffList.map((staff) => {
            const catInfo = categoryIcons[staff.category] || categoryIcons.other;
            return (
              <Card key={staff._id} style={styles.staffCard}>
                <View style={styles.staffRow}>
                  <View style={[styles.staffIcon, { backgroundColor: catInfo.bg }]}>
                    <Ionicons name={catInfo.icon} size={22} color={catInfo.color} />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffDesc}>{staff.description}</Text>
                    <View style={styles.staffMeta}>
                      <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.staffHours}>{staff.workingHours}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(staff.phone, staff.name)}
                  >
                    <Ionicons name="call" size={18} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },

  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.lg },

  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  emergencyCard: { width: '47%', backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center' },
  emergencyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  emergencyName: { ...Typography.captionMedium, color: Colors.dangerDark, textAlign: 'center' },
  emergencyPhone: { ...Typography.h4, color: Colors.danger, marginTop: 2 },

  staffCard: { marginBottom: Spacing.md },
  staffRow: { flexDirection: 'row', alignItems: 'center' },
  staffIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  staffInfo: { flex: 1, marginLeft: Spacing.md },
  staffName: { ...Typography.bodyMedium, color: Colors.text },
  staffDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  staffMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  staffHours: { ...Typography.caption, color: Colors.textTertiary },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
});
