import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { corsOptions } from './config/cors';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFound } from './middlewares/error.middleware';
import routes from './routes';

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(mongoSanitize());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging — use 'combined' in production for full log output, 'dev' in development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Portl API is running 🚀', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
