import { Router } from 'express';
import authRoutes from './auth.routes';
import visitorRoutes from './visitor.routes';
import communityRoutes from './community.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/visitors', visitorRoutes);
router.use('/community', communityRoutes);
router.use('/admin', adminRoutes);

// Guard-specific search route (reuses admin service)
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { adminController } from '../controllers/community.controller';
import { UserRole } from '../constants';

router.get(
  '/guard/search-residents',
  authenticate,
  authorize(UserRole.GUARD),
  (req, res, next) => adminController.searchResidents(req, res, next)
);

export default router;
