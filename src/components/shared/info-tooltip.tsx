'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface InfoTooltipProps {
  /** Nội dung giải thích, nên ngắn (1–2 câu). */
  content: React.ReactNode;
  /** Nhãn đọc cho screen reader, ví dụ "Protein là gì?". */
  label: string;
  className?: string;
}

/**
 * Icon thông tin nhỏ, giải thích thuật ngữ ngay tại chỗ thay vì nhồi một đoạn
 * hướng dẫn dài trên form.
 */
export function InfoTooltip({ content, label, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
