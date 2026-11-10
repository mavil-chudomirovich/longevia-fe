'use client';

import * as React from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ChangePasswordForm } from '@/features/profile/components/change-password-form';
import {
  usePreferencesQuery,
  useProfileQuery,
  useUpdatePreferencesMutation,
} from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';

function ProfileContent() {
  const [tab, setTab] = React.useState<'profile' | 'security'>('profile');
  const query = useProfileQuery();
  const preferences = usePreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();
  const user = useAuthStore((state) => state.user);
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
      <p className="mt-2 text-muted-foreground">Quản lý thông tin sức khỏe và bảo mật tài khoản.</p>
      <div className="my-6 flex gap-2">
        <Button
          variant={tab === 'profile' ? 'default' : 'outline'}
          onClick={() => setTab('profile')}
        >
          Hồ sơ sức khỏe
        </Button>
        <Button
          variant={tab === 'security' ? 'default' : 'outline'}
          onClick={() => setTab('security')}
        >
          Bảo mật
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{tab === 'profile' ? 'Thông tin sức khỏe' : 'Đổi mật khẩu'}</CardTitle>
          <CardDescription>
            {tab === 'profile'
              ? 'Thông tin này giúp cá nhân hóa các gợi ý dinh dưỡng.'
              : 'Đổi mật khẩu sẽ đăng xuất mọi thiết bị, kể cả thiết bị này. Bạn cần đăng nhập lại bằng mật khẩu mới.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tab === 'profile' ? (
            query.isLoading ? (
              <p>Đang tải hồ sơ...</p>
            ) : query.isError ? (
              <div>
                <p role="alert">Không thể tải hồ sơ.</p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : (
              <ProfileForm initialProfile={query.data?.profile ?? user?.profile} />
            )
          ) : (
            <ChangePasswordForm />
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Báo cáo tuần</CardTitle>
          <CardDescription>
            Nhận email tổng kết dinh dưỡng, nhịn ăn và chuỗi ngày vào thứ Hai. Mặc định tắt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Nhận báo cáo tuần</p>
              <p className="text-xs text-muted-foreground">
                Chỉ gửi khi bạn bật và có hoạt động trong tuần.
              </p>
            </div>
            <Switch
              checked={preferences.data?.receiveWeeklyDigest ?? false}
              disabled={preferences.isLoading || updatePreferences.isPending}
              onCheckedChange={(value) => updatePreferences.mutate(value)}
              aria-label="Bật nhận báo cáo tuần"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
