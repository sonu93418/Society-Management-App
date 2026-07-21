import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../constants';
import { Admin } from './Admin';
import { Guard } from './Guard';
import { Resident } from './Resident';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  society: mongoose.Types.ObjectId;
  flat?: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  refreshToken?: string;
  pushToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  loginAttempts: number;
  lockUntil?: Date | null;
  notificationPreferences: {
    visitor: boolean;
    complaint: boolean;
    notice: boolean;
    booking: boolean;
    payment: boolean;
    poll: boolean;
    marketing: boolean;
    emergency: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    pushToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
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
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export { Admin, Guard, Resident };

// Multi-Collection Helper Functions across admins, guards, residents, and users collections
export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const [admin, guard, resident, baseUser] = await Promise.all([
    Admin.findOne({ email: normalizedEmail }).select('+password').populate('society', 'name address city state pincode totalTowers totalFlats'),
    Guard.findOne({ email: normalizedEmail }).select('+password').populate('society', 'name address city state pincode totalTowers totalFlats'),
    Resident.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('society', 'name address city state pincode totalTowers totalFlats')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      }),
    User.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('society', 'name address city state pincode totalTowers totalFlats')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      }),
  ]);

  return admin || guard || resident || baseUser;
}

export async function findUserById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const [admin, guard, resident, baseUser] = await Promise.all([
    Admin.findById(id).populate('society', 'name address city state pincode totalTowers totalFlats'),
    Guard.findById(id).populate('society', 'name address city state pincode totalTowers totalFlats'),
    Resident.findById(id)
      .populate('society', 'name address city state pincode totalTowers totalFlats')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      }),
    User.findById(id)
      .populate('society', 'name address city state pincode totalTowers totalFlats')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      }),
  ]);

  return admin || guard || resident || baseUser;
}
