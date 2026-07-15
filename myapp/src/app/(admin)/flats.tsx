import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useFlats, useCreateFlat, useTowers, useDeleteFlat } from '../../hooks/useAdmin';
import { router, useLocalSearchParams } from 'expo-router';

export default function FlatsScreen() {
  const params = useLocalSearchParams<{ towerId?: string }>();
  const { data: towersRes } = useTowers();
  const towers = towersRes?.data || [];

  const [selectedTowerFilter, setSelectedTowerFilter] = useState<string | null>(
    params.towerId || null
  );

  useEffect(() => {
    if (params.towerId) {
      setSelectedTowerFilter(params.towerId);
    }
  }, [params.towerId]);

  const { data: flatsRes, isLoading, refetch } = useFlats(
    selectedTowerFilter ? { towerId: selectedTowerFilter } : undefined
  );
  const createFlatMutation = useCreateFlat();
  const deleteFlatMutation = useDeleteFlat();

  const flats = flatsRes?.data || [];

  const handleDelete = (id: string, flatName: string) => {
    Alert.alert(
      'Delete Flat',
      `Are you sure you want to delete Flat ${flatName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFlatMutation.mutate(id, {
              onSuccess: () => {
                Alert.alert('Success', `Flat ${flatName} deleted successfully`);
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Error', err?.message || 'Failed to delete flat');
              },
            });
          },
        },
      ]
    );
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [flatNumber, setFlatNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState('');
  const [flatType, setFlatType] = useState('2BHK');

  const handleCreate = () => {
    if (!flatNumber.trim() || !floor.trim() || !selectedTowerId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const floorNum = parseInt(floor, 10);
    if (isNaN(floorNum) || floorNum < 0) {
      Alert.alert('Error', 'Floor must be a non-negative number');
      return;
    }

    createFlatMutation.mutate(
      {
        flatNumber: flatNumber.trim(),
        floor: floorNum,
        towerId: selectedTowerId,
        type: flatType,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', `Flat ${flatNumber} created successfully!`);
          setModalVisible(false);
          setFlatNumber('');
          setFloor('');
          setSelectedTowerId('');
          setFlatType('2BHK');
          refetch();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to create flat');
        },
      }
    );
  };

  const getTowerName = (flat: any) => {
    if (!flat.tower) return '';
    if (typeof flat.tower === 'object') return flat.tower.name || '';
    const match = towers.find((t) => t._id === flat.tower);
    return match ? match.name : '';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flats</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tower Filter Row */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedTowerFilter && styles.filterChipActive]}
            onPress={() => setSelectedTowerFilter(null)}
          >
            <Text style={[styles.filterChipText, !selectedTowerFilter && styles.filterChipTextActive]}>All Towers</Text>
          </TouchableOpacity>
          {towers.map((t) => (
            <TouchableOpacity
              key={t._id}
              style={[styles.filterChip, selectedTowerFilter === t._id && styles.filterChipActive]}
              onPress={() => setSelectedTowerFilter(t._id)}
            >
              <Text style={[styles.filterChipText, selectedTowerFilter === t._id && styles.filterChipTextActive]}>
                Tower {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : flats.length === 0 ? (
        <EmptyState
          icon="home-outline"
          title="No Flats Found"
          description="Create the first flat to begin organizing residents and visitor requests."
          action={
            <Button
              title="Add Flat"
              onPress={() => setModalVisible(true)}
              variant="primary"
            />
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {flats.map((flat) => (
            <Card key={flat._id} style={styles.flatCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: flat.isOccupied ? Colors.successLight : Colors.primaryGhost }]}>
                  <Ionicons name="home" size={22} color={flat.isOccupied ? Colors.success : Colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.flatName}>Flat {getTowerName(flat)}-{flat.flatNumber}</Text>
                  <Text style={styles.flatDetails}>Floor {flat.floor} • {flat.type || 'N/A'}</Text>
                </View>
                <View style={styles.flatRight}>
                  <Badge
                    label={flat.isOccupied ? 'Occupied' : 'Vacant'}
                    variant={flat.isOccupied ? 'success' : 'low'}
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(flat._id, `${getTowerName(flat)}-${flat.flatNumber}`)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} style={{ marginTop: Spacing.xs }} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Flat</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} keyboardShouldPersistTaps="handled">
              {/* Tower Selection */}
              <Text style={styles.fieldLabel}>Select Tower *</Text>
              {towers.length === 0 ? (
                <Text style={{ ...Typography.caption, color: Colors.danger, marginBottom: Spacing.md }}>
                  No towers available. Please create a tower first.
                </Text>
              ) : (
                <View style={styles.towerSelector}>
                  {towers.map((t) => (
                    <TouchableOpacity
                      key={t._id}
                      style={[styles.towerOption, selectedTowerId === t._id && styles.towerOptionActive]}
                      onPress={() => setSelectedTowerId(t._id)}
                    >
                      <Text style={[styles.towerOptionText, selectedTowerId === t._id && styles.towerOptionTextActive]}>
                        Tower {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Input
                label="Flat Number *"
                placeholder="e.g. 101, 304"
                value={flatNumber}
                onChangeText={setFlatNumber}
                leftIcon="home-outline"
              />

              <Input
                label="Floor *"
                placeholder="e.g. 1, 3"
                keyboardType="numeric"
                value={floor}
                onChangeText={setFloor}
                leftIcon="layers-outline"
              />

              <Text style={styles.fieldLabel}>Flat Type</Text>
              <View style={styles.typeSelector}>
                {['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeOption, flatType === type && styles.typeOptionActive]}
                    onPress={() => setFlatType(type)}
                  >
                    <Text style={[styles.typeOptionText, flatType === type && styles.typeOptionTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Create Flat"
                onPress={handleCreate}
                loading={createFlatMutation.isPending}
                disabled={towers.length === 0}
                fullWidth
                style={{ marginTop: Spacing.xl }}
              />
            </ScrollView>
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
  filterContainer: { paddingVertical: Spacing.sm, backgroundColor: Colors.background, borderBottomWidth: 1, borderColor: Colors.borderLight },
  filterScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing['5xl'] },
  flatCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: Spacing.md },
  flatName: { ...Typography.bodyMedium, color: Colors.text },
  flatDetails: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, minHeight: 480, ...Shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  towerSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  towerOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  towerOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  towerOptionText: { ...Typography.captionMedium, color: Colors.textSecondary },
  towerOptionTextActive: { color: Colors.white },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  typeOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeOptionText: { ...Typography.captionMedium, color: Colors.textSecondary },
  typeOptionTextActive: { color: Colors.white },
  flatRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  deleteBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
