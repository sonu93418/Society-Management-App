import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export type NotificationReceivedCallback = (notification: Notifications.Notification) => void;
export type NotificationTappedCallback = (response: Notifications.NotificationResponse) => void;

// ── Foreground notification presentation handler ──
// NOTE: This only affects FOREGROUND display.
// Lock screen / background display is controlled entirely by Android channels (importance) and iOS permission grants.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Android Channel Definitions (v2 — fresh IDs to bypass Android's importance cache) ──
const ANDROID_CHANNELS = [
  {
    id: 'portl_visitor_v2',
    name: 'Visitor & Gate Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#4F46E5',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
    bypassDnd: true,
  },
  {
    id: 'portl_emergency_v2',
    name: 'Emergency SOS',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 1000, 500, 1000],
    lightColor: '#EF4444',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
    bypassDnd: true,
  },
  {
    id: 'portl_complaint_v2',
    name: 'Maintenance Tickets',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F59E0B',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
  },
  {
    id: 'portl_payments_v2',
    name: 'Maintenance Payments',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: '#10B981',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
  },
  {
    id: 'portl_general_v2',
    name: 'Society Announcements',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#4F46E5',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
  },
];

// Map category → new channel IDs
const CHANNEL_ID_MAP: Record<string, string> = {
  visitor: 'portl_visitor_v2',
  emergency: 'portl_emergency_v2',
  complaint: 'portl_complaint_v2',
  payments: 'portl_payments_v2',
  payment: 'portl_payments_v2',
  general: 'portl_general_v2',
  notice: 'portl_general_v2',
  poll: 'portl_general_v2',
  booking: 'portl_general_v2',
};

class NotificationManagerClass {
  private receivedCallbacks = new Map<string, NotificationReceivedCallback>();
  private tappedCallbacks = new Map<string, NotificationTappedCallback>();
  private isInitialized = false;
  private channelsConfigured = false;
  private notificationListener: any = null;
  private responseListener: any = null;
  private lastRegisteredToken: string | null = null;

  onNotificationReceived(id: string, callback: NotificationReceivedCallback) {
    this.receivedCallbacks.set(id, callback);
  }

  offNotificationReceived(id: string) {
    this.receivedCallbacks.delete(id);
  }

  onNotificationTapped(id: string, callback: NotificationTappedCallback) {
    this.tappedCallbacks.set(id, callback);
  }

  offNotificationTapped(id: string) {
    this.tappedCallbacks.delete(id);
  }

  /**
   * MUST be called at app startup BEFORE user login — ensures Android channels
   * are registered with MAX importance so lock screen banners work immediately.
   */
  async setupChannelsEarly() {
    if (Platform.OS !== 'android') return;
    if (this.channelsConfigured) return;

    console.log('🔔 NotificationManager: Setting up Android channels (early, pre-login)...');
    await this.configureAndroidChannels();
    this.channelsConfigured = true;
    console.log('✅ NotificationManager: Android channels ready.');
  }

