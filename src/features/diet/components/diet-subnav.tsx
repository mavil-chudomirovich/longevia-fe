'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Apple,
  BookOpen,
  CalendarDays,
  FlaskConical,
  LayoutList,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DietNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DIET_NAV_ITEMS: DietNavItem[] = [
  { title: 'Nhật ký', href: '/diet', icon: LayoutList },
  { title: 'Mục tiêu', href: '/diet/targets', icon: Target },
  { title: 'Gợi ý AI', href: '/diet/suggestions', icon: Sparkles },
  { title: 'Kế hoạch tuần', href: '/diet/meal-plan', icon: CalendarDays },
  { title: 'Vi chất', href: '/diet/nutrients', icon: FlaskConical },
  { title: 'Danh mục món', href: '/diet/foods', icon: Apple },
  { title: 'Hỏi sách', href: '/knowledge', icon: BookOpen },
];

/**
 * Điều hướng phụ dùng chung cho cả khu Dinh dưỡng, cùng pattern với
 * `ProgressSubNav`. Nhờ vậy trang con vẫn chuyển nhanh được sang trang con khác
 * mà không phải quay lại `/diet`.
 */
export function DietSubNav() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none"
          aria-label="Điều hướng Dinh dưỡng"
        >
          {DIET_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/diet' ? pathname === '/diet' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
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
