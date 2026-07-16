import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noticeApi, pollApi, ticketApi, amenityApi, paymentApi, staffApi, guardApi, notificationApi } from '../api/community.api';

const QUERY_KEYS = {
  notices: ['notices'] as const,
  polls: ['polls'] as const,
  tickets: ['tickets'] as const,
  amenities: ['amenities'] as const,
  payments: ['payments'] as const,
};

// --- Notices ---
export const useNotices = (params?: { page?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.notices, params],
    queryFn: () => noticeApi.getAll(params),
  });
};

// --- Polls ---
export const usePolls = () => {
  return useQuery({
    queryKey: QUERY_KEYS.polls,
    queryFn: () => pollApi.getAll(),
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { pollId: string; optionIndex: number }) =>
      pollApi.vote(data.pollId, data.optionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.polls });
    },
  });
};

// --- Helpdesk Tickets ---
export const useMyTickets = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.tickets, params],
    queryFn: () => ticketApi.getAll({ mine: 'true', ...params }),
  });
};

export const useAllTickets = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.tickets, 'all', params],
    queryFn: () => ticketApi.getAll(params),
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category: string;
      priority?: string;
      flatId: string;
      images?: string[];
    }) => ticketApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets });
    },
  });
};

export const useTicketDetails = (id: string) => {
  return useQuery({
    queryKey: ['ticket', id] as const,
    queryFn: () => ticketApi.getById(id),
    enabled: !!id,
  });
};

export const useAddTicketReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ticketId: string; message: string; images?: string[] }) =>
      ticketApi.addReply(data.ticketId, data.message, data.images),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ticketId: string; status: string }) =>
      ticketApi.updateStatus(data.ticketId, data.status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets });
    },
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; isPinned?: boolean }) => noticeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notices });
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notices });
    },
  });
};

export const useCreatePoll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; options: string[]; endDate: string }) => pollApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.polls });
    },
  });
};

// --- Amenities ---
export const useAmenities = () => {
  return useQuery({
    queryKey: QUERY_KEYS.amenities,
    queryFn: () => amenityApi.getAll(),
  });
};

export const useBookAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      amenityId: string;
      date: string;
      startTime: string;
      endTime: string;
      numberOfPeople?: number;
      notes?: string;
    }) => amenityApi.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.amenities });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useBookings = (params?: { mine?: string; status?: string }) => {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => amenityApi.getBookings(params),
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bookingId: string; reason?: string }) =>
      amenityApi.cancelBooking(data.bookingId, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

// --- Payments ---
export const usePayments = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.payments, params],
    queryFn: () => paymentApi.getAll({ mine: 'true', ...params }),
  });
};

export const usePayDues = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { paymentId: string; transactionId?: string }) =>
      paymentApi.markPaid(data.paymentId, data.transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments });
    },
  });
};

// --- Staff Directory ---
export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'] as const,
    queryFn: () => staffApi.getStaff(),
  });
};

export const useGuardSearchResidents = (query: string) => {
   return useQuery({
     queryKey: ['residents', 'search', query] as const,
     queryFn: () => guardApi.searchResidents(query),
     enabled: query.trim().length >= 2,
   });
 };

// --- Notifications ---
export const useNotifications = (params?: { page?: number }) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getAll(params),
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

