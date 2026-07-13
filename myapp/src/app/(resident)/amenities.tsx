import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Amenity } from '../../types/models';

import { useAmenities, useBookAmenity, useBookings, useCancelBooking } from '../../hooks/useCommunity';
import { EmptyState } from '../../components/ui/EmptyState';

const timeSlots = [
  '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
  '10:00 - 11:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
  '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
];

const amenityIcons: Record<string, string> = {
  'swimming pool': '🏊',
  'pool': '🏊',
  'clubhouse': '🏠',
  'club house': '🏠',
  'tennis': '🎾',
  'tennis court': '🎾',
  'gym': '🏋️',
  'gymnasium': '🏋️',
  'badminton': '🏸',
  'squash': '🏸',
  'park': '🌳',
  'garden': '🌳',
  'hall': '🏢',
};

const getAmenityIcon = (name: string) => {
  const norm = name.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (norm.includes(key)) return icon;
  }
  return '🏢';
};

export default function AmenitiesScreen() {
  const [activeTab, setActiveTab] = useState<'amenities' | 'bookings'>('amenities');

  const { data: response, isLoading: amenitiesLoading, refetch: refetchAmenities } = useAmenities();
  const { data: bookingsResponse, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings({ mine: 'true' });

  const bookAmenityMutation = useBookAmenity();
  const cancelBookingMutation = useCancelBooking();

  const amenities = response?.data || [];
  const bookings = bookingsResponse?.data?.bookings || [];

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [people, setPeople] = useState(1);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            cancelBookingMutation.mutate(
              { bookingId },
              {
                onSuccess: () => {
                  Alert.alert('Booking Cancelled', 'Your booking request has been cancelled.');
                  refetchBookings();
                },
                onError: (err: any) => {
                  Alert.alert('Error', err?.message || 'Failed to cancel booking');
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleBook = () => {
    if (!selectedSlot || !selectedAmenity) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    const [startTime, endTime] = selectedSlot.split(' - ');
    const formattedDate = dates[selectedDate].toISOString().split('T')[0];

    bookAmenityMutation.mutate(
      {
        amenityId: selectedAmenity._id,
        date: formattedDate,
        startTime,
        endTime,
        numberOfPeople: people,
      },
      {
        onSuccess: (bookingRes) => {
          const statusMsg = bookingRes.data?.status === 'pending'
            ? 'Booking request submitted and is pending approval.'
            : 'Booking confirmed successfully!';

          Alert.alert(
            'Booking Request',
            `${selectedAmenity.name}\nDate: ${dates[selectedDate].toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}\nSlot: ${selectedSlot}\n${statusMsg}`,
            [{ text: 'OK', onPress: () => { setSelectedAmenity(null); setSelectedSlot(null); setPeople(1); } }]
          );
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to book amenity');
        },
      }
    );
  };

  if (selectedAmenity) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedAmenity(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book {selectedAmenity.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Amenity Info */}
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.emoji}>{getAmenityIcon(selectedAmenity.name)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.amenityName}>{selectedAmenity.name}</Text>
                <Text style={styles.amenityDesc}>{selectedAmenity.description}</Text>
              </View>
            </View>
            <View style={styles.infoDetails}>
              <View style={styles.infoChip}>
                <Ionicons name="people-outline" size={14} color={Colors.primary} />
                <Text style={styles.infoChipText}>Max {selectedAmenity.capacity}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="time-outline" size={14} color={Colors.primary} />
                <Text style={styles.infoChipText}>{selectedAmenity.availableFrom} - {selectedAmenity.availableTo}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="cash-outline" size={14} color={Colors.primary} />
                <Text style={styles.infoChipText}>{selectedAmenity.pricePerSlot ? `₹${selectedAmenity.pricePerSlot}/slot` : 'Free'}</Text>
              </View>
            </View>
          </Card>

          {/* Date Selection */}
          <Text style={styles.fieldLabel}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((date, i) => {
              const isToday = i === 0;
              const isSelected = selectedDate === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setSelectedDate(i)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                    {isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>
                    {date.toLocaleDateString('en-IN', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Slots */}
          <Text style={styles.fieldLabel}>Select Time Slot</Text>
          <View style={styles.slotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* People */}
          <Text style={styles.fieldLabel}>Number of People</Text>
          <View style={styles.peopleRow}>
            <TouchableOpacity style={styles.peopleBtn} onPress={() => setPeople(Math.max(1, people - 1))}>
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.peopleCount}>{people}</Text>
            <TouchableOpacity style={styles.peopleBtn} onPress={() => setPeople(Math.min(selectedAmenity.capacity, people + 1))}>
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Rules */}
          {selectedAmenity.rules.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Rules</Text>
              <Card style={styles.rulesCard} variant="outlined">
                {selectedAmenity.rules.map((rule, i) => (
                  <View key={i} style={styles.ruleRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          <Button title="Confirm Booking" onPress={handleBook} fullWidth size="lg" style={{ marginTop: Spacing.xl }} icon={<Ionicons name="calendar-outline" size={20} color={Colors.white} />} />

          <View style={{ height: Spacing['5xl'] }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleRefresh = async () => {
    if (activeTab === 'amenities') {
      await refetchAmenities();
    } else {
      await refetchBookings();
    }
  };

  const isRefreshing = activeTab === 'amenities' ? amenitiesLoading : bookingsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Amenities</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amenities' && styles.tabActive]}
          onPress={() => setActiveTab('amenities')}
        >
          <Text style={[styles.tabText, activeTab === 'amenities' && styles.tabTextActive]}>Book Amenities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content */}
      {activeTab === 'amenities' ? (
        amenitiesLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : amenities.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="No Amenities"
            description="There are no amenities available for booking at this time."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          >
            {amenities.map((amenity) => (
              <TouchableOpacity key={amenity._id} activeOpacity={0.7} onPress={() => setSelectedAmenity(amenity)}>
                <Card style={styles.amenityCard}>
                  <View style={styles.amenityRow}>
                    <View style={styles.emojiContainer}>
                      <Text style={styles.emojiLarge}>{getAmenityIcon(amenity.name)}</Text>
                    </View>
                    <View style={styles.amenityInfo}>
                      <Text style={styles.amenityName}>{amenity.name}</Text>
                      <Text style={styles.amenityDesc} numberOfLines={2}>{amenity.description}</Text>
                      <View style={styles.amenityMeta}>
                        <Badge label={amenity.pricePerSlot ? `₹${amenity.pricePerSlot}` : 'Free'} variant={amenity.pricePerSlot ? 'warning' : 'success'} size="sm" />
                        <Text style={styles.amenityTime}>{amenity.availableFrom} - {amenity.availableTo}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
            <View style={{ height: Spacing['3xl'] }} />
          </ScrollView>
        )
      ) : (
        bookingsLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Bookings Yet"
            description="You haven't made any amenity bookings yet."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          >
            {bookings.map((booking: any) => {
              const amenityName = typeof booking.amenity === 'object' ? booking.amenity.name : 'Amenity';
              const isCancellable = booking.status === 'pending' || booking.status === 'confirmed';
              return (
                <Card key={booking._id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingAmenity}>{amenityName}</Text>
                      <Text style={styles.bookingTime}>
                        {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {booking.startTime} - {booking.endTime}
                      </Text>
                    </View>
                    <Badge label={booking.status} variant={booking.status as any} size="sm" />
                  </View>

                  <View style={styles.bookingFooter}>
                    <Text style={styles.bookingDetails}>
                      Guests: {booking.numberOfPeople || 1} • {booking.pricePaid ? `Paid: ₹${booking.pricePaid}` : 'Free'}
                    </Text>
                    {isCancellable && (
                      <Button
                        title="Cancel"
                        variant="danger"
                        size="sm"
                        onPress={() => handleCancelBooking(booking._id)}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
            <View style={{ height: Spacing['3xl'] }} />
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },

  // Amenity List
  amenityCard: { marginBottom: Spacing.md },
  amenityRow: { flexDirection: 'row', alignItems: 'center' },
  emojiContainer: { width: 52, height: 52, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  emojiLarge: { fontSize: 28 },
  emoji: { fontSize: 36, marginRight: Spacing.md },
  amenityInfo: { flex: 1, marginLeft: Spacing.md },
  amenityName: { ...Typography.bodyMedium, color: Colors.text },
  amenityDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  amenityMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  amenityTime: { ...Typography.caption, color: Colors.textTertiary },

  // Booking View
  infoCard: { marginBottom: Spacing.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, gap: Spacing.xs },
  infoChipText: { ...Typography.captionMedium, color: Colors.primary },

  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.md },
  dateScroll: { marginBottom: Spacing.lg },
  dateChip: { alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, backgroundColor: Colors.white, marginRight: Spacing.md, minWidth: 64, ...Shadows.xs },
  dateChipActive: { backgroundColor: Colors.primary },
  dateDay: { ...Typography.caption, color: Colors.textSecondary },
  dateDayActive: { color: 'rgba(255,255,255,0.7)' },
  dateNum: { ...Typography.h4, color: Colors.text, marginVertical: 2 },
  dateNumActive: { color: Colors.white },
  dateMonth: { ...Typography.caption, color: Colors.textSecondary },
  dateMonthActive: { color: 'rgba(255,255,255,0.7)' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  slotChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  slotChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { ...Typography.captionMedium, color: Colors.textSecondary },
  slotTextActive: { color: Colors.white },

  peopleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.lg },
  peopleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  peopleCount: { ...Typography.h3, color: Colors.text, minWidth: 30, textAlign: 'center' },

  rulesCard: { marginBottom: Spacing.md },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  ruleText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1 },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xs, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, ...Shadows.xs },
  tab: { flex: 1, paddingVertical: Spacing.sm + 2, alignItems: 'center', borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.captionMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Bookings list
  bookingCard: { marginBottom: Spacing.md },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingAmenity: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '600' },
  bookingTime: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  bookingDetails: { ...Typography.captionMedium, color: Colors.textTertiary },
});
