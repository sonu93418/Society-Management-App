import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useResidents, useSearchResidents, useTowers, useFlats, useAssignFlatToResident } from '../../hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSuccessModal } from '../../components/ui/SuccessModal';

// ─── Resident Card ───────────────────────────────────────────────────────────

interface ResidentCardProps {
  resident: any;
  onAssign: (resident: any) => void;
}

const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onAssign }) => {
  const firstLetter = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
  const hasFlat = !!resident.flat;

  const flatLabel = () => {
    if (!resident.flat) return null;
    if (typeof resident.flat === 'object') {
      const towerName = resident.flat.tower?.name || '';
      const flatNum = resident.flat.flatNumber || '';
      return towerName ? `${towerName}-${flatNum}` : flatNum;
    }
    return String(resident.flat);
  };

  return (
    <Card style={[styles.residentCard, !hasFlat && styles.residentCardWarning]}>
      {/* Left accent bar for unassigned */}
      {!hasFlat && <View style={styles.cardAccentBar} />}

      <View style={styles.cardRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: hasFlat ? Colors.primaryGhost : Colors.warningLight }]}>
          <Text style={[styles.avatarText, { color: hasFlat ? Colors.primary : Colors.warningDark }]}>
            {firstLetter}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.residentName} numberOfLines={1}>{resident.name}</Text>
          <Text style={styles.residentPhone} numberOfLines={1}>
            <Ionicons name="call-outline" size={11} color={Colors.textTertiary} /> {resident.phone}
          </Text>
          <Text style={styles.residentEmail} numberOfLines={1}>
            <Ionicons name="mail-outline" size={11} color={Colors.textTertiary} /> {resident.email}
          </Text>
        </View>

        {/* Right side */}
        <View style={styles.cardRight}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: resident.isActive ? Colors.successLight : Colors.dangerLight }]}>
            <View style={[styles.statusDot, { backgroundColor: resident.isActive ? Colors.success : Colors.danger }]} />
            <Text style={[styles.statusText, { color: resident.isActive ? Colors.successDark : Colors.dangerDark }]}>
              {resident.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Flat Row */}
      <View style={styles.flatRowContainer}>
        <View style={styles.flatRowLeft}>
          <Ionicons
            name={hasFlat ? 'home' : 'home-outline'}
            size={14}
            color={hasFlat ? Colors.success : Colors.warningDark}
          />
          {hasFlat ? (
            <Text style={styles.flatAssignedText}>Flat {flatLabel()}</Text>
          ) : (
            <Text style={styles.flatUnassignedText}>No flat assigned</Text>
          )}
        </View>

        <TouchableOpacity style={[styles.assignBtn, hasFlat && styles.reassignBtn]} onPress={() => onAssign(resident)}>
          <Ionicons
            name={hasFlat ? 'swap-horizontal-outline' : 'add-circle-outline'}
            size={13}
            color={hasFlat ? Colors.primary : Colors.white}
          />
          <Text style={[styles.assignBtnText, hasFlat && styles.reassignBtnText]}>
            {hasFlat ? 'Reassign' : 'Assign Flat'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ResidentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: listRes, isLoading: listLoading } = useResidents();
  const { data: searchRes, isLoading: searchLoading } = useSearchResidents(searchQuery);

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = isSearching ? searchLoading : listLoading;
  const allResidents: any[] = isSearching ? (searchRes?.data || []) : (listRes?.data?.residents || []);

  // Split: no-flat first (urgent), then has-flat
  const { unassigned, assigned } = useMemo(() => ({
    unassigned: allResidents.filter((r) => !r.flat),
    assigned: allResidents.filter((r) => !!r.flat),
  }), [allResidents]);

  // ── Modal state ──────────────────────────────────────────────────────────
  const { data: towersRes, isLoading: loadingTowers } = useTowers();
  const towers = towersRes?.data || [];

  const [activeResident, setActiveResident] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: tower, Step 2: flat
  const [selectedTower, setSelectedTower] = useState<any>(null);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);

  const { data: flatsRes, isLoading: loadingFlats } = useFlats(
    selectedTower ? { towerId: selectedTower._id } : undefined,
    { enabled: !!selectedTower }
  );
  // Only show vacant flats (admin can reassign so we allow the current resident's own flat too)
  const flats = (flatsRes?.data || []).filter((flat: any) => !flat.isOccupied);

  const assignFlatMutation = useAssignFlatToResident();

  const handleOpenAssignModal = (resident: any) => {
    setActiveResident(resident);
    setSelectedTower(null);
    setSelectedFlat(null);
    setStep(1);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setActiveResident(null);
    setSelectedTower(null);
    setSelectedFlat(null);
    setStep(1);
  };

  const handleSelectTower = (tower: any) => {
    setSelectedTower(tower);
    setSelectedFlat(null);
    setStep(2);
  };

  const handleSelectFlat = (flat: any) => {
    setSelectedFlat(flat);
  };

  const { showSuccess } = useSuccessModal();

  const handleConfirmFlat = () => {
    if (!activeResident || !selectedFlat) return;

    assignFlatMutation.mutate(
      { residentId: activeResident._id || activeResident.id, flatId: selectedFlat._id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['flats'] });
          handleCloseModal();
          showSuccess({
            title: '🏠 Flat Assigned',
            message: `The resident ${activeResident.name} has been successfully assigned to Flat ${selectedTower?.name}-${selectedFlat.flatNumber}.`,
            taskType: 'flat_assigned',
            details: [
              { label: 'Resident', value: activeResident.name },
              { label: 'Tower', value: selectedTower?.name || '—' },
              { label: 'Flat Number', value: selectedFlat.flatNumber },
              { label: 'Flat Type', value: selectedFlat.type },
            ]
          });
        },
        onError: (err: any) => {
          Alert.alert('Assignment Failed', err?.response?.data?.message || err?.message || 'Failed to assign flat. Please try again.');
        },
      }
    );
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCount = allResidents.length;
  const assignedCount = assigned.length;
  const unassignedCount = unassigned.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Residents</Text>
          <Text style={styles.headerSub}>Society Management</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name, phone, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* ── Stats Bar (only when not searching) ── */}
      {!isSearching && !isLoading && allResidents.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{assignedCount}</Text>
            <Text style={styles.statLabel}>With Flat</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: unassignedCount > 0 ? Colors.warning : Colors.textTertiary }]}>
              {unassignedCount}
            </Text>
            <Text style={styles.statLabel}>Needs Flat</Text>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading residents...</Text>
        </View>
      ) : allResidents.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Residents Found"
          description={isSearching ? 'No registered users match your query.' : 'There are no registered residents in this society.'}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Unassigned Section ── */}
          {unassigned.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.urgentDot} />
                  <Text style={styles.sectionTitle}>Needs Flat Assigned</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{unassignedCount}</Text>
                </View>
              </View>
              {unassigned.map((resident) => (
                <ResidentCard key={resident._id || resident.id} resident={resident} onAssign={handleOpenAssignModal} />
              ))}
            </>
          )}

          {/* ── Assigned Section ── */}
          {assigned.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: unassigned.length > 0 ? Spacing.lg : 0 }]}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.urgentDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.sectionTitle}>Flat Assigned</Text>
                </View>
                <View style={[styles.sectionBadge, { backgroundColor: Colors.successLight }]}>
                  <Text style={[styles.sectionBadgeText, { color: Colors.successDark }]}>{assignedCount}</Text>
                </View>
              </View>
              {assigned.map((resident) => (
                <ResidentCard key={resident._id || resident.id} resident={resident} onAssign={handleOpenAssignModal} />
              ))}
            </>
          )}

          <View style={{ height: Spacing['5xl'] }} />
        </ScrollView>
      )}

      {/* ── Assign Flat Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            {/* Modal Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalResidentInfo}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {activeResident?.name?.charAt(0).toUpperCase() || 'R'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {activeResident?.name || 'Resident'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {activeResident?.flat ? '🔄 Reassigning flat' : '🏠 Assigning new flat'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Progress Steps */}
            <View style={styles.progressBar}>
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, styles.progressDotActive]}>
                  <Text style={styles.progressDotText}>1</Text>
                </View>
                <Text style={[styles.progressLabel, styles.progressLabelActive]}>Tower</Text>
              </View>
              <View style={[styles.progressLine, step === 2 && styles.progressLineActive]} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, step === 2 && styles.progressDotActive]}>
                  <Text style={[styles.progressDotText, step !== 2 && { color: Colors.textTertiary }]}>2</Text>
                </View>
                <Text style={[styles.progressLabel, step === 2 && styles.progressLabelActive]}>Flat</Text>
              </View>
            </View>

            {loadingTowers ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.modalLoaderText}>Loading towers...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>

                {/* ── STEP 1: Tower Selection ── */}
                {step === 1 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepInstruction}>
                      Select the tower where you want to assign a flat:
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {towers.map((tower: any) => (
                        <TouchableOpacity
                          key={tower._id || tower.id}
                          style={[
                            styles.towerCard,
                            selectedTower?._id === tower._id && styles.towerCardActive,
                          ]}
                          onPress={() => handleSelectTower(tower)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.towerIcon, selectedTower?._id === tower._id && styles.towerIconActive]}>
                            <Ionicons
                              name="business"
                              size={22}
                              color={selectedTower?._id === tower._id ? Colors.white : Colors.primary}
                            />
                          </View>
                          <View style={styles.towerInfo}>
                            <Text style={[styles.towerName, selectedTower?._id === tower._id && styles.towerNameActive]}>
                              Tower {tower.name}
                            </Text>
                            <Text style={[styles.towerMeta, selectedTower?._id === tower._id && styles.towerMetaActive]}>
                              {tower.totalFloors} floors • {tower.totalFlats ?? '—'} flats
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={selectedTower?._id === tower._id ? Colors.white : Colors.textTertiary}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ── STEP 2: Flat Selection ── */}
                {step === 2 && (
                  <View style={{ flex: 1 }}>
                    {/* Back to tower */}
                    <TouchableOpacity style={styles.backToTower} onPress={() => setStep(1)}>
                      <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                      <Text style={styles.backToTowerText}>Tower {selectedTower?.name}</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepInstruction}>
                      Select a vacant flat from Tower {selectedTower?.name}:
                    </Text>

                    {loadingFlats ? (
                      <View style={styles.modalLoader}>
                        <ActivityIndicator color={Colors.primary} />
                        <Text style={styles.modalLoaderText}>Loading flats...</Text>
                      </View>
                    ) : flats.length === 0 ? (
                      <View style={styles.emptyFlatsContainer}>
                        <Ionicons name="home-outline" size={40} color={Colors.textTertiary} />
                        <Text style={styles.emptyFlatsTitle}>All Flats Occupied</Text>
                        <Text style={styles.emptyFlatsText}>
                          No vacant flats in Tower {selectedTower?.name}. Try another tower.
                        </Text>
                        <TouchableOpacity style={styles.tryAnotherBtn} onPress={() => setStep(1)}>
                          <Text style={styles.tryAnotherText}>← Try Another Tower</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.vacantCount}>{flats.length} vacant flat{flats.length !== 1 ? 's' : ''} available</Text>
                        <FlatList
                          data={flats}
                          numColumns={3}
                          keyExtractor={(item) => item._id}
                          columnWrapperStyle={styles.flatGridRow}
                          showsVerticalScrollIndicator={false}
                          renderItem={({ item }) => {
                            const isSelected = selectedFlat?._id === item._id;
                            return (
                              <TouchableOpacity
                                style={[styles.flatCell, isSelected && styles.flatCellActive]}
                                onPress={() => handleSelectFlat(item)}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name="home"
                                  size={16}
                                  color={isSelected ? Colors.white : Colors.primary}
                                />
                                <Text style={[styles.flatCellNumber, isSelected && styles.flatCellNumberActive]}>
                                  {item.flatNumber}
                                </Text>
                                <Text style={[styles.flatCellType, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                                  {item.type}
                                </Text>
                                {isSelected && (
                                  <View style={styles.flatCellCheck}>
                                    <Ionicons name="checkmark" size={10} color={Colors.white} />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </>
                    )}

                    {/* Selected Summary */}
                    {selectedFlat && (
                      <View style={styles.selectionSummary}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                        <Text style={styles.selectionSummaryText}>
                          Selected: <Text style={{ fontWeight: '700' }}>Tower {selectedTower?.name} — Flat {selectedFlat.flatNumber}</Text> ({selectedFlat.type})
                        </Text>
                      </View>
                    )}

                    {/* Confirm Button */}
                    <Button
                      title={assignFlatMutation.isPending ? 'Assigning...' : `Confirm — Flat ${selectedFlat ? `${selectedTower?.name}-${selectedFlat.flatNumber}` : ''}`}
                      onPress={handleConfirmFlat}
                      disabled={!selectedFlat}
                      loading={assignFlatMutation.isPending}
                      fullWidth
                      style={styles.confirmBtn}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.text },
  headerSub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 1 },

  // ── Search
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  // ── Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.xs,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

  // ── Loading
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  loaderText: { ...Typography.bodySm, color: Colors.textSecondary },

  // ── Scroll
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // ── Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warning },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '600' },
  sectionBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionBadgeText: { ...Typography.caption, color: Colors.warningDark, fontWeight: '700' },

  // ── Resident Card
  residentCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  residentCardWarning: {
    borderLeftWidth: 0, // handled by accent bar
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.warning,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.h4, fontWeight: '700' },
  cardInfo: { flex: 1 },
  residentName: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '600' },
  residentPhone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  residentEmail: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.caption, fontWeight: '600' },

  // Flat row inside card
  flatRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginLeft: 58, // align with info column
  },
  flatRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  flatAssignedText: { ...Typography.captionMedium, color: Colors.success, fontWeight: '600' },
  flatUnassignedText: { ...Typography.captionMedium, color: Colors.warningDark, fontWeight: '600' },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  assignBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  reassignBtn: {
    backgroundColor: Colors.primaryGhost,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reassignBtnText: { color: Colors.primary },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    height: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalResidentInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginRight: Spacing.md },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
  modalTitle: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '700' },
  modalSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress bar
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressDotText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  progressLabel: { ...Typography.caption, color: Colors.textTertiary },
  progressLabelActive: { color: Colors.primary, fontWeight: '600' },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.sm, marginBottom: 16 },
  progressLineActive: { backgroundColor: Colors.primary },

  // Modal loader
  modalLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  modalLoaderText: { ...Typography.bodySm, color: Colors.textSecondary },

  // Step instruction
  stepInstruction: { ...Typography.bodySm, color: Colors.textSecondary, marginBottom: Spacing.md },

  // Tower cards (Step 1)
  towerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  towerCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  towerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  towerIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  towerInfo: { flex: 1 },
  towerName: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '600' },
  towerNameActive: { color: Colors.white },
  towerMeta: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  towerMetaActive: { color: 'rgba(255,255,255,0.75)' },

  // Back to tower (Step 2)
  backToTower: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backToTowerText: { ...Typography.captionMedium, color: Colors.primary, fontWeight: '600' },

  vacantCount: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.sm },

  // Flat grid (Step 2)
  flatGridRow: { justifyContent: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  flatCell: {
    flex: 1,
    maxWidth: '30%',
    aspectRatio: 0.9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    ...Shadows.xs,
  },
  flatCellActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flatCellNumber: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '700' },
  flatCellNumberActive: { color: Colors.white },
  flatCellType: { ...Typography.caption, color: Colors.textTertiary, fontSize: 10 },
  flatCellCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty flats
  emptyFlatsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  emptyFlatsTitle: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '600' },
  emptyFlatsText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  tryAnotherBtn: { marginTop: Spacing.sm },
  tryAnotherText: { ...Typography.captionMedium, color: Colors.primary, fontWeight: '600' },

  // Selection summary
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  selectionSummaryText: { ...Typography.captionMedium, color: Colors.successDark, flex: 1 },
  confirmBtn: { borderRadius: BorderRadius.xl },
});
