'use client';

import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { MarkdownText } from '@/components/shared/markdown-text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CitationLike {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  quote: string;
  sourceFile?: string;
  verified?: boolean;
}

export interface CitationChipProps {
  citation: CitationLike;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Trích dẫn sách dạng gọn: chỉ icon + số trang. Tooltip mở khi hover/focus;
 * `CitationChipList` giữ trạng thái mở duy nhất để không bao giờ có hai nguồn
 * cùng hiện hoặc nguồn cũ dính lại khi hover sang nguồn khác.
 */
export function CitationChip({
  citation,
  className,
  open = false,
  onOpenChange,
}: CitationChipProps) {
  const label = `Xem trích dẫn chương ${citation.chapterNumber}, trang ${citation.bookPage}`;

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => onOpenChange?.(!open)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 align-middle text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
        >
          <BookOpen className="size-3" aria-hidden="true" />
          <span>tr. {citation.bookPage}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={6}
        className="max-w-80 space-y-2 border bg-popover p-3 text-popover-foreground shadow-md [&>svg]:hidden"
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Chương {citation.chapterNumber} — tr. {citation.bookPage}
          </p>
          {citation.chapterTitle && (
            <p className="text-xs font-medium text-foreground">{citation.chapterTitle}</p>
          )}
        </div>
        <MarkdownText content={citation.quote} compact className="text-muted-foreground" />
      </TooltipContent>
    </Tooltip>
  );
}

export function CitationChipList({
  citations,
  className,
}: {
  citations: CitationLike[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  if (citations.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {citations.map((citation, index) => (
        <CitationChip
          key={`${citation.sourceFile ?? citation.chapterTitle}-${citation.bookPage}-${index}`}
          citation={citation}
          open={openIndex === index}
          onOpenChange={(next) =>
            setOpenIndex((current) => (next ? index : current === index ? null : current))
          }
        />
      ))}
    </div>
  );
}
