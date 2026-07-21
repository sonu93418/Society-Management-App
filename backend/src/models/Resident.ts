import mongoose, { Schema } from 'mongoose';
import { IUser } from './User';
import { UserRole } from '../constants';

const residentSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: [UserRole.RESIDENT], default: UserRole.RESIDENT },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat' },
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
  { timestamps: true, collection: 'residents' }
);

export const Resident = mongoose.models.Resident || mongoose.model<IUser>('Resident', residentSchema, 'residents');
export default Resident;
