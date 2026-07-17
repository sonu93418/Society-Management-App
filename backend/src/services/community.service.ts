import { Notice } from '../models/Notice';
import { Poll, Vote } from '../models/Poll';
import { Amenity, Booking } from '../models/Amenity';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/response';
import { NotificationType, BookingStatus, PaymentStatus } from '../constants';

// ========== NOTICE SERVICE ==========
export class NoticeService {
  async create(data: { title: string; content: string; attachments?: string[]; isPinned?: boolean; authorId: string; societyId: string }) {
    const notice = await Notice.create({
      title: data.title,
      content: data.content,
      attachments: data.attachments || [],
      isPinned: data.isPinned || false,
      author: data.authorId,
      society: data.societyId,
    });

    // Notify all active residents in the society
    try {
      const { User } = require('../models/User');
      const residents = await User.find({ society: data.societyId, role: 'resident', isActive: true });
      for (const resident of residents) {
        await Notification.create({
          user: resident._id,
          society: data.societyId,
          type: NotificationType.NOTICE_PUBLISHED,
          title: '📢 New Notice Published',
          body: data.title,
          data: { noticeId: notice._id.toString() },
        });
      }
    } catch (err) {
      console.error('Failed to dispatch notifications for new notice:', err);
    }

    return notice;
  }

