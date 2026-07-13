import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

import { useSocket } from '../hooks/useSocket';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize socket connection when authenticated
  useSocket();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Already authenticated, redirect to role dashboard
      if (user?.role === 'admin') {
        router.replace('/(admin)');
      } else if (user?.role === 'guard') {
        router.replace('/(guard)');
      } else {
        router.replace('/(resident)');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Check stored auth on app start
    // In a real app, we'd read from SecureStore here
    setLoading(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(resident)" />
          <Stack.Screen name="(guard)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
