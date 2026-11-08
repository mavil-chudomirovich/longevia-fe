'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuthStore } from '@/store/useAuthStore';

function safeTarget(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = React.useState(search.get('tab') === 'register' ? 'register' : 'login');
  const [registered, setRegistered] = React.useState(false);

  const onLogin = () => {
    const user = useAuthStore.getState().user;
    const target = safeTarget(search.get('from'));
    router.push(target !== '/' ? target : user?.profile ? '/progress' : '/onboarding');
  };

  return (
    <section className="w-full max-w-[460px] rounded-[28px] border border-border/70 bg-card/95 p-6 shadow-xl sm:p-9">
      <div className="mb-6 flex rounded-full bg-muted p-1">
        {(['login', 'register'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setRegistered(false);
            }}
            className={`min-h-11 flex-1 rounded-full text-sm font-medium ${tab === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            {value === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        ))}
      </div>

      {registered ? (
        <div className="space-y-4 py-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold">Kiểm tra email để xác minh</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản đã được tạo. Mở email xác minh rồi quay lại đăng nhập.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setTab('login');
              setRegistered(false);
            }}
          >
            Quay lại đăng nhập
          </Button>
        </div>
      ) : tab === 'login' ? (
        <>
          <h1 className="text-2xl font-bold">Mừng bạn trở lại</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Đăng nhập để theo dõi sức khỏe và dinh dưỡng.
          </p>
          <div className="mt-6">
            <LoginForm onSuccess={onLogin} />
          </div>
          <p className="mt-5 text-center text-sm">
            <Link className="text-primary hover:underline" href="/forgot-password">
              Quên mật khẩu?
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => setTab('register')}
            >
              Đăng ký
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Tạo tài khoản Longevia</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dùng email của bạn để bắt đầu theo dõi sức khỏe.
          </p>
          <div className="mt-6">
            <RegisterForm onSuccess={() => setRegistered(true)} />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => setTab('login')}
            >
              Đăng nhập
            </button>
          </p>
        </>
      )}
      <div className="mt-7 flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Dữ liệu được bảo vệ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Leaf className="h-4 w-4 text-primary" />
          Sống khỏe mỗi ngày
        </span>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="h-96 w-full max-w-[460px] animate-pulse rounded-3xl bg-muted" />}
    >
      <LoginContent />
    </Suspense>
  );
}
