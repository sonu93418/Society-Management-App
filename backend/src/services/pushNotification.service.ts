import { logger } from '../utils/logger';

export interface PushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export class PushNotificationService {
  private EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(message: PushMessage): Promise<boolean> {
    try {
      const { to, title, body, data, sound = 'default', badge, channelId } = message;

      // Filter out invalid/empty tokens
      const tokens = Array.isArray(to) ? to : [to];
      const validTokens = tokens.filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken['));

      if (validTokens.length === 0) {
        logger.info('📱 PushNotificationService: No valid Expo push tokens provided.');
        return false;
      }

      // Expo endpoint accepts either a single message object or an array of message objects (up to 100).
      // We will batch if there are multiple.
      const payloads = validTokens.map(token => ({
        to: token,
        title,
        body,
        sound,
        data,
        badge,
        channelId,
      }));

      // Expo expects an array or a single object
      const bodyData = payloads.length === 1 ? payloads[0] : payloads;

      logger.info(`📱 Sending push notification to ${validTokens.length} token(s). Title: "${title}"`);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };

      const { env } = require('../config/env');
      if (env.EXPO_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
      }

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ Expo push notification API failed: status ${response.status}, details: ${errorText}`);
        return false;
      }

      const resData = await response.json() as any;
      logger.info('📱 Expo response: ' + JSON.stringify(resData));
      return true;
    } catch (error) {
      logger.error('❌ Error sending push notification:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
