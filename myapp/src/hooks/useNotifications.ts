import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';

// Track whether the handler has been configured yet (module-level singleton flag)
let notificationHandlerConfigured = false;

export const useNotifications = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Effect 1: Configure the notification handler exactly once after mount.
  // This MUST be inside useEffect — calling setNotificationHandler at module
  // level triggers a React state update before components have mounted.
  useEffect(() => {
    if (!notificationHandlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notificationHandlerConfigured = true;
    }
  }, []);

  // Effect 2: Register push token with backend when the user is authenticated.
  useEffect(() => {
    if (!token || !user) return;

    registerForPushNotificationsAsync()
      .then(async (pushToken) => {
        if (pushToken) {
          try {
            await authApi.updatePushToken(pushToken);
            console.log('📱 Push token registered with backend:', pushToken);
          } catch (err) {
            console.error('❌ Failed to register push token with backend:', err);
          }
        }
      })
      .catch((err) => console.error('❌ registerForPushNotificationsAsync error:', err));
  }, [token, user]);

  // Effect 3: Subscribe to notification events after mount (independent of auth).
  useEffect(() => {
    // Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Push notification received in foreground:', notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    // User tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 User tapped on a push notification:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [queryClient]);
};

async function registerForPushNotificationsAsync() {
  let pushToken: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  if (!Device.isDevice) {
    console.log('💻 Push notifications require a physical device. Simulator detected.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('⚠️ Push notification permission not granted.');
    return;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error('EAS projectId not found in app.json extra.eas.projectId');
    }

    pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('📱 Expo push token obtained:', pushToken);
  } catch (e) {
    console.error('❌ Error getting Expo Push Token:', e);
  }

  return pushToken;
}