  async initNotifications(userId: string, userToken: string) {
    // Ensure channels are set up if not already done
    if (Platform.OS === 'android' && !this.channelsConfigured) {
      await this.configureAndroidChannels();
      this.channelsConfigured = true;
    }

    if (this.isInitialized) {
      this.checkAndRegisterToken(userId);
      return;
    }

    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      this.receivedCallbacks.forEach((cb) => {
        try { cb(notification); } catch (err) {
          console.error('Error executing received callback:', err);
        }
      });
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      this.tappedCallbacks.forEach((cb) => {
        try { cb(response); } catch (err) {
          console.error('Error executing tapped callback:', err);
        }
      });
    });

    this.isInitialized = true;
    console.log('🔔 NotificationManager: Listeners initialized.');
    await this.checkAndRegisterToken(userId);
  }

  shutdown() {
    if (this.notificationListener) { this.notificationListener.remove(); this.notificationListener = null; }
    if (this.responseListener) { this.responseListener.remove(); this.responseListener = null; }
    this.receivedCallbacks.clear();
    this.tappedCallbacks.clear();
    this.isInitialized = false;
    this.lastRegisteredToken = null;
    console.log('🔔 NotificationManager: Destroyed notification listeners.');
  }

  /**
   * Delete old channels and recreate with fresh v2 IDs + MAX importance.
   * Android caches channel importance permanently per ID — fresh IDs bypass the cache.
   */
  private async configureAndroidChannels() {
    // Delete legacy channels if they exist (so old importance caches are cleared)
    const legacyIds = ['visitor', 'emergency', 'complaint', 'payments', 'general', 'default'];
    for (const id of legacyIds) {
      try {
        await Notifications.deleteNotificationChannelAsync(id);
      } catch (_) { /* channel may not exist — ignore */ }
    }

    // Create fresh v2 channels with MAX importance
    for (const channel of ANDROID_CHANNELS) {
      try {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          importance: channel.importance,
          vibrationPattern: channel.vibrationPattern,
          lightColor: channel.lightColor,
          lockscreenVisibility: channel.lockscreenVisibility,
          enableLights: channel.enableLights,
          enableVibrate: channel.enableVibrate,
          bypassDnd: (channel as any).bypassDnd,
        });
        console.log(`✅ Channel created: ${channel.id} (importance: ${channel.importance})`);
      } catch (err) {
        console.error(`❌ Failed to create channel ${channel.id}:`, err);
      }
    }
  }

  private async checkAndRegisterToken(userId: string) {
    if (!Device.isDevice) {
      console.log('💻 NotificationManager: Simulated device — skipping push registration.');
      return;
    }

    const authToken = useAuthStore.getState().accessToken;
    if (!userId || !authToken) {
      console.log('📱 NotificationManager: Auth session not active. Deferring token registration.');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
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

        if (!projectId) throw new Error('EAS projectId not found.');

        pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        tokenType = 'expo';
        console.log('📱 NotificationManager: Fetched iOS Expo push token:', pushToken);
      }

      const cacheKey = `registered_push_token_${userId}`;
      let cachedToken: string | null = null;
      try {
        if (Platform.OS !== 'web') cachedToken = await SecureStore.getItemAsync(cacheKey);
      } catch (_) {}

      if (pushToken && (pushToken !== this.lastRegisteredToken || pushToken !== cachedToken)) {
        await authApi.registerDevice(pushToken, tokenType, Platform.OS);
        this.lastRegisteredToken = pushToken;
        try {
          if (Platform.OS !== 'web') await SecureStore.setItemAsync(cacheKey, pushToken);
        } catch (_) {}
        console.log(`📱 NotificationManager: Registered ${tokenType} token on backend.`);
      } else {
        console.log('📱 NotificationManager: Push token already registered. Skipping.');
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('📱 NotificationManager: Push token registration deferred (waiting for active session).');
      } else {
        console.warn('⚠️ NotificationManager: Push token registration skipped:', error?.message || error);
      }
    }
  }

  /**
   * Schedule a local notification to appear on the lock screen and system tray.
   * Uses v2 channel IDs which are created with MAX importance (bypasses Android cache).
   */
  async scheduleLockScreenNotification({
    title,
    body,
    data = {},
    category = 'visitor',
    seconds = 5,
  }: {
    title: string;
    body: string;
    data?: Record<string, any>;
    category?: string;
    seconds?: number;
  }) {
    // Ensure channels are ready before scheduling
    if (Platform.OS === 'android' && !this.channelsConfigured) {
      await this.configureAndroidChannels();
      this.channelsConfigured = true;
    }

    const channelId = CHANNEL_ID_MAP[category] || 'portl_general_v2';

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, category },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          badge: 1,
        },
        trigger: seconds > 0
          ? ({ seconds, repeats: false, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL } as any)
          : null,
        ...(Platform.OS === 'android' ? { channelId } : {}),
      } as any);
      console.log(`🔔 Lock screen notification scheduled on channel "${channelId}" in ${seconds}s.`);
    } catch (err) {
      console.error('❌ NotificationManager: Error scheduling lock screen notification:', err);
    }
  }

  /**
   * Get resolved channel ID for a given category string.
   */
  getChannelId(category: string): string {
    return CHANNEL_ID_MAP[category] || 'portl_general_v2';
  }
}

export const NotificationManager = new NotificationManagerClass();
