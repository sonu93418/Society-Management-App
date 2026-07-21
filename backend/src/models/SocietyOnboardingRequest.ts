import mongoose, { Schema, Document } from 'mongoose';

export interface ISocietyOnboardingRequest extends Document {
  societyName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalTowers?: number;
  totalFlats?: number;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPasswordHash: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const onboardingRequestSchema = new Schema<ISocietyOnboardingRequest>(
  {
    societyName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    totalTowers: { type: Number, default: 0 },
    totalFlats: { type: Number, default: 0 },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    adminPhone: { type: String, required: true, trim: true },
    adminPasswordHash: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const SocietyOnboardingRequest = mongoose.model<ISocietyOnboardingRequest>(
  'SocietyOnboardingRequest',
  onboardingRequestSchema
);
