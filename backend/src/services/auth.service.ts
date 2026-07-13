import { User, IUser } from '../models/User';
import { Society } from '../models/Society';
import { Flat } from '../models/Flat';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateTokenPair, verifyRefreshToken } from '../utils/token';
import { AppError } from '../utils/response';
import { UserRole } from '../constants';

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
      .populate('flat', 'flatNumber floor');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

export const authService = new AuthService();
