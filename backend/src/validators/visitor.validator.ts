import { z } from 'zod';
import { VisitorType } from '../constants';

export const createVisitorSchema = z.object({
  body: z.object({
    visitorName: z.string().min(2, 'Visitor name is required'),
    visitorPhone: z.string().min(10, 'Valid phone number required'),
    purpose: z.string().min(2, 'Purpose is required'),
    type: z.nativeEnum(VisitorType),
    vehicleNumber: z.string().optional(),
    flatId: z.string().min(1, 'Flat ID is required'),
    residentId: z.string().min(1, 'Resident ID is required'),
    expectedCount: z.number().min(1).max(20).optional(),
    notes: z.string().optional(),
  }),
});

export const preApproveVisitorSchema = z.object({
  body: z.object({
    visitorName: z.string().min(2, 'Visitor name is required'),
    visitorPhone: z.string().min(10, 'Valid phone number required'),
    purpose: z.string().min(2, 'Purpose is required'),
    type: z.nativeEnum(VisitorType),
    vehicleNumber: z.string().optional(),
    flatId: z.string().min(1, 'Flat ID is required'),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    expectedCount: z.number().min(1).max(20).optional(),
  }),
});

export const approveVisitorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Visitor request ID is required'),
  }),
});

export const rejectVisitorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Visitor request ID is required'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});
