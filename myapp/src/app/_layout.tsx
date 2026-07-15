import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../theme';

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

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated → send to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screen → send to role dashboard
      const role = user?.role;
      if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'guard') {
        router.replace('/(guard)');
      } else {
        router.replace('/(resident)');
      }
    }
  }, [isAuthenticated, isLoading, user?.role, segments, router]);

  return null;
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Restore session from SecureStore exactly once on mount.
    // restoreSession always sets isLoading=false when done (even on error).
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While restoring session — show a full-screen loading indicator.
  // This prevents the <Redirect> flash and eliminates navigation-during-render.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
