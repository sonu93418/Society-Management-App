import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'development' ? 1000 : env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 999999 : env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
    error: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    data: null,
    error: 'Auth rate limit exceeded',
  },
});
