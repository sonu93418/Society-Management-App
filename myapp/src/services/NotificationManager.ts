import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '../api/auth.api';

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
   * Unregister a foreground notification callback.
   */
  offNotificationReceived(id: string) {
    this.receivedCallbacks.delete(id);
  }

  /**
   * Register a callback to fire when a user taps a notification (deep linking).
   */
  onNotificationTapped(id: string, callback: NotificationTappedCallback) {
    this.tappedCallbacks.set(id, callback);
  }

  /**
   * Unregister a notification tap callback.
   */
  offNotificationTapped(id: string) {
    this.tappedCallbacks.delete(id);
  }

  /**
   * Initialize notification channels and register global notification listeners.
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
        shouldShowAlert: true,
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

    // 4. Retrieve push token and map to backend
    this.checkAndRegisterToken(userId);
  }

  /**
   * Shutdown notification listeners (clean cleanup).
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
    this.isInitialized = false;
    this.lastRegisteredToken = null;
    console.log('🔔 NotificationManager: Destroyed notification listeners.');
  }

  /**
   * Safe wrapper to register notification channels on Android.
   * If a custom sound resource is missing from the native binary (e.g. in dev client/Expo Go),
   * catch the error, log a warning, and fall back to registering with default sound.
   */
  private async safeSetNotificationChannelAsync(
    channelId: string,
    options: Notifications.NotificationChannelInput
  ) {
    try {
      await Notifications.setNotificationChannelAsync(channelId, options);
      console.log(`✅ NotificationManager: Configured channel "${channelId}" with custom sound.`);
    } catch (error) {
      console.warn(
        `⚠️ NotificationManager: Custom sound "${options.sound}" not found in native app for channel "${channelId}". Falling back to system default.`
      );
      try {
        // Fallback: Re-create the channel with 'default' sound
        const fallbackOptions = { ...options, sound: 'default' };
        await Notifications.setNotificationChannelAsync(channelId, fallbackOptions);
        console.log(`✅ NotificationManager: Configured fallback channel "${channelId}" successfully.`);
      } catch (fallbackError) {
        console.error(
          `❌ NotificationManager: Failed to configure fallback channel for "${channelId}":`,
          fallbackError
        );
      }
    }
  }

  /**
   * Setup all Android channels with custom sounds and importance overrides.
   */
  private async configureAndroidChannels() {
    // Visitor Channel
    await this.safeSetNotificationChannelAsync('visitor', {
      name: 'Visitor Requests',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'doorbell.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });

    // Complaint Channel
    await this.safeSetNotificationChannelAsync('complaint', {
      name: 'Complaint Updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'complaint.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
    });

    // Payments Channel
    await this.safeSetNotificationChannelAsync('payments', {
      name: 'Payment Invoices',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'success.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    // Notice Channel
    await this.safeSetNotificationChannelAsync('notice', {
      name: 'Notice Board',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'general.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    // Bookings Channel
    await this.safeSetNotificationChannelAsync('bookings', {
      name: 'Amenity Bookings',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'general.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });

    // Emergency Channel
    await this.safeSetNotificationChannelAsync('emergency', {
      name: '🚨 Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'emergency.wav',
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lightColor: '#EF4444',
    });

    // Default Fallback Channel
    await this.safeSetNotificationChannelAsync('general', {
      name: 'General Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'general.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
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

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('EAS projectId not found in configuration config options.');
      }

      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      if (pushToken && pushToken !== this.lastRegisteredToken) {
        await authApi.registerDevice(pushToken, 'expo', Platform.OS);
        this.lastRegisteredToken = pushToken;
        console.log('📱 NotificationManager: Registered push token on backend:', pushToken);
      }
    } catch (error) {
      console.error('❌ NotificationManager: Failed to fetch/register push token:', error);
    }
  }
}

export const NotificationManager = new NotificationManagerClass();
