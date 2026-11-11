'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/features/auth/api/auth.api';
import { passwordSchema } from '@/features/auth/schemas/auth.schema';
import { getApiErrorMessage } from '@/lib/api-error';

function ResetContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [token, setToken] = React.useState(search.get('token') ?? '');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);

  React.useEffect(() => {
    if (!succeeded) return;
    const timer = setTimeout(() => router.replace('/login?reset=success'), 2000);
    return () => clearTimeout(timer);
  }, [succeeded, router]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      setError(
        'Mã xác nhận chưa đúng. Bạn hãy sao chép nguyên mã trong email (gồm 64 ký tự chữ và số).'
      );
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
      setMessage(
        'Mật khẩu đã được đặt lại. Longevia sẽ chuyển bạn sang trang đăng nhập trong giây lát.'
      );
      setSucceeded(true);
    } catch (reason) {
      setError(
        getApiErrorMessage(
          reason,
          'Chưa đặt lại được mật khẩu. Bạn kiểm tra yêu cầu mật khẩu rồi thử lại nhé.'
        )
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-lg">
      <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dán mã xác nhận Longevia vừa gửi vào email của bạn, rồi chọn mật khẩu mới.
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
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              className="pr-12"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
