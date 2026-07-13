import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.flatten();
      const errorMessage = Object.entries(errors.fieldErrors)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('; ');

      sendError(res, 400, 'Validation failed', errorMessage || 'Invalid input data');
      return;
    }

    // Merge validated data back into request
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();
  };
};
