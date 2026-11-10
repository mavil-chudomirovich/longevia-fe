'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Flame, Droplets, Moon, Scale, Dumbbell, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PROGRESS_NAV_ITEMS: ProgressNavItem[] = [
  {
    title: 'Tổng quan',
    href: '/progress',
    icon: Activity,
  },
  {
    title: 'Nhịn ăn',
    href: '/progress/fasting',
    icon: Flame,
  },
  {
    title: 'Nước uống',
    href: '/progress/water',
    icon: Droplets,
  },
  {
    title: 'Giấc ngủ',
    href: '/progress/sleep',
    icon: Moon,
  },
  {
    title: 'Chỉ số & Lịch sử',
    href: '/progress/metrics',
    icon: Scale,
  },
  {
    title: 'Kế hoạch tập',
    href: '/progress/workout',
    icon: Dumbbell,
  },
  {
    title: 'Trường thọ',
    href: '/progress/longevity',
    icon: HeartPulse,
  },
];

export function ProgressSubNav() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none"
          aria-label="Điều hướng Tiến trình"
        >
          {PROGRESS_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/progress' ? pathname === '/progress' : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
