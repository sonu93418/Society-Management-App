import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTowers, useCreateTower, useDeleteTower } from '../../hooks/useAdmin';
import { router } from 'expo-router';
import { getApiError } from '../../api/client';

export default function TowersScreen() {
  const { data: towersRes, isLoading, refetch } = useTowers();
  const createTowerMutation = useCreateTower();
  const deleteTowerMutation = useDeleteTower();

  const towers = towersRes?.data || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [totalFloors, setTotalFloors] = useState('');

  const handleDelete = (id: string, towerName: string) => {
    Alert.alert(
      'Delete Tower',
      `Are you sure you want to delete ${towerName}? This will also delete all flats in this tower.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTowerMutation.mutate(id, {
              onSuccess: () => {
                Alert.alert('Success', `Tower ${towerName} deleted successfully`);
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Error', getApiError(err));
              },
            });
          },
        },
      ]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || !totalFloors.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const floorsNum = parseInt(totalFloors, 10);
    if (isNaN(floorsNum) || floorsNum <= 0) {
      Alert.alert('Error', 'Total floors must be a positive number');
      return;
    }

    createTowerMutation.mutate(
      { name: name.trim(), totalFloors: floorsNum },
      {
        onSuccess: () => {
          Alert.alert('Success', `Tower ${name} created successfully!`);
          setModalVisible(false);
          setName('');
          setTotalFloors('');
          refetch();
        },
        onError: (err: any) => {
          Alert.alert('Error', getApiError(err));
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Towers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : towers.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No Towers"
          description="Create the first tower to begin organizing your society's infrastructure."
          action={
            <Button
              title="Add Tower"
              onPress={() => setModalVisible(true)}
              variant="primary"
            />
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {towers.map((tower) => (
            <TouchableOpacity
              key={tower._id}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(admin)/flats', params: { towerId: tower._id } })}
            >
              <Card style={styles.towerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBg}>
                    <Ionicons name="business" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.towerName}>Tower {tower.name}</Text>
                    <Text style={styles.towerDetails}>{tower.totalFloors} Floors • {tower.totalFlats || 0} Flats</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(tower._id, tower.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} style={{ marginLeft: Spacing.sm }} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            style={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Tower</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} keyboardShouldPersistTaps="handled">
                <Input
                  label="Tower Name *"
                  placeholder="e.g. Tower A, Wing B"
                  value={name}
                  onChangeText={setName}
                  leftIcon="business-outline"
                />

                <Input
                  label="Total Floors *"
                  placeholder="e.g. 12"
                  keyboardType="numeric"
                  value={totalFloors}
                  onChangeText={setTotalFloors}
                  leftIcon="layers-outline"
                />

                <Button
                  title="Create Tower"
                  onPress={handleCreate}
                  loading={createTowerMutation.isPending}
                  fullWidth
                  style={{ marginTop: Spacing.xl }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  addBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },
  towerCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: Spacing.md },
  towerName: { ...Typography.bodyMedium, color: Colors.text },
  towerDetails: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, minHeight: 400, ...Shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.text },
  deleteBtn: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
