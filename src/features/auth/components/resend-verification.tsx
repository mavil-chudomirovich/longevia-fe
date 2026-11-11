'use client';

import * as React from 'react';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResendVerificationMutation } from '../queries/auth.queries';

const COOLDOWN_SECONDS = 60;

function useCooldown() {
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const start = () => setSecondsLeft(COOLDOWN_SECONDS);
  return { secondsLeft, start };
}

export function ResendVerificationButton({
  email,
  size = 'sm',
  variant = 'outline',
  label = 'Gửi lại email xác minh',
}: {
  email: string;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'default';
  label?: string;
}) {
  const mutation = useResendVerificationMutation();
  const { secondsLeft, start } = useCooldown();
  const disabled = mutation.isPending || secondsLeft > 0 || !email;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className="gap-1.5"
      disabled={disabled}
      onClick={async () => {
        try {
          await mutation.mutateAsync(email);
          start();
        } catch {
          // Toast đã hiển thị trong mutation.
        }
      }}
    >
      <MailCheck className="size-4" aria-hidden="true" />
      {mutation.isPending ? 'Đang gửi…' : secondsLeft > 0 ? `Gửi lại sau ${secondsLeft}s` : label}
    </Button>
  );
}

/**
 * Dùng khi chưa biết chắc email (link xác minh hết hạn): cho nhập email rồi gửi lại.
 */
export function ResendVerificationForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = React.useState(initialEmail);

  return (
    <div className="space-y-2 text-left">
      <Label htmlFor="resend-email">Email đã đăng ký</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          placeholder="ban@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <ResendVerificationButton email={email.trim()} />
      </div>
      <p className="text-xs text-muted-foreground">
        Nếu chưa thấy email, bạn kiểm tra thêm mục Spam/Quảng cáo.
      </p>
    </div>
  );
}
