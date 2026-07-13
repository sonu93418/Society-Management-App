import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  society: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  attachments: string[];
  isPinned: boolean;
  isPublished: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

noticeSchema.index({ society: 1, createdAt: -1 });

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
