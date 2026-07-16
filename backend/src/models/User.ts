import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../constants';

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
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    society: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    flat: {
      type: Schema.Types.ObjectId,
      ref: 'Flat',
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    pushToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ society: 1, role: 1 });
userSchema.index({ phone: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
