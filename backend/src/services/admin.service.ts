import { User } from '../models/User';
import { Society } from '../models/Society';
import { Tower } from '../models/Tower';
import { Flat } from '../models/Flat';
import { Staff } from '../models/Staff';
import { VisitorRequest } from '../models/VisitorRequest';
import { HelpdeskTicket } from '../models/HelpdeskTicket';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/response';
import { UserRole, VisitorStatus, TicketStatus, PaymentStatus } from '../constants';

export class AdminService {
  // Dashboard analytics
  async getDashboardStats(societyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalResidents,
      totalGuards,
      totalTowers,
      totalFlats,
      todayVisitors,
      insideVisitors,
      pendingApprovals,
      openComplaints,
      pendingPayments,
    ] = await Promise.all([
      User.countDocuments({ society: societyId, role: UserRole.RESIDENT, isActive: true }),
      User.countDocuments({ society: societyId, role: UserRole.GUARD, isActive: true }),
      Tower.countDocuments({ society: societyId, isActive: true }),
      Flat.countDocuments({ society: societyId, isActive: true }),
      VisitorRequest.countDocuments({ society: societyId, createdAt: { $gte: today } }),
      VisitorRequest.countDocuments({ society: societyId, status: VisitorStatus.INSIDE }),
      VisitorRequest.countDocuments({ society: societyId, status: VisitorStatus.PENDING }),
      HelpdeskTicket.countDocuments({ society: societyId, status: { $in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } }),
      Payment.countDocuments({ society: societyId, status: { $in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } }),
    ]);

    const occupiedFlats = await Flat.countDocuments({ society: societyId, isOccupied: true });

    return {
      totalResidents,
      totalGuards,
      totalTowers,
      totalFlats,
      todayVisitors,
      insideVisitors,
      pendingApprovals,
      openComplaints,
      pendingPayments,
      occupancyRate: totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0,
    };
  }

  // Tower management
  async createTower(data: { name: string; totalFloors: number; societyId: string }) {
    const tower = await Tower.create({
      name: data.name,
      totalFloors: data.totalFloors,
      society: data.societyId,
    });
    await Society.findByIdAndUpdate(data.societyId, { $inc: { totalTowers: 1 } });
    return tower;
  }

  async getTowers(societyId: string) {
    return Tower.find({ society: societyId, isActive: true }).sort({ name: 1 });
  }

  async deleteTower(towerId: string) {
    const tower = await Tower.findByIdAndUpdate(towerId, { isActive: false }, { new: true });
    if (!tower) {
      throw new AppError('Tower not found', 404);
    }
    // Also mark all flats in this tower as inactive
    await Flat.updateMany({ tower: towerId }, { isActive: false });
    return tower;
  }

  // Flat management
  async createFlat(data: { flatNumber: string; floor: number; towerId: string; type?: string; area?: number; societyId: string }) {
    const flat = await Flat.create({
      flatNumber: data.flatNumber,
      floor: data.floor,
      tower: data.towerId,
      society: data.societyId,
      type: data.type || '2BHK',
      area: data.area,
    });
    await Tower.findByIdAndUpdate(data.towerId, { $inc: { totalFlats: 1 } });
    await Society.findByIdAndUpdate(data.societyId, { $inc: { totalFlats: 1 } });
    return flat;
  }

  async getFlats(query: { societyId: string; towerId?: string }) {
    const filter: Record<string, unknown> = { society: query.societyId, isActive: true };
    if (query.towerId) filter.tower = query.towerId;
    return Flat.find(filter)
      .populate('tower', 'name')
      .populate('residents', 'name phone email')
      .sort({ flatNumber: 1 });
  }

  async deleteFlat(flatId: string) {
    const flat = await Flat.findByIdAndUpdate(flatId, { isActive: false }, { new: true });
    if (!flat) {
      throw new AppError('Flat not found', 404);
    }
    return flat;
  }

  // Resident management
  async getResidents(societyId: string, page = 1, limit = 20) {
    const total = await User.countDocuments({ society: societyId, role: UserRole.RESIDENT });
    const residents = await User.find({ society: societyId, role: UserRole.RESIDENT })
      .populate('flat', 'flatNumber')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { residents, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  // Staff management
  async createStaff(data: any, societyId: string) {
    return Staff.create({ ...data, society: societyId });
  }

  async getStaff(societyId: string) {
    return Staff.find({ society: societyId, isActive: true }).sort({ category: 1, name: 1 });
  }

  // Notification management
  async getNotifications(userId: string, page = 1, limit = 20) {
    const total = await Notification.countDocuments({ user: userId });
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    return { notifications, unreadCount, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async markNotificationRead(notificationId: string, userId: string) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true }
    );
  }

  async markAllNotificationsRead(userId: string) {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  // Search residents (for guards)
  async searchResidents(societyId: string, query: string) {
    const searchRegex = new RegExp(query, 'i');
    return User.find({
      society: societyId,
      role: UserRole.RESIDENT,
      isActive: true,
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ],
    })
      .populate('flat', 'flatNumber floor')
      .limit(20);
  }
}

export const adminService = new AdminService();
