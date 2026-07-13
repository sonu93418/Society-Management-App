import mongoose, { Schema, Document } from 'mongoose';

export interface ITower extends Document {
  name: string;
  society: mongoose.Types.ObjectId;
  totalFloors: number;
  totalFlats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const towerSchema = new Schema<ITower>(
  {
    name: { type: String, required: true, trim: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    totalFloors: { type: Number, required: true },
    totalFlats: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

towerSchema.index({ society: 1 });

export const Tower = mongoose.model<ITower>('Tower', towerSchema);
