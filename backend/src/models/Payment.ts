import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus } from '../constants';

export interface IPayment extends Document {
  resident: mongoose.Types.ObjectId;
  flat: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  amount: number;
  month: string;
  year: number;
  status: PaymentStatus;
  dueDate: Date;
  paidAt?: Date;
  transactionId?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    transactionId: { type: String },
    description: { type: String, default: 'Monthly Maintenance' },
  },
  { timestamps: true }
);

paymentSchema.index({ resident: 1, status: 1 });
paymentSchema.index({ society: 1, status: 1, month: 1, year: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
