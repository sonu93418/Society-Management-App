import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
