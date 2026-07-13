import { Request, Response, NextFunction } from 'express';
import { visitorService } from '../services/visitor.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class VisitorController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.createVisitorRequest({
        ...req.body,
        guardId: req.user!.userId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Visitor request created', result);
    } catch (error) {
      next(error);
    }
  }

  async preApprove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.preApproveVisitor({
        ...req.body,
        residentId: req.user!.userId,
        flatId: req.body.flatId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Visitor pre-approved', result);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.approveVisitor(
        req.params.id,
        req.user!.userId
      );
      sendSuccess(res, 200, 'Visitor approved', result);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.rejectVisitor(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      sendSuccess(res, 200, 'Visitor rejected', result);
    } catch (error) {
      next(error);
    }
  }

  async markEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.markEntry(
        req.params.id,
        req.user!.userId
      );
      sendSuccess(res, 200, 'Entry marked', result);
    } catch (error) {
      next(error);
    }
  }

  async markExit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.markExit(
        req.params.id,
        req.user!.userId
      );
      sendSuccess(res, 200, 'Exit marked', result);
    } catch (error) {
      next(error);
    }
  }

  async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.getPendingRequests(req.user!.userId);
      sendSuccess(res, 200, 'Pending requests fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.getVisitorHistory({
        societyId: req.user!.societyId,
        residentId: req.query.residentId as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      sendSuccess(res, 200, 'Visitor history fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getSocietyPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.getSocietyPendingRequests(req.user!.societyId);
      sendSuccess(res, 200, 'Society pending requests fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getInside(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.getInsideVisitors(req.user!.societyId);
      sendSuccess(res, 200, 'Inside visitors fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.getTodayStats(req.user!.societyId);
      sendSuccess(res, 200, 'Visitor stats fetched', result);
    } catch (error) {
      next(error);
    }
  }
}

export const visitorController = new VisitorController();
