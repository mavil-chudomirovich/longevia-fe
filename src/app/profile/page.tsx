'use client';

import * as React from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ChangePasswordForm } from '@/features/profile/components/change-password-form';
import { useProfileQuery } from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';

function ProfileContent() {
  const [tab, setTab] = React.useState<'profile' | 'security'>('profile');
  const query = useProfileQuery();
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
              : 'Đổi mật khẩu sẽ thu hồi các phiên đăng nhập khác.'}
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
