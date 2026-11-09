import * as React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Render nội dung markdown từ backend (câu trả lời AI, trích dẫn sách, mẹo…).
 * HTML thô bị chặn: không cấu hình `rehype-raw` nên thẻ trong dữ liệu chỉ hiển thị
 * dạng chữ, tránh XSS từ nội dung sách/AI.
 */
const markdownComponents: Components = {
  p: ({ node: _node, className, ...props }) => (
    <p className={cn('text-pretty leading-relaxed', className)} {...props} />
  ),
  strong: ({ node: _node, className, ...props }) => (
    <strong className={cn('font-semibold text-foreground', className)} {...props} />
  ),
  em: ({ node: _node, className, ...props }) => (
    <em className={cn('italic', className)} {...props} />
  ),
  a: ({ node: _node, className, children, href, title }) => (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noreferrer noopener"
      className={cn('font-medium text-primary underline underline-offset-2', className)}
    >
      {children}
    </a>
  ),
  ul: ({ node: _node, className, ...props }) => (
    <ul className={cn('list-disc space-y-1 pl-5', className)} {...props} />
  ),
  ol: ({ node: _node, className, ...props }) => (
    <ol className={cn('list-decimal space-y-1 pl-5', className)} {...props} />
  ),
  li: ({ node: _node, className, ...props }) => (
    <li className={cn('leading-relaxed marker:text-muted-foreground', className)} {...props} />
  ),
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote
      className={cn('border-l-2 border-primary/40 pl-3 text-muted-foreground italic', className)}
      {...props}
    />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code
      className={cn('rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]', className)}
      {...props}
    />
  ),
  pre: ({ node: _node, className, ...props }) => (
    <pre
      className={cn(
        'overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed',
        className
      )}
      {...props}
    />
  ),
  h1: ({ node: _node, className, ...props }) => (
    <h3 className={cn('font-semibold text-foreground', className)} {...props} />
  ),
  h2: ({ node: _node, className, ...props }) => (
    <h4 className={cn('font-semibold text-foreground', className)} {...props} />
  ),
  h3: ({ node: _node, className, ...props }) => (
    <h5 className={cn('font-semibold text-foreground', className)} {...props} />
  ),
  hr: ({ node: _node, className, ...props }) => (
    <hr className={cn('border-border/60', className)} {...props} />
  ),
  table: ({ node: _node, className, children, ...props }) => (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ node: _node, className, ...props }) => (
    <th className={cn('border-b px-2 py-1 font-semibold', className)} {...props} />
  ),
  td: ({ node: _node, className, ...props }) => (
    <td className={cn('border-b border-border/40 px-2 py-1 align-top', className)} {...props} />
  ),
};

export interface MarkdownTextProps {
  content: string;
  className?: string;
  /** Dùng trong card nhỏ, bảng gợi ý: giảm khoảng cách và cỡ chữ. */
  compact?: boolean;
}

export function MarkdownText({ content, className, compact = false }: MarkdownTextProps) {
  if (!content.trim()) return null;

  return (
    <div
      className={cn(
        'text-sm text-foreground',
        compact ? 'space-y-1.5 text-[13px]' : 'space-y-2.5',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
