import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '../constants';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Post-save hook to dispatch real-time events and push notifications
notificationSchema.post('save', async function (doc) {
  try {
    // 1. Emit Socket.IO event in real-time
    const { emitToUser } = require('../socket');
    emitToUser(doc.user.toString(), 'notification', {
      _id: doc._id,
      user: doc.user,
      society: doc.society,
      type: doc.type,
      title: doc.title,
      body: doc.body,
      data: doc.data,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
    });

    // 2. Map NotificationType to Push Notification Category
    let category: 'visitor' | 'complaint' | 'notice' | 'booking' | 'payment' | 'poll' | 'emergency' | 'general' = 'general';
    const type = doc.type;

    if (type.startsWith('visitor')) {
      category = 'visitor';
    } else if (type.startsWith('ticket')) {
      category = 'complaint';
    } else if (type === 'notice_published') {
      category = 'notice';
    } else if (type === 'poll_created') {
      category = 'poll';
    } else if (type.startsWith('booking')) {
      category = 'booking';
    } else if (type.startsWith('payment')) {
      category = 'payment';
    } else if (type === 'emergency') {
      category = 'emergency';
    }

    // 3. Enqueue and dispatch push notification asynchronously in the background
    const { notificationQueueService } = require('../services/notificationQueue.service');
    notificationQueueService.enqueue({
      userId: doc.user.toString(),
      title: doc.title,
      body: doc.body,
      category,
      data: doc.data ? JSON.parse(JSON.stringify(doc.data)) : undefined,
    }).catch((err: any) => {
      const { logger } = require('../utils/logger');
      if (logger) logger.error('❌ Background enqueue failed:', err);
    });

  } catch (error) {
    const { logger } = require('../utils/logger');
    if (logger) {
      logger.error('❌ Error in Notification post-save hook:', error);
    } else {
      console.error('❌ Error in Notification post-save hook:', error);
    }
  }
});

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
