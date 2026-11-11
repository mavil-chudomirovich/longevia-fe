'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/features/auth/api/auth.api';
import { forceLogout } from '@/lib/auth-refresh';
import { getApiErrorMessage } from '@/lib/api-error';

function ConfirmEmailChangeContent() {
  const search = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const [token, setToken] = React.useState(search.get('token') ?? '');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      setError(
        'Mã xác nhận chưa đúng. Bạn hãy sao chép nguyên mã trong email (gồm 64 ký tự chữ và số).'
      );
      return;
    }
    setPending(true);
    try {
      await authApi.confirmEmailChange(token);
      setSucceeded(true);
      // BE thu hồi mọi refresh token sau khi đổi email, nên phiên hiện tại phải đăng
      // xuất và đăng nhập lại bằng địa chỉ mới.
      await forceLogout();
      client.clear();
      router.replace('/login?email-changed=success');
    } catch (reason) {
      setError(
        getApiErrorMessage(
          reason,
          'Chưa xác nhận được đổi email. Link có thể đã hết hạn; bạn yêu cầu lại trong Hồ sơ nhé.'
        )
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-bold">Xác nhận đổi email</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Bấm xác nhận để dùng địa chỉ email mới khi đăng nhập Longevia. Sau khi đổi, bạn cần đăng
        nhập lại bằng email mới.
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-change-token">Mã xác nhận trong email</Label>
          <Input
            id="email-change-token"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="one-time-code"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {succeeded && (
          <p role="status" className="text-sm text-primary">
            Đã đổi email. Longevia sẽ chuyển bạn sang trang đăng nhập trong giây lát.
          </p>
        )}
        <Button type="submit" disabled={pending || succeeded}>
          {pending ? 'Đang xác nhận…' : 'Xác nhận đổi email'}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </section>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense
      fallback={<div className="h-72 w-full max-w-lg animate-pulse rounded-3xl bg-muted" />}
    >
      <ConfirmEmailChangeContent />
    </Suspense>
  );
}
