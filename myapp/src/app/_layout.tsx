import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import { Colors, Typography, Spacing } from '../theme';
import { SuccessModalProvider } from '../components/ui/SuccessModal';
import { InAppNotificationProvider } from '../components/ui/InAppNotification';

const appLogo = require('../../assets/images/logo.png');

// QueryClient is created once at module level — stable reference, never recreated
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// ─── Navigation Guard ────────────────────────────────────────────────────────
// Separated from RootLayout so it can safely use useRouter() and useSegments()
// which require being inside <Stack>.
function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();
  // Ref to prevent navigation from running before the router is ready
  const navigationReady = useRef(false);

  // Initialize socket and push notifications (they guard themselves internally)
  useSocket();
  useNotifications();

  useEffect(() => {
    // Mark router as ready after first render
    navigationReady.current = true;
  }, []);

  useEffect(() => {
    // Never navigate while session is still being restored from SecureStore
    if (isLoading) return;
    // Don't navigate if router isn't ready yet
    if (!navigationReady.current) return;

    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === '(auth)';
    const isAtRoot = routeSegments.length === 0 || routeSegments[0] === 'index' || routeSegments[0] === '';

    if (!isAuthenticated) {
      // Not authenticated → send to login if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/onboarding');
      }
    } else {
      // Authenticated → send to role dashboard if on auth screen or root entry screen
      if (inAuthGroup || isAtRoot) {
        const role = user?.role;
        if (role === 'admin') {
          router.replace('/(admin)');
        } else if (role === 'guard') {
          router.replace('/(guard)');
        } else {
          router.replace('/(resident)');
        }
      }
    }
  }, [isAuthenticated, isLoading, user?.role, segments, router]);

  return null;
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Keep splash visible for at least 2500ms so the logo is always seen
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Restore session from SecureStore exactly once on mount.
    // restoreSession always sets isLoading=false when done (even on error).
    restoreSession();

    // Guarantee a minimum splash display time of 2500ms
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, [restoreSession]);

  // Show branded logo screen while session is loading OR minimum time hasn't elapsed
  if (isLoading || showSplash) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        {/* App logo image shown for the few seconds during session restore */}
        <Image source={appLogo} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.brandName}>Portl</Text>
        <Text style={styles.brandTagline}>Your society, one tap away</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <InAppNotificationProvider>
        <SuccessModalProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(resident)" />
            <Stack.Screen name="(guard)" />
            <Stack.Screen name="(admin)" />
          </Stack>
          {/* AuthGate is placed INSIDE Stack so useRouter/useSegments work correctly */}
          <AuthGate />
        </SuccessModalProvider>
      </InAppNotificationProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary, // solid indigo — matches the logo background
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 32,
    marginBottom: Spacing.lg,
  },
  brandName: {
    ...Typography.h1,
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandTagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
});
