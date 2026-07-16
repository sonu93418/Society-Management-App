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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async () => {
    if (!email.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please enter both email and phone number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase(), phone.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Verification Code Sent',
        `For demo testing, copy the generated verification code:\n\n${res.data?.resetToken}\n\nUse this code to set your new password in the next step.`,
        [
          {
            text: 'Proceed to Reset',
            onPress: () => {
              setToken(res.data?.resetToken || '');
              setStep(2);
            },
          },
        ]
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Request Failed', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), token.trim(), newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your password has been reset successfully!', [
        { text: 'Sign In Now', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Reset Failed', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Verify your identity to request a code'
                : 'Enter your verification code and set a new password'}
            </Text>
          </View>

          {step === 1 ? (
            /* Step 1 Form */
            <View style={styles.form}>
              <Text style={styles.formTitle}>Step 1: Verification</Text>
              <Text style={styles.formSubtitle}>
                Enter the email address and phone number linked to your account.
              </Text>

              <Input
                label="Email Address"
                placeholder="e.g. user@example.com"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                leftIcon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Button
                title="Get Verification Code"
                onPress={handleRequestToken}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.lg }}
                icon={<Ionicons name="key-outline" size={20} color={Colors.white} />}
              />
            </View>
          ) : (
            /* Step 2 Form */
            <View style={styles.form}>
              <Text style={styles.formTitle}>Step 2: New Password</Text>
              <Text style={styles.formSubtitle}>
                Set a strong password to secure your account access.
              </Text>

              <Input
                label="Verification Code"
                placeholder="Enter the 6-digit code"
                leftIcon="lock-open-outline"
                value={token}
                onChangeText={setToken}
                keyboardType="numeric"
              />

              <Input
                label="New Password"
                placeholder="Enter new password"
                leftIcon="lock-closed-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                leftIcon="shield-checkmark-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.lg }}
                icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
              />

              <TouchableOpacity style={styles.backToStepOne} onPress={() => setStep(1)}>
                <Text style={styles.backToStepOneText}>Back to Verification</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
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
  form: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.md,
  },
  formTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  backToStepOne: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  backToStepOneText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
