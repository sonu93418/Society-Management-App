import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { sendError } from '../utils/response';
import { findUserById } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    societyId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'Access denied. No token provided.');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Check user across ALL role collections (admins, guards, residents, users)
    // NOTE: Users live in role-specific collections, NOT in the base 'users' collection.
    // Using User.findById() here would always return null for real accounts.
    const user = await findUserById(decoded.userId);
    if (!user || !user.isActive) {
      sendError(res, 401, 'User account is deactivated or does not exist.');
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 401, 'Invalid or expired token.');
  }
};
