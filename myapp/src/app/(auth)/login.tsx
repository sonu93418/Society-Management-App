import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../api/client';

import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email: email.trim().toLowerCase(), password });
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        await setAuth({ ...user, id: user.id || (user as any)._id }, accessToken, refreshToken);

        // Haptic feedback on success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate based on role
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else if (user.role === 'guard') {
          router.replace('/(guard)');
        } else {
          router.replace('/(resident)');
        }
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'resident' | 'guard' | 'admin') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const credentials = {
      resident: { email: 'resident@portl.app', password: 'Demo@1234' },
      guard: { email: 'guard@portl.app', password: 'Demo@1234' },
      admin: { email: 'admin@portl.app', password: 'Demo@1234' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.appName}>Portl</Text>
          <Text style={styles.tagline}>Your society, one tap away</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            leftIcon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="log-in-outline" size={20} color={Colors.white} />}
          />

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Quick Demo Login</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: Colors.primaryGhost }]}
              onPress={() => fillDemoCredentials('resident')}
            >
              <Ionicons name="home-outline" size={18} color={Colors.primary} />
              <Text style={[styles.demoButtonText, { color: Colors.primary }]}>Resident</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: Colors.successLight }]}
              onPress={() => fillDemoCredentials('guard')}
            >
              <Ionicons name="shield-outline" size={18} color={Colors.successDark} />
              <Text style={[styles.demoButtonText, { color: Colors.successDark }]}>Guard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: Colors.warningLight }]}
              onPress={() => fillDemoCredentials('admin')}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.warningDark} />
              <Text style={[styles.demoButtonText, { color: Colors.warningDark }]}>Admin</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: Spacing['6xl'],
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  tagline: {
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
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  registerLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  registerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  registerHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  demoTitle: {
    ...Typography.captionMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  demoButtonText: {
    ...Typography.captionMedium,
  },
});
