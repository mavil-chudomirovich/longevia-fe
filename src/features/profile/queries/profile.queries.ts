import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';
import type { ProfileFormValues } from '../schemas/profile.schema';
import { profileApi } from '../api/profile.api';

export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
  me: (userId: string) => [...profileKeys.user(userId), 'me'] as const,
};

export function useProfileQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  const setUser = useAuthStore((state) => state.setUser);
  return useQuery({
    queryKey: profileKeys.me(userId ?? ''),
    queryFn: async () => {
      const user = await authApi.getMe();
      setUser(user);
      return user;
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateProfileMutation() {
  const client = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useMutation({
    mutationFn: (values: ProfileFormValues) => profileApi.update(values),
    onSuccess: (user) => {
      setUser(user);
      client.setQueryData(AUTH_QUERY_KEYS.me(), user);
      client.setQueryData(profileKeys.me(userId), user);
      void client.invalidateQueries({ queryKey: ['diet', userId] });
      void client.invalidateQueries({ queryKey: ['progress', userId] });
      toast.success('Đã lưu hồ sơ sức khỏe.');
    },
  });
}

export function useChangePasswordMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me() });
      toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị thu hồi.');
    },
  });
}
