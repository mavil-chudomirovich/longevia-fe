'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps['theme']) || 'system'}
      className="toaster group font-sans"
      closeButton
      duration={3500}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/80 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3.5',
          title:
            'group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:text-foreground group-[.toast]:tracking-tight',
          description:
            'group-[.toast]:text-xs group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground group-[.toast]:mt-1 group-[.toast]:whitespace-pre-line',
          actionButton:
            'group-[.toast]:rounded-full group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:shadow-sm group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors',
          cancelButton:
            'group-[.toast]:rounded-full group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:hover:bg-accent group-[.toast]:hover:text-foreground group-[.toast]:transition-colors',
          closeButton:
            'group-[.toast]:rounded-full group-[.toast]:border group-[.toast]:border-border/70 group-[.toast]:bg-background/90 group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-accent group-[.toast]:hover:border-border group-[.toast]:transition-all group-[.toast]:top-3 group-[.toast]:right-3',
          success:
            'group-[.toaster]:border-primary/40 group-[.toaster]:shadow-primary/10 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-secondary/50 group-[.toaster]:via-card/95 group-[.toaster]:to-card/95',
          error:
            'group-[.toaster]:border-destructive/40 group-[.toaster]:shadow-destructive/10 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-destructive/10 group-[.toaster]:via-card/95 group-[.toaster]:to-card/95',
          warning:
            'group-[.toaster]:border-warning/40 group-[.toaster]:shadow-warning/10 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-warning/10 group-[.toaster]:via-card/95 group-[.toaster]:to-card/95',
          info: 'group-[.toaster]:border-primary/30 group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-secondary/30 group-[.toaster]:via-card/95 group-[.toaster]:to-card/95',
          loading: 'group-[.toaster]:border-primary/30 group-[.toaster]:bg-card/95',
        },
      }}
      icons={{
        success: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-xs">
            <CheckCircle2 className="size-4 text-primary" />
          </div>
        ),
        error: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive shadow-xs">
            <AlertCircle className="size-4 text-destructive" />
          </div>
        ),
        warning: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning shadow-xs">
            <AlertTriangle className="size-4 text-warning" />
          </div>
        ),
        info: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary shadow-xs">
            <Info className="size-4 text-primary" />
          </div>
        ),
        loading: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-xs">
            <Loader2 className="size-4 animate-spin text-primary" />
          </div>
        ),
      }}
      {...props}
    />
  );
}
