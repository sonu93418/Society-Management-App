import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { residentService } from './resident.service';
import { sendSuccess } from '../utils/response';

export class ResidentController {
  async getMyTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getMyTickets(req.user!.userId);
      sendSuccess(res, 200, 'My helpdesk tickets fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getMyPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getMyPayments(req.user!.userId);
      sendSuccess(res, 200, 'My maintenance payments fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getNotices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getNotices(req.user!.societyId);
      sendSuccess(res, 200, 'Notices fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getPolls(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getPolls(req.user!.societyId);
      sendSuccess(res, 200, 'Polls fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getAmenities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getAmenities(req.user!.societyId);
      sendSuccess(res, 200, 'Amenities fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async getStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await residentService.getStaff(req.user!.societyId);
      sendSuccess(res, 200, 'Staff directory fetched', result);
    } catch (error) {
      next(error);
    }
  }
}

export const residentController = new ResidentController();
