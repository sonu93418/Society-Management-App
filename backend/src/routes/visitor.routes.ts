import { Router } from 'express';
import { visitorController } from '../controllers/visitor.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { UserRole } from '../constants';
import { createVisitorSchema, preApproveVisitorSchema, approveVisitorSchema, rejectVisitorSchema } from '../validators/visitor.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Guard endpoints
router.post('/', authorize(UserRole.GUARD), validate(createVisitorSchema), (req, res, next) => visitorController.create(req, res, next));
router.put('/:id/entry', authorize(UserRole.GUARD), (req, res, next) => visitorController.markEntry(req, res, next));
router.put('/:id/exit', authorize(UserRole.GUARD), (req, res, next) => visitorController.markExit(req, res, next));
router.get('/society/pending', authorize(UserRole.GUARD, UserRole.ADMIN), (req, res, next) => visitorController.getSocietyPending(req, res, next));
router.get('/society/inside', authorize(UserRole.GUARD, UserRole.ADMIN), (req, res, next) => visitorController.getInside(req, res, next));

// Resident endpoints
router.post('/pre-approve', authorize(UserRole.RESIDENT), validate(preApproveVisitorSchema), (req, res, next) => visitorController.preApprove(req, res, next));
router.put('/:id/approve', authorize(UserRole.RESIDENT), validate(approveVisitorSchema), (req, res, next) => visitorController.approve(req, res, next));
router.put('/:id/reject', authorize(UserRole.RESIDENT), validate(rejectVisitorSchema), (req, res, next) => visitorController.reject(req, res, next));
router.get('/pending', authorize(UserRole.RESIDENT), (req, res, next) => visitorController.getPending(req, res, next));

// Shared endpoints
router.get('/history', (req, res, next) => visitorController.getHistory(req, res, next));
router.get('/stats', authorize(UserRole.GUARD, UserRole.ADMIN), (req, res, next) => visitorController.getStats(req, res, next));

export default router;