  async getAll(societyId: string, page = 1, limit = 20) {
    const total = await Notice.countDocuments({ society: societyId, isPublished: true });
    const notices = await Notice.find({ society: societyId, isPublished: true })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name avatar');
    return { notices, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async markRead(noticeId: string, userId: string) {
    await Notice.findByIdAndUpdate(noticeId, { $addToSet: { readBy: userId } });
  }

  async delete(noticeId: string) {
    const notice = await Notice.findByIdAndDelete(noticeId);
    if (!notice) {
      throw new AppError('Notice not found', 404);
    }
    return notice;
  }
}

// ========== POLL SERVICE ==========
export class PollService {
  async create(data: { title: string; description?: string; options: string[]; isAnonymous?: boolean; endDate: string; authorId: string; societyId: string }) {
    const poll = await Poll.create({
      title: data.title,
      description: data.description,
      options: data.options.map((text) => ({ text, votes: 0 })),
      isAnonymous: data.isAnonymous || false,
      endDate: new Date(data.endDate),
      author: data.authorId,
      society: data.societyId,
    });

    // Notify all active residents in the society
    try {
      const { User } = require('../models/User');
      const residents = await User.find({ society: data.societyId, role: 'resident', isActive: true });
      for (const resident of residents) {
        await Notification.create({
          user: resident._id,
          society: data.societyId,
          type: NotificationType.POLL_CREATED,
          title: '🗳️ New Poll Published',
          body: data.title,
          data: { pollId: poll._id.toString() },
        });
      }
    } catch (err) {
      console.error('Failed to dispatch notifications for new poll:', err);
    }

    return poll;
  }

  async vote(pollId: string, userId: string, optionIndex: number) {
    const poll = await Poll.findById(pollId);
    if (!poll) throw new AppError('Poll not found', 404);
    if (!poll.isActive) throw new AppError('Poll is closed', 400);
    if (new Date() > poll.endDate) throw new AppError('Poll has ended', 400);
    if (optionIndex < 0 || optionIndex >= poll.options.length) throw new AppError('Invalid option', 400);

    const existingVote = await Vote.findOne({ poll: pollId, user: userId });
    if (existingVote) throw new AppError('You have already voted', 400);

    await Vote.create({ poll: pollId, user: userId, optionIndex });
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    await poll.save();

    return poll;
  }

  async getAll(societyId: string, userId: string) {
    const polls = await Poll.find({ society: societyId })
      .sort({ createdAt: -1 })
      .populate('author', 'name');

    // Check if user has voted on each poll and retrieve votedIndex
    const votes = await Vote.find({ user: userId });
    const voteMap = new Map<string, number>(votes.map((v) => [v.poll.toString(), v.optionIndex]));

    return polls.map((poll) => {
      const pollIdStr = poll._id!.toString();
      const hasVoted = voteMap.has(pollIdStr);
      return {
        ...poll.toObject(),
        hasVoted,
        votedIndex: hasVoted ? voteMap.get(pollIdStr) : undefined,
      };
    });
  }
}

// ========== AMENITY SERVICE ==========
export class AmenityService {
  async create(data: any, societyId: string) {
    const amenity = await Amenity.create({ ...data, society: societyId });
    return amenity;
  }

  async getAll(societyId: string) {
    return Amenity.find({ society: societyId, isActive: true });
  }

  async createBooking(data: { amenityId: string; date: string; startTime: string; endTime: string; numberOfPeople?: number; notes?: string; residentId: string; societyId: string }) {
    const amenity = await Amenity.findById(data.amenityId);
    if (!amenity) throw new AppError('Amenity not found', 404);
    if (!amenity.isActive) throw new AppError('Amenity is not available', 400);

    // Check capacity for the slot
    const existingBookings = await Booking.countDocuments({
      amenity: data.amenityId,
      date: new Date(data.date),
      startTime: data.startTime,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });

    if (existingBookings >= amenity.capacity) {
      throw new AppError('This slot is fully booked', 400);
    }

    const booking = await Booking.create({
      amenity: data.amenityId,
      resident: data.residentId,
      society: data.societyId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      numberOfPeople: data.numberOfPeople || 1,
      notes: data.notes,
      status: amenity.requiresApproval ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
    });

    // Notify resident or admin
    try {
      if (booking.status === BookingStatus.CONFIRMED) {
        await Notification.create({
          user: data.residentId,
          society: data.societyId,
          type: NotificationType.BOOKING_CONFIRMED,
          title: '📅 Booking Confirmed',
          body: `Your booking for ${amenity.name} on ${new Date(data.date).toLocaleDateString('en-IN')} is confirmed!`,
          data: { bookingId: booking._id.toString() },
        });
      } else if (booking.status === BookingStatus.PENDING) {
        const { User } = require('../models/User');
        const admins = await User.find({ society: data.societyId, role: 'admin', isActive: true });
        for (const admin of admins) {
          await Notification.create({
            user: admin._id,
            society: data.societyId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: '📅 New Booking Request',
            body: `A resident requested to book ${amenity.name} on ${new Date(data.date).toLocaleDateString('en-IN')}.`,
            data: { bookingId: booking._id.toString() },
          });
        }
      }
    } catch (err) {
      console.error('Failed to send booking notification:', err);
    }

    return booking;
  }

  async getBookings(query: { societyId?: string; residentId?: string; amenityId?: string; status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, ...filters } = query;
    const mongoFilter: Record<string, unknown> = {};
    if (filters.societyId) mongoFilter.society = filters.societyId;
    if (filters.residentId) mongoFilter.resident = filters.residentId;
    if (filters.amenityId) mongoFilter.amenity = filters.amenityId;
    if (filters.status) mongoFilter.status = filters.status;

    const total = await Booking.countDocuments(mongoFilter);
    const bookings = await Booking.find(mongoFilter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('amenity', 'name')
      .populate('resident', 'name phone');

    return { bookings, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async cancelBooking(bookingId: string, residentId: string, reason?: string) {
    const booking = await Booking.findById(bookingId).populate('amenity', 'name');
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.resident.toString() !== residentId) throw new AppError('Unauthorized', 403);
    if (booking.status === BookingStatus.CANCELLED) throw new AppError('Already cancelled', 400);

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    await booking.save();

    // Notify resident about cancellation
    try {
      const amenityName = (booking.amenity as any)?.name || 'Facility';
      await Notification.create({
        user: residentId,
        society: booking.society,
        type: NotificationType.BOOKING_CANCELLED,
        title: '📅 Booking Cancelled',
        body: `Your booking for ${amenityName} has been cancelled.`,
        data: { bookingId: booking._id.toString() },
      });
    } catch (err) {
      console.error('Failed to send cancellation notification:', err);
    }

    return booking;
  }
}

// ========== PAYMENT SERVICE ==========
export class PaymentService {
  async getPayments(query: { residentId?: string; societyId?: string; status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, ...filters } = query;
    const mongoFilter: Record<string, unknown> = {};
    if (filters.residentId) mongoFilter.resident = filters.residentId;
    if (filters.societyId) mongoFilter.society = filters.societyId;
    if (filters.status) mongoFilter.status = filters.status;

    const total = await Payment.countDocuments(mongoFilter);
    const payments = await Payment.find(mongoFilter)
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('flat', 'flatNumber');

    return { payments, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async markPaid(paymentId: string, transactionId?: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found', 404);

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.transactionId = transactionId;
    await payment.save();

    // Notify resident about payment received
    try {
      await Notification.create({
        user: payment.resident,
        society: payment.society,
        type: NotificationType.PAYMENT_RECEIVED,
        title: '💳 Payment Received',
        body: `Thank you! Your payment of ₹${payment.amount} for ${payment.month} ${payment.year} has been received.`,
        data: { paymentId: payment._id.toString() },
      });
    } catch (err) {
      console.error('Failed to send payment receipt notification:', err);
    }

    return payment;
  }

  async getStats(societyId: string) {
    const [pending, paid, overdue] = await Promise.all([
      Payment.countDocuments({ society: societyId, status: PaymentStatus.PENDING }),
      Payment.countDocuments({ society: societyId, status: PaymentStatus.PAID }),
      Payment.countDocuments({ society: societyId, status: PaymentStatus.OVERDUE }),
    ]);

    const totalCollected = await Payment.aggregate([
      { $match: { society: societyId, status: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalPending = await Payment.aggregate([
      { $match: { society: societyId, status: { $in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      pending,
      paid,
      overdue,
      totalCollected: totalCollected[0]?.total || 0,
      totalPending: totalPending[0]?.total || 0,
    };
  }
}

export const noticeService = new NoticeService();
export const pollService = new PollService();
export const amenityService = new AmenityService();
export const paymentService = new PaymentService();
