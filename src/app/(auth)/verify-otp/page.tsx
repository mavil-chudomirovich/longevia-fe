'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  MailCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OtpVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'chayxanh.user@gmail.com';
  const shouldReduceMotion = useReducedMotion();

  const [otp, setOtp] = React.useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState<number>(60);
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược 60 giây để gửi lại OTP
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    setIsError(false);
    // Chỉ chấp nhận chữ số
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    if (cleanVal.length > 1) {
      // Xử lý khi dán (paste) nhiều số
      const pastedDigits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    setIsError(false);
    inputRefs.current[0]?.focus();
    toast.success('Mã OTP mới đã được gửi tới email của bạn!');
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setIsError(true);
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      toast.success('Xác thực tài khoản thành công!');
      setTimeout(() => {
        router.push('/onboarding');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-md">
          <CardHeader className="pb-4 text-center">
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              {isSuccess ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                >
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </motion.div>
              ) : (
                <MailCheck className="h-7 w-7" />
              )}
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Xác thực tài khoản
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Mã OTP gồm 6 chữ số đã được gửi đến email
              <br />
              <span className="font-semibold text-foreground">{emailParam}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP input boxes with error shake */}
            <motion.div
              animate={isError && !shouldReduceMotion ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-2 sm:gap-3"
            >
              {otp.map((digit, idx) => {
                const isFilled = Boolean(digit);
                return (
                  <motion.div
                    key={idx}
                    whileFocus={shouldReduceMotion ? undefined : { scale: 1.05 }}
                    animate={
                      isFilled && !shouldReduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }
                    }
                    transition={{ duration: 0.18 }}
                  >
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      disabled={isVerifying || isSuccess}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="h-12 w-11 rounded-xl border border-input bg-background text-center text-xl font-bold text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 sm:h-14 sm:w-12"
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Countdown & Resend */}
            <div className="text-center text-sm">
              {countdown > 0 ? (
                <p className="text-muted-foreground">
                  Gửi lại mã sau:{' '}
                  <span className="inline-flex items-center justify-center font-semibold text-primary">
                    {countdown}s
                  </span>
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  className="gap-1.5 font-medium text-primary hover:text-primary/90"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Gửi lại mã OTP
                </Button>
              )}
            </div>

            {/* Security alert */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia
                  sẻ mã này cho bất kỳ ai để bảo vệ tài khoản ChayXanh của bạn.
                </p>
              </div>
            </div>

            {/* Action button */}
            <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
              <Button
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-md"
                disabled={isVerifying || isSuccess || otp.join('').length < 6}
                onClick={handleVerify}
              >
                {isVerifying ? (
                  'Đang xác thực...'
                ) : isSuccess ? (
                  <>
                    Thành công <CheckCircle2 className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Xác thực & Tiếp tục <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Back link */}
            <div className="pt-1 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
