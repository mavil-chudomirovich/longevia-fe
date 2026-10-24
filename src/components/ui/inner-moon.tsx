'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface InnerMoonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  duration?: number;
  /** Whether the toggle should render in its dark-theme state. */
  toggled?: boolean;
  [key: `data-${string}`]: string | number | boolean | null | undefined;
}

export const InnerMoon = React.forwardRef<HTMLButtonElement, InnerMoonProps>(function InnerMoon(
  {
    duration = 200,
    toggled,
    className,
    type = 'button',
    title = 'Toggle theme',
    'aria-label': ariaLabel = 'Toggle theme',
    'aria-pressed': ariaPressed,
    ...props
  },
  ref
) {
  const isToggled = toggled === true;
  const shouldReduceMotion = useReducedMotion();
  const animDuration = shouldReduceMotion ? 0 : Math.min(duration / 1000, 0.25);
  const [rippling, setRippling] = React.useState(false);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setRippling(true);
    const timer = setTimeout(() => setRippling(false), 550);
    return () => clearTimeout(timer);
  }, [toggled]);

  return (
    <button
      ref={ref}
      {...props}
      type={type}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={toggled ?? ariaPressed}
      className={[
        'relative inline-flex items-center justify-center select-none cursor-pointer overflow-visible',
        className,
        isToggled ? 'dark' : toggled === false ? 'light' : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Vòng sóng ripple cục bộ quanh nút toggle khi chuyển theme */}
      {rippling && !shouldReduceMotion && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-full border border-primary/50 animate-ping"
          style={{ animationDuration: '550ms' }}
        />
      )}

      <motion.svg
        width="1em"
        height="1em"
        viewBox="0 0 32 32"
        aria-hidden="true"
        fill="currentColor"
        className="overflow-visible pointer-events-none"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        {/* 8 tia mặt trời: xoay 180° bằng GPU compositor transform trong 200ms */}
        <motion.path
          d="M27.5 11.5v-7h-7L16 0l-4.5 4.5h-7v7L0 16l4.5 4.5v7h7L16 32l4.5-4.5h7v-7L32 16l-4.5-4.5zM16 25.4a9.39 9.39 0 1 1 0-18.8 9.39 9.39 0 1 1 0 18.8z"
          initial={false}
          animate={{
            rotate: isToggled ? 180 : 0,
            scale: isToggled ? 0.92 : 1,
          }}
          transition={{
            duration: animDuration,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            originX: '16px',
            originY: '16px',
            transformOrigin: '16px 16px',
          }}
        />
        {/* Vòng tròn tâm: trượt ngang bằng translateX (compositor x) trong 200ms */}
        <motion.circle
          cx={16}
          cy={16}
          r={7.6}
          initial={false}
          animate={{
            x: isToggled ? 4.8 : 0,
          }}
          transition={{
            duration: animDuration,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            originX: '16px',
            originY: '16px',
            transformOrigin: '16px 16px',
          }}
        />
      </motion.svg>
    </button>
  );
});

InnerMoon.displayName = 'InnerMoon';
