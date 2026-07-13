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

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
