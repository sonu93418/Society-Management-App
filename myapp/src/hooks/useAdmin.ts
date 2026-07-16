import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/community.api';

const QUERY_KEYS = {
  adminDashboard: ['admin', 'dashboard'] as const,
  towers: ['towers'] as const,
  flats: ['flats'] as const,
  residents: ['residents'] as const,
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: QUERY_KEYS.adminDashboard,
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 15000, // refresh stats every 15s
  });
};

export const useTowers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.towers,
    queryFn: () => adminApi.getTowers(),
  });
};

export const useCreateTower = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; totalFloors: number }) => adminApi.createTower(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.towers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
    },
  });
};

export const useDeleteTower = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTower(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.towers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
    },
  });
};

export const useFlats = (params?: { towerId?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.flats, params],
    queryFn: () => adminApi.getFlats(params),
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
};

export const useCreateFlat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { flatNumber: string; floor: number; towerId: string; type?: string }) => adminApi.createFlat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
    },
  });
};

export const useDeleteFlat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteFlat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
    },
  });
};

export const useResidents = (params?: { page?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.residents, params],
    queryFn: () => adminApi.getResidents(params),
  });
};

export const useSearchResidents = (query: string) => {
  return useQuery({
    queryKey: ['residents', 'search', query] as const,
    queryFn: () => adminApi.searchResidents(query),
    enabled: query.trim().length >= 2,
  });
};

export const useAssignFlatToResident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { residentId: string; flatId: string }) =>
      adminApi.assignFlatToResident(data.residentId, data.flatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.residents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
    },
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone: string; category: string; workingHours?: string; description?: string }) =>
      adminApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};
