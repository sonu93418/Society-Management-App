import { NotificationQueue, INotificationQueue } from '../models/NotificationQueue';
import { User } from '../models/User';
import { pushNotificationService } from './pushNotification.service';
import { logger } from '../utils/logger';

// Maps notification category to user preference key
const PREFERENCE_KEY_MAP = {
  visitor: 'visitor',
  complaint: 'complaint',
  notice: 'notice',
  booking: 'booking',
  payment: 'payment',
  poll: 'poll',
  emergency: 'emergency',
  general: 'notice',
} as const;

export class NotificationQueueService {
  async enqueue(params: {
    userId: string;
    title: string;
    body: string;
    category: 'visitor' | 'complaint' | 'notice' | 'booking' | 'payment' | 'poll' | 'emergency' | 'general';
    data?: Record<string, string>;
  }): Promise<INotificationQueue | null> {
    try {
      const { userId, title, body, category, data } = params;

      // 1. Fetch user to check preferences
      const user = await User.findById(userId);
      if (!user) {
        logger.warn(`📱 QueueService: User ${userId} not found, skipping notification.`);
        return null;
      }

      // 2. Validate preferences
      const prefKey = PREFERENCE_KEY_MAP[category] || 'notice';
      const isEnabled = user.notificationPreferences
        ? (user.notificationPreferences as any)[prefKey] !== false
        : true;

      // Emergency notifications cannot be disabled
      if (!isEnabled && category !== 'emergency') {
        logger.info(`📱 QueueService: Notification skipped for user ${userId} because preference "${prefKey}" is disabled.`);
        return null;
      }

      // 3. Create queue entry
      const queueItem = await NotificationQueue.create({
        user: userId,
        title,
        body,
        data,
        status: 'pending',
        category,
        retries: 0,
      });

      logger.info(`📱 QueueService: Enqueued notification "${title}" for user ${userId}`);

      // 4. Try immediate dispatch
      await this.dispatchItem(queueItem);

      return queueItem;
    } catch (error) {
      logger.error('❌ QueueService: Failed to enqueue notification:', error);
      return null;
    }
  }

  async dispatchItem(item: INotificationQueue): Promise<boolean> {
    try {
      item.status = 'pending';
      await item.save();

      const result = await pushNotificationService.sendToUser({
        userId: item.user.toString(),
        title: item.title,
        body: item.body,
        category: item.category,
        data: item.data ? JSON.parse(JSON.stringify(item.data)) : undefined,
      });

      if (result.success) {
        item.status = 'sent';
        item.error = undefined;
        await item.save();
        logger.info(`📱 QueueService: Notification ${item._id} sent successfully.`);
        return true;
      } else {
        item.status = 'failed';
        item.retries += 1;
        item.error = 'No active tokens or sending failed';
        await item.save();
        return false;
      }
    } catch (error: any) {
      item.status = 'failed';
      item.retries += 1;
      item.error = error?.message || 'Unknown error during dispatch';
      await item.save();
      logger.error(`❌ QueueService: Dispatch failed for notification ${item._id}:`, error);
      return false;
    }
  }

  async retryFailedNotifications(): Promise<void> {
    try {
      // Find pending or failed notifications with less than 3 retries
      const failedItems = await NotificationQueue.find({
        status: { $in: ['pending', 'failed'] },
        retries: { $lt: 3 },
      }).limit(50);

      if (failedItems.length === 0) return;

      logger.info(`🔄 QueueService: Retrying ${failedItems.length} failed/pending notifications...`);

      for (const item of failedItems) {
        await this.dispatchItem(item);
      }
    } catch (error) {
      logger.error('❌ QueueService: Error in retry loop:', error);
    }
  }

  startCronWorker(): NodeJS.Timeout {
    logger.info('⚙️  Notification Queue Cron worker started (runs every 60 seconds)');
    return setInterval(() => {
      this.retryFailedNotifications().catch(err => {
        logger.error('❌ QueueService: Error in background cron job:', err);
      });
    }, 60 * 1000);
  }
}

export const notificationQueueService = new NotificationQueueService();
