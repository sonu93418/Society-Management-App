import { User, Admin, Guard, Resident, findUserByEmail, findUserById, IUser } from '../models/User';
import { Society } from '../models/Society';
import { Flat } from '../models/Flat';
import { DeviceToken } from '../models/DeviceToken';
import { hashPassword, comparePassword } from '../utils/hash';
import { OAuth2Client } from 'google-auth-library';
import { generateTokenPair, verifyRefreshToken } from '../utils/token';
import { AppError } from '../utils/response';
import { UserRole, NotificationType } from '../constants';
import { Notification } from '../models/Notification';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  societyId: string;
  flatId?: string;
  registrationCode?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

import mongoose from 'mongoose';

export const getSocietyId = (societyField: any): string => {
  if (!societyField) return '';
  if (typeof societyField === 'object' && societyField._id) {
    return societyField._id.toString();
  }
  return societyField.toString();
};

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists across collections
    const existingUser = await findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Role-specific signup guards to prevent unauthorized escalation
    if (input.role === UserRole.ADMIN) {
      const adminSecret = process.env.ADMIN_REGISTRATION_SECRET || 'admin123';
      if (!input.registrationCode || input.registrationCode !== adminSecret) {
        throw new AppError('Invalid registration code for Admin role', 403);
      }
    } else if (input.role === UserRole.GUARD) {
      const guardSecret = process.env.GUARD_REGISTRATION_SECRET || 'guard123';
      if (!input.registrationCode || input.registrationCode !== guardSecret) {
        throw new AppError('Invalid registration code for Guard role', 403);
      }
    }

    // Verify society exists (with fallback for DEMO_SOCIETY_ID or invalid ObjectId)
    let society = null;
    if (mongoose.Types.ObjectId.isValid(input.societyId)) {
      society = await Society.findById(input.societyId);
    } else {
      society = await Society.findOne();
    }

    if (!society) {
      throw new AppError('Society not found', 404);
    }

    // If resident, verify flat
    if (input.role === UserRole.RESIDENT && input.flatId) {
      const flat = await Flat.findById(input.flatId);
      if (!flat) {
        throw new AppError('Flat not found', 404);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user in role-specific MongoDB collection (admins, guards, residents)
    const userData = {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      phone: input.phone,
      role: input.role,
      society: society._id,
      flat: input.flatId,
      isActive: input.role !== UserRole.RESIDENT,
    };

    let user;
    if (input.role === UserRole.ADMIN) {
      user = await Admin.create(userData);
    } else if (input.role === UserRole.GUARD) {
      user = await Guard.create(userData);
    } else {
      user = await Resident.create(userData);
    }

    // If resident, add to flat
    if (input.role === UserRole.RESIDENT && input.flatId) {
      await Flat.findByIdAndUpdate(input.flatId, {
        $push: { residents: user._id },
        isOccupied: true,
      });
    }

    // Populate society and flat details for client return
    const populatedUser = await User.findById(user._id)
      .populate('society', 'name address city state pincode totalTowers totalFlats')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: getSocietyId(user.society),
    });

    // Save refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      user: {
        id: populatedUser!._id,
        email: populatedUser!.email,
        name: populatedUser!.name,
        phone: populatedUser!.phone,
        role: populatedUser!.role,
        society: populatedUser!.society,
        flat: populatedUser!.flat,
      },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    // Find user across admins, guards, residents collections with populated society and flat details
    const user = await findUserByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AppError(`Your account is temporarily locked due to consecutive failed login attempts. Try again in ${remainingMinutes} minute(s).`, 403);
    }

    if (!user.isActive) {
      throw new AppError('Your account is pending admin approval or has been deactivated.', 403);
    }

    // Compare password
    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
      }
      await user.save();
      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed login attempts on successful authentication
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: getSocietyId(user.society),
    });

    // Save refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        society: user.society,
        flat: user.flat,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await findUserById(decoded.userId);
    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Refresh Token Reuse Detection
    if (user.refreshToken && user.refreshToken !== refreshToken) {
      // Token reuse detected - invalidate user's active session completely for security
      user.refreshToken = undefined;
      await user.save();
      throw new AppError('Refresh token reuse detected. Access denied.', 401);
    }

    // Generate new token pair (Access & Rotate Refresh Token)
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: getSocietyId(user.society),
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  async logout(userId: string) {
    const user = await findUserById(userId);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  }

  async getProfile(userId: string) {
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updatePushToken(userId: string, pushToken: string | undefined) {
    await User.findByIdAndUpdate(userId, { pushToken });
    if (pushToken) {
      const tokenType = (pushToken.includes('ExponentPushToken') || pushToken.includes('ExpoPushToken')) ? 'expo' : 'fcm';
      await this.registerDevice(userId, { token: pushToken, tokenType, deviceType: 'android' });
    }
  }

  async forgotPassword(email: string, phone: string) {
    const user = await User.findOne({ email: email.toLowerCase().trim(), phone: phone.trim() });
    if (!user) {
      throw new AppError('No matching user found with the provided email and phone number.', 404);
    }

    // Generate a simple 6-digit numeric reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetExpire;
    await user.save();

    console.log(`🔑 Reset Password Request for ${user.email}. Verification Token: ${resetToken}`);

    return { resetToken };
  }

  async resetPassword(email: string, resetToken: string, newPassword: string) {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetToken.trim(),
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token.', 400);
    }

    // Hash and save new password
    const { hashPassword } = require('../utils/hash');
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'Password has been reset successfully.' };
  }

  async assignFlat(userId: string, flatId: string) {
    // 1. Validate flat exists and is active
    const flat = await Flat.findOne({ _id: flatId, isActive: true });
    if (!flat) {
      throw new AppError('Flat not found or inactive', 404);
    }

    // 2. Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 3. Ensure flat belongs to same society
    if (flat.society.toString() !== user.society.toString()) {
      throw new AppError('Flat does not belong to your society', 403);
    }

    // 4. Prevent assigning an occupied flat already taken by another resident
    const flatAlreadyHasOtherResident = flat.residents.some(
      (r) => r.toString() !== userId
    );
    if (flatAlreadyHasOtherResident) {
      throw new AppError('This flat is already occupied. Please contact your admin to get a flat assigned.', 409);
    }

    // 5. If user already has a different flat, remove from old flat
    if (user.flat && user.flat.toString() !== flatId) {
      const oldFlatId = user.flat.toString();
      await Flat.findByIdAndUpdate(oldFlatId, { $pull: { residents: userId } });
      const oldFlatAfter = await Flat.findById(oldFlatId);
      if (oldFlatAfter && oldFlatAfter.residents.length === 0) {
        await Flat.findByIdAndUpdate(oldFlatId, { isOccupied: false });
      }
    }

    // 6. Assign flat to user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { flat: flatId },
      { new: true }
    ).populate([
      { path: 'society', select: 'name address city state pincode totalTowers totalFlats' },
      { path: 'flat', select: 'flatNumber floor tower isOccupied', populate: { path: 'tower', select: 'name' } },
    ]);

    // 7. Mark flat as occupied
    await Flat.findByIdAndUpdate(flatId, {
      $addToSet: { residents: userId },
      isOccupied: true,
    });

    // 8. Notify resident
    try {
      await Notification.create({
        user: userId,
        society: flat.society,
        type: NotificationType.NOTICE_PUBLISHED,
        title: '🏠 Flat Linked Successfully',
        body: `You have successfully linked Flat ${flat.flatNumber} to your profile.`,
        data: { flatId: flatId },
      });
    } catch (err) {
      console.error('Failed to notify resident of self flat assignment:', err);
    }

    return updatedUser;
  }

  async registerDevice(userId: string, data: { token: string; tokenType: 'fcm' | 'expo'; deviceType?: 'ios' | 'android' | 'web' }) {
    try {
      // Use findOneAndUpdate with upsert to prevent unique key race conditions
      const deviceToken = await DeviceToken.findOneAndUpdate(
        { token: data.token },
        {
          user: userId as any,
          tokenType: data.tokenType,
          deviceType: data.deviceType || 'android',
          isActive: true,
          lastUsedAt: new Date(),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Backwards compatibility: update single pushToken on User schema
      await User.findByIdAndUpdate(userId, { pushToken: data.token });

      return deviceToken;
    } catch (error: any) {
      // Fallback if double concurrent upsert hits raw duplicate constraint
      if (error.code === 11000) {
        const deviceToken = await DeviceToken.findOneAndUpdate(
          { token: data.token },
          {
            user: userId as any,
            isActive: true,
            lastUsedAt: new Date(),
          },
          { new: true }
        );
        return deviceToken;
      }
      throw error;
    }
  }

  async googleLogin(idToken: string) {
    let email: string;
    let name: string;
    let avatar: string | undefined;

    // 1. Support mock tokens for offline/emulator/dev testing
    if (idToken.startsWith('mock_google_token_')) {
      const targetRole = idToken.replace('mock_google_token_', '');
      if (targetRole === 'admin') {
        email = 'loverbirdcpr6457@gmail.com'; // Admin account email
        name = 'Society Admin';
      } else if (targetRole === 'guard') {
        email = 'guard@portl.app';
        name = 'Gate Guard';
      } else {
        email = 'resident@portl.app';
        name = 'Resident User';
      }
      avatar = 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    } else {
      // Verify Google ID token with Google OAuth2 API
      try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name) {
          throw new AppError('Invalid Google token payload', 400);
        }
        email = payload.email.toLowerCase().trim();
        name = payload.name;
        avatar = payload.picture;
      } catch (err: any) {
        console.error('Google token verification failed:', err);
        throw new AppError('Google token verification failed. Please try again.', 401);
      }
    }

    // 2. Check if user already exists with populated details in Database across collections
    let user = await findUserByEmail(email);

    if (!user) {
      // If user does not exist in database, find onboarded society and auto-create in residents collection
      const society = await Society.findOne();
      if (!society) {
        throw new AppError('No society found in system. Google Auth requires an onboarded society.', 400);
      }

      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);

      const newUser = await Resident.create({
        email,
        password: hashedPassword,
        name,
        phone: '9999999999',
        role: UserRole.RESIDENT,
        society: society._id,
        avatar,
        isActive: true,
      });

      user = await findUserById(newUser._id.toString());
    } else {
      // Auto-activate user account on Google Sign-In
      if (!user.isActive) {
        user.isActive = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user!._id.toString(),
      role: user!.role,
      societyId: getSocietyId(user!.society),
    });

    user!.refreshToken = refreshToken;
    await user!.save();

    return {
      user: {
        id: user!._id.toString(),
        email: user!.email,
        name: user!.name,
        phone: user!.phone,
        role: user!.role,
        society: user!.society,
        flat: user!.flat,
        avatar: user!.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  async updatePreferences(userId: string, preferences: Partial<IUser['notificationPreferences']>) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Merge preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences,
      emergency: true, // Emergency preferences are read-only and always enabled
    };

    await user.save();
    return user;
  }

  async getSocieties() {
    return Society.find().select('name address city state pincode').sort({ name: 1 });
  }
}

export const authService = new AuthService();
