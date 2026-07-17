import { VisitorRequest, IVisitorRequest } from '../models/VisitorRequest';
import { Flat } from '../models/Flat';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/response';
import { VisitorStatus, VisitorType, NotificationType, UserRole } from '../constants';
import crypto from 'crypto';

interface CreateVisitorInput {
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  type: VisitorType;
  vehicleNumber?: string;
  flatId: string;
  residentId: string;
  guardId: string;
  societyId: string;
  expectedCount?: number;
  notes?: string;
}

interface PreApproveInput {
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  type: VisitorType;
  vehicleNumber?: string;
  residentId: string;
  flatId: string;
  societyId: string;
  validFrom?: string;
  validUntil?: string;
  expectedCount?: number;
}

export class VisitorService {
  async createVisitorRequest(input: CreateVisitorInput) {
    // Verify flat and resident exist
    const flat = await Flat.findById(input.flatId);
    if (!flat) throw new AppError('Flat not found', 404);

    const resident = await User.findById(input.residentId);
    if (!resident) throw new AppError('Resident not found', 404);

    // Check for existing pre-approved visitor
    const preApproved = await VisitorRequest.findOne({
      visitorPhone: input.visitorPhone,
      flat: input.flatId,
      preApproved: true,
      status: VisitorStatus.APPROVED,
      validUntil: { $gte: new Date() },
    });

    const request = await VisitorRequest.create({
      visitorName: input.visitorName,
      visitorPhone: input.visitorPhone,
      purpose: input.purpose,
      type: input.type,
      vehicleNumber: input.vehicleNumber,
      flat: input.flatId,
      resident: input.residentId,
      guard: input.guardId,
      society: input.societyId,
      status: preApproved ? VisitorStatus.APPROVED : VisitorStatus.PENDING,
      preApproved: !!preApproved,
      expectedCount: input.expectedCount || 1,
      notes: input.notes,
      approvedAt: preApproved ? new Date() : undefined,
      qrCode: preApproved ? crypto.randomUUID() : undefined,
    });

    // Create notification for resident
    await Notification.create({
      user: input.residentId,
      society: input.societyId,
      type: preApproved
        ? NotificationType.VISITOR_APPROVED
        : NotificationType.VISITOR_REQUEST,
      title: preApproved ? 'Pre-approved Visitor Arrived' : 'New Visitor Request',
      body: preApproved
        ? `${input.visitorName} (pre-approved) has arrived at the gate.`
        : `${input.visitorName} is at the gate for ${input.purpose}.`,
      data: { visitorRequestId: request._id },
    });

    return request;
  }

  async preApproveVisitor(input: PreApproveInput) {
    const request = await VisitorRequest.create({
      visitorName: input.visitorName,
      visitorPhone: input.visitorPhone,
      purpose: input.purpose,
      type: input.type,
      vehicleNumber: input.vehicleNumber,
      flat: input.flatId,
      resident: input.residentId,
      society: input.societyId,
      status: VisitorStatus.APPROVED,
      preApproved: true,
      expectedCount: input.expectedCount || 1,
      validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
      validUntil: input.validUntil
        ? new Date(input.validUntil)
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      approvedAt: new Date(),
      qrCode: crypto.randomUUID(),
    });

    return request;
  }

  async approveVisitor(requestId: string, residentId: string) {
    const request = await VisitorRequest.findById(requestId);
    if (!request) throw new AppError('Visitor request not found', 404);
    if (request.resident.toString() !== residentId) {
      throw new AppError('You can only approve visitors for your flat', 403);
    }
    if (request.status !== VisitorStatus.PENDING) {
      throw new AppError(`Request already ${request.status}`, 400);
    }

    request.status = VisitorStatus.APPROVED;
    request.approvedAt = new Date();
    request.qrCode = crypto.randomUUID();
    await request.save();

    return request;
  }

  async rejectVisitor(requestId: string, residentId: string, reason?: string) {
    const request = await VisitorRequest.findById(requestId);
    if (!request) throw new AppError('Visitor request not found', 404);
    if (request.resident.toString() !== residentId) {
      throw new AppError('You can only reject visitors for your flat', 403);
    }
    if (request.status !== VisitorStatus.PENDING) {
      throw new AppError(`Request already ${request.status}`, 400);
    }

    request.status = VisitorStatus.REJECTED;
    request.rejectedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    return request;
  }

