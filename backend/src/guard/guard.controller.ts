import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { guardService } from './guard.service';
import { sendSuccess } from '../utils/response';

export class GuardController {
  async searchResidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const result = await guardService.searchDestinationResidents(req.user!.societyId, query);
      sendSuccess(res, 200, 'Destination residents fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await guardService.getPendingApprovals(req.user!.societyId);
      sendSuccess(res, 200, 'Pending gate approvals fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getInside(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await guardService.getInsideVisitors(req.user!.societyId);
      sendSuccess(res, 200, 'Inside visitors fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await guardService.getGateStats(req.user!.societyId);
      sendSuccess(res, 200, 'Gate control stats fetched', result);
    } catch (error) {
      next(error);
    }
  }
}

export const guardController = new GuardController();
