import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { communityApi } from '../../api/community.api';
import { getApiError } from '../../api/client';
import type { Tower, Flat } from '../../types/models';
import { useSuccessModal } from '../../components/ui/SuccessModal';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  // Flat assignment state
  const [modalVisible, setModalVisible] = useState(false);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  const handleTogglePreference = async (key: string) => {
    if (!user) return;
    const currentPrefs = user.notificationPreferences || {
      visitor: true,
      complaint: true,
      notice: true,
      booking: true,
      payment: true,
      poll: true,
      marketing: true,
      emergency: true,
    };
    const updatedValue = !(currentPrefs as any)[key];
    const newPrefs = { ...currentPrefs, [key]: updatedValue };

    // Update local store immediately for instant UI feedback
    setUser({
      ...user,
      notificationPreferences: newPrefs,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await authApi.updateNotificationPreferences({ [key]: updatedValue });
    } catch (err) {
      // Revert on error
      setUser({
        ...user,
        notificationPreferences: currentPrefs,
      });
      Alert.alert('Error', 'Failed to update preferences. Please check your network connection.');
    }
  };

  const getFlatDisplay = () => {
    if (!user?.flat) return 'Not Assigned';
    if (typeof user.flat === 'object') {
      const tower = user.flat.tower;
      const towerName = (tower && typeof tower === 'object') ? (tower as any).name : '';
      // Tower A - Orchid -> A
      const shortTower = towerName.match(/Tower\s+([A-Za-z0-9]+)/)?.[1] || towerName || '';
      return shortTower ? `${shortTower}-${user.flat.flatNumber}` : user.flat.flatNumber;
    }
    return String(user.flat);
  };

  const loadTowers = async () => {
    setLoadingTowers(true);
    try {
      const res = await communityApi.getPublicTowers();
      setTowers(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load towers: ' + getApiError(err));
    } finally {
      setLoadingTowers(false);
    }
  };

  const loadFlats = async (towerId: string) => {
    setLoadingFlats(true);
    try {
      const res = await communityApi.getPublicFlats({ towerId });
      // Only show vacant (unoccupied) flats in self-assign modal
      const vacantFlats = (res.data || []).filter((f: any) => !f.isOccupied);
      setFlats(vacantFlats);
    } catch (err) {
      Alert.alert('Error', 'Failed to load flats: ' + getApiError(err));
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleOpenAssignModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTower(null);
    setSelectedFlat(null);
    setFlats([]);
    setModalVisible(true);
    loadTowers();
  };

  const handleSelectTower = (tower: Tower) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTower(tower);
    setSelectedFlat(null);
    loadFlats(tower._id || (tower as any).id);
  };

  const handleSelectFlat = (flat: Flat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFlat(flat);
  };

  const { showSuccess } = useSuccessModal();

  const handleConfirmFlat = async () => {
    if (!selectedFlat) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      const res = await authApi.assignFlat(selectedFlat._id || (selectedFlat as any).id);
      if (res.success && res.data) {
        setUser(res.data);
        setModalVisible(false);
        showSuccess({
          title: '🏠 Flat Linked!',
          message: `You have successfully linked Flat ${selectedTower?.name}-${selectedFlat.flatNumber} to your profile.`,
          taskType: 'flat_assigned',
          details: [
            { label: 'Tower', value: selectedTower?.name || '—' },
            { label: 'Flat Number', value: selectedFlat.flatNumber },
            { label: 'Flat Type', value: selectedFlat.type },
          ],
        });
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || getApiError(err);
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout().catch(console.error);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        {/* Warning Banner if flat is not assigned */}
        {!user?.flat && (
          <Card style={styles.warningBanner}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={24} color={Colors.warning} />
              <Text style={styles.warningTitle}>Action Required</Text>
            </View>
            <Text style={styles.warningText}>
              You have not assigned a flat to your profile yet. Please select your flat to enable gate clearances and helpdesk requests.
            </Text>
            <Button
              title="Assign Flat"
              size="sm"
              variant="primary"
              style={{ marginTop: Spacing.sm }}
              onPress={handleOpenAssignModal}
            />
          </Card>
        )}

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="home" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>Resident</Text>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Flat</Text>
              <View style={styles.flatValueContainer}>
                <Text style={styles.infoValue}>{getFlatDisplay()}</Text>
                {/* Only allow self-assign if flat is not yet assigned */}
                {!user?.flat && (
                  <TouchableOpacity onPress={handleOpenAssignModal} style={styles.editFlatBtn}>
                    <Text style={styles.editFlatText}>Assign</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Society</Text>
              <Text style={styles.infoValue}>{typeof user?.society === 'object' ? user.society.name : 'Portl Residency'}</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="people-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Family Members</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowNotificationPreferences(!showNotificationPreferences);
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Notifications Preferences</Text>
            <Ionicons
              name={showNotificationPreferences ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>

          {showNotificationPreferences && (
            <View style={styles.preferencesContainer}>
              <View style={styles.separator} />
              
              {/* Visitor Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Visitor Alerts</Text>
                  <Text style={styles.prefDesc}>Visitor requests and entry clearances</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.visitor !== false}
                  onValueChange={() => handleTogglePreference('visitor')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.visitor !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Helpdesk Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Complaint Updates</Text>
                  <Text style={styles.prefDesc}>Status alerts for helpdesk tickets</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.complaint !== false}
                  onValueChange={() => handleTogglePreference('complaint')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.complaint !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Notice Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Notice Board</Text>
                  <Text style={styles.prefDesc}>Announcements and management circulars</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.notice !== false}
                  onValueChange={() => handleTogglePreference('notice')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.notice !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Booking Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Amenity Bookings</Text>
                  <Text style={styles.prefDesc}>Confirmations and reminders for bookings</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.booking !== false}
                  onValueChange={() => handleTogglePreference('booking')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.booking !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Payment Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Maintenance Payments</Text>
                  <Text style={styles.prefDesc}>Invoices, due alerts, and payment receipts</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.payment !== false}
                  onValueChange={() => handleTogglePreference('payment')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.payment !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Poll Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Community Polls</Text>
                  <Text style={styles.prefDesc}>New voting polls and final results</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.poll !== false}
                  onValueChange={() => handleTogglePreference('poll')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.poll !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Marketing Toggle */}
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefLabel}>Promotional Alerts</Text>
                  <Text style={styles.prefDesc}>Offers and neighborhood marketing digests</Text>
                </View>
                <Switch
                  value={user?.notificationPreferences?.marketing !== false}
                  onValueChange={() => handleTogglePreference('marketing')}
                  trackColor={{ false: '#CBD5E1', true: Colors.primaryLight }}
                  thumbColor={Platform.OS === 'ios' ? undefined : (user?.notificationPreferences?.marketing !== false ? Colors.primary : '#F1F5F9')}
                />
              </View>
              <View style={styles.separator} />

              {/* Emergency Toggle (Always Enabled) */}
              <View style={[styles.prefRow, { opacity: 0.8 }]}>
                <View style={styles.prefTextContainer}>
                  <Text style={[styles.prefLabel, { color: Colors.danger }]}>🚨 Emergency Alerts</Text>
                  <Text style={styles.prefDesc}>Security emergencies and evacuation circulars</Text>
                </View>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: '#CBD5E1', true: '#FDA4AF' }}
                  thumbColor={Colors.danger}
                />
              </View>
            </View>
          )}

          <View style={styles.separator} />
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.text} />
            <Text style={styles.settingsLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Portl v1.0.0</Text>
        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>

      {/* Flat Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Flat</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {loadingTowers ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Loading society towers...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Towers List */}
                <Text style={styles.sectionLabel}>Select Tower</Text>
                <View style={{ maxHeight: 75, marginBottom: Spacing.md }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.towersScroll}>
                    {towers.map((tower) => (
                      <TouchableOpacity
                        key={tower._id || (tower as any).id}
                        style={[
                          styles.towerChip,
                          selectedTower?._id === tower._id && styles.towerChipActive,
                        ]}
                        onPress={() => handleSelectTower(tower)}
                      >
                        <Text style={[styles.towerChipText, selectedTower?._id === tower._id && styles.towerChipTextActive]}>
                          {tower.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Flats Grid */}
                {selectedTower ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>Select Flat Number</Text>
                    {loadingFlats ? (
                      <View style={styles.modalLoader}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                      </View>
                    ) : flats.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {loadingFlats ? '' : 'All flats in this tower are already occupied. Please contact your admin.'}
                      </Text>
                    ) : (
                      <FlatList
                        data={flats}
                        numColumns={3}
                        keyExtractor={(item) => item._id || (item as any).id}
                        columnWrapperStyle={styles.flatRow}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.flatChip,
                              selectedFlat?._id === item._id && styles.flatChipActive,
                            ]}
                            onPress={() => handleSelectFlat(item)}
                          >
                            <Text style={[styles.flatChipText, selectedFlat?._id === item._id && styles.flatChipTextActive]}>
                              {item.flatNumber}
                            </Text>
                            <Text style={[styles.flatTypeText, selectedFlat?._id === item._id && { color: 'rgba(255,255,255,0.8)' }]}>
                              {item.type}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    )}
                  </View>
                ) : (
                  <View style={styles.promptContainer}>
                    <Ionicons name="business" size={48} color={Colors.textTertiary} />
                    <Text style={styles.promptText}>Select a tower above to browse available flats</Text>
                  </View>
                )}

                {/* Confirm Action Button */}
                <Button
                  title="Confirm Assignment"
                  onPress={handleConfirmFlat}
                  disabled={!selectedFlat}
                  loading={submitting}
                  fullWidth
                  size="lg"
                  style={{ marginTop: Spacing.md }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.xl },
  warningBanner: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: Colors.warning, borderWidth: 1, marginBottom: Spacing.lg, padding: Spacing.md },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  warningTitle: { ...Typography.bodyMedium, color: Colors.warning, fontWeight: '700' },
  warningText: { ...Typography.bodySm, color: Colors.textSecondary, lineHeight: 18 },
  profileCard: { alignItems: 'center', paddingVertical: Spacing['2xl'], marginBottom: Spacing.lg },
  avatarContainer: { marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  profileName: { ...Typography.h3, color: Colors.text },
  profileEmail: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.md, gap: Spacing.xs },
  roleText: { ...Typography.captionMedium, color: Colors.primary },
  infoCard: { marginBottom: Spacing.lg, padding: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  infoContent: { flex: 1, marginLeft: Spacing.md },
  infoLabel: { ...Typography.caption, color: Colors.textTertiary },
  infoValue: { ...Typography.bodyMedium, color: Colors.text, marginTop: 2 },
  flatValueContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  editFlatBtn: { backgroundColor: Colors.primaryGhost, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  editFlatText: { ...Typography.captionMedium, color: Colors.primary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  settingsCard: { marginBottom: Spacing.lg, padding: Spacing.sm },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  settingsLabel: { ...Typography.bodyMedium, color: Colors.text, flex: 1, marginLeft: Spacing.md },
  preferencesContainer: {
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  prefTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  prefLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  prefDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius['3xl'], gap: Spacing.sm, marginBottom: Spacing.lg },
  logoutText: { ...Typography.button, color: Colors.danger },
  version: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center' },

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  modalLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  loaderText: { ...Typography.bodySm, color: Colors.textSecondary },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  towersScroll: { gap: Spacing.sm, paddingRight: Spacing.lg },
  towerChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, height: 42, justifyContent: 'center' },
  towerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  towerChipText: { ...Typography.captionMedium, color: Colors.textSecondary },
  towerChipTextActive: { color: Colors.white, fontWeight: '700' },
  flatRow: { justifyContent: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  flatChip: { width: '30%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.sm, alignItems: 'center' },
  flatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flatChipText: { ...Typography.bodyMedium, color: Colors.text, fontWeight: 'bold' },
  flatChipTextActive: { color: Colors.white },
  flatTypeText: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  emptyText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  promptContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  promptText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
