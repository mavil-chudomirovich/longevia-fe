'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterMutation } from '../queries/auth.queries';
import { registerSchema, type RegisterFormValues } from '../schemas/auth.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { ContributorRequestFields } from './contributor-request-fields';

function PasswordStrength({ value }: { value: string }) {
  const rules = [
    { label: 'Từ 8 ký tự', ok: value.length >= 8 },
    { label: '1 chữ HOA', ok: /[A-Z]/.test(value) },
    { label: '1 số (0-9)', ok: /[0-9]/.test(value) },
  ];
  const score = rules.filter((r) => r.ok).length;
  const label = !value
    ? 'Chưa nhập'
    : ['Rất yếu', 'Rất yếu', 'Trung bình', 'Khá mạnh', 'An toàn'][score];
  const barColor = ['bg-muted', 'bg-destructive', 'bg-cta', 'bg-sprout', 'bg-primary'][score];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Độ an toàn mật khẩu:</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i < score ? barColor : 'bg-muted')}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {rules.map((r) => (
          <span
            key={r.label}
            className={cn('inline-flex items-center gap-1', r.ok && 'text-primary')}
          >
            {r.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Form đăng ký tài khoản Member. Gọi API thật và tự đăng nhập sau khi thành công.
 * Lỗi nghiệp vụ đọc theo `error.code` (không branch theo text).
 */
export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const registerMutation = useRegisterMutation();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      wantsContributor: false,
    },
  });

  const passwordValue = form.watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      onSuccess?.();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'EMAIL_ALREADY_EXISTS') {
        form.setError('email', { message: 'Email này đã được sử dụng. Vui lòng dùng email khác.' });
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const field = key as keyof RegisterFormValues;
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
      setFormError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
    }
  };

  return (
    <FormProvider {...form}>
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
            htmlFor="register-displayName"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Họ và tên
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-displayName"
              autoComplete="name"
              placeholder="Ví dụ: Lê Minh Tâm"
              className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              {...form.register('displayName')}
            />
          </div>
          {form.formState.errors.displayName && (
            <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="register-email"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Địa chỉ Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="ban@gmail.com"
              className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="register-password"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Mật khẩu mới
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự..."
              className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              {...form.register('password')}
            />
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : (
            <PasswordStrength value={passwordValue ?? ''} />
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="register-confirmPassword"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Nhập lại mật khẩu
          </Label>
          <Input
            id="register-confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu..."
            className="h-12 rounded-xl px-4 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <ContributorRequestFields />

        <Button
          type="submit"
          className="h-12 w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/95 active:scale-[0.99] transition-all shadow-xs"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản VeggieConnect'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </FormProvider>
  );
}
