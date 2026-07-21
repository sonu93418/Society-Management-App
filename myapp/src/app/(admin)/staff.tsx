import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useStaff } from '../../hooks/useCommunity';
import { useCreateStaff } from '../../hooks/useAdmin';
import { router } from 'expo-router';

export default function StaffScreen() {
  const { data: staffRes, isLoading, refetch } = useStaff();
  const createStaffMutation = useCreateStaff();

  const staffList = staffRes?.data || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('plumber');
  const [workingHours, setWorkingHours] = useState('9 AM - 6 PM');
  const [description, setDescription] = useState('');

  const categories = [
    { key: 'electrician', label: 'Electrician' },
    { key: 'plumber', label: 'Plumber' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'housekeeping', label: 'Housekeeping' },
    { key: 'security', label: 'Security' },
    { key: 'gardener', label: 'Gardener' },
    { key: 'other', label: 'Other' },
  ];

  const handleCreate = () => {
    if (!name.trim() || !phone.trim() || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    createStaffMutation.mutate(
      {
        name: name.trim(),
        phone: phone.trim(),
        category,
        workingHours: workingHours.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', `Staff ${name} registered successfully!`);
          setModalVisible(false);
          setName('');
          setPhone('');
          setCategory('plumber');
          setWorkingHours('9 AM - 6 PM');
          setDescription('');
          refetch();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to register staff member');
        },
      }
    );
  };

  const getCategoryLabel = (key: string) => {
    const match = categories.find((c) => c.key === key);
    return match ? match.label : key;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff & Services</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : staffList.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title="No Staff Registered"
          description="Register service staff or security guards to build your society directory."
          action={
            <Button
              title="Add Staff Member"
              onPress={() => setModalVisible(true)}
              variant="primary"
            />
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {staffList.map((staff) => (
            <Card key={staff._id} style={styles.staffCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarBg}>
                  <Ionicons name="construct" size={20} color={Colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffDetails}>{getCategoryLabel(staff.category)} • {staff.phone}</Text>
                  {staff.workingHours && (
                    <Text style={styles.staffHours}>Hours: {staff.workingHours}</Text>
                  )}
                </View>
                <Badge
                  label="Verified"
                  variant="success"
                  size="sm"
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register Staff</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} keyboardShouldPersistTaps="handled">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChangeText={setName}
                  leftIcon="person-outline"
                />

                <Input
                  label="Phone Number *"
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  leftIcon="call-outline"
                />

                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categorySelector}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryOption, category === cat.key && styles.categoryOptionActive]}
                      onPress={() => setCategory(cat.key)}
                    >
                      <Text style={[styles.categoryOptionText, category === cat.key && styles.categoryOptionTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Working Hours"
                  placeholder="e.g. 9 AM - 6 PM"
                  value={workingHours}
                  onChangeText={setWorkingHours}
                  leftIcon="time-outline"
                />

                <Input
                  label="Short Description"
                  placeholder="e.g. Available for B-block plumbing"
                  value={description}
                  onChangeText={setDescription}
                  leftIcon="document-text-outline"
                />

                <Button
                  title="Register Staff"
                  onPress={handleCreate}
                  loading={createStaffMutation.isPending}
                  fullWidth
                  style={{ marginTop: Spacing.xl }}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  addBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing['5xl'] },
  staffCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarBg: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: Spacing.md },
  staffName: { ...Typography.bodyMedium, color: Colors.text },
  staffDetails: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  staffHours: { ...Typography.captionMedium, color: Colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, minHeight: 480, ...Shadows.lg },
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
  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  categoryOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryOptionText: { ...Typography.captionMedium, color: Colors.textSecondary },
  categoryOptionTextActive: { color: Colors.white },
});
