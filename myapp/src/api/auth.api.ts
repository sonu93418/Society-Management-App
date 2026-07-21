import { apiClient } from './client';
import type { ApiResponse, User } from '../types/models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  societyId: string;
  flatId?: string;
  registrationCode?: string;
}

export interface OnboardingRequest {
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
  adminPassword: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data;
  },

  googleLogin: async (idToken: string) => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google-login', { idToken });
    return res.data;
  },

  register: async (data: RegisterRequest) => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
  },

  refreshToken: async (refreshToken: string) => {
    const res = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', { refreshToken });
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post<ApiResponse>('/auth/logout');
    return res.data;
  },

  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return res.data;
  },

  updatePushToken: async (pushToken: string | null) => {
    const res = await apiClient.put<ApiResponse>('/auth/push-token', { pushToken });
    return res.data;
  },

  registerDevice: async (token: string, tokenType: 'fcm' | 'expo', deviceType: string) => {
    const res = await apiClient.post<ApiResponse>('/auth/register-device', { token, tokenType, deviceType });
    return res.data;
  },

  updateNotificationPreferences: async (preferences: Record<string, boolean>) => {
    const res = await apiClient.put<ApiResponse>('/auth/notification-preferences', preferences);
    return res.data;
  },

  forgotPassword: async (email: string, phone: string) => {
    const res = await apiClient.post<ApiResponse<{ resetToken: string }>>('/auth/forgot-password', { email, phone });
    return res.data;
  },

  resetPassword: async (email: string, resetToken: string, newPassword: string) => {
    const res = await apiClient.post<ApiResponse>('/auth/reset-password', { email, resetToken, newPassword });
    return res.data;
  },

  assignFlat: async (flatId: string) => {
    const res = await apiClient.put<ApiResponse<User>>('/auth/assign-flat', { flatId });
    return res.data;
  },

  submitOnboardingRequest: async (data: OnboardingRequest) => {
    const res = await apiClient.post<ApiResponse<{ id: string; societyName: string; adminEmail: string; status: string }>>('/auth/onboarding-request', data);
    return res.data;
  },

  getSocieties: async () => {
    const res = await apiClient.get<ApiResponse<Array<{ _id: string; name: string; address: string; city: string; state: string; pincode: string }>>>('/auth/societies');
    return res.data;
  },
};
