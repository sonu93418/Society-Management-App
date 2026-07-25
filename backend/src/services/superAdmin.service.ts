import { SocietyOnboardingRequest } from '../models/SocietyOnboardingRequest';
import { Society } from '../models/Society';
import { User, Admin, Guard, Resident, findUserById, findUserByEmail } from '../models/User';
import { Flat } from '../models/Flat';
import { Notification } from '../models/Notification';
import { hashPassword } from '../utils/hash';
import { AppError } from '../utils/response';
import { UserRole, NotificationType } from '../constants';
import { emailService } from './email.service';
import { pushNotificationService } from './pushNotification.service';
import { emitToUser } from '../socket';

export class SuperAdminService {
  async submitRequest(input: {
    societyName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    totalTowers?: number;
    totalFlats?: number;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    adminPasswordHash: string;
  }) {
    // Check if email already registered as user
    const userExists = await User.findOne({ email: input.adminEmail });
    if (userExists) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Check if onboarding request already exists with pending state
    const pendingRequest = await SocietyOnboardingRequest.findOne({
      adminEmail: input.adminEmail,
      status: 'pending',
    });
    if (pendingRequest) {
      throw new AppError('An onboarding request with this email is already pending.', 409);
    }

    // Create request
    const request = await SocietyOnboardingRequest.create({
      societyName: input.societyName,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      totalTowers: input.totalTowers || 0,
      totalFlats: input.totalFlats || 0,
      adminName: input.adminName,
      adminEmail: input.adminEmail,
      adminPhone: input.adminPhone,
      adminPasswordHash: input.adminPasswordHash,
    });

    return request;
  }

