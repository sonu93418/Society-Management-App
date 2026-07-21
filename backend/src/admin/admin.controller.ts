import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminService } from './admin.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboardStats(req.user!.societyId);
      sendSuccess(res, 200, 'Dashboard stats fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async createTower(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createTower({ ...req.body, societyId: req.user!.societyId });
      sendSuccess(res, 201, 'Tower created', result);
    } catch (error) {
      next(error);
    }
  }

  async getTowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getTowers(req.user!.societyId);
      sendSuccess(res, 200, 'Towers fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTower(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteTower(req.params.id);
      sendSuccess(res, 200, 'Tower deleted', result);
    } catch (error) {
      next(error);
    }
  }

  async createFlat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createFlat({ ...req.body, societyId: req.user!.societyId });
      sendSuccess(res, 201, 'Flat created', result);
    } catch (error) {
      next(error);
    }
  }

  async getFlats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getFlats({
        societyId: req.user!.societyId,
        towerId: req.query.towerId as string,
      });
      sendSuccess(res, 200, 'Flats fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteFlat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteFlat(req.params.id);
      sendSuccess(res, 200, 'Flat deleted', result);
    } catch (error) {
      next(error);
    }
  }

  async getResidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await adminService.getResidents(req.user!.societyId, page, limit);
      sendSuccess(res, 200, 'Residents fetched', result);
    } catch (error) {
      next(error);
    }
  }

  async searchResidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const result = await adminService.searchResidents(req.user!.societyId, query);
      sendSuccess(res, 200, 'Residents search result', result);
    } catch (error) {
      next(error);
    }
  }

  async assignFlatToResident(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { residentId, flatId } = req.body;
      const result = await adminService.assignFlatToResident(residentId, flatId);
      sendSuccess(res, 200, 'Flat assigned to resident', result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
