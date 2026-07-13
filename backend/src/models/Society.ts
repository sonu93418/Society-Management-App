import mongoose, { Schema, Document } from 'mongoose';

export interface ISociety extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalTowers: number;
  totalFlats: number;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    totalTowers: { type: Number, default: 0 },
    totalFlats: { type: Number, default: 0 },
    logo: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Society = mongoose.model<ISociety>('Society', societySchema);
