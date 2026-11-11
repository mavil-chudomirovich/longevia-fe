'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api/auth.api';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification';

function VerifyContent() {
  const token = useSearchParams().get('token') ?? '';
  const attempted = React.useRef('');
  const [verification, setVerification] = React.useState<{
    token: string;
    state: 'success' | 'error';
  } | null>(null);
  React.useEffect(() => {
    if (!token) return;
    if (attempted.current === token) return;
    attempted.current = token;
    void authApi
      .verifyEmail(token)
      .then(() => setVerification({ token, state: 'success' }))
      .catch(() => setVerification({ token, state: 'error' }));
  }, [token]);
  const state = !token ? 'error' : verification?.token === token ? verification.state : 'loading';
  return (
    <section className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-lg">
      <h1 className="text-2xl font-bold">
        {state === 'loading'
          ? 'Đang xác minh email…'
          : state === 'success'
            ? 'Email đã được xác minh'
            : 'Không thể xác minh email'}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {state === 'success'
          ? 'Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập.'
          : state === 'error'
            ? 'Liên kết có thể đã hết hạn hoặc đã được sử dụng. Bạn nhập email bên dưới để nhận liên kết mới, hoặc đăng nhập nếu tài khoản đã kích hoạt.'
            : 'Vui lòng đợi trong giây lát.'}
      </p>
      {state === 'error' && (
        <div className="mt-5">
          <ResendVerificationForm />
        </div>
      )}
      {(state === 'success' || state === 'error') && (
        <Button asChild className="mt-6">
          <Link href="/login">Đăng nhập</Link>
        </Button>
      )}
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="h-60 w-full max-w-lg animate-pulse rounded-3xl bg-muted" />}
    >
      <VerifyContent />
    </Suspense>
  );
}
