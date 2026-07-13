import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from '../constants';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    category: z.nativeEnum(TicketCategory),
    priority: z.nativeEnum(TicketPriority).optional(),
    images: z.array(z.string()).max(5).optional(),
  }),
});

export const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.nativeEnum(TicketStatus),
  }),
});

export const replyTicketSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    message: z.string().min(1, 'Reply message is required'),
    images: z.array(z.string()).max(3).optional(),
  }),
});
