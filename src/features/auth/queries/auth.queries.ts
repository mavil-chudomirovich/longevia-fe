import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, type LoginPayload } from '../api/auth.api';
import type { RegisterFormValues } from '../schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';
import { clearAccessToken, setAccessToken } from '@/lib/auth-token';

export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  me: () => [...AUTH_QUERY_KEYS.all, 'me'] as const,
};

export const useCurrentUserQuery = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me(),
    queryFn: async () => {
      const user = await authApi.getMe();
      if (user.id) setUser(user);
      return user;
    },
    enabled: Boolean(token),
  });
};

export const useRegisterMutation = () => {
  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) => authApi.register(values),
  });
  return {
    ...mutation,
    mutateAsync: async (values: RegisterFormValues) => {
      const user = await mutation.mutateAsync(values);
      toast.success('Tài khoản đã tạo. Hãy kiểm tra email để xác minh địa chỉ của bạn.');
      return user;
    },
  };
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const session = await authApi.login(payload);
      setAccessToken(session.accessToken);
      try {
        return { session, user: await authApi.getMe() };
      } catch (error) {
        clearAccessToken();
        throw error;
      }
    },
    onSuccess: ({ session, user }) => {
      setSession(session.accessToken, user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), user);
      toast.success('Đăng nhập thành công!');
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success('Đã đăng xuất');
    },
  });
};
