import { VisitorRequest } from '../models/VisitorRequest';
import { User, Resident } from '../models/User';
import { VisitorStatus } from '../constants';
import { AppError } from '../utils/response';

export class GuardService {
  async searchDestinationResidents(societyId: string, query: string) {
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

  async getPendingApprovals(societyId: string) {
    return VisitorRequest.find({ society: societyId, status: VisitorStatus.PENDING })
      .populate('resident', 'name phone email')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower',
        populate: { path: 'tower', select: 'name' },
      })
      .sort({ createdAt: -1 });
  }

  async getInsideVisitors(societyId: string) {
    return VisitorRequest.find({ society: societyId, status: VisitorStatus.INSIDE })
      .populate('resident', 'name phone email')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower',
        populate: { path: 'tower', select: 'name' },
      })
      .sort({ entryAt: -1 });
  }

  async getGateStats(societyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, inside, approved] = await Promise.all([
      VisitorRequest.countDocuments({ society: societyId, createdAt: { $gte: today } }),
      VisitorRequest.countDocuments({ society: societyId, status: VisitorStatus.PENDING }),
      VisitorRequest.countDocuments({ society: societyId, status: VisitorStatus.INSIDE }),
      VisitorRequest.countDocuments({ society: societyId, status: VisitorStatus.APPROVED }),
    ]);

    return { total, pending, inside, approved };
  }
}

export const guardService = new GuardService();
