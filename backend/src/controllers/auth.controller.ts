import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, 201, 'Registration successful', result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, 200, 'Token refreshed', tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      sendSuccess(res, 200, 'Profile fetched', user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
