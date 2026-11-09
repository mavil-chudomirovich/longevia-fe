import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { forceLogout } from '@/lib/auth-refresh';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';
import type { ProfileFormValues } from '../schemas/profile.schema';
import { profileApi } from '../api/profile.api';

export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
  me: (userId: string) => [...profileKeys.user(userId), 'me'] as const,
  preferences: (userId: string) => [...profileKeys.user(userId), 'preferences'] as const,
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
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
    onSuccess: async () => {
      // BE thu hồi MỌI refresh token của user (kể cả thiết bị này), nên phiên hiện tại
      // sẽ không gia hạn được nữa -> đăng xuất ngay và yêu cầu đăng nhập lại.
      toast.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.');
      await forceLogout();
      client.clear();
      router.replace('/login');
    },
  });
}

export function usePreferencesQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useQuery({
    queryKey: profileKeys.preferences(userId),
    queryFn: () => profileApi.getPreferences(),
    enabled: Boolean(userId),
  });
}

export function useUpdatePreferencesMutation() {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useMutation({
    mutationFn: (receiveWeeklyDigest: boolean) => profileApi.updatePreferences(receiveWeeklyDigest),
    onSuccess: (data) => {
      client.setQueryData(profileKeys.preferences(userId), data);
      toast.success(data.receiveWeeklyDigest ? 'Đã bật báo cáo tuần.' : 'Đã tắt báo cáo tuần.');
    },
  });
}
