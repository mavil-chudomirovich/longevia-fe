'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-4">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Đã xảy ra sự cố!</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Hệ thống gặp lỗi không mong muốn khi hiển thị trang này. Bạn có thể thử tải lại hoặc liên hệ
        hỗ trợ.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Thử lại</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
