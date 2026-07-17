import { HelpdeskTicket } from '../models/HelpdeskTicket';
import { TicketReply } from '../models/HelpdeskTicket';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AppError } from '../utils/response';
import { TicketStatus, TicketCategory, TicketPriority, NotificationType } from '../constants';

interface CreateTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  images?: string[];
  residentId: string;
  flatId?: string;
  societyId: string;
}

export class TicketService {
  async createTicket(input: CreateTicketInput) {
    let resolvedFlatId = input.flatId;

    if (!resolvedFlatId) {
      const user = await User.findById(input.residentId);
      if (user && user.flat) {
        resolvedFlatId = user.flat.toString();
      }
    }

    if (!resolvedFlatId) {
      throw new AppError('No flat is assigned to this resident account.', 400);
    }

    const ticket = await HelpdeskTicket.create({
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority || TicketPriority.MEDIUM,
      images: input.images || [],
      resident: input.residentId,
      flat: resolvedFlatId,
      society: input.societyId,
    });

    // Notify admins about new complaint
    try {
      const admins = await User.find({ society: input.societyId, role: 'admin', isActive: true });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          society: input.societyId,
          type: NotificationType.TICKET_CREATED,
          title: '🔧 New Complaint Raised',
          body: `A new complaint "${ticket.title}" has been registered.`,
          data: { ticketId: ticket._id.toString() },
        });
      }
    } catch (err) {
      console.error('Failed to notify admins of new ticket:', err);
    }

    return ticket;
  }

  async getTickets(query: {
    societyId?: string;
    residentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...filters } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (filters.societyId) mongoFilter.society = filters.societyId;
    if (filters.residentId) mongoFilter.resident = filters.residentId;
    if (filters.status) mongoFilter.status = filters.status;

    const total = await HelpdeskTicket.countDocuments(mongoFilter);
    const tickets = await HelpdeskTicket.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('resident', 'name phone')
      .populate('flat', 'flatNumber')
      .populate('assignedTo', 'name');

    return {
      tickets,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getTicketById(ticketId: string) {
    const ticket = await HelpdeskTicket.findById(ticketId)
      .populate('resident', 'name phone email')
      .populate('flat', 'flatNumber')
      .populate('assignedTo', 'name');

    if (!ticket) throw new AppError('Ticket not found', 404);

    const replies = await TicketReply.find({ ticket: ticketId })
      .sort({ createdAt: 1 })
      .populate('user', 'name role avatar');

    return { ticket, replies };
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = await HelpdeskTicket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    ticket.status = status;
    if (status === TicketStatus.RESOLVED) ticket.resolvedAt = new Date();
    if (status === TicketStatus.CLOSED) ticket.closedAt = new Date();
    await ticket.save();

    // Notify resident
    const isResolved = status === TicketStatus.RESOLVED;
    await Notification.create({
      user: ticket.resident,
      society: ticket.society,
      type: isResolved ? NotificationType.TICKET_RESOLVED : NotificationType.TICKET_UPDATED,
      title: isResolved ? '🎉 Complaint Resolved!' : 'Complaint Updated',
      body: isResolved 
        ? `Good news! Your complaint "${ticket.title}" has been resolved.` 
        : `Your complaint "${ticket.title}" status changed to ${status}.`,
      data: { ticketId: ticket._id.toString() },
    });

    return ticket;
  }

  async addReply(ticketId: string, userId: string, message: string, images?: string[]) {
    const ticket = await HelpdeskTicket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    const reply = await TicketReply.create({
      ticket: ticketId,
      user: userId,
      message,
      images: images || [],
    });

    // Notify the other party about the reply
    try {
      const user = await User.findById(userId);
      const isResident = user?.role === 'resident';

      if (isResident) {
        const admins = await User.find({ society: ticket.society, role: 'admin', isActive: true });
        for (const admin of admins) {
          await Notification.create({
            user: admin._id,
            society: ticket.society,
            type: NotificationType.TICKET_UPDATED,
            title: '💬 New Reply on Ticket',
            body: `Resident replied on "${ticket.title}": "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`,
            data: { ticketId: ticket._id.toString() },
          });
        }
      } else {
        await Notification.create({
          user: ticket.resident,
          society: ticket.society,
          type: NotificationType.TICKET_UPDATED,
          title: '💬 New Reply on Ticket',
          body: `Admin/Staff replied on "${ticket.title}": "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`,
          data: { ticketId: ticket._id.toString() },
        });
      }
    } catch (err) {
      console.error('Failed to notify party of new ticket reply:', err);
    }

    return reply;
  }

  async getStats(societyId: string) {
    const [open, inProgress, resolved, closed] = await Promise.all([
      HelpdeskTicket.countDocuments({ society: societyId, status: TicketStatus.OPEN }),
      HelpdeskTicket.countDocuments({ society: societyId, status: TicketStatus.IN_PROGRESS }),
      HelpdeskTicket.countDocuments({ society: societyId, status: TicketStatus.RESOLVED }),
      HelpdeskTicket.countDocuments({ society: societyId, status: TicketStatus.CLOSED }),
    ]);
    return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
  }
}

export const ticketService = new TicketService();
