import mongoose, { Schema } from 'mongoose';
import { IUser } from './User';
import { UserRole } from '../constants';

const adminSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: [UserRole.ADMIN], default: UserRole.ADMIN },
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
  { timestamps: true, collection: 'admins' }
);

export const Admin = mongoose.models.Admin || mongoose.model<IUser>('Admin', adminSchema, 'admins');
export default Admin;
