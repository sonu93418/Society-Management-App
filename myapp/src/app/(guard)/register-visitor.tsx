import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

import { useGuardSearchResidents } from '../../hooks/useCommunity';
import { useCreateVisitor } from '../../hooks/useVisitors';
import { router } from 'expo-router';
import { getApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

export default function RegisterVisitor() {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedType, setSelectedType] = useState<'guest' | 'delivery' | 'cab' | 'service'>('guest');
  const [searchQuery, setSearchQuery] = useState('');

  // State to hold the selected resident
  const [selectedResident, setSelectedResident] = useState<{ id: string; name: string; flat: any } | null>(null);

  const { data: searchResponse, isLoading: isSearching } = useGuardSearchResidents(searchQuery);
  const searchResults = searchResponse?.data || [];

  const createMutation = useCreateVisitor();

  const visitorTypes = [
    { key: 'guest' as const, label: 'Guest', icon: 'person-outline' as const, color: '#8B5CF6' },
    { key: 'delivery' as const, label: 'Delivery', icon: 'cube-outline' as const, color: Colors.warning },
    { key: 'cab' as const, label: 'Cab', icon: 'car-outline' as const, color: '#3B82F6' },
    { key: 'service' as const, label: 'Service', icon: 'construct-outline' as const, color: Colors.success },
  ];

  const handleRegister = () => {
    if (!selectedResident) {
      Alert.alert('Error', 'Please select a destination resident first');
      return;
    }
    if (!visitorName.trim() || !visitorPhone.trim() || !purpose.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const flatId = typeof selectedResident.flat === 'object' ? selectedResident.flat._id : selectedResident.flat;
    if (!flatId) {
      Alert.alert('Error', 'Selected resident has no flat assigned');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    createMutation.mutate(
      {
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        purpose: purpose.trim(),
        type: selectedType,
        flatId,
        residentId: selectedResident.id,
        vehicleNumber: vehicleNumber.trim() || undefined,
        expectedCount: 1,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', `Visitor request sent to ${selectedResident.name} for approval.`, [
            { text: 'OK', onPress: () => router.back() },
          ]);
          setVisitorName('');
          setVisitorPhone('');
          setPurpose('');
          setVehicleNumber('');
          setSelectedResident(null);
          setSearchQuery('');
        },
        onError: (err: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', getApiError(err));
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Register Visitor</Text>
              <Text style={styles.subtitle}>Log new entry & request resident approval</Text>
            </View>
          </View>

          {/* Search / Select Destination Resident */}
          <Card style={styles.searchCard}>
            <Text style={styles.cardTitle}>Destination Resident / Flat *</Text>
            <Input
              placeholder="Search resident by name, phone, or flat (e.g. A-101)"
              leftIcon="search-outline"
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ marginBottom: Spacing.xs }}
            />

            {/* Selected Resident Banner */}
            {selectedResident && (() => {
              const selectedTowerName =
                typeof selectedResident.flat === 'object' && selectedResident.flat?.tower && typeof selectedResident.flat.tower === 'object'
                  ? (selectedResident.flat.tower as any).name || ''
                  : '';
              const selectedFlatNum = typeof selectedResident.flat === 'object' ? selectedResident.flat?.flatNumber || '' : '';
              const selectedFlatStr = selectedTowerName ? `${selectedTowerName}-${selectedFlatNum}` : selectedFlatNum || String(selectedResident.flat || '');
              return (
                <View style={styles.selectedBanner}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.success} style={{ marginRight: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.bodyMedium, color: Colors.successDark, fontWeight: '700' }}>
                      Selected: {selectedResident.name}
                    </Text>
                    <Text style={{ ...Typography.caption, color: Colors.successDark }}>
                      Destination Flat: {selectedFlatStr}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedResident(null)}>
                    <Ionicons name="close-circle" size={22} color={Colors.successDark} />
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Quick Flat Chips (Registered Flats) */}
            {searchResults.length > 0 && !selectedResident && (
              <View style={styles.quickChipsSection}>
                <Text style={styles.quickChipsTitle}>Tap Registered Flat to Select:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {searchResults.map((resident) => {
                    const towerName =
                      typeof resident.flat === 'object' && resident.flat?.tower && typeof resident.flat.tower === 'object'
                        ? (resident.flat.tower as any).name || ''
                        : '';
                    const flatNum = typeof resident.flat === 'object' ? resident.flat?.flatNumber || '' : '';
                    const flatStr = towerName ? `${towerName}-${flatNum}` : flatNum || 'General';
                    return (
                      <TouchableOpacity
                        key={resident._id || resident.id}
                        style={styles.flatChip}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedResident({
                            id: resident._id || resident.id,
                            name: resident.name,
                            flat: resident.flat,
                          });
                          setSearchQuery('');
                        }}
                      >
                        <Ionicons name="business-outline" size={14} color={Colors.primary} />
                        <Text style={styles.flatChipText}>
                          {flatStr} ({resident.name.split(' ')[0]})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.md }} />
            )}

            {/* Expanded Search Result List when typing */}
            {searchQuery.length >= 1 && !isSearching && (
              <View style={styles.searchResults}>
                {searchResults.length === 0 ? (
                  <Text style={{ ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md }}>
                    No matching residents found.
                  </Text>
                ) : (
                  searchResults.map((resident) => {
                    const towerName =
                      typeof resident.flat === 'object' && resident.flat?.tower && typeof resident.flat.tower === 'object'
                        ? (resident.flat.tower as any).name || ''
                        : '';
                    const flatNum = typeof resident.flat === 'object' ? resident.flat?.flatNumber || '' : '';
                    const flatStr = towerName ? `${towerName}-${flatNum}` : flatNum || String(resident.flat || '');
                    const firstLetter = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                    return (
                      <TouchableOpacity
                        key={resident._id || resident.id}
                        style={styles.searchResult}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedResident({
                            id: resident._id || resident.id,
                            name: resident.name,
                            flat: resident.flat,
                          });
                          setSearchQuery('');
                        }}
                      >
                        <View style={styles.searchAvatar}>
                          <Text style={styles.searchAvatarText}>{firstLetter}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.searchName}>{resident.name}</Text>
                          <Text style={styles.searchFlat}>Flat {flatStr} • {resident.phone}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </Card>

          {/* Visitor Type */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={styles.cardTitle}>Visitor Type</Text>
            <View style={styles.typeGrid}>
              {visitorTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedType === type.key && { backgroundColor: type.color, borderColor: type.color },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.key);
                  }}
                >
                  <Ionicons
                    name={type.icon}
                    size={22}
                    color={selectedType === type.key ? Colors.white : type.color}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === type.key && { color: Colors.white, fontWeight: '700' },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Visitor Details */}
          <Card>
            <Text style={styles.cardTitle}>Visitor Details</Text>
            <Input label="Visitor Name *" placeholder="Enter visitor's full name" leftIcon="person-outline" value={visitorName} onChangeText={setVisitorName} />
            <Input label="Phone Number *" placeholder="Enter visitor's 10-digit phone" leftIcon="call-outline" value={visitorPhone} onChangeText={setVisitorPhone} keyboardType="phone-pad" />
            <Input label="Purpose *" placeholder="e.g. Delivery, Guest visit, Maintenance" leftIcon="document-text-outline" value={purpose} onChangeText={setPurpose} />
            <Input label="Vehicle Number (Optional)" placeholder="e.g. KA-01-AB-1234" leftIcon="car-outline" value={vehicleNumber} onChangeText={setVehicleNumber} containerStyle={{ marginBottom: 0 }} />
          </Card>

          {/* Submit Action */}
          <Button
            title="Send Approval Request"
            onPress={handleRegister}
            loading={createMutation.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.xl, marginBottom: 40 }}
            icon={<Ionicons name="send" size={18} color={Colors.white} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  searchCard: { marginBottom: Spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
  
  // Quick Chips
  quickChipsSection: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  quickChipsTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsScroll: { gap: 8, paddingVertical: 4 },
  flatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.2)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  flatChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  searchResults: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.background, marginBottom: Spacing.sm },
  searchAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  searchAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  searchName: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '700' },
  searchFlat: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  typeGrid: { flexDirection: 'row', gap: Spacing.sm },
  typeButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.xs },
  typeLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
});
