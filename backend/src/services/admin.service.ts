import mongoose from 'mongoose';
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
import { UserRole, VisitorStatus, TicketStatus, PaymentStatus, NotificationType } from '../constants';

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
    if (!data.societyId || !mongoose.Types.ObjectId.isValid(data.societyId)) {
      throw new AppError('Society ID is invalid or missing. Please log out and sign in again.', 400);
    }
    const existingTower = await Tower.findOne({ society: data.societyId, name: data.name.trim(), isActive: true });
    if (existingTower) {
      throw new AppError(`Tower "${data.name}" already exists in this society`, 409);
    }
    const tower = await Tower.create({
      name: data.name.trim(),
      totalFloors: data.totalFloors,
      society: data.societyId,
    });
    await Society.findByIdAndUpdate(data.societyId, { $inc: { totalTowers: 1 } });
    return tower;
  }

  async getTowers(societyId: string) {
    if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
      return [];
    }
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
    if (!data.societyId || !mongoose.Types.ObjectId.isValid(data.societyId)) {
      throw new AppError('Society ID is invalid or missing. Please log out and sign in again.', 400);
    }
    const existingFlat = await Flat.findOne({ society: data.societyId, tower: data.towerId, flatNumber: data.flatNumber.trim(), isActive: true });
    if (existingFlat) {
      throw new AppError(`Flat "${data.flatNumber}" already exists in this tower`, 409);
    }
    const flat = await Flat.create({
      flatNumber: data.flatNumber.trim(),
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
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower',
        populate: { path: 'tower', select: 'name' },
      })
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

  // Search residents (for guards and admins)
  async searchResidents(societyId: string, query: string) {
    const searchRegex = new RegExp(query, 'i');

    // Check if query is formatted like "A-101" or "A 101" or "Tower A 101"
    const splitMatch = query.match(/^([a-zA-Z0-9\s]+)[-\s]([0-9a-zA-Z]+)$/);
    if (splitMatch) {
      const towerPart = splitMatch[1].trim();
      const flatPart = splitMatch[2].trim();

      const towerRegex = new RegExp(towerPart, 'i');
      const flatRegex = new RegExp(flatPart, 'i');

      const towers = await Tower.find({ society: societyId, name: towerRegex, isActive: true });
      const towerIds = towers.map((t) => t._id);

      const matchingFlats = await Flat.find({
        society: societyId,
        isActive: true,
        tower: { $in: towerIds },
        flatNumber: flatRegex
      });
      const flatIds = matchingFlats.map((f) => f._id);

      return User.find({
        society: societyId,
        role: UserRole.RESIDENT,
        isActive: true,
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
          { email: searchRegex },
          { flat: { $in: flatIds } }
        ],
      })
        .populate({
          path: 'flat',
          select: 'flatNumber floor tower',
          populate: {
            path: 'tower',
            select: 'name'
          }
        })
        .limit(20);
    }

    // Default search matching name, phone, email, tower name, or flat number
    const towers = await Tower.find({ society: societyId, name: searchRegex, isActive: true });
    const towerIds = towers.map((t) => t._id);

    const matchingFlats = await Flat.find({
      society: societyId,
      isActive: true,
      $or: [
        { flatNumber: searchRegex },
        { tower: { $in: towerIds } }
      ]
    });
    const flatIds = matchingFlats.map((f) => f._id);

    return User.find({
      society: societyId,
      role: UserRole.RESIDENT,
      isActive: true,
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { flat: { $in: flatIds } }
      ],
    })
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower',
        populate: {
          path: 'tower',
          select: 'name'
        }
      })
      .limit(20);
  }

  async assignFlatToResident(residentId: string, flatId: string) {
    // 1. Validate flat exists and is active
    const flat = await Flat.findOne({ _id: flatId, isActive: true });
    if (!flat) {
      throw new AppError('Flat not found or inactive', 404);
    }

    // 2. Validate resident exists
    const resident = await User.findById(residentId);
    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    // 3. Ensure flat belongs to same society as resident
    if (flat.society.toString() !== resident.society.toString()) {
      throw new AppError('Flat does not belong to this society', 403);
    }

    // 4. Prevent assigning an already-occupied flat to a different resident
    const flatAlreadyHasOtherResident = flat.residents.some(
      (r) => r.toString() !== residentId
    );
    if (flatAlreadyHasOtherResident) {
      throw new AppError('This flat is already occupied by another resident. Please choose a vacant flat.', 409);
    }

    // 5. If resident already has a different flat, remove them from it
    if (resident.flat && resident.flat.toString() !== flatId) {
      const oldFlatId = resident.flat.toString();
      await Flat.findByIdAndUpdate(oldFlatId, {
        $pull: { residents: residentId },
      });
      // Clear isOccupied if no residents remain in the old flat
      const oldFlatAfter = await Flat.findById(oldFlatId);
      if (oldFlatAfter && oldFlatAfter.residents.length === 0) {
        await Flat.findByIdAndUpdate(oldFlatId, { isOccupied: false });
      }
    }

    // 6. Assign new flat to resident
    const updatedResident = await User.findByIdAndUpdate(
      residentId,
      { flat: flatId },
      { new: true }
    ).populate({
      path: 'flat',
      select: 'flatNumber floor tower isOccupied',
      populate: { path: 'tower', select: 'name' },
    });

    // 7. Add resident to flat's residents list and mark as occupied
    await Flat.findByIdAndUpdate(flatId, {
      $addToSet: { residents: residentId },
      isOccupied: true,
    });

    // 8. Notify resident about flat assignment
    try {
      await Notification.create({
        user: residentId,
        society: flat.society,
        type: NotificationType.NOTICE_PUBLISHED, // Resident general category
        title: '🏠 Flat Assigned',
        body: `Welcome! Your resident profile is now linked to Flat ${flat.flatNumber}.`,
        data: { flatId: flatId },
      });
    } catch (err) {
      console.error('Failed to notify resident of flat assignment:', err);
    }

    return updatedResident;
  }
}

export const adminService = new AdminService();
