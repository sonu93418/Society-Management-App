import { Request, Response, NextFunction } from 'express';
import { superAdminService } from '../services/superAdmin.service';
import { sendSuccess } from '../utils/response';
import { hashPassword } from '../utils/hash';

export class SuperAdminController {
  async submitOnboardingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        societyName,
        address,
        city,
        state,
        pincode,
        totalTowers,
        totalFlats,
        adminName,
        adminEmail,
        adminPhone,
        adminPassword,
      } = req.body;

      // Hash the password before saving
      const adminPasswordHash = await hashPassword(adminPassword);

      const request = await superAdminService.submitRequest({
        societyName,
        address,
        city,
        state,
        pincode,
        totalTowers,
        totalFlats,
        adminName,
        adminEmail,
        adminPhone,
        adminPasswordHash,
      });

      sendSuccess(res, 201, 'Society onboarding request submitted successfully. Developer review is pending.', {
        id: request._id,
        societyName: request.societyName,
        adminEmail: request.adminEmail,
        status: request.status,
      });
    } catch (error) {
      next(error);
    }
  }

  async listOnboardingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const requests = await superAdminService.listRequests(status);
      sendSuccess(res, 200, 'Onboarding requests retrieved successfully.', requests);
    } catch (error) {
      next(error);
    }
  }

  async approveOnboardingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await superAdminService.approveRequest(id);
      sendSuccess(res, 200, 'Onboarding request approved. Society and admin accounts created.', result);
    } catch (error) {
      next(error);
    }
  }

  async rejectOnboardingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const request = await superAdminService.rejectRequest(id, reason);
      sendSuccess(res, 200, `Onboarding request rejected successfully. Reason: ${request.rejectionReason}`, {
        id: request._id,
        status: request.status,
        rejectionReason: request.rejectionReason,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await superAdminService.getSystemAnalytics();
      sendSuccess(res, 200, 'Developer analytics fetched successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async sendBroadcastNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, message, targetRole, priority } = req.body;
      const result = await superAdminService.sendBroadcastNotification({ title, message, targetRole, priority });
      sendSuccess(res, 200, 'Broadcast notification dispatched successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async listAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string | undefined;
      const query = req.query.q as string | undefined;
      const users = await superAdminService.listAllUsers(role, query);
      sendSuccess(res, 200, 'User accounts fetched successfully.', users);
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await superAdminService.toggleUserStatus(id);
      sendSuccess(res, 200, `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`, user);
    } catch (error) {
      next(error);
    }
  }
}

export const superAdminController = new SuperAdminController();
