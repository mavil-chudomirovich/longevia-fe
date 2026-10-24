import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginPayload } from '../api/auth.api';
import type { RegisterFormValues } from '../schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  me: () => [...AUTH_QUERY_KEYS.all, 'me'] as const,
};

export const useCurrentUserQuery = () => {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me(),
    queryFn: async () => {
      const user = await authApi.getMe();
      // Bỏ qua user rỗng để không ghi đè session hợp lệ bằng dữ liệu rỗng.
      if (user.id) setUser(user);
      return user;
    },
    enabled: !!token,
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (values: RegisterFormValues) => authApi.register(values),
    onSuccess: (session) => {
      if (!session.accessToken) return;
      setSession(session.accessToken, session.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), session.user);
      toast.success('Đăng ký thành công! Chào mừng bạn đến với ChayXanh.');
    },
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (session) => {
      if (!session.accessToken) return;
      setSession(session.accessToken, session.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), session.user);
      toast.success('Đăng nhập thành công!');
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: (opts?: { allDevices?: boolean }) => authApi.logout(opts),
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success('Đã đăng xuất');
    },
  });
};
