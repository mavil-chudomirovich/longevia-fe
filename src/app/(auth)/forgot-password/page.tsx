'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/features/auth/api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Không thể gửi yêu cầu lúc này. Vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-lg">
      <h1 className="text-2xl font-bold">Khôi phục mật khẩu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nhập email tài khoản. Nếu địa chỉ tồn tại, mã đặt lại sẽ được gửi tới hộp thư.
      </p>
      {sent ? (
        <div className="mt-6 space-y-4">
          <p role="status" className="rounded-lg bg-primary/10 p-4 text-sm">
            Nếu email tồn tại, mã đặt lại đã được gửi. Hãy kiểm tra hộp thư và nhập mã ở trang tiếp
            theo.
          </p>
          <Button asChild>
            <Link href="/reset-password">Nhập mã đặt lại</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Đang gửi…' : 'Gửi mã đặt lại'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </section>
  );
}
