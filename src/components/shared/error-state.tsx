'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

export function ErrorState({
  error,
  title = 'Tải dữ liệu thất bại.',
  onRetry,
  className,
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {error !== undefined && (
          <p className="mt-0.5 text-xs opacity-90">{getApiErrorMessage(error)}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
