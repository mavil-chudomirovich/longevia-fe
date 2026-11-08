'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordSchema } from '@/features/auth/schemas/auth.schema';
import { getApiErrorCode, toastFriendlyError } from '@/lib/api-error';
import { useChangePasswordMutation } from '../queries/profile.queries';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Nhập lại mật khẩu mới.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp.',
  });

type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const mutation = useChangePasswordMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await mutation.mutateAsync({ currentPassword, newPassword });
      form.reset();
    } catch (error) {
      if (getApiErrorCode(error) === 'identity.invalid_current_password') {
        form.setError('currentPassword', {
          message: 'Mật khẩu hiện tại chưa đúng. Bạn kiểm tra lại giúp mình nhé.',
        });
        return;
      }
      toastFriendlyError(error, 'Chưa đổi được mật khẩu. Bạn vui lòng thử lại nhé.');
    }
  });
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="max-w-lg space-y-4" noValidate>
      {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((name) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {name === 'currentPassword'
              ? 'Mật khẩu hiện tại'
              : name === 'newPassword'
                ? 'Mật khẩu mới'
                : 'Xác nhận mật khẩu mới'}
          </Label>
          <Input
            id={name}
            type="password"
            autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
            {...form.register(name)}
          />
          {form.formState.errors[name] && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors[name]?.message}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
      </Button>
    </form>
  );
}
