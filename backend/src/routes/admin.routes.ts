import { Router } from 'express';
import { adminController } from '../controllers/community.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../constants';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/dashboard/tickets', (req, res, next) => adminController.getTicketStats(req, res, next));
router.get('/dashboard/payments', (req, res, next) => adminController.getPaymentStats(req, res, next));

// Towers
router.post('/towers', (req, res, next) => adminController.createTower(req, res, next));
router.get('/towers', (req, res, next) => adminController.getTowers(req, res, next));
router.delete('/towers/:id', (req, res, next) => adminController.deleteTower(req, res, next));

// Flats
router.post('/flats', (req, res, next) => adminController.createFlat(req, res, next));
router.get('/flats', (req, res, next) => adminController.getFlats(req, res, next));
router.delete('/flats/:id', (req, res, next) => adminController.deleteFlat(req, res, next));

// Residents
router.get('/residents', (req, res, next) => adminController.getResidents(req, res, next));
router.get('/residents/search', (req, res, next) => adminController.searchResidents(req, res, next));
router.put('/residents/assign-flat', (req, res, next) => adminController.assignFlatToResident(req, res, next));

// Staff
router.post('/staff', (req, res, next) => adminController.createStaff(req, res, next));
router.get('/staff', (req, res, next) => adminController.getStaff(req, res, next));

export default router;
