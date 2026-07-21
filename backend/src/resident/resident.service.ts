import { HelpdeskTicket } from '../models/HelpdeskTicket';
import { Amenity } from '../models/Amenity';
import { Payment } from '../models/Payment';
import { Notice } from '../models/Notice';
import { Poll } from '../models/Poll';
import { Staff } from '../models/Staff';
import { AppError } from '../utils/response';

export class ResidentService {
  // Helpdesk Tickets
  async getMyTickets(userId: string) {
    return HelpdeskTicket.find({ resident: userId })
      .populate('flat', 'flatNumber floor')
      .sort({ createdAt: -1 });
  }

  // Maintenance Payments
  async getMyPayments(userId: string) {
    return Payment.find({ resident: userId })
      .populate('flat', 'flatNumber floor')
      .sort({ createdAt: -1 });
  }

  // Notices & Broadcasts
  async getNotices(societyId: string) {
    return Notice.find({ society: societyId })
      .populate('author', 'name role')
      .sort({ isPinned: -1, createdAt: -1 });
  }

  // Polls
  async getPolls(societyId: string) {
    return Poll.find({ society: societyId }).sort({ createdAt: -1 });
  }

  // Amenities
  async getAmenities(societyId: string) {
    return Amenity.find({ society: societyId, isActive: true }).sort({ name: 1 });
  }

  // Staff Directory
  async getStaff(societyId: string) {
    return Staff.find({ society: societyId, isActive: true }).sort({ name: 1 });
  }
}

export const residentService = new ResidentService();
