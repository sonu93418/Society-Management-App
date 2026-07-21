import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

export default function RegisterSocietyScreen() {
  // Society Info
  const [societyName, setSocietyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [totalTowers, setTotalTowers] = useState('');
  const [totalFlats, setTotalFlats] = useState('');

  // Admin Info
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !societyName.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim() ||
      !adminName.trim() ||
      !adminEmail.trim() ||
      !adminPhone.trim() ||
      !adminPassword.trim()
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Validation Error', 'Please fill in all required fields marked with *');
      return;
    }

    if (adminPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    if (adminPassword.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return;
    }

    // Password regex check matching zod schema
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(adminPassword)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Validation Error',
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.submitOnboardingRequest({
        societyName: societyName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        totalTowers: totalTowers ? parseInt(totalTowers, 10) : undefined,
        totalFlats: totalFlats ? parseInt(totalFlats, 10) : undefined,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPhone: adminPhone.trim(),
        adminPassword: adminPassword,
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSubmitted(true);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Submission Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.successContainer}>
        <StatusBar style="dark" />
        <View style={styles.successCard}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successDescription}>
            Thank you for registering <Text style={{ fontWeight: '700', color: Colors.text }}>{societyName}</Text>. 
            Your onboarding request has been sent to our developer team for verification.
          </Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>
              We will review the request and configure your society dashboard within 24 hours. An email confirmation will be sent to <Text style={{ fontWeight: '600' }}>{adminEmail}</Text>.
            </Text>
          </View>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Register Society</Text>
          <Text style={styles.subtitle}>List your housing society on Portl Management System</Text>
        </View>

        {/* Section 1: Society Info */}
        <View style={styles.sectionHeader}>
          <Ionicons name="business-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Society Details</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Society Name *"
            placeholder="e.g. Silver Oak Residency"
            leftIcon="business-outline"
            value={societyName}
            onChangeText={setSocietyName}
          />
          <Input
            label="Street Address *"
            placeholder="e.g. 456 Main Road, Whitefield"
            leftIcon="map-outline"
            value={address}
            onChangeText={setAddress}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                label="City *"
                placeholder="Bangalore"
                leftIcon="location-outline"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="State *"
                placeholder="Karnataka"
                leftIcon="flag-outline"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                label="Pincode *"
                placeholder="560066"
                leftIcon="pin-outline"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', gap: Spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Towers"
                  placeholder="e.g. 3"
                  value={totalTowers}
                  onChangeText={setTotalTowers}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Flats"
                  placeholder="e.g. 100"
                  value={totalFlats}
                  onChangeText={setTotalFlats}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Admin Info */}
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Admin Account Setup</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Admin Full Name *"
            placeholder="e.g. Rajesh Kumar"
            leftIcon="person-outline"
            value={adminName}
            onChangeText={setAdminName}
          />
          <Input
            label="Admin Email Address *"
            placeholder="e.g. admin@your-society.com"
            leftIcon="mail-outline"
            value={adminEmail}
            onChangeText={setAdminEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Admin Phone Number *"
            placeholder="e.g. 9876543210"
            leftIcon="call-outline"
            value={adminPhone}
            onChangeText={setAdminPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Create Admin Password *"
            placeholder="Min. 8 chars (A-z, 1-9, @)"
            leftIcon="lock-closed-outline"
            value={adminPassword}
            onChangeText={setAdminPassword}
            isPassword
          />
          <Input
            label="Confirm Password *"
            placeholder="Re-enter password"
            leftIcon="lock-closed-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          <Button
            title="Submit Onboarding Request"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.md }}
            icon={<Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.md,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['3xl'],
    alignItems: 'center',
    ...Shadows.xl,
    width: '100%',
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.success,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'flex-start',
    marginBottom: Spacing['2xl'],
  },
  infoText: {
    ...Typography.bodySm,
    color: Colors.primary,
    flex: 1,
    lineHeight: 18,
  },
});