  async markEntry(requestId: string, guardId: string) {
    const request = await VisitorRequest.findById(requestId);
    if (!request) throw new AppError('Visitor request not found', 404);
    if (request.status !== VisitorStatus.APPROVED) {
      throw new AppError('Visitor must be approved before entry', 400);
    }

    request.status = VisitorStatus.INSIDE;
    request.entryAt = new Date();
    request.entryGuard = guardId as any;
    await request.save();

    // Notify resident
    await Notification.create({
      user: request.resident,
      society: request.society,
      type: NotificationType.VISITOR_ENTRY,
      title: 'Visitor Entered',
      body: `${request.visitorName} has entered the society.`,
      data: { visitorRequestId: request._id },
    });

    return request;
  }

  async markExit(requestId: string, guardId: string) {
    const request = await VisitorRequest.findById(requestId);
    if (!request) throw new AppError('Visitor request not found', 404);
    if (request.status !== VisitorStatus.INSIDE) {
      throw new AppError('Visitor must be inside to mark exit', 400);
    }

    request.status = VisitorStatus.EXITED;
    request.exitAt = new Date();
    request.exitGuard = guardId as any;
    await request.save();

    // Notify resident about visitor exit
    try {
      await Notification.create({
        user: request.resident,
        society: request.society,
        type: NotificationType.VISITOR_EXIT,
        title: 'Visitor Exited',
        body: `${request.visitorName} has exited the society.`,
        data: { visitorRequestId: request._id },
      });
    } catch (err) {
      console.error('Failed to send visitor exit notification:', err);
    }

    return request;
  }

  async getPendingRequests(residentId: string) {
    return VisitorRequest.find({
      resident: residentId,
      status: VisitorStatus.PENDING,
    })
      .sort({ createdAt: -1 })
      .populate('guard', 'name')
      .populate('flat', 'flatNumber');
  }

  async getVisitorHistory(query: {
    societyId?: string;
    residentId?: string;
    flatId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...filters } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (filters.societyId) mongoFilter.society = filters.societyId;
    if (filters.residentId) mongoFilter.resident = filters.residentId;
    if (filters.flatId) mongoFilter.flat = filters.flatId;
    if (filters.status) mongoFilter.status = filters.status;

    const total = await VisitorRequest.countDocuments(mongoFilter);
    const visitors = await VisitorRequest.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('flat', 'flatNumber')
      .populate('resident', 'name phone')
      .populate('guard', 'name');

    return {
      visitors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSocietyPendingRequests(societyId: string) {
    return VisitorRequest.find({
      society: societyId,
      status: VisitorStatus.PENDING,
    })
      .sort({ createdAt: -1 })
      .populate('flat', 'flatNumber')
      .populate('resident', 'name phone');
  }

  async getInsideVisitors(societyId: string) {
    return VisitorRequest.find({
      society: societyId,
      status: VisitorStatus.INSIDE,
    })
      .sort({ entryAt: -1 })
      .populate('flat', 'flatNumber')
      .populate('resident', 'name');
  }

  async getTodayStats(societyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, inside, approved] = await Promise.all([
      VisitorRequest.countDocuments({
        society: societyId,
        createdAt: { $gte: today },
      }),
      VisitorRequest.countDocuments({
        society: societyId,
        status: VisitorStatus.PENDING,
      }),
      VisitorRequest.countDocuments({
        society: societyId,
        status: VisitorStatus.INSIDE,
      }),
      VisitorRequest.countDocuments({
        society: societyId,
        status: VisitorStatus.APPROVED,
        createdAt: { $gte: today },
      }),
    ]);

    return { total, pending, inside, approved };
  }

  async deleteVisitorRequest(id: string, userId: string, role: string) {
    const visitor = await VisitorRequest.findById(id);
    if (!visitor) {
      throw new AppError('Visitor record not found', 404);
    }
    // Residents can only delete their own visitor history
    if (role === UserRole.RESIDENT && visitor.resident.toString() !== userId) {
      throw new AppError('Unauthorized to delete this visitor record', 403);
    }
    await VisitorRequest.findByIdAndDelete(id);
    return visitor;
  }
}

export const visitorService = new VisitorService();
