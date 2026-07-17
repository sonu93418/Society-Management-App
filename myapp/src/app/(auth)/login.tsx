import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const splashPoster = require('../../../assets/images/splash_poster.png');
const appLogo = require('../../../assets/images/logo.png');
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../api/client';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId:
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
          '1086683526523-google-client-id-placeholder.apps.googleusercontent.com',
        offlineAccess: true,
      });
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);

    if (Platform.OS === 'web') {
      const confirmMock = window.confirm(
        'Google Native Sign-In is not supported on Web.\n\nWould you like to log in with a Mock Google Account for testing?'
      );
      if (confirmMock) {
        await performGoogleBackendLogin('mock_google_token_resident');
      } else {
        setLoading(false);
      }
      return;
    }

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('No ID Token returned from Google');
      }

      await performGoogleBackendLogin(idToken);
    } catch (error: any) {
      console.warn('Google Sign-In Error details:', error);

      if (
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === statusCodes.IN_PROGRESS
      ) {
        Alert.alert('Sign-In Cancelled', 'Google Sign-In was cancelled.');
        setLoading(false);
        return;
      }

      // Offer Mock Google Login for testing/offline simulator contexts
      Alert.alert(
        'Google Sign-In Setup',
        'Google Client Credentials are not configured in your environment, or Play Services are missing.\n\nWould you like to log in with a Mock Google Account for testing?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          { 
            text: 'Use Mock Resident', 
            onPress: () => performGoogleBackendLogin('mock_google_token_resident') 
          },
          { 
            text: 'Use Mock Admin', 
            onPress: () => performGoogleBackendLogin('mock_google_token_admin') 
          }
        ]
      );
    }
  };

  const performGoogleBackendLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await authApi.googleLogin(idToken);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        await setAuth({ ...user, id: user.id || (user as any)._id }, accessToken, refreshToken);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      Alert.alert('Google Auth Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

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
          <Image source={appLogo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.appName}>Portl</Text>
          <Text style={styles.tagline}>Your society, one tap away</Text>

          <TouchableOpacity
            style={styles.showcaseBtn}
            onPress={() => setShowShowcase(true)}
          >
            <Ionicons name="sparkles" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.showcaseBtnText}>See what's new in Portl</Text>
          </TouchableOpacity>
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

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="log-in-outline" size={20} color={Colors.white} />}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          </TouchableOpacity>

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

      <Modal
        visible={showShowcase}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShowcase(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Explore Portl</Text>
              <TouchableOpacity
                onPress={() => setShowShowcase(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.imageContainer}>
                <Image
                  source={splashPoster}
                  style={styles.posterImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.showcaseHeader}>Smart Living, Unified</Text>
              <Text style={styles.showcaseSub}>
                Manage your home and stay connected with your community on India's most secure society management portal.
              </Text>

              {/* Feature Items */}
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIconContainer, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Gate Security & Pre-Approve</Text>
                    <Text style={styles.featureDescription}>
                      Pre-register visitors, service providers, and get real-time approvals for visitor entry.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconContainer, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="megaphone" size={22} color={Colors.warning} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Notices & Interactive Polls</Text>
                    <Text style={styles.featureDescription}>
                      Stay updated with official broadcasts and cast your vote on community decisions.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconContainer, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="cash" size={22} color={Colors.success} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Bills & Amenities Booking</Text>
                    <Text style={styles.featureDescription}>
                      Pay maintenance invoices directly and book society clubhouses, pools, or halls.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconContainer, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="construct" size={22} color="#0284C7" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Digital Helpdesk Tickets</Text>
                    <Text style={styles.featureDescription}>
                      File requests for plumbing, electrical, or generic issues and track updates instantly.
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                title="Get Started"
                onPress={() => setShowShowcase(false)}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.xl, marginBottom: Spacing['2xl'] }}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 24,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: -Spacing.xs,
  },
  forgotText: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '600',
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
  showcaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  showcaseBtnText: {
    ...Typography.captionMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: Spacing.xl,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  showcaseHeader: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  showcaseSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  featureList: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    ...Typography.captionMedium,
    color: Colors.textTertiary,
    textTransform: 'lowercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    height: 48,
    width: '100%',
    ...Shadows.sm,
  },
  googleBtnText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
});
