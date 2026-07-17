import { User, IUser } from '../models/User';
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
}

interface LoginInput {
  email: string;
  password: string;
}

import mongoose from 'mongoose';

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
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

    // Create user
    const user = await User.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      phone: input.phone,
      role: input.role,
      society: society._id,
      flat: input.flatId,
    });

    // If resident, add to flat
    if (input.role === UserRole.RESIDENT && input.flatId) {
      await Flat.findByIdAndUpdate(input.flatId, {
        $push: { residents: user._id },
        isOccupied: true,
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: user.society.toString(),
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
      },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    // Find user with password
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact admin.', 403);
    }

    // Compare password
    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: user.society.toString(),
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

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: user.society.toString(),
    });

    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId)
      .populate('society', 'name address city')
      .populate({
        path: 'flat',
        select: 'flatNumber floor tower isOccupied',
        populate: { path: 'tower', select: 'name' },
      });

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
      { path: 'society', select: 'name address city' },
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

    // Support mock tokens for local testing in development/offline modes
    if (idToken.startsWith('mock_google_token_')) {
      const mockRole = idToken.replace('mock_google_token_', '');
      email = `${mockRole}@google-demo.com`;
      name = `Google ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)} User`;
      avatar = 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    } else {
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
        throw new AppError('Google token verification failed', 401);
      }
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, log them in
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        await user.save();
      }
    } else {
      // 2. Auto-create user if they don't exist
      // Find the first society in database to bind them
      const society = await Society.findOne();
      if (!society) {
        throw new AppError('No society found in the database. Google Auth is disabled until a society is created.', 400);
      }

      // Generate a random secure password for database validation constraint
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);

      user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone: '9999999999', // placeholder phone number
        role: UserRole.RESIDENT,
        society: society._id,
        avatar,
        isActive: true,
      });

      // Send a welcome notification
      await Notification.create({
        user: user._id,
        society: society._id,
        type: NotificationType.NOTICE_PUBLISHED,
        title: 'Welcome to Portl!',
        body: `Hello ${name}, your account was successfully created via Google Sign-In! You have been assigned to ${society.name}. Please configure your flat details in profile.`,
      });
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      societyId: user.society.toString(),
    });

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        society: user.society.toString(),
        flat: user.flat ? user.flat.toString() : undefined,
        avatar: user.avatar,
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
}

export const authService = new AuthService();
