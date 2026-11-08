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
import { getApiErrorCode, getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';

/**
 * Form đăng nhập email/mật khẩu. Lỗi nghiệp vụ đọc theo `error.code`:
 * - `identity.invalid_credentials` → inline message (including unverified email).
 * - `identity.user_suspended` → account is suspended.
 *   (không CAPTCHA, không đếm ngược — Clarifications spec 2026-09-15).
 */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
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
      if (code === 'identity.invalid_credentials' || code === 'identity.user_suspended') {
        setFormError(getApiErrorMessage(error));
        return;
      }
      if (code === 'identity.validation_failed') {
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
      setFormError(
        getApiErrorMessage(
          error,
          'Chưa đăng nhập được. Bạn kiểm tra lại thông tin rồi thử lại nhé.'
        )
      );
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
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vidu@longevia.vn"
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
