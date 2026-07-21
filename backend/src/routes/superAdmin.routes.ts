import { Router, Request, Response, NextFunction } from 'express';
import { superAdminController } from '../controllers/superAdmin.controller';
import { sendError } from '../utils/response';

const router = Router();

const verifySuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers['x-super-admin-key'];
  const expectedKey = process.env.SUPER_ADMIN_API_KEY || 'Sonukumarray@93418';
  if (!adminKey || adminKey !== expectedKey) {
    sendError(res, 401, 'Unauthorized. Invalid Super Admin Key.');
    return;
  }
  next();
};

router.use(verifySuperAdmin);

router.get('/onboarding-requests', (req, res, next) => superAdminController.listOnboardingRequests(req, res, next));
router.put('/onboarding-requests/:id/approve', (req, res, next) => superAdminController.approveOnboardingRequest(req, res, next));
router.put('/onboarding-requests/:id/reject', (req, res, next) => superAdminController.rejectOnboardingRequest(req, res, next));

// Developer Portal Endpoints
router.get('/analytics', (req, res, next) => superAdminController.getAnalytics(req, res, next));
router.post('/broadcast-notification', (req, res, next) => superAdminController.sendBroadcastNotification(req, res, next));
router.get('/users', (req, res, next) => superAdminController.listAllUsers(req, res, next));
router.put('/users/:id/toggle-status', (req, res, next) => superAdminController.toggleUserStatus(req, res, next));

export default router;
