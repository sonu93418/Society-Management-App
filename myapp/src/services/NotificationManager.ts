import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export type NotificationReceivedCallback = (notification: Notifications.Notification) => void;
export type NotificationTappedCallback = (response: Notifications.NotificationResponse) => void;

class NotificationManagerClass {
  private receivedCallbacks = new Map<string, NotificationReceivedCallback>();
  private tappedCallbacks = new Map<string, NotificationTappedCallback>();
  private isInitialized = false;
  private notificationListener: any = null;
  private responseListener: any = null;
  private lastRegisteredToken: string | null = null;

  /**
   * Register a callback to fire when a notification is received in the foreground.
   */
  onNotificationReceived(id: string, callback: NotificationReceivedCallback) {
    this.receivedCallbacks.set(id, callback);
  }

  /**
   * Unregister a notification received callback.
   */
  offNotificationReceived(id: string) {
    this.receivedCallbacks.delete(id);
  }

  /**
   * Register a callback to fire when a user taps a notification.
   */
  onNotificationTapped(id: string, callback: NotificationTappedCallback) {
    this.tappedCallbacks.set(id, callback);
  }

  /**
   * Unregister a notification tapped callback.
   */
  offNotificationTapped(id: string) {
    this.tappedCallbacks.delete(id);
  }

  /**
   * Main initialization method. Call this on app startup when user is authenticated.
   */
  async initNotifications(userId: string, userToken: string) {
    if (this.isInitialized) {
      // Re-trigger token registration check if user changed, but keep listeners active
      this.checkAndRegisterToken(userId);
      return;
    }

    // 1. Configure default behavior (heads-up notifications when app is active)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // 2. Set up Android notification channels (with audio fallback check)
    if (Platform.OS === 'android') {
      await this.configureAndroidChannels();
    }

    // 3. Register global listeners
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      this.receivedCallbacks.forEach((cb) => {
        try {
          cb(notification);
        } catch (err) {
          console.error('Error executing received callback:', err);
        }
      });
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      this.tappedCallbacks.forEach((cb) => {
        try {
          cb(response);
        } catch (err) {
          console.error('Error executing tapped callback:', err);
        }
      });
    });

    this.isInitialized = true;
    console.log('🔔 NotificationManager: Initialized listeners and channels.');

    // 4. Resolve and register device push token
    await this.checkAndRegisterToken(userId);
  }

  /**
   * Teardown listeners when user logs out.
   */
  shutdown() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    this.receivedCallbacks.clear();
    this.tappedCallbacks.clear();
    this.isInitialized = false;
    this.lastRegisteredToken = null;
    console.log('🔔 NotificationManager: Destroyed notification listeners.');
  }

  /**
   * Safely set up an Android notification channel.
   * If the custom audio asset is missing from native build, falls back to DEFAULT sound.
   */
  private async safeSetNotificationChannelAsync(
    channelId: string,
    options: Notifications.NotificationChannelInput
  ) {
    try {
      await Notifications.setNotificationChannelAsync(channelId, options);
      console.log(`✅ NotificationManager: Configured channel "${channelId}" with custom sound.`);
    } catch (err) {
      console.warn(
        `⚠️ NotificationManager: Custom sound "${options.sound}" not found in native app for channel "${channelId}". Falling back to system default.`
      );
      try {
        await Notifications.setNotificationChannelAsync(channelId, {
          ...options,
          sound: undefined, // Uses Android system default notification sound
        });
        console.log(`✅ NotificationManager: Configured fallback channel "${channelId}" successfully.`);
      } catch (fallbackErr) {
        console.error(
          `❌ NotificationManager: Failed to configure fallback channel for "${channelId}":`,
          fallbackErr
        );
      }
    }
  }

  /**
   * Configure all required high-importance Android channels.
   */
  private async configureAndroidChannels() {
    // Visitor Approvals & Gate Alerts Channel
    await this.safeSetNotificationChannelAsync('visitor', {
      name: 'Visitor Approvals',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'doorbell.wav',
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#4F46E5',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Emergency Alerts Channel
    await this.safeSetNotificationChannelAsync('emergency', {
      name: 'Emergency SOS',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'emergency.wav',
      vibrationPattern: [0, 1000, 500, 1000],
      lightColor: '#EF4444',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Maintenance Complaints & Tickets Channel
    await this.safeSetNotificationChannelAsync('complaint', {
      name: 'Maintenance Tickets',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'complaint.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Society Maintenance Payments Channel
    await this.safeSetNotificationChannelAsync('payments', {
      name: 'Maintenance Payments',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'success.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Default Fallback Channel
    await this.safeSetNotificationChannelAsync('general', {
      name: 'General Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'general.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  /**
   * Request permissions, resolve Expo Push Token, and register it on backend.
   */
  private async checkAndRegisterToken(userId: string) {
    if (!Device.isDevice) {
      console.log('💻 NotificationManager: Simulated device detected. Skipping push registration.');
      return;
    }

    const authToken = useAuthStore.getState().accessToken;
    if (!userId || !authToken) {
      console.log('📱 NotificationManager: Auth session not active. Deferring device token registration until login.');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ NotificationManager: Push notification permissions denied.');
        return;
      }

      let pushToken: string;
      let tokenType: 'expo' | 'fcm';

      if (Platform.OS === 'android') {
        pushToken = (await Notifications.getDevicePushTokenAsync()).data;
        tokenType = 'fcm';
        console.log('📱 NotificationManager: Fetched Android native FCM token:', pushToken);
      } else {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          throw new Error('EAS projectId not found in configuration config options.');
        }

        pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        tokenType = 'expo';
        console.log('📱 NotificationManager: Fetched iOS Expo push token:', pushToken);
      }

      let cachedToken: string | null = null;
      const cacheKey = `registered_push_token_${userId}`;
      try {
        if (Platform.OS !== 'web') {
          cachedToken = await SecureStore.getItemAsync(cacheKey);
        }
      } catch (err) {
        console.warn('⚠️ NotificationManager: Failed to read from SecureStore:', err);
      }

      if (pushToken && (pushToken !== this.lastRegisteredToken || pushToken !== cachedToken)) {
        await authApi.registerDevice(pushToken, tokenType, Platform.OS);
        this.lastRegisteredToken = pushToken;
        
        try {
          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync(cacheKey, pushToken);
          }
        } catch (err) {
          console.warn('⚠️ NotificationManager: Failed to write to SecureStore:', err);
        }
        
        console.log(`📱 NotificationManager: Registered ${tokenType} token on backend.`);
      } else {
        console.log('📱 NotificationManager: Push token already registered for this session/user. Skipping registration.');
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('📱 NotificationManager: Push token registration deferred (waiting for active session).');
      } else {
        console.warn('⚠️ NotificationManager: Push token registration skipped:', error?.message || error);
      }
    }
  }
}

export const NotificationManager = new NotificationManagerClass();
