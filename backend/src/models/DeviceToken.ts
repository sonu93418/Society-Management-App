import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  tokenType: 'fcm' | 'expo';
  deviceType: 'ios' | 'android' | 'web';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    tokenType: { type: String, enum: ['fcm', 'expo'], required: true },
    deviceType: { type: String, enum: ['ios', 'android', 'web'], default: 'android' },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ user: 1, isActive: 1 });

export const DeviceToken = mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema);
