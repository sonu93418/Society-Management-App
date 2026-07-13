import mongoose, { Schema, Document } from 'mongoose';
import { VisitorType, VisitorStatus } from '../constants';

export interface IVisitorRequest extends Document {
  visitorName: string;
  visitorPhone: string;
  visitorPhoto?: string;
  purpose: string;
  type: VisitorType;
  vehicleNumber?: string;
  flat: mongoose.Types.ObjectId;
  resident: mongoose.Types.ObjectId;
  guard?: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  status: VisitorStatus;
  qrCode?: string;
  preApproved: boolean;
  expectedCount: number;
  validFrom?: Date;
  validUntil?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  entryAt?: Date;
  exitAt?: Date;
  entryGuard?: mongoose.Types.ObjectId;
  exitGuard?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitorRequestSchema = new Schema<IVisitorRequest>(
  {
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    visitorPhoto: { type: String },
    purpose: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(VisitorType),
      required: true,
    },
    vehicleNumber: { type: String, trim: true },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    resident: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    guard: { type: Schema.Types.ObjectId, ref: 'User' },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    status: {
      type: String,
      enum: Object.values(VisitorStatus),
      default: VisitorStatus.PENDING,
    },
    qrCode: { type: String },
    preApproved: { type: Boolean, default: false },
    expectedCount: { type: Number, default: 1 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    entryAt: { type: Date },
    exitAt: { type: Date },
    entryGuard: { type: Schema.Types.ObjectId, ref: 'User' },
    exitGuard: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

visitorRequestSchema.index({ society: 1, status: 1 });
visitorRequestSchema.index({ resident: 1, status: 1 });
visitorRequestSchema.index({ flat: 1, createdAt: -1 });
visitorRequestSchema.index({ society: 1, createdAt: -1 });
visitorRequestSchema.index({ visitorPhone: 1 });

export const VisitorRequest = mongoose.model<IVisitorRequest>(
  'VisitorRequest',
  visitorRequestSchema
);
