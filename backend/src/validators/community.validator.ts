import { z } from 'zod';

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    attachments: z.array(z.string()).max(5).optional(),
    isPinned: z.boolean().optional(),
  }),
});

export const createPollSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required').max(200),
    description: z.string().optional(),
    options: z.array(z.string().min(1)).min(2, 'At least 2 options required').max(10),
    isAnonymous: z.boolean().optional(),
    endDate: z.string().datetime('Valid end date required'),
  }),
});

export const voteSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    optionIndex: z.number().min(0),
  }),
});

export const createAmenitySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Amenity name is required'),
    description: z.string().min(5, 'Description is required'),
    capacity: z.number().min(1),
    pricePerSlot: z.number().min(0).optional(),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
    availableDays: z.array(z.number().min(0).max(6)).optional(),
    rules: z.array(z.string()).optional(),
    requiresApproval: z.boolean().optional(),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    amenityId: z.string().min(1, 'Amenity ID is required'),
    date: z.string().datetime('Valid date required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    numberOfPeople: z.number().min(1).max(50).optional(),
    notes: z.string().optional(),
  }),
});
