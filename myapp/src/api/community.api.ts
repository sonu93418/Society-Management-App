import { apiClient } from './client';
import type { ApiResponse, HelpdeskTicket, TicketReply, Notice, Poll, Amenity, Booking, Payment, Notification as NotifType, Staff, AdminDashboardStats, Tower, Flat, User } from '../types/models';

// ========== TICKETS ==========
export const ticketApi = {
  create: async (data: { title: string; description: string; category: string; priority?: string; flatId: string; images?: string[] }) => {
    const res = await apiClient.post<ApiResponse<HelpdeskTicket>>('/community/tickets', data);
    return res.data;
  },
  getAll: async (params?: { mine?: string; status?: string; page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ tickets: HelpdeskTicket[]; pagination: any }>>('/community/tickets', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ ticket: HelpdeskTicket; replies: TicketReply[] }>>(`/community/tickets/${id}`);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.put<ApiResponse<HelpdeskTicket>>(`/community/tickets/${id}/status`, { status });
    return res.data;
  },
  addReply: async (id: string, message: string, images?: string[]) => {
    const res = await apiClient.post<ApiResponse<TicketReply>>(`/community/tickets/${id}/reply`, { message, images });
    return res.data;
  },
};

// ========== NOTICES ==========
export const noticeApi = {
  create: async (data: { title: string; content: string; attachments?: string[]; isPinned?: boolean }) => {
    const res = await apiClient.post<ApiResponse<Notice>>('/community/notices', data);
    return res.data;
  },
  getAll: async (params?: { page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ notices: Notice[]; pagination: any }>>('/community/notices', { params });
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.put<ApiResponse>(`/community/notices/${id}/read`);
    return res.data;
  },
};

// ========== POLLS ==========
export const pollApi = {
  create: async (data: { title: string; description?: string; options: string[]; isAnonymous?: boolean; endDate: string }) => {
    const res = await apiClient.post<ApiResponse<Poll>>('/community/polls', data);
    return res.data;
  },
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Poll[]>>('/community/polls');
    return res.data;
  },
  vote: async (id: string, optionIndex: number) => {
    const res = await apiClient.post<ApiResponse<Poll>>(`/community/polls/${id}/vote`, { optionIndex });
    return res.data;
  },
};

// ========== AMENITIES ==========
export const amenityApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Amenity[]>>('/community/amenities');
    return res.data;
  },
  createBooking: async (data: { amenityId: string; date: string; startTime: string; endTime: string; numberOfPeople?: number; notes?: string }) => {
    const res = await apiClient.post<ApiResponse<Booking>>('/community/bookings', data);
    return res.data;
  },
  getBookings: async (params?: { mine?: string; status?: string; page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ bookings: Booking[]; pagination: any }>>('/community/bookings', { params });
    return res.data;
  },
  cancelBooking: async (id: string, reason?: string) => {
    const res = await apiClient.put<ApiResponse<Booking>>(`/community/bookings/${id}/cancel`, { reason });
    return res.data;
  },
};

// ========== PAYMENTS ==========
export const paymentApi = {
  getAll: async (params?: { mine?: string; status?: string; page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ payments: Payment[]; pagination: any }>>('/community/payments', { params });
    return res.data;
  },
  markPaid: async (id: string, transactionId?: string) => {
    const res = await apiClient.put<ApiResponse<Payment>>(`/community/payments/${id}/pay`, { transactionId });
    return res.data;
  },
};

// ========== NOTIFICATIONS ==========
export const notificationApi = {
  getAll: async (params?: { page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ notifications: NotifType[]; unreadCount: number; pagination: any }>>('/community/notifications', { params });
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.put<ApiResponse>(`/community/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.put<ApiResponse>('/community/notifications/read-all');
    return res.data;
  },
};

// ========== STAFF ==========
export const staffApi = {
  getStaff: async () => {
    const res = await apiClient.get<ApiResponse<Staff[]>>('/community/staff');
    return res.data;
  },
};

// ========== ADMIN ==========
export const adminApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
    return res.data;
  },
  getTowers: async () => {
    const res = await apiClient.get<ApiResponse<Tower[]>>('/admin/towers');
    return res.data;
  },
  createTower: async (data: { name: string; totalFloors: number }) => {
    const res = await apiClient.post<ApiResponse<Tower>>('/admin/towers', data);
    return res.data;
  },
  deleteTower: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<Tower>>(`/admin/towers/${id}`);
    return res.data;
  },
  getFlats: async (params?: { towerId?: string }) => {
    const res = await apiClient.get<ApiResponse<Flat[]>>('/admin/flats', { params });
    return res.data;
  },
  createFlat: async (data: { flatNumber: string; floor: number; towerId: string; type?: string }) => {
    const res = await apiClient.post<ApiResponse<Flat>>('/admin/flats', data);
    return res.data;
  },
  deleteFlat: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<Flat>>(`/admin/flats/${id}`);
    return res.data;
  },
  getResidents: async (params?: { page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ residents: User[]; pagination: any }>>('/admin/residents', { params });
    return res.data;
  },
  searchResidents: async (q: string) => {
    const res = await apiClient.get<ApiResponse<User[]>>('/admin/residents/search', { params: { q } });
    return res.data;
  },
  getStaff: async () => {
    const res = await apiClient.get<ApiResponse<Staff[]>>('/admin/staff');
    return res.data;
  },
  createStaff: async (data: { name: string; phone: string; category: string; workingHours?: string; description?: string }) => {
    const res = await apiClient.post<ApiResponse<Staff>>('/admin/staff', data);
    return res.data;
  },
};

// Guard search
export const guardApi = {
  searchResidents: async (q: string) => {
    const res = await apiClient.get<ApiResponse<User[]>>('/guard/search-residents', { params: { q } });
    return res.data;
  },
};
