import mongoose, { Schema, Document } from 'mongoose';
import { StaffCategory } from '../constants';

export interface IStaff extends Document {
  name: string;
  phone: string;
  category: StaffCategory;
  society: mongoose.Types.ObjectId;
  photo?: string;
  isActive: boolean;
  workingHours: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(StaffCategory),
      required: true,
    },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
    workingHours: { type: String, default: '9:00 AM - 6:00 PM' },
    description: { type: String },
  },
  { timestamps: true }
);

staffSchema.index({ society: 1, category: 1 });

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);