  async listRequests(status?: 'pending' | 'approved' | 'rejected') {
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }
    return SocietyOnboardingRequest.find(filter).sort({ createdAt: -1 });
  }

  async approveRequest(requestId: string) {
    const request = await SocietyOnboardingRequest.findById(requestId);
    if (!request) {
      throw new AppError('Onboarding request not found.', 404);
    }
    if (request.status !== 'pending') {
      throw new AppError(`Request has already been processed with status: ${request.status}`, 400);
    }

    // 1. Create or Find Society
    let society = await Society.findOne({ name: new RegExp(`^${request.societyName.trim()}$`, 'i') });
    if (!society) {
      society = await Society.create({
        name: request.societyName,
        address: request.address,
        city: request.city,
        state: request.state,
        pincode: request.pincode,
        totalTowers: request.totalTowers || 0,
        totalFlats: request.totalFlats || 0,
        contactEmail: request.adminEmail,
        contactPhone: request.adminPhone,
        isActive: true,
      });
    } else {
      await Society.updateOne({ _id: society._id }, { $set: { isActive: true } });
    }

    // 2. Create or Activate Admin User in Admin collection
    let admin = await findUserByEmail(request.adminEmail);
    if (!admin) {
      admin = await Admin.create({
        email: request.adminEmail,
        password: request.adminPasswordHash, // already hashed during request submission
        name: request.adminName,
        phone: request.adminPhone,
        role: UserRole.ADMIN,
        society: society._id,
        isActive: true,
      });
    } else {
      const AdminModel = (admin.constructor as any);
      await AdminModel.updateOne(
        { _id: admin._id },
        { $set: { society: society._id, isActive: true, role: UserRole.ADMIN } }
      );
    }

    // 3. Mark request as approved
    request.status = 'approved';
    request.processedAt = new Date();
    await request.save();

    // 4. Send Verification/Welcome Email via SMTP (and console fallback)
    try {
      await emailService.sendOnboardingApprovalEmail(
        request.adminEmail,
        request.adminName,
        request.societyName
      );
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    // 5. Send In-App Approval Notification
    try {
      await Notification.create({
        user: admin._id,
        society: society._id,
        type: NotificationType.NOTICE_PUBLISHED,
        title: '🎉 Society Verified & Approved!',
        body: `Congratulations ${request.adminName}! ${request.societyName} has been approved by the Developer Team. Your Admin account is now fully active.`,
        data: { societyId: society._id.toString() },
      });
    } catch (err) {
      console.error('Failed to send in-app approval notification:', err);
    }

    return {
      society: {
        id: society._id.toString(),
        name: society.name,
      },
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        isActive: true,
      },
      message: `Onboarding request approved! Society ${society.name} and Admin ${admin.name} (${admin.email}) are now active. Confirmation email dispatched.`,
    };
  }

  async rejectRequest(requestId: string, reason: string) {
    const request = await SocietyOnboardingRequest.findById(requestId);
    if (!request) {
      throw new AppError('Onboarding request not found.', 404);
    }
    if (request.status !== 'pending') {
      throw new AppError(`Request has already been processed with status: ${request.status}`, 400);
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'Request did not pass developer verification.';
    request.processedAt = new Date();
    await request.save();

    return request;
  }

  // Developer Portal Analytics
  async getSystemAnalytics() {
    const [
      totalSocieties,
      totalAdmins,
      totalGuards,
      totalResidents,
      totalFlats,
      pendingOnboarding,
    ] = await Promise.all([
      Society.countDocuments({ isActive: true }),
      Admin.countDocuments({ isActive: true }),
      Guard.countDocuments({ isActive: true }),
      Resident.countDocuments({ isActive: true }),
      Flat.countDocuments({ isActive: true }),
      SocietyOnboardingRequest.countDocuments({ status: 'pending' }),
    ]);

    return {
      totalSocieties,
      totalAdmins,
      totalGuards,
      totalResidents,
      totalFlats,
      pendingOnboarding,
      systemUptime: process.uptime(),
      serverTime: new Date().toISOString(),
    };
  }

  // Custom System Broadcast Dispatcher
  async sendBroadcastNotification(data: {
    title: string;
    message: string;
    targetRole?: string;
    priority?: string;
  }) {
    const filter: Record<string, unknown> = { isActive: true };
    if (data.targetRole && data.targetRole !== 'all') {
      filter.role = data.targetRole;
    }

    const [admins, guards, residents] = await Promise.all([
      (!data.targetRole || data.targetRole === 'all' || data.targetRole === 'admin')
        ? Admin.find(filter).select('pushToken email name role society')
        : [],
      (!data.targetRole || data.targetRole === 'all' || data.targetRole === 'guard')
        ? Guard.find(filter).select('pushToken email name role society')
        : [],
      (!data.targetRole || data.targetRole === 'all' || data.targetRole === 'resident')
        ? Resident.find(filter).select('pushToken email name role society')
        : [],
    ]);

    const targetUsers = [...admins, ...guards, ...residents];
    let dispatchedCount = 0;
    
    // Create Notification records in MongoDB (post-save hook dispatches socket & push)
    await Promise.allSettled(
      targetUsers.map(async (u) => {
        try {
          if (!u.society) return;

          await Notification.create({
            user: u._id,
            society: u.society,
            title: `📢 ${data.title}`,
            body: data.message,
            type: data.priority === 'HIGH' ? NotificationType.EMERGENCY : NotificationType.NOTICE_PUBLISHED,
            data: { priority: data.priority || 'NORMAL' },
            isRead: false,
          });
          dispatchedCount++;
        } catch (err) {
          console.error(`Broadcast item dispatch error for user ${u._id}:`, err);
        }
      })
    );

    return {
      dispatchedCount,
      pushTokensSent: targetUsers.length,
      targetRole: data.targetRole || 'all',
    };
  }

  // Master User Account Control across collections
  async listAllUsers(role?: string, query?: string) {
    const searchFilter: Record<string, unknown> = {};
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      searchFilter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [admins, guards, residents] = await Promise.all([
      (!role || role === 'admin') ? Admin.find(searchFilter).populate('society', 'name').limit(50) : [],
      (!role || role === 'guard') ? Guard.find(searchFilter).populate('society', 'name').limit(50) : [],
      (!role || role === 'resident') ? Resident.find(searchFilter).populate('society', 'name').populate('flat', 'flatNumber').limit(50) : [],
    ]);

    return [...admins, ...guards, ...residents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async toggleUserStatus(userId: string) {
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    // Protect demo accounts from being deactivated
    const DEMO_EMAILS = [
      'admin@portl.app',
      'guard@portl.app',
      'resident@portl.app',
      'loverbirdcpr6457@gmail.com',
      'sonukumarray1009@gmail.com',
    ];
    if (DEMO_EMAILS.includes(user.email?.toLowerCase())) {
      throw new AppError('Demo accounts cannot be deactivated. They are protected for testing purposes.', 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
  }
}

export const superAdminService = new SuperAdminService();
