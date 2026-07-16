import { Router } from 'express';
import { ticketController, noticeController, pollController, amenityController, paymentController, adminController } from '../controllers/community.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { UserRole } from '../constants';
import { createTicketSchema, updateTicketStatusSchema, replyTicketSchema } from '../validators/ticket.validator';
import { createNoticeSchema, createPollSchema, voteSchema, createAmenitySchema, createBookingSchema } from '../validators/community.validator';

const router = Router();
router.use(authenticate);

// ========== TICKETS ==========
router.post('/tickets', authorize(UserRole.RESIDENT), validate(createTicketSchema), (req, res, next) => ticketController.create(req, res, next));
router.get('/tickets', (req, res, next) => ticketController.getAll(req, res, next));
router.get('/tickets/:id', (req, res, next) => ticketController.getById(req, res, next));
router.put('/tickets/:id/status', authorize(UserRole.ADMIN), validate(updateTicketStatusSchema), (req, res, next) => ticketController.updateStatus(req, res, next));
router.post('/tickets/:id/reply', validate(replyTicketSchema), (req, res, next) => ticketController.addReply(req, res, next));

// ========== NOTICES ==========
router.post('/notices', authorize(UserRole.ADMIN), validate(createNoticeSchema), (req, res, next) => noticeController.create(req, res, next));
router.get('/notices', (req, res, next) => noticeController.getAll(req, res, next));
router.put('/notices/:id/read', (req, res, next) => noticeController.markRead(req, res, next));
router.delete('/notices/:id', authorize(UserRole.ADMIN), (req, res, next) => noticeController.delete(req, res, next));

// ========== POLLS ==========
router.post('/polls', authorize(UserRole.ADMIN), validate(createPollSchema), (req, res, next) => pollController.create(req, res, next));
router.get('/polls', (req, res, next) => pollController.getAll(req, res, next));
router.post('/polls/:id/vote', authorize(UserRole.RESIDENT), validate(voteSchema), (req, res, next) => pollController.vote(req, res, next));

// ========== AMENITIES ==========
router.post('/amenities', authorize(UserRole.ADMIN), validate(createAmenitySchema), (req, res, next) => amenityController.create(req, res, next));
router.get('/amenities', (req, res, next) => amenityController.getAll(req, res, next));
router.post('/bookings', authorize(UserRole.RESIDENT), validate(createBookingSchema), (req, res, next) => amenityController.createBooking(req, res, next));
router.get('/bookings', (req, res, next) => amenityController.getBookings(req, res, next));
router.put('/bookings/:id/cancel', authorize(UserRole.RESIDENT), (req, res, next) => amenityController.cancelBooking(req, res, next));

// ========== PAYMENTS ==========
router.get('/payments', (req, res, next) => paymentController.getPayments(req, res, next));
router.put('/payments/:id/pay', (req, res, next) => paymentController.markPaid(req, res, next));

// ========== NOTIFICATIONS ==========
router.get('/notifications', (req, res, next) => adminController.getNotifications(req, res, next));
router.put('/notifications/:id/read', (req, res, next) => adminController.markNotificationRead(req, res, next));
router.put('/notifications/read-all', (req, res, next) => adminController.markAllRead(req, res, next));

// ========== STAFF ==========
router.get('/staff', (req, res, next) => adminController.getStaff(req, res, next));

// ========== PUBLIC TOWERS & FLATS FOR RESIDENT FLOWS ==========
router.get('/towers', (req, res, next) => adminController.getTowers(req, res, next));
router.get('/flats', (req, res, next) => adminController.getFlats(req, res, next));

export default router;
