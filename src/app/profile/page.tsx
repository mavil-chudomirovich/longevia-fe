'use client';

import * as React from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ChangePasswordForm } from '@/features/profile/components/change-password-form';
import { EmailChangeDialog } from '@/features/profile/components/email-change-dialog';
import {
  usePreferencesQuery,
  useProfileQuery,
  useUpdateNameMutation,
  useUpdatePreferencesMutation,
} from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserModel } from '@/features/auth/types/auth.model';

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

      <AccountCard key={`${user?.id ?? 'anonymous'}:${user?.fullName ?? ''}`} user={user} />

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

function AccountCard({ user }: { user: UserModel | null }) {
  const updateName = useUpdateNameMutation();
  const [fullNameDraft, setFullNameDraft] = React.useState(user?.fullName ?? '');
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const trimmedName = fullNameDraft.trim();
  const canSaveName =
    trimmedName.length > 0 &&
    trimmedName !== (user?.fullName ?? '').trim() &&
    !updateName.isPending;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tài khoản</CardTitle>
        <CardDescription>Đổi họ tên hiển thị và email đăng nhập của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSaveName) return;
            void updateName.mutateAsync(trimmedName).catch(() => undefined);
          }}
        >
          <label htmlFor="account-full-name" className="text-muted-foreground">
            Họ và tên
          </label>
          <Input
            id="account-full-name"
            value={fullNameDraft}
            maxLength={100}
            onChange={(event) => setFullNameDraft(event.target.value)}
            autoComplete="name"
          />
          {trimmedName.length === 0 && (
            <p className="text-xs text-destructive">Họ tên không được để trống.</p>
          )}
          <Button type="submit" variant="outline" className="sm:w-auto" disabled={!canSaveName}>
            {updateName.isPending ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </form>
        <div className="space-y-2">
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium break-all">{user?.email || 'Chưa cập nhật'}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
            disabled={!user?.email}
          >
            Đổi email
          </Button>
          <p className="text-xs text-muted-foreground">
            Link xác nhận gửi tới email mới; địa chỉ cũ chỉ bị thay sau khi bạn bấm link.{' '}
            <Link href="/confirm-email-change" className="text-primary hover:underline">
              Đã có mã xác nhận?
            </Link>
          </p>
        </div>
      </CardContent>
      <EmailChangeDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={user?.email ?? ''}
      />
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
