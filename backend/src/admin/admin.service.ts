import mongoose from 'mongoose';
import { User, Admin, Guard, Resident } from '../models/User';
import { Society } from '../models/Society';
import { Tower } from '../models/Tower';
import { Flat } from '../models/Flat';
import { Staff } from '../models/Staff';
import { VisitorRequest } from '../models/VisitorRequest';
import { HelpdeskTicket } from '../models/HelpdeskTicket';
import { Payment } from '../models/Payment';
import { Notice } from '../models/Notice';
import { Poll } from '../models/Poll';
import { AppError } from '../utils/response';
import { VisitorStatus, TicketStatus, PaymentStatus } from '../constants';

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
      Resident.countDocuments({ society: societyId, isActive: true }),
      Guard.countDocuments({ society: societyId, isActive: true }),
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
    const skip = (page - 1) * limit;
    const [residents, total] = await Promise.all([
      Resident.find({ society: societyId, isActive: true })
        .populate({
          path: 'flat',
          select: 'flatNumber floor tower',
          populate: { path: 'tower', select: 'name' },
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Resident.countDocuments({ society: societyId, isActive: true }),
    ]);

    return {
      residents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchResidents(societyId: string, query: string) {
    const searchRegex = new RegExp(query, 'i');
    return Resident.find({
      society: societyId,
      isActive: true,
      $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }],
    })
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower',
        populate: { path: 'tower', select: 'name' },
      })
      .limit(20);
  }

  async assignFlatToResident(residentId: string, flatId: string) {
    const flat = await Flat.findOne({ _id: flatId, isActive: true });
    if (!flat) {
      throw new AppError('Flat not found or inactive', 404);
    }
    const resident = await User.findById(residentId);
    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    resident.flat = flat._id as any;
    await resident.save();

    await Flat.findByIdAndUpdate(flatId, {
      $addToSet: { residents: resident._id },
      isOccupied: true,
    });

    return resident;
  }
}

export const adminService = new AdminService();
