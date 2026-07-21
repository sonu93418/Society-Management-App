import { Router } from 'express';
import { guardController } from './guard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../constants';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.GUARD));

// Security Guard Gate Endpoints
router.get('/search-residents', (req, res, next) => guardController.searchResidents(req, res, next));
router.get('/pending', (req, res, next) => guardController.getPending(req, res, next));
router.get('/inside', (req, res, next) => guardController.getInside(req, res, next));
router.get('/stats', (req, res, next) => guardController.getStats(req, res, next));

export default router;
