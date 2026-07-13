import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error: string | null = null
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    data: null,
    error,
  };
  return res.status(statusCode).json(response);
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
