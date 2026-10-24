'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowLeft, Mail, Send, ShieldCheck, Leaf, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';

type Tab = 'login' | 'register' | 'forgot';

/**
 * Chặn open redirect: chỉ chấp nhận path nội bộ bắt đầu bằng `/` (không `//`, không scheme).
 */
function getSafeRedirectTarget(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
  return from;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from');
  const redirectTarget = getSafeRedirectTarget(rawFrom);

  const [tab, setTab] = React.useState<Tab>('login');
  const [forgotSent, setForgotSent] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleLoginSuccess = React.useCallback(() => {
    const role = useAuthStore.getState().user?.role;
    // Nếu có ?from= tường minh (khác '/'), tôn trọng nó; nếu không, admin vào /admin
    if (rawFrom && redirectTarget !== '/') {
      router.push(redirectTarget);
    } else if (role === UserRole.ADMIN) {
      router.push('/admin?tab=categories');
    } else {
      router.push(redirectTarget);
    }
  }, [rawFrom, redirectTarget, router]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'login', label: 'Đăng nhập' },
    { id: 'register', label: 'Tạo tài khoản' },
    { id: 'forgot', label: 'Khôi phục' },
  ];

  return (
    <div className="w-full max-w-[460px]">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_20px_50px_rgba(29,43,34,0.06)] backdrop-blur-md sm:p-9 dark:border-border/40 dark:bg-[#12211A]/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
      >
        {/* Modern Segmented Control Tabs */}
        <div className="relative grid grid-cols-3 gap-1 rounded-full bg-[#F3F2EC] p-1 dark:bg-muted/50">
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative z-10 rounded-full py-2 text-xs sm:text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-[#075B45] dark:text-emerald-300'
                    : 'text-[#718078] hover:text-[#1D2B22] dark:text-neutral-400 dark:hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-auth-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-xs dark:bg-[#1C3326]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' && (
            <motion.div
              key="login"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1D2B22] sm:text-[28px] dark:text-[#E8F1E8]">
                Mừng bạn trở lại!
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#718078] dark:text-neutral-400">
                Tiếp tục hành trình ẩm thực chay thanh nhẹ và đầy đủ vi chất mỗi ngày.
              </p>

              <div className="mt-6">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onForgotPassword={() => setTab('forgot')}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border/70" />
                <span className="font-medium text-[#718078] dark:text-neutral-400">
                  Hoặc tiếp tục với
                </span>
                <span className="h-px flex-1 bg-border/70" />
              </div>

              <div className="flex justify-center">
                <motion.div
                  className="w-full"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                >
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-border/80 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => toast.info('Đăng nhập Google sẽ sớm khả dụng')}
                  >
                    Google ID
                  </Button>
                </motion.div>
              </div>

              <p className="mt-6 text-center text-xs text-[#718078] dark:text-neutral-400">
                Bạn mới biết đến VeggieConnect?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-semibold text-primary hover:underline"
                >
                  Đăng ký tài khoản miễn phí
                </button>
              </p>
            </motion.div>
          )}

          {tab === 'register' && (
            <motion.div
              key="register"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1D2B22] sm:text-[28px] dark:text-[#E8F1E8]">
                Khởi tạo phong cách sống xanh
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#718078] dark:text-neutral-400">
                Tạo hồ sơ nhận ngay thực đơn thuần chay 7 ngày được cá nhân hoá theo thể trạng.
              </p>

              <div className="mt-6">
                <RegisterForm onSuccess={() => router.push(redirectTarget)} />
              </div>

              <p className="mt-6 text-center text-xs text-[#718078] dark:text-neutral-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="font-semibold text-primary hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </motion.div>
          )}

          {tab === 'forgot' && (
            <motion.div
              key="forgot"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1D2B22] sm:text-[28px] dark:text-[#E8F1E8]">
                Khôi phục mật khẩu
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#718078] dark:text-neutral-400">
                Nhập email liên kết với tài khoản VeggieConnect. Chúng tôi sẽ gửi hướng dẫn khôi
                phục bảo mật trong tích tắc.
              </p>

              {forgotSent && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"
                >
                  <p className="flex items-center gap-1.5 font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Email đã được gửi!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vui lòng kiểm tra hộp thư đến (và thư mục Spam). Liên kết có hiệu lực trong 15
                    phút.
                  </p>
                </motion.div>
              )}

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                  toast.success('Đã gửi liên kết khôi phục');
                }}
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
                  >
                    Email đã đăng ký tài khoản
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="vidu@veggieconnect.vn"
                      className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                      required
                    />
                  </div>
                </div>
                <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}>
                  <Button
                    type="submit"
                    className="h-12 w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/95"
                  >
                    <Send className="h-4 w-4" /> Gửi liên kết khôi phục
                  </Button>
                </motion.div>
              </form>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang Đăng nhập
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Security & Lifestyle Reassurance */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-[#718078] dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#287D32] dark:text-emerald-400" />
          Bảo mật dữ liệu cá nhân
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Leaf className="h-4 w-4 text-[#287D32] dark:text-emerald-400" />
          Cộng đồng thuần chay chuẩn mực
        </span>
      </div>
    </div>
  );
}
