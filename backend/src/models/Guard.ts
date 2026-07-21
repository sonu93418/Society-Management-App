import mongoose, { Schema } from 'mongoose';
import { IUser } from './User';
import { UserRole } from '../constants';

const guardSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: [UserRole.GUARD], default: UserRole.GUARD },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    pushToken: { type: String },
    notificationPreferences: {
      visitor: { type: Boolean, default: true },
      complaint: { type: Boolean, default: true },
      notice: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      poll: { type: Boolean, default: true },
      marketing: { type: Boolean, default: true },
      emergency: { type: Boolean, default: true },
    },
  },
  { timestamps: true, collection: 'guards' }
);

export const Guard = mongoose.models.Guard || mongoose.model<IUser>('Guard', guardSchema, 'guards');
export default Guard;
