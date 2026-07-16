import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { noticeService, pollService, amenityService, paymentService } from '../services/community.service';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';

// ========== TICKET CONTROLLER ==========
export class TicketController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.createTicket({
        ...req.body,
        residentId: req.user!.userId,
        flatId: req.body.flatId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Ticket created', result);
    } catch (error) { next(error); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.getTickets({
        societyId: req.user!.societyId,
        residentId: req.query.mine === 'true' ? req.user!.userId : undefined,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      sendSuccess(res, 200, 'Tickets fetched', result);
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.getTicketById(req.params.id);
      sendSuccess(res, 200, 'Ticket details fetched', result);
    } catch (error) { next(error); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, 200, 'Ticket status updated', result);
    } catch (error) { next(error); }
  }

  async addReply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.addReply(
        req.params.id,
        req.user!.userId,
        req.body.message,
        req.body.images
      );
      sendSuccess(res, 201, 'Reply added', result);
    } catch (error) { next(error); }
  }
}

// ========== NOTICE CONTROLLER ==========
export class NoticeController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.create({
        ...req.body,
        authorId: req.user!.userId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Notice published', result);
    } catch (error) { next(error); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.getAll(
        req.user!.societyId,
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20
      );
      sendSuccess(res, 200, 'Notices fetched', result);
    } catch (error) { next(error); }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await noticeService.markRead(req.params.id, req.user!.userId);
      sendSuccess(res, 200, 'Notice marked as read');
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await noticeService.delete(req.params.id);
      sendSuccess(res, 200, 'Notice deleted successfully', result);
    } catch (error) { next(error); }
  }
}

// ========== POLL CONTROLLER ==========
export class PollController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pollService.create({
        ...req.body,
        authorId: req.user!.userId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Poll created', result);
    } catch (error) { next(error); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pollService.getAll(req.user!.societyId, req.user!.userId);
      sendSuccess(res, 200, 'Polls fetched', result);
    } catch (error) { next(error); }
  }

  async vote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pollService.vote(req.params.id, req.user!.userId, req.body.optionIndex);
      sendSuccess(res, 200, 'Vote recorded', result);
    } catch (error) { next(error); }
  }
}

// ========== AMENITY CONTROLLER ==========
export class AmenityController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await amenityService.create(req.body, req.user!.societyId);
      sendSuccess(res, 201, 'Amenity created', result);
    } catch (error) { next(error); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await amenityService.getAll(req.user!.societyId);
      sendSuccess(res, 200, 'Amenities fetched', result);
    } catch (error) { next(error); }
  }

  async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await amenityService.createBooking({
        ...req.body,
        residentId: req.user!.userId,
        societyId: req.user!.societyId,
      });
      sendSuccess(res, 201, 'Booking created', result);
    } catch (error) { next(error); }
  }

  async getBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await amenityService.getBookings({
        societyId: req.user!.societyId,
        residentId: req.query.mine === 'true' ? req.user!.userId : undefined,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
      });
      sendSuccess(res, 200, 'Bookings fetched', result);
    } catch (error) { next(error); }
  }

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await amenityService.cancelBooking(req.params.id, req.user!.userId, req.body.reason);
      sendSuccess(res, 200, 'Booking cancelled', result);
    } catch (error) { next(error); }
  }
}

// ========== PAYMENT CONTROLLER ==========
export class PaymentController {
  async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getPayments({
        residentId: req.query.mine === 'true' ? req.user!.userId : undefined,
        societyId: req.user!.societyId,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
      });
      sendSuccess(res, 200, 'Payments fetched', result);
    } catch (error) { next(error); }
  }

  async markPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.markPaid(req.params.id, req.body.transactionId);
      sendSuccess(res, 200, 'Payment marked as paid', result);
    } catch (error) { next(error); }
  }
}

// ========== ADMIN CONTROLLER ==========
export class AdminController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboardStats(req.user!.societyId);
      sendSuccess(res, 200, 'Dashboard stats fetched', result);
    } catch (error) { next(error); }
  }

  async createTower(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createTower({ ...req.body, societyId: req.user!.societyId });
      sendSuccess(res, 201, 'Tower created', result);
    } catch (error) { next(error); }
  }

  async getTowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getTowers(req.user!.societyId);
      sendSuccess(res, 200, 'Towers fetched', result);
    } catch (error) { next(error); }
  }

  async deleteTower(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteTower(req.params.id);
      sendSuccess(res, 200, 'Tower deleted', result);
    } catch (error) { next(error); }
  }

  async createFlat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createFlat({ ...req.body, societyId: req.user!.societyId });
      sendSuccess(res, 201, 'Flat created', result);
    } catch (error) { next(error); }
  }

  async getFlats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getFlats({
        societyId: req.user!.societyId,
        towerId: req.query.towerId as string,
      });
      sendSuccess(res, 200, 'Flats fetched', result);
    } catch (error) { next(error); }
  }

  async deleteFlat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteFlat(req.params.id);
      sendSuccess(res, 200, 'Flat deleted', result);
    } catch (error) { next(error); }
  }

  async getResidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getResidents(
        req.user!.societyId,
        Number(req.query.page) || 1
      );
      sendSuccess(res, 200, 'Residents fetched', result);
    } catch (error) { next(error); }
  }

  async searchResidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.searchResidents(
        req.user!.societyId,
        req.query.q as string || ''
      );
      sendSuccess(res, 200, 'Search results', result);
    } catch (error) { next(error); }
  }

  async createStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createStaff(req.body, req.user!.societyId);
      sendSuccess(res, 201, 'Staff created', result);
    } catch (error) { next(error); }
  }

  async getStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getStaff(req.user!.societyId);
      sendSuccess(res, 200, 'Staff fetched', result);
    } catch (error) { next(error); }
  }

  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getNotifications(
        req.user!.userId,
        Number(req.query.page) || 1
      );
      sendSuccess(res, 200, 'Notifications fetched', result);
    } catch (error) { next(error); }
  }

  async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.markNotificationRead(req.params.id, req.user!.userId);
      sendSuccess(res, 200, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.markAllNotificationsRead(req.user!.userId);
      sendSuccess(res, 200, 'All notifications marked as read');
    } catch (error) { next(error); }
  }

  async getTicketStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.getStats(req.user!.societyId);
      sendSuccess(res, 200, 'Ticket stats fetched', result);
    } catch (error) { next(error); }
  }

  async getPaymentStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getStats(req.user!.societyId);
      sendSuccess(res, 200, 'Payment stats fetched', result);
    } catch (error) { next(error); }
  }

  async assignFlatToResident(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { residentId, flatId } = req.body;
      const result = await adminService.assignFlatToResident(residentId, flatId);
      sendSuccess(res, 200, 'Flat assigned to resident successfully', result);
    } catch (error) { next(error); }
  }
}

export const ticketController = new TicketController();
export const noticeController = new NoticeController();
export const pollController = new PollController();
export const amenityController = new AmenityController();
export const paymentController = new PaymentController();
export const adminController = new AdminController();
