import mongoose, { Schema, Document } from 'mongoose';
import { TicketStatus, TicketPriority, TicketCategory } from '../constants';

export interface IHelpdeskTicket extends Document {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  images: string[];
  resident: mongoose.Types.ObjectId;
  flat: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const helpdeskTicketSchema = new Schema<IHelpdeskTicket>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    images: [{ type: String }],
    resident: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    society: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

helpdeskTicketSchema.index({ society: 1, status: 1 });
helpdeskTicketSchema.index({ resident: 1, createdAt: -1 });

export const HelpdeskTicket = mongoose.model<IHelpdeskTicket>(
  'HelpdeskTicket',
  helpdeskTicketSchema
);

// Ticket replies
export interface ITicketReply extends Document {
  ticket: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  message: string;
  images: string[];
  createdAt: Date;
}

const ticketReplySchema = new Schema<ITicketReply>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'HelpdeskTicket', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

ticketReplySchema.index({ ticket: 1, createdAt: 1 });

export const TicketReply = mongoose.model<ITicketReply>('TicketReply', ticketReplySchema);
