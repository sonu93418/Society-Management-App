import mongoose, { Schema, Document } from 'mongoose';

export interface IAmenity extends Document {
  name: string;
  description: string;
  society: mongoose.Types.ObjectId;
  capacity: number;
  pricePerSlot: number;
  availableFrom: string;
  availableTo: string;
  availableDays: number[];
  images: string[];
  rules: string[];
  isActive: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const amenitySchema = new Schema<IAmenity>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    capacity: { type: Number, required: true },
    pricePerSlot: { type: Number, default: 0 },
    availableFrom: { type: String, default: '06:00' },
    availableTo: { type: String, default: '22:00' },
    availableDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    images: [{ type: String }],
    rules: [{ type: String }],
    isActive: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
  },
  { timestamps: true }
);

amenitySchema.index({ society: 1 });

export const Amenity = mongoose.model<IAmenity>('Amenity', amenitySchema);

// Booking model
import { BookingStatus } from '../constants';

export interface IBooking extends Document {
  amenity: mongoose.Types.ObjectId;
  resident: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  numberOfPeople: number;
  notes?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    amenity: { type: Schema.Types.ObjectId, ref: 'Amenity', required: true },
    resident: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    numberOfPeople: { type: Number, default: 1 },
    notes: { type: String },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ amenity: 1, date: 1 });
bookingSchema.index({ resident: 1, createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
