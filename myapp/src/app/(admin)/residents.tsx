import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useResidents, useSearchResidents } from '../../hooks/useAdmin';
import { router } from 'expo-router';

export default function ResidentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback lists
  const { data: listRes, isLoading: listLoading } = useResidents();
  const { data: searchRes, isLoading: searchLoading } = useSearchResidents(searchQuery);

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = isSearching ? searchLoading : listLoading;

  const residents = isSearching ? (searchRes?.data || []) : (listRes?.data?.residents || []);

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
              </Card>
            );
          })}
        </ScrollView>
      )}
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
});
