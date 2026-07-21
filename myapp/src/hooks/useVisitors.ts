import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../api/visitor.api';

const QUERY_KEYS = {
  visitors: ['visitors'] as const,
  visitorsPending: ['visitors', 'pending'] as const,
  visitorHistory: ['visitors', 'history'] as const,
};

export const useMyVisitors = (params?: { page?: number; status?: string; residentId?: string }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.visitors, params],
    queryFn: () => visitorApi.getHistory(params),
  });
};

export const useSocietyPendingVisitors = () => {
  return useQuery({
    queryKey: ['visitors', 'society', 'pending'] as const,
    queryFn: () => visitorApi.getSocietyPending(),
    staleTime: 1000 * 60 * 2,
  });
};

export const useInsideVisitors = () => {
  return useQuery({
    queryKey: ['visitors', 'society', 'inside'] as const,
    queryFn: () => visitorApi.getInside(),
    staleTime: 1000 * 60 * 2,
  });
};

export const useVisitorStats = () => {
  return useQuery({
    queryKey: ['visitors', 'stats'] as const,
    queryFn: () => visitorApi.getStats(),
    staleTime: 1000 * 60 * 2,
  });
};

export const usePendingVisitors = () => {
  return useQuery({
    queryKey: QUERY_KEYS.visitorsPending,
    queryFn: () => visitorApi.getPending(),
    staleTime: 1000 * 60 * 2,
  });
};

export const useApproveVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitorsPending });
    },
  });
};

export const useRejectVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => visitorApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitorsPending });
    },
  });
};

export const useDeleteVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitorsPending });
    },
  });
};

export const useCreateVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      visitorName: string;
      visitorPhone: string;
      purpose: string;
      type: string;
      flatId: string;
      residentId: string;
      vehicleNumber?: string;
      expectedCount?: number;
      notes?: string;
    }) => visitorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
    },
  });
};

export const usePreApproveVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      visitorName: string;
      visitorPhone: string;
      purpose: string;
      type: string;
      flatId: string;
      vehicleNumber?: string;
      validUntil?: string;
      expectedCount?: number;
    }) => visitorApi.preApprove(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
    },
  });
};

export const useMarkVisitorEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorApi.markEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
    },
  });
};

export const useMarkVisitorExit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorApi.markExit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitors });
    },
  });
};
