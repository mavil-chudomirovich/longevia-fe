'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginMutation } from '../queries/auth.queries';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';

/**
 * Form đăng nhập email/mật khẩu. Lỗi nghiệp vụ đọc theo `error.code`:
 * - `INVALID_CREDENTIALS` → inline "Email hoặc mật khẩu không đúng."
 * - `ACCOUNT_LOCKED` / `ACCOUNT_BANNED` → thông báo lỗi đăng nhập thất bại chung
 *   (không CAPTCHA, không đếm ngược — Clarifications spec 2026-09-15).
 */
export function LoginForm({
  onSuccess,
  onForgotPassword,
}: {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}) {
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(values);
      onSuccess?.();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'INVALID_CREDENTIALS') {
        setFormError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
        return;
      }
      if (code === 'ACCOUNT_LOCKED' || code === 'ACCOUNT_BANNED') {
        setFormError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const field = key as keyof LoginFormValues;
            if (field in form.getValues()) {
              const first = Array.isArray(messages) ? messages[0] : messages;
              form.setError(field, {
                message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
              });
              mapped = true;
            }
          }
        }
        if (mapped) return;
      }
      setFormError('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="login-email"
          className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
        >
          Email hoặc Tên đăng nhập
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vidu@veggieconnect.vn"
            className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Mật khẩu
          </Label>
          <button
            type="button"
            onClick={() => onForgotPassword?.()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 rounded-xl px-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            {...form.register('password')}
          />
          <button
            type="button"
            aria-label="Hiện/ẩn mật khẩu"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-12 w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/95 active:scale-[0.99] transition-all shadow-xs"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập'}
        <LogIn className="h-4 w-4" />
      </Button>
    </form>
  );
}
