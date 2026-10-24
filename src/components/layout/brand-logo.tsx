'use client';

import * as React from 'react';
import Link from 'next/link';
import { HeartPulse, Sparkles, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  variant?: 'horizontal' | 'mark' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  asLink?: boolean;
  className?: string;
  withSubtitle?: string;
  priority?: boolean;
}

const SIZE_STYLES = {
  sm: { icon: 'w-5 h-5', text: 'text-base', sub: 'text-[10px]' },
  md: { icon: 'w-6 h-6', text: 'text-xl', sub: 'text-xs' },
  lg: { icon: 'w-8 h-8', text: 'text-2xl', sub: 'text-sm' },
  xl: { icon: 'w-10 h-10', text: 'text-3xl', sub: 'text-base' },
};

export function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  asLink = true,
  className,
  withSubtitle,
}: BrandLogoProps) {
  const styles = SIZE_STYLES[size];

  const content = (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 font-bold tracking-tight select-none',
        className
      )}
    >
      <div className="relative flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-1.5 shadow-sm ring-1 ring-primary/20">
        <HeartPulse className={cn(styles.icon, 'animate-pulse text-white')} />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>

      {variant !== 'mark' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={cn(styles.text, 'font-extrabold tracking-tight text-foreground')}>
              Longe<span className="text-primary">via</span>
            </span>
          </div>
          {withSubtitle && (
            <span className={cn(styles.sub, 'font-medium text-muted-foreground mt-0.5')}>
              {withSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-flex items-center group transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
