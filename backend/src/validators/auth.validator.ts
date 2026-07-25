import { z } from 'zod';
import { UserRole } from '../constants';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required').max(100),
    phone: z.string().min(1, 'Phone number is required'),
    role: z.nativeEnum(UserRole),
    societyId: z.string().optional(),
    flatId: z.string().optional(),
    registrationCode: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerDeviceSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    tokenType: z.enum(['fcm', 'expo']),
    deviceType: z.enum(['ios', 'android', 'web']).optional(),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    visitor: z.boolean().optional(),
    complaint: z.boolean().optional(),
    notice: z.boolean().optional(),
    booking: z.boolean().optional(),
    payment: z.boolean().optional(),
    poll: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  }),
});

export const onboardingRequestSchema = z.object({
  body: z.object({
    societyName: z.string().min(1, 'Society name is required').max(100),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City name is required'),
    state: z.string().min(1, 'State name is required'),
    pincode: z.string().min(1, 'Pincode is required').max(10),
    totalTowers: z.number().optional(),
    totalFlats: z.number().optional(),
    adminName: z.string().min(1, 'Admin name is required'),
    adminEmail: z.string().email('Invalid admin email address'),
    adminPhone: z.string().min(1, 'Admin phone number is required'),
    adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

