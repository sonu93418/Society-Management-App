import { logger } from '../utils/logger';
import { getFirebaseApp } from '../config/firebase';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { DeviceToken } from '../models/DeviceToken';
import { env } from '../config/env';

export interface PushMessagePayload {
  userId: string;
  title: string;
  body: string;
  category: 'visitor' | 'complaint' | 'notice' | 'booking' | 'payment' | 'poll' | 'emergency' | 'general';
  data?: Record<string, string>;
}

// Maps category to Android channel and sound resource
const CATEGORY_MAP = {
  visitor: { channelId: 'visitor', sound: 'doorbell' },
  complaint: { channelId: 'complaint', sound: 'complaint' },
  notice: { channelId: 'notice', sound: 'general' },
  booking: { channelId: 'bookings', sound: 'general' },
  payment: { channelId: 'payments', sound: 'success' },
  poll: { channelId: 'notice', sound: 'general' },
  emergency: { channelId: 'emergency', sound: 'emergency' },
  general: { channelId: 'general', sound: 'general' },
};

export class PushNotificationService {
  private EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendToUser(payload: PushMessagePayload): Promise<{ success: boolean; sentCount: number }> {
    try {
      const { userId, title, body, category, data = {} } = payload;

      // 1. Fetch active push tokens for this user
      const deviceTokens = await DeviceToken.find({ user: userId, isActive: true });
      if (deviceTokens.length === 0) {
        logger.info(`📱 PushNotificationService: No active push tokens found for user ${userId}`);
        return { success: false, sentCount: 0 };
      }

      const fcmTokens = deviceTokens.filter(t => t.tokenType === 'fcm').map(t => t.token);
      const expoTokens = deviceTokens.filter(t => t.tokenType === 'expo').map(t => t.token);

      const mapping = CATEGORY_MAP[category] || CATEGORY_MAP.general;

      let sentCount = 0;

      // 2. Dispatch FCM Push Notifications
      if (fcmTokens.length > 0) {
        const fcmSent = await this.sendFcmMulticast(fcmTokens, {
          title,
          body,
          channelId: mapping.channelId,
          sound: mapping.sound,
          data: { ...data, category },
        });
        sentCount += fcmSent;
      }

      // 3. Dispatch Expo Push Notifications
      if (expoTokens.length > 0) {
        const expoSent = await this.sendExpoBatch(expoTokens, {
          title,
          body,
          channelId: mapping.channelId,
          sound: `${mapping.sound}.wav`, // Expo expects extension
          data: { ...data, category },
        });
        sentCount += expoSent;
      }

      return { success: sentCount > 0, sentCount };
    } catch (error) {
      logger.error('❌ Error sending push notification to user:', error);
      return { success: false, sentCount: 0 };
    }
  }

  private async sendFcmMulticast(tokens: string[], message: { title: string; body: string; channelId: string; sound: string; data: Record<string, string> }): Promise<number> {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) {
      logger.warn('⚠️ Firebase Admin SDK not initialized. Skipping FCM dispatch.');
      return 0;
    }

    try {
      const messaging = getMessaging(firebaseApp);
      
      const payload: MulticastMessage = {
        tokens,
        notification: {
          title: message.title,
          body: message.body,
        },
        android: {
          priority: message.channelId === 'emergency' ? 'high' : 'normal',
          notification: {
            channelId: message.channelId,
            sound: message.sound,
            clickAction: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: `${message.sound}.wav`,
              badge: 1,
            },
          },
        },
        data: message.data,
      };

      const response = await messaging.sendEachForMulticast(payload);
      
      let successCount = response.successCount;
      
      // Handle invalid/unregistered tokens
      if (response.failureCount > 0) {
        for (let idx = 0; idx < response.responses.length; idx++) {
          const res = response.responses[idx];
          if (!res.success && res.error) {
            const token = tokens[idx];
            const code = res.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              logger.info(`🧹 Deactivating invalid FCM token: ${token}`);
              await DeviceToken.updateOne({ token }, { isActive: false });
            }
          }
        }
      }

      logger.info(`🔥 FCM: Successfully sent notification to ${successCount}/${tokens.length} tokens.`);
      return successCount;
    } catch (error) {
      logger.error('❌ Failed to send FCM multicast:', error);
      return 0;
    }
  }

  private async sendExpoBatch(tokens: string[], message: { title: string; body: string; channelId: string; sound: string; data: Record<string, string> }): Promise<number> {
    try {
      const payloads = tokens.map(token => ({
        to: token,
        title: message.title,
        body: message.body,
        sound: 'default', // standard fallback
        channelId: message.channelId,
        data: message.data,
      }));

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };

      if (env.EXPO_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
      }

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloads),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`❌ Expo Push gateway returned error status ${response.status}: ${errText}`);
        return 0;
      }

      const resData = await response.json() as any;
      let successCount = 0;

      if (resData && Array.isArray(resData.data)) {
        for (let idx = 0; idx < resData.data.length; idx++) {
          const ticket = resData.data[idx];
          const token = tokens[idx];
          
          if (ticket.status === 'ok') {
            successCount++;
          } else if (ticket.status === 'error' && ticket.details && ticket.details.error === 'DeviceNotRegistered') {
            logger.info(`🧹 Deactivating unregistered Expo token: ${token}`);
            await DeviceToken.updateOne({ token }, { isActive: false });
          }
        }
      }

      logger.info(`📱 Expo: Successfully sent notification to ${successCount}/${tokens.length} tokens.`);
      return successCount;
    } catch (error) {
      logger.error('❌ Failed to send Expo batch push:', error);
      return 0;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
