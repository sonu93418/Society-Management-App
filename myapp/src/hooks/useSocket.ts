import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Platform } from 'react-native';

// Derive socket URL dynamically from EXPO_PUBLIC_API_URL (or app.json extra config)
const getSocketUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '');
  }
  return (Constants.expoConfig?.extra?.socketUrl as string | undefined) ?? 'http://10.69.91.148:5000';
};

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const currentTokenRef = useRef<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        currentTokenRef.current = null;
      }
      return;
    }

    // Skip redundant reconnection if socket is already initialized with active token
    if (socketRef.current && currentTokenRef.current === token) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    currentTokenRef.current = token;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      // Log connection warnings gracefully without surfacing red error overlays for transient timeouts
      console.warn('🔌 Socket connection warning:', error.message);
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        console.warn('⚠️ Stale or invalid session token detected. Logging out...');
        useAuthStore.getState().logout().catch(console.error);
      }
    });

    // Resident Event Handlers
    if (user?.role === 'resident') {
      socket.on('visitor:request', (data: any) => {
        console.log('📩 Received visitor:request:', data);
        
        // Invalidate query to update pending list automatically
        queryClient.invalidateQueries({ queryKey: ['visitors', 'pending'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'my-visitors'] });

        Alert.alert(
          'New Visitor Request',
          `${data.visitorName} (${data.type}) is waiting at the gate for flat ${data.flatNumber || 'your flat'}. Purpose: ${data.purpose || 'None'}`,
          [{ text: 'View Requests' }]
        );
      });

      socket.on('visitor:entry', (data: any) => {
        console.log('📩 Received visitor:entry:', data);
        
        queryClient.invalidateQueries({ queryKey: ['visitors', 'my-visitors'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'history'] });

        Alert.alert(
          'Visitor Entered',
          `${data.visitorName} has entered the premises.`
        );
      });

      socket.on('visitor:exit', (data: any) => {
        console.log('📩 Received visitor:exit:', data);

        queryClient.invalidateQueries({ queryKey: ['visitors', 'my-visitors'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'history'] });

        Alert.alert(
          'Visitor Checked Out',
          `${data.visitorName} has exited the premises.`
        );
      });
    }

    // Guard Event Handlers
    if (user?.role === 'guard') {
      socket.on('visitor:approved', (data: any) => {
        console.log('📩 Received visitor:approved:', data);

        queryClient.invalidateQueries({ queryKey: ['visitors', 'society', 'pending'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'history'] });

        Alert.alert(
          'Visitor Approved',
          `Visitor request for ${data.visitorName} has been APPROVED by the resident.`
        );
      });

      socket.on('visitor:rejected', (data: any) => {
        console.log('📩 Received visitor:rejected:', data);

        queryClient.invalidateQueries({ queryKey: ['visitors', 'society', 'pending'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'history'] });

        Alert.alert(
          'Visitor Rejected',
          `Visitor request for ${data.visitorName} was REJECTED by the resident.`
        );
      });

      socket.on('guard:activity', (data: any) => {
        console.log('📩 Received guard:activity:', data);

        queryClient.invalidateQueries({ queryKey: ['visitors', 'society', 'inside'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['visitors', 'history'] });
      });
    }

    // Shared Notifications
    socket.on('notification', (data: any) => {
      console.log('📩 Received notification:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Alert.alert(data.title || 'Notification', data.message || '');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.role, queryClient]);

  return socketRef.current;
};
