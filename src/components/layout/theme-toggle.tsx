'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { InnerMoon } from '@/components/ui/inner-moon';

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => Promise<void> | void) => ViewTransition;
};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Tránh hydration mismatch khi đọc theme của next-themes (chỉ có trên client).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';

  const handleToggle = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const nextTheme = isDark ? 'light' : 'dark';
      const doc = typeof document !== 'undefined' ? (document as DocumentWithViewTransition) : null;

      const supportsViewTransition =
        Boolean(doc?.startViewTransition) &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!supportsViewTransition || !doc?.startViewTransition) {
        setTheme(nextTheme);
        return;
      }

      // Lấy tọa độ trung tâm của nút toggle làm tâm điểm gợn sóng
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Bán kính tối đa vươn tới góc xa nhất của màn hình
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = doc.startViewTransition(() => {
        // Đồng bộ class ngay tức thì để snapshot của view transition bắt đúng theme mới
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setTheme(nextTheme);
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
            },
            {
              duration: 450,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          // Fallback nếu transition bị cancel
        });
    },
    [isDark, setTheme]
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative text-[1.25rem] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors overflow-visible"
    >
      <InnerMoon
        toggled={isDark}
        onClick={handleToggle}
        title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      />
    </Button>
  );
}
