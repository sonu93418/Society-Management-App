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
  Dimensions,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (clientId && !clientId.includes('placeholder')) {
        GoogleSignin.configure({
          webClientId: clientId,
          offlineAccess: true,
        });
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Google Sign-In is only available on Android and iOS devices.');
      return;
    }

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId || clientId.includes('placeholder')) {
      Alert.alert(
        'Google Sign-In Setup Required',
        'Google Sign-In requires a valid Web Client ID from Google Cloud Console.\n\nTo configure Google Sign-In:\n1. Open Google Cloud / Firebase Console\n2. Register your Android App ("com.portl.app") & add your SHA-1 fingerprint\n3. Copy the Web Client ID into EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in myapp/.env\n\nPlease sign in with Email & Password in the meantime.'
      );
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      // Force native account picker dialog by clearing any cached session first
      await GoogleSignin.signOut().catch(() => {});

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
        // User cancelled — do nothing
        setLoading(false);
        return;
      }

      if (
        error?.code === 'DEVELOPER_ERROR' ||
        error?.code === '10' ||
        error?.message?.includes('DEVELOPER_ERROR')
      ) {
        setLoading(false);
        Alert.alert(
          'Select Google Account to Sign In',
          'Native Google Sign-In requires adding your SHA-1 to Google Cloud Console.\n\nChoose an account email to test database role-based login:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resident (resident@portl.app)',
              onPress: () => performGoogleBackendLogin('mock_google_token_resident'),
            },
            {
              text: 'Guard (guard@portl.app)',
              onPress: () => performGoogleBackendLogin('mock_google_token_guard'),
            },
            {
              text: 'Admin (loverbirdcpr6457@gmail.com)',
              onPress: () => performGoogleBackendLogin('mock_google_token_admin'),
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Google Sign-In Failed',
        'Could not complete Google Sign-In. Please check your network connection or log in with your email and password.'
      );
      setLoading(false);
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
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = getApiError(error);

      // Check if this is a "no account found" error — guide to registration
      if (error?.response?.status === 404) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this Google email.\n\nPlease register first with email & password, then you can use Google Sign-In to log in.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Register Now', onPress: () => router.push('/(auth)/register') },
          ]
        );
      } else if (error?.response?.status === 403) {
        Alert.alert('Account Pending', errorMsg);
      } else {
        Alert.alert('Google Auth Failed', errorMsg);
      }
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
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top gradient hero with branding */}
      <View style={styles.heroSection}>
        <Image source={appLogo} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.appName}>Portl</Text>
        <Text style={styles.tagline}>Your society, one tap away</Text>
        <TouchableOpacity
          style={styles.showcaseBtn}
          onPress={() => setShowShowcase(true)}
        >
          <Ionicons name="sparkles" size={13} color="#fff" style={{ marginRight: 5 }} />
          <Text style={styles.showcaseBtnText}>See what's new</Text>
        </TouchableOpacity>
      </View>

      {/* Main card that covers the bottom portion of the screen */}
      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.cardScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formCard}>
            {/* Drag handle indicator */}
            <View style={styles.handleBar} />

            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </TouchableOpacity>

            {/* Registration links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>
                  No account? <Text style={styles.linkHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
              <View style={styles.linkDot} />
              <TouchableOpacity onPress={() => router.push('/(auth)/register-society')}>
                <Text style={styles.linkText}>
                  <Text style={styles.linkHighlight}>Register Society</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo Quick Access */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Quick Demo</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: '#EEF2FF' }]}
                  onPress={() => fillDemoCredentials('resident')}
                >
                  <Ionicons name="home-outline" size={15} color={Colors.primary} />
                  <Text style={[styles.demoButtonText, { color: Colors.primary }]}>Resident</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: '#ECFDF5' }]}
                  onPress={() => fillDemoCredentials('guard')}
                >
                  <Ionicons name="shield-outline" size={15} color={Colors.successDark} />
                  <Text style={[styles.demoButtonText, { color: Colors.successDark }]}>Guard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: '#FFF7ED' }]}
                  onPress={() => fillDemoCredentials('admin')}
                >
                  <Ionicons name="settings-outline" size={15} color={Colors.warningDark} />
                  <Text style={[styles.demoButtonText, { color: Colors.warningDark }]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Showcase Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  // ── Hero (top branding area) ──
  heroSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 28,
    backgroundColor: Colors.primary,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  showcaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    marginTop: 12,
  },
  showcaseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Bottom card area ──
  cardWrapper: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  cardScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  formCard: {
    flex: 1,
  },

  // ── Handle bar ──
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 6,
  },

  // ── Form header ──
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  // ── Forgot password ──
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
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

  // ── Google button ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    height: 48,
    width: '100%',
    ...Shadows.xs,
  },
  googleBtnText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },

  // ── Registration links row ──
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  linkText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  linkHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  linkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },

  // ── Demo section ──
  demoSection: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Showcase Modal ──
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
});
