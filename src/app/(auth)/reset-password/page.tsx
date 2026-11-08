'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/features/auth/api/auth.api';
import { passwordSchema } from '@/features/auth/schemas/auth.schema';
import { getApiErrorCode } from '@/lib/api-error';

function ResetContent() {
  const search = useSearchParams();
  const [token, setToken] = React.useState(search.get('token') ?? '');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      setError('Mã đặt lại phải gồm 64 ký tự hex.');
      return;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.issues[0]?.message ?? 'Mật khẩu chưa đáp ứng yêu cầu.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setPending(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setMessage('Mật khẩu đã được đặt lại. Bạn có thể đăng nhập.');
    } catch (reason) {
      setError(
        getApiErrorCode(reason) === 'identity.invalid_password_reset_token'
          ? 'Mã không hợp lệ, đã hết hạn hoặc đã được sử dụng.'
          : 'Không thể đặt lại mật khẩu. Kiểm tra yêu cầu mật khẩu rồi thử lại.'
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-lg">
      <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dán mã 64 ký tự hex trong email và chọn mật khẩu mới.
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-token">Mã đặt lại</Label>
          <Input
            id="reset-token"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-primary">
            {message}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="h-72 w-full max-w-lg animate-pulse rounded-3xl bg-muted" />}
    >
      <ResetContent />
    </Suspense>
  );
}
