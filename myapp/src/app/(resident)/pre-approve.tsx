import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const visitorTypes = [
  { key: 'guest' as const, label: 'Guest', icon: 'person-outline' as const, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'delivery' as const, label: 'Delivery', icon: 'cube-outline' as const, color: Colors.warning, bg: Colors.warningLight },
  { key: 'cab' as const, label: 'Cab', icon: 'car-outline' as const, color: '#3B82F6', bg: Colors.infoLight },
  { key: 'service' as const, label: 'Service', icon: 'construct-outline' as const, color: Colors.success, bg: Colors.successLight },
];

import { useAuthStore } from '../../store/auth.store';
import { usePreApproveVisitor } from '../../hooks/useVisitors';
import { ActivityIndicator, Share, Image } from 'react-native';

export default function PreApproveScreen() {
  const user = useAuthStore((s) => s.user);
  const preApproveMutation = usePreApproveVisitor();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedType, setSelectedType] = useState<any>('guest');
  const [validDays, setValidDays] = useState(1);
  const [count, setCount] = useState(1);

  const [createdPass, setCreatedPass] = useState<any>(null);

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in visitor name and phone number');
      return;
    }

    const flatId = typeof user?.flat === 'object' ? user.flat._id : user?.flat;
    if (!flatId) {
      Alert.alert('Error', 'No flat assigned to your profile. Please contact the administrator.');
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    preApproveMutation.mutate(
      {
        visitorName: name.trim(),
        visitorPhone: phone.trim(),
        purpose: purpose.trim() || 'Pre-approved entry',
        type: selectedType,
        flatId,
        vehicleNumber: vehicleNumber.trim() || undefined,
        validUntil: validUntil.toISOString(),
        expectedCount: count,
      },
      {
        onSuccess: (res: any) => {
          setCreatedPass(res?.data || res);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to pre-approve visitor');
        },
      }
    );
  };

  const handleShare = async () => {
    if (!createdPass) return;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${createdPass.qrCode}`;
      const message = `✨ Portl Digital Visitor Pass ✨\n\nHi ${createdPass.visitorName},\n\nYou have been pre-approved for entry.\n\n📍 Purpose: ${createdPass.purpose || 'None'}\n🗓 Valid Till: ${new Date(createdPass.validUntil).toLocaleDateString('en-IN')}\n🔢 Pass Code: ${createdPass.qrCode?.slice(0, 8).toUpperCase()}\n\nScan this QR Code at the security gate to enter instantly:\n${qrUrl}`;
      await Share.share({
        message,
        title: 'Visitor Pass',
      });
    } catch (error) {
      console.error('Error sharing pass:', error);
    }
  };

  if (createdPass) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${createdPass.qrCode}`;
    const firstLetter = createdPass.visitorName ? createdPass.visitorName.charAt(0).toUpperCase() : 'V';
    const typeColor = visitorTypes.find(t => t.key === createdPass.type)?.color || Colors.primary;
    const typeBg = visitorTypes.find(t => t.key === createdPass.type)?.bg || Colors.primaryGhost;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCreatedPass(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visitor Pass</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Card style={[styles.passCard, { borderTopColor: typeColor, borderTopWidth: 4 }]}>
            <View style={styles.passHeader}>
              <View style={[styles.passTypeIcon, { backgroundColor: typeBg }]}>
                <Ionicons
                  name={visitorTypes.find(t => t.key === createdPass.type)?.icon || 'person-outline'}
                  size={24}
                  color={typeColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.passLabel}>{String(createdPass.type).toUpperCase()} PASS</Text>
                <Text style={styles.passId}>Code: {createdPass.qrCode?.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <Image source={{ uri: qrUrl }} style={styles.qrImage} />
              <Text style={styles.qrHint}>Scan at gate for instant entry</Text>
            </View>

            <View style={styles.passDivider}>
              <View style={styles.dividerDotLeft} />
              <View style={styles.dividerLine} />
              <View style={styles.dividerDotRight} />
            </View>

            <View style={styles.passDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Visitor</Text>
                <Text style={styles.detailValue}>{createdPass.visitorName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{createdPass.visitorPhone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.detailValue}>{createdPass.purpose || 'Visitor entry'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valid Till</Text>
                <Text style={styles.detailValue}>
                  {new Date(createdPass.validUntil).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {createdPass.expectedCount > 1 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Count</Text>
                  <Text style={styles.detailValue}>{createdPass.expectedCount} Persons</Text>
                </View>
              )}
            </View>
          </Card>

          <Button
            title="Share Pass"
            onPress={handleShare}
            fullWidth
            size="lg"
            variant="primary"
            style={{ marginTop: Spacing.xl }}
            icon={<Ionicons name="share-social-outline" size={20} color={Colors.white} />}
          />

          <Button
            title="Done"
            onPress={() => router.back()}
            fullWidth
            size="lg"
            variant="secondary"
            style={{ marginTop: Spacing.md }}
          />

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pre-Approve Visitor</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <Card style={styles.infoBanner} variant="outlined">
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={22} color={Colors.primary} />
            <Text style={styles.infoText}>
              Pre-approved visitors can enter without waiting for your real-time approval. The guard will verify their identity and let them in.
            </Text>
          </View>
        </Card>

        {/* Visitor Type */}
        <Text style={styles.fieldLabel}>Visitor Type</Text>
        <View style={styles.typeRow}>
          {visitorTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.typeCard, selectedType === type.key && { borderColor: type.color, borderWidth: 2, backgroundColor: type.bg }]}
              onPress={() => setSelectedType(type.key)}
            >
              <View style={[styles.typeIcon, { backgroundColor: selectedType === type.key ? type.color : type.bg }]}>
                <Ionicons name={type.icon} size={20} color={selectedType === type.key ? Colors.white : type.color} />
              </View>
              <Text style={[styles.typeLabel, selectedType === type.key && { color: type.color, fontWeight: '600' }]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details */}
        <Card style={{ marginTop: Spacing.xl }}>
          <Input label="Visitor Name *" placeholder="Enter visitor's full name" leftIcon="person-outline" value={name} onChangeText={setName} />
          <Input label="Phone Number *" placeholder="Enter phone number" leftIcon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Purpose" placeholder="e.g. Family visit, Package collection" leftIcon="document-text-outline" value={purpose} onChangeText={setPurpose} />
          <Input label="Vehicle Number" placeholder="e.g. KA-01-AB-1234 (optional)" leftIcon="car-outline" value={vehicleNumber} onChangeText={setVehicleNumber} containerStyle={{ marginBottom: 0 }} />
        </Card>

        {/* Valid For */}
        <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>Valid For</Text>
        <View style={styles.daysRow}>
          {[1, 3, 7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, validDays === d && styles.dayChipActive]}
              onPress={() => setValidDays(d)}
            >
              <Text style={[styles.dayText, validDays === d && styles.dayTextActive]}>
                {d === 1 ? 'Today' : d < 7 ? `${d} Days` : d === 7 ? '1 Week' : d === 14 ? '2 Weeks' : '1 Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expected Count */}
        <Text style={styles.fieldLabel}>Expected Visitors</Text>
        <View style={styles.countRow}>
          <TouchableOpacity style={styles.countBtn} onPress={() => setCount(Math.max(1, count - 1))}>
            <Ionicons name="remove" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.countValue}>{count}</Text>
          <TouchableOpacity style={styles.countBtn} onPress={() => setCount(Math.min(10, count + 1))}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.countLabel}>person{count > 1 ? 's' : ''}</Text>
        </View>

        <Button
          title="Pre-Approve Visitor"
          onPress={handleSubmit}
          loading={preApproveMutation.isPending}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing['2xl'] }}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
        />

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h4, color: Colors.text },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'] },

  infoBanner: { marginBottom: Spacing.xl },
  infoRow: { flexDirection: 'row', gap: Spacing.md },
  infoText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.md },

  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.xs },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  typeLabel: { ...Typography.captionMedium, color: Colors.textSecondary },

  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dayChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { ...Typography.captionMedium, color: Colors.textSecondary },
  dayTextActive: { color: Colors.white },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  countBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  countValue: { ...Typography.h3, color: Colors.text, minWidth: 30, textAlign: 'center' },
  countLabel: { ...Typography.body, color: Colors.textSecondary },

  // Pass success card styling
  passCard: { padding: Spacing.lg, marginTop: Spacing.xl, ...Shadows.md },
  passHeader: { flexDirection: 'row', alignItems: 'center' },
  passTypeIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  passLabel: { ...Typography.label, color: Colors.textTertiary, letterSpacing: 1 },
  passId: { ...Typography.bodyMedium, color: Colors.text, marginTop: 2, fontWeight: 'bold' },
  qrContainer: { alignItems: 'center', marginVertical: Spacing.xl },
  qrImage: { width: 200, height: 200, borderRadius: BorderRadius.md },
  qrHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
  passDivider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -Spacing.lg, marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border, borderRadius: 1 },
  dividerDotLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.background, marginLeft: -8 },
  dividerDotRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.background, marginRight: -8 },
  passDetails: { gap: Spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...Typography.bodySm, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyMedium, color: Colors.text, fontWeight: '500' },
});
