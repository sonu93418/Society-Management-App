import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

import { useGuardSearchResidents } from '../../hooks/useCommunity';
import { useCreateVisitor } from '../../hooks/useVisitors';
import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

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
      Alert.alert('Error', 'Please search and select a resident first');
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
          Alert.alert('Success', `Visitor request sent to ${selectedResident.name} for approval.`, [
            { text: 'OK', onPress: () => router.back() }
          ]);
          setVisitorName('');
          setVisitorPhone('');
          setPurpose('');
          setVehicleNumber('');
          setSelectedResident(null);
          setSearchQuery('');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to register visitor');
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Register Visitor</Text>

        {/* Search Resident */}
        <Card style={styles.searchCard}>
          <Text style={styles.cardTitle}>Search Resident</Text>
          <Input
            placeholder="Search by name, flat, or phone"
            leftIcon="search-outline"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ marginBottom: 0 }}
          />
          {selectedResident && (() => {
            const selectedTowerName = typeof selectedResident.flat === 'object' && selectedResident.flat?.tower && typeof selectedResident.flat.tower === 'object' ? (selectedResident.flat.tower as any).name || '' : '';
            const selectedFlatNum = typeof selectedResident.flat === 'object' ? selectedResident.flat?.flatNumber || '' : '';
            const selectedFlatStr = selectedTowerName ? `${selectedTowerName}-${selectedFlatNum}` : selectedFlatNum || String(selectedResident.flat || '');
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.md }}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginRight: Spacing.sm }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.bodyMedium, color: Colors.successDark }}>Selected: {selectedResident.name}</Text>
                  <Text style={{ ...Typography.caption, color: Colors.successDark }}>
                    Flat: {selectedFlatStr}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedResident(null)}>
                  <Ionicons name="close-circle" size={20} color={Colors.successDark} />
                </TouchableOpacity>
              </View>
            );
          })()}

          {isSearching && searchQuery.length >= 2 && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.md }} />
          )}

          {searchQuery.length >= 2 && !isSearching && (
            <View style={styles.searchResults}>
              {searchResults.length === 0 ? (
                <Text style={{ ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md }}>No residents found.</Text>
              ) : (
                searchResults.map((resident) => {
                  const towerName = typeof resident.flat === 'object' && resident.flat?.tower && typeof resident.flat.tower === 'object' ? (resident.flat.tower as any).name || '' : '';
                  const flatNum = typeof resident.flat === 'object' ? resident.flat?.flatNumber || '' : '';
                  const flatStr = towerName ? `${towerName}-${flatNum}` : flatNum || String(resident.flat || '');
                  const firstLetter = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                  return (
                    <TouchableOpacity
                      key={resident._id || resident.id}
                      style={styles.searchResult}
                      onPress={() => {
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
                      <View>
                        <Text style={styles.searchName}>{resident.name}</Text>
                        <Text style={styles.searchFlat}>Flat {flatStr} • {resident.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </Card>

        {/* Visitor Type */}
        <Card>
          <Text style={styles.cardTitle}>Visitor Type</Text>
          <View style={styles.typeGrid}>
            {visitorTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  selectedType === type.key && { backgroundColor: type.color, borderColor: type.color },
                ]}
                onPress={() => setSelectedType(type.key)}
              >
                <Ionicons
                  name={type.icon}
                  size={22}
                  color={selectedType === type.key ? Colors.white : type.color}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.key && { color: Colors.white },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Visitor Details */}
        <Card style={{ marginTop: Spacing.lg }}>
          <Text style={styles.cardTitle}>Visitor Details</Text>
          <Input label="Visitor Name *" placeholder="Enter visitor's name" leftIcon="person-outline" value={visitorName} onChangeText={setVisitorName} />
          <Input label="Phone Number *" placeholder="Enter phone number" leftIcon="call-outline" value={visitorPhone} onChangeText={setVisitorPhone} keyboardType="phone-pad" />
          <Input label="Purpose *" placeholder="e.g. Package delivery, Family visit" leftIcon="document-text-outline" value={purpose} onChangeText={setPurpose} />
          <Input label="Vehicle Number" placeholder="e.g. KA-01-AB-1234" leftIcon="car-outline" value={vehicleNumber} onChangeText={setVehicleNumber} containerStyle={{ marginBottom: 0 }} />
        </Card>

        {/* Submit */}
        <Button
          title="Send Approval Request"
          onPress={handleRegister}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl }}
          icon={<Ionicons name="send" size={20} color={Colors.white} />}
        />

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.xl },
  searchCard: { marginBottom: Spacing.lg },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.lg },
  searchResults: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.background, marginBottom: Spacing.sm },
  searchAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  searchAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  searchName: { ...Typography.bodyMedium, color: Colors.text },
  searchFlat: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  typeGrid: { flexDirection: 'row', gap: Spacing.md },
  typeButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.xs },
  typeLabel: { ...Typography.captionMedium, color: Colors.textSecondary },
});
