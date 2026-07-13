import { Request, Response, NextFunction } from 'express';
import { sendError, AppError } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    sendError(res, 400, 'Validation error', err.message);
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    sendError(res, 409, 'Duplicate entry. This record already exists.');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 401, 'Invalid token.');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 401, 'Token expired.');
    return;
  }

  // Default server error
  const message =
    env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred';

  sendError(res, 500, message);
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};
