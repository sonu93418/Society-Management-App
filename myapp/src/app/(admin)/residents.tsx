import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useResidents, useSearchResidents, useTowers, useFlats, useAssignFlatToResident } from '../../hooks/useAdmin';
import { router } from 'expo-router';

export default function ResidentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback lists
  const { data: listRes, isLoading: listLoading } = useResidents();
  const { data: searchRes, isLoading: searchLoading } = useSearchResidents(searchQuery);

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = isSearching ? searchLoading : listLoading;

  const residents = isSearching ? (searchRes?.data || []) : (listRes?.data?.residents || []);

  // Assign Flat States
  const { data: towersRes, isLoading: loadingTowers } = useTowers();
  const towers = towersRes?.data || [];

  const [activeResident, setActiveResident] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTower, setSelectedTower] = useState<any>(null);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);

  const { data: flatsRes, isLoading: loadingFlats } = useFlats(
    selectedTower ? { towerId: selectedTower._id } : undefined,
    // Only fetch flats once a tower is actually selected
    { enabled: !!selectedTower }
  );
  const flats = flatsRes?.data || [];

  const assignFlatMutation = useAssignFlatToResident();

  const handleOpenAssignModal = (resident: any) => {
    setActiveResident(resident);
    setSelectedTower(null);
    setSelectedFlat(null);
    setModalVisible(true);
  };

  const handleSelectTower = (tower: any) => {
    setSelectedTower(tower);
    setSelectedFlat(null);
  };

  const handleSelectFlat = (flat: any) => {
    setSelectedFlat(flat);
  };

  const handleConfirmFlat = () => {
    if (!activeResident || !selectedFlat) return;

    assignFlatMutation.mutate(
      { residentId: activeResident._id || activeResident.id, flatId: selectedFlat._id },
      {
        onSuccess: () => {
          Alert.alert('Success', `Flat ${selectedTower.name}-${selectedFlat.flatNumber} assigned successfully.`);
          setModalVisible(false);
          setActiveResident(null);
          setSelectedTower(null);
          setSelectedFlat(null);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to assign flat');
        },
      }
    );
  };

  const formatFlat = (flat: any) => {
    if (!flat) return 'N/A';
    if (typeof flat === 'object') {
      return `${flat.tower?.name || ''}-${flat.flatNumber}`;
    }
    return String(flat);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Residents</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name, phone, or flat..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : residents.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Residents Found"
          description={isSearching ? "No registered users match your query." : "There are no registered residents in this society."}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {residents.map((resident) => {
            const firstLetter = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
            return (
              <Card key={resident._id || resident.id} style={styles.residentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarBg}>
                    <Text style={styles.avatarText}>{firstLetter}</Text>
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.residentName}>{resident.name}</Text>
                    <Text style={styles.residentFlat}>Flat {formatFlat(resident.flat)} • {resident.phone}</Text>
                  </View>
                  <Badge
                    label={resident.isActive ? 'Active' : 'Inactive'}
                    variant={resident.isActive ? 'success' : 'low'}
                  />
                </View>
                {!resident.flat && (
                  <View style={styles.assignFlatContainer}>
                    <View style={styles.assignFlatTextCol}>
                      <Ionicons name="home-outline" size={16} color={Colors.warningDark} />
                      <View>
                        <Text style={styles.assignFlatWarningText}>No flat assigned</Text>
                        <Text style={styles.assignFlatHint}>Tap to link this resident to a flat unit</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.assignFlatBtn}
                      onPress={() => handleOpenAssignModal(resident)}
                    >
                      <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
                      <Text style={styles.assignFlatBtnText}>Assign Flat</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
      {/* Flat Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={styles.modalTitle} numberOfLines={1}>Assign Flat to {activeResident?.name}</Text>
                <Text style={styles.modalSubtitle}>Select a tower, then pick an available flat unit to link with this resident's account.</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
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
                    {towers.map((tower: any) => (
                      <TouchableOpacity
                        key={tower._id || tower.id}
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
                      <Text style={styles.emptyText}>No available flats found in this tower.</Text>
                    ) : (
                      <FlatList
                        data={flats}
                        numColumns={3}
                        keyExtractor={(item) => item._id}
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
                    <Text style={styles.promptText}>Select a tower above to browse flats</Text>
                  </View>
                )}

                {/* Confirm Action Button */}
                <Button
                  title="Confirm Assignment"
                  onPress={handleConfirmFlat}
                  disabled={!selectedFlat}
                  loading={assignFlatMutation.isPending}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing['5xl'] },
  residentCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarBg: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: 'bold' },
  headerText: { flex: 1, marginLeft: Spacing.md },
  residentName: { ...Typography.bodyMedium, color: Colors.text },
  residentFlat: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  // Assign flat quick card
  assignFlatContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.warningLight + '55', borderRadius: BorderRadius.lg, padding: Spacing.sm, marginHorizontal: -Spacing.xs },
  assignFlatTextCol: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, flex: 1 },
  assignFlatWarningText: { ...Typography.captionMedium, color: Colors.warningDark, fontWeight: '700' },
  assignFlatHint: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10, marginTop: 1 },
  assignFlatBtn: { backgroundColor: Colors.primaryGhost, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignFlatBtnText: { ...Typography.captionMedium, color: Colors.primary, fontWeight: 'bold' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  modalSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  modalLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  loaderText: { ...Typography.bodySm, color: Colors.textSecondary },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.md },
  towersScroll: { gap: Spacing.sm, paddingRight: Spacing.xl },
  towerChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, height: 40, justifyContent: 'center' },
  towerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  towerChipText: { ...Typography.bodySm, color: Colors.textSecondary, fontWeight: '500' },
  towerChipTextActive: { color: Colors.white },
  emptyText: { ...Typography.bodySm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
  flatRow: { justifyContent: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  flatChip: { flex: 1, maxWidth: '30%', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  flatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flatChipText: { ...Typography.bodyMedium, color: Colors.text, fontWeight: 'bold' },
  flatChipTextActive: { color: Colors.white },
  flatTypeText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, fontSize: 10 },
  promptContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, opacity: 0.6 },
  promptText: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});
