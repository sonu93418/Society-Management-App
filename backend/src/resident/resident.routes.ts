import { Router } from 'express';
import { residentController } from './resident.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Resident Community Endpoints
router.get('/tickets/mine', (req, res, next) => residentController.getMyTickets(req, res, next));
router.get('/payments/mine', (req, res, next) => residentController.getMyPayments(req, res, next));
router.get('/notices', (req, res, next) => residentController.getNotices(req, res, next));
router.get('/polls', (req, res, next) => residentController.getPolls(req, res, next));
router.get('/amenities', (req, res, next) => residentController.getAmenities(req, res, next));
router.get('/staff', (req, res, next) => residentController.getStaff(req, res, next));

export default router;
