'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-error';
import { useRequestEmailChangeMutation } from '../queries/profile.queries';

const schema = z.object({
  newEmail: z
    .string()
    .min(1, 'Vui lòng nhập email mới.')
    .email('Email mới chưa đúng định dạng.')
    .max(320, 'Email quá dài.'),
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại để xác nhận.'),
});

type Values = z.infer<typeof schema>;

interface EmailChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function EmailChangeDialog({ open, onOpenChange, currentEmail }: EmailChangeDialogProps) {
  const mutation = useRequestEmailChangeMutation();
  const [formError, setFormError] = React.useState('');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next) {
      form.reset({ newEmail: '', currentPassword: '' });
      setFormError('');
    }
  };

  const submit = async (values: Values) => {
    setFormError('');
    const newEmail = values.newEmail.trim().toLowerCase();
    if (newEmail === currentEmail.trim().toLowerCase()) {
      setFormError('Email mới đang trùng với email hiện tại.');
      return;
    }
    try {
      await mutation.mutateAsync({
        newEmail,
        currentPassword: values.currentPassword,
      });
      onOpenChange(false);
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          'Chưa gửi được yêu cầu đổi email. Bạn kiểm tra lại mật khẩu rồi thử lại nhé.'
        )
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi email đăng nhập</DialogTitle>
          <DialogDescription>
            Longevia gửi link xác nhận tới email mới và cảnh báo tới{' '}
            <span className="font-medium text-foreground">{currentEmail}</span>. Email chỉ thay đổi
            sau khi bạn bấm link trong hộp thư mới.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => void submit(values))}>
          <div className="space-y-2">
            <Label htmlFor="email-change-new">Email mới</Label>
            <Input
              id="email-change-new"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              aria-invalid={Boolean(form.formState.errors.newEmail)}
              {...form.register('newEmail')}
            />
            {form.formState.errors.newEmail && (
              <p className="text-xs text-destructive">{form.formState.errors.newEmail.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-change-password">Mật khẩu hiện tại</Label>
            <Input
              id="email-change-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.currentPassword)}
              {...form.register('currentPassword')}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang gửi…' : 'Gửi link xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
