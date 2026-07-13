import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { LoginRequest, RegisterRequest } from '../api/auth.api';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
      }
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
      }
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
};
