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

    // 2. Send native push notification if user has registered a token
    const User = mongoose.model('User');
    const user = await User.findById(doc.user).select('pushToken');
    if (user && user.pushToken) {
      const { pushNotificationService } = require('../services/pushNotification.service');
      await pushNotificationService.sendPushNotification({
        to: user.pushToken,
        title: doc.title,
        body: doc.body,
        data: doc.data ? JSON.parse(JSON.stringify(doc.data)) : undefined,
      });
    }
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
