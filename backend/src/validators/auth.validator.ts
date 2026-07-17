import { z } from 'zod';
import { UserRole } from '../constants';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    role: z.nativeEnum(UserRole),
    societyId: z.string().min(1, 'Society ID is required'),
    flatId: z.string().optional(),
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
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    resetToken: z.string().min(6, 'Reset token must be at least 6 digits'),
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
