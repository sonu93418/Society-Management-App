import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption {
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  description: string;
  options: IPollOption[];
  society: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  isAnonymous: boolean;
  isActive: boolean;
  endDate: Date;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const pollSchema = new Schema<IPoll>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    endDate: { type: Date, required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pollSchema.index({ society: 1, isActive: 1 });

export const Poll = mongoose.model<IPoll>('Poll', pollSchema);

// Vote model
export interface IVote extends Document {
  poll: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  optionIndex: number;
  createdAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    poll: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    optionIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

voteSchema.index({ poll: 1, user: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', voteSchema);
