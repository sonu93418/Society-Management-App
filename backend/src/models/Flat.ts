import mongoose, { Schema, Document } from 'mongoose';

export interface IFlat extends Document {
  flatNumber: string;
  floor: number;
  tower: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  type: string;
  area?: number;
  isOccupied: boolean;
  owner?: mongoose.Types.ObjectId;
  residents: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const flatSchema = new Schema<IFlat>(
  {
    flatNumber: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    tower: { type: Schema.Types.ObjectId, ref: 'Tower', required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    type: { type: String, default: '2BHK' },
    area: { type: Number },
    isOccupied: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    residents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

flatSchema.index({ society: 1, tower: 1 });
flatSchema.index({ flatNumber: 1, tower: 1 }, { unique: true });

export const Flat = mongoose.model<IFlat>('Flat', flatSchema);
