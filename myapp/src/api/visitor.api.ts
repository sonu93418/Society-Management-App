import { apiClient } from './client';
import type { ApiResponse, VisitorRequest, VisitorStats } from '../types/models';

export const visitorApi = {
  // Guard: create visitor request
  create: async (data: {
    visitorName: string;
    visitorPhone: string;
    purpose: string;
    type: string;
    flatId: string;
    residentId: string;
    vehicleNumber?: string;
    expectedCount?: number;
    notes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<VisitorRequest>>('/visitors', data);
    return res.data;
  },

  // Resident: pre-approve guest
  preApprove: async (data: {
    visitorName: string;
    visitorPhone: string;
    purpose: string;
    type: string;
    flatId: string;
    vehicleNumber?: string;
    validUntil?: string;
    expectedCount?: number;
  }) => {
    const res = await apiClient.post<ApiResponse<VisitorRequest>>('/visitors/pre-approve', data);
    return res.data;
  },

  // Resident: approve visitor
  approve: async (id: string) => {
    const res = await apiClient.put<ApiResponse<VisitorRequest>>(`/visitors/${id}/approve`);
    return res.data;
  },

  // Resident: reject visitor
  reject: async (id: string, reason?: string) => {
    const res = await apiClient.put<ApiResponse<VisitorRequest>>(`/visitors/${id}/reject`, { reason });
    return res.data;
  },

  // Guard: mark entry
  markEntry: async (id: string) => {
    const res = await apiClient.put<ApiResponse<VisitorRequest>>(`/visitors/${id}/entry`);
    return res.data;
  },

  // Guard: mark exit
  markExit: async (id: string) => {
    const res = await apiClient.put<ApiResponse<VisitorRequest>>(`/visitors/${id}/exit`);
    return res.data;
  },

  // Resident: get pending requests
  getPending: async () => {
    const res = await apiClient.get<ApiResponse<VisitorRequest[]>>('/visitors/pending');
    return res.data;
  },

  // Guard/Admin: get society pending
  getSocietyPending: async () => {
    const res = await apiClient.get<ApiResponse<VisitorRequest[]>>('/visitors/society/pending');
    return res.data;
  },

  // Guard/Admin: get inside visitors
  getInside: async () => {
    const res = await apiClient.get<ApiResponse<VisitorRequest[]>>('/visitors/society/inside');
    return res.data;
  },

  // All: get visitor history
  getHistory: async (params?: { page?: number; status?: string; residentId?: string }) => {
    const res = await apiClient.get<ApiResponse<{ visitors: VisitorRequest[]; pagination: any }>>('/visitors/history', { params });
    return res.data;
  },

  // Guard/Admin: get stats
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<VisitorStats>>('/visitors/stats');
    return res.data;
  },

  // Delete visitor request
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<VisitorRequest>>(`/visitors/${id}`);
    return res.data;
  },
};
