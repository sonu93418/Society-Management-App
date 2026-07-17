import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationQueue extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed';
  retries: number;
  error?: string;
  category: 'visitor' | 'complaint' | 'notice' | 'booking' | 'payment' | 'poll' | 'emergency' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

const notificationQueueSchema = new Schema<INotificationQueue>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    retries: { type: Number, default: 0 },
    error: { type: String },
    category: {
      type: String,
      enum: ['visitor', 'complaint', 'notice', 'booking', 'payment', 'poll', 'emergency', 'general'],
      default: 'general',
    },
  },
  { timestamps: true }
);

notificationQueueSchema.index({ status: 1, retries: 1 });
notificationQueueSchema.index({ user: 1, createdAt: -1 });

export const NotificationQueue = mongoose.model<INotificationQueue>('NotificationQueue', notificationQueueSchema);
