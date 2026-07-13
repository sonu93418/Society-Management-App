import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';
import { UserRole } from '../constants';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      sendError(res, 403, 'You do not have permission to perform this action.');
      return;
    }

    next();
  };
};
