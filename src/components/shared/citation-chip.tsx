'use client';

import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { MarkdownText } from '@/components/shared/markdown-text';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
}

/**
 * Trích dẫn sách dạng gọn: chỉ icon + số trang. Hover (desktop) hoặc bấm
 * (touch) mới mở nội dung, tránh các khối "— CHƯƠNG 12 …, tr. 234" dài dòng
 * lặp lại khắp trang. Cờ `verified` vẫn nằm trong dữ liệu nhưng không hiển thị.
 */
export function CitationChip({ citation, className }: CitationChipProps) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  React.useEffect(() => cancelClose, [cancelClose]);

  const label = `Xem trích dẫn chương ${citation.chapterNumber}, trang ${citation.bookPage}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onFocus={() => setOpen(true)}
          onBlur={scheduleClose}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 align-middle text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
        >
          <BookOpen className="size-3" aria-hidden="true" />
          <span>tr. {citation.bookPage}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-w-80 space-y-2"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Chương {citation.chapterNumber} · tr. {citation.bookPage}
          </p>
          {citation.chapterTitle && (
            <p className="text-xs font-medium text-foreground">{citation.chapterTitle}</p>
          )}
        </div>
        <MarkdownText content={citation.quote} compact className="text-muted-foreground" />
      </PopoverContent>
    </Popover>
  );
}

export function CitationChipList({
  citations,
  className,
}: {
  citations: CitationLike[];
  className?: string;
}) {
  if (citations.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {citations.map((citation, index) => (
        <CitationChip
          key={`${citation.sourceFile ?? citation.chapterTitle}-${citation.bookPage}-${index}`}
          citation={citation}
        />
      ))}
    </div>
  );
}
