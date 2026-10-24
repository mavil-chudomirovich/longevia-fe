'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Leaf, Flame, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Skeleton tải trước hiển thị chiếc tô tĩnh và các badge, giữ layout ổn định (tránh CLS).
 */
export function HeroFoodSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="animate-pulse">
        <Image
          src="/hero/optimized/bowl.webp"
          alt="Đang tải..."
          width={310}
          height={310}
          className="object-contain opacity-70"
          priority
        />
      </div>
    </div>
  );
}

const DynamicHeroFoodPlayer = dynamic(
  () => import('./hero-food-player').then((mod) => mod.HeroFoodPlayer),
  {
    ssr: false,
    loading: () => <HeroFoodSkeleton />,
  }
);

export interface HeroFoodAnimationProps {
  className?: string;
}

/**
 * Visual Hero Animation Component cho Landing Page VeggieConnect.
 * Thay thế hình ảnh tĩnh bằng hoạt cảnh 2D ẩm thực thuần chay với Remotion Player.
 */
/**
 * Thẻ dinh dưỡng thực vật với đường sáng viền chuyển động liên tục 360 độ (Border Beam).
 * Tách biệt state pulseActive độc lập để không làm re-render toàn bộ HeroFoodPlayer.
 */
function NutritionBadge() {
  const [pulseActive, setPulseActive] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const intervalId = setInterval(() => {
      timeoutId = setTimeout(() => {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 1600);
      }, 3200);
    }, 8000);

    const initialTimeout = setTimeout(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 1600);
    }, 3200);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <div
      className={cn(
        'absolute bottom-3.5 left-3.5 z-20 transition-transform duration-500 ease-out',
        pulseActive ? 'scale-105' : 'scale-100'
      )}
    >
      {/* Glow phủ phía sau thẻ tạo quầng sáng neon mềm mại */}
      <div
        className={cn(
          'pointer-events-none absolute -inset-1 rounded-2xl transition-opacity duration-500',
          pulseActive
            ? 'bg-emerald-500/35 opacity-100 blur-md'
            : 'bg-emerald-500/15 opacity-60 blur-sm'
        )}
        aria-hidden="true"
      />

      {/* Khung viền chứa đường sáng chuyển động (concentric 2px border) */}
      <div className="relative overflow-hidden rounded-2xl p-[2px] shadow-lg shadow-black/25 dark:shadow-emerald-950/60">
        {/* Lớp viền nền tĩnh */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl border border-border/80 dark:border-emerald-500/20"
          aria-hidden="true"
        />

        {/* Tia sáng chuyển động liên tục 360 độ quanh khung viền */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[280%] animate-border-beam"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 260deg, rgba(16, 185, 129, 0.2) 280deg, rgba(16, 185, 129, 0.7) 315deg, #10b981 338deg, #34d399 350deg, #fef08a 357deg, #ffffff 360deg, transparent 361deg)',
          }}
          aria-hidden="true"
        />

        {/* Bề mặt card kính mờ cao cấp */}
        <div className="relative z-10 flex flex-col gap-2 rounded-[calc(1rem-2px)] bg-background/90 px-3.5 py-3 backdrop-blur-xl dark:bg-[#0c1a14]/92">
          {/* Dòng 1: Calo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold tracking-tight text-foreground">385</span>
              <span className="text-[11px] font-semibold text-muted-foreground">kcal</span>
            </div>
            {pulseActive && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-2.5 w-2.5 animate-spin" /> Đủ chất
              </span>
            )}
          </div>

          {/* Dòng 2: Protein thực vật */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/25">
              <Leaf className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-baseline gap-1 text-xs">
              <span className="font-bold text-foreground">18g</span>
              <span className="font-medium text-muted-foreground">Protein thực vật</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroFoodAnimation({ className = '' }: HeroFoodAnimationProps) {
  return (
    <div
      className={`relative aspect-[4/4.2] w-full overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-background to-secondary/30 shadow-sm backdrop-blur-sm ${className}`}
    >
      {/* Vòng sáng ambient phía sau tăng chiều sâu */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/15" />

      {/* Hoạt cảnh Remotion Player chính */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <DynamicHeroFoodPlayer />
      </div>

      {/* BADGE 1 (Góc trên - phải): Lịch Chay */}
      <Badge className="absolute right-3.5 top-3.5 z-20 gap-1.5 rounded-full border border-border/70 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-transform hover:scale-105">
        <Calendar className="h-3.5 w-3.5 text-primary" /> Lịch Chay: Hôm nay Mùng Một
      </Badge>

      {/* BADGE 2 (Góc dưới - trái): Thẻ Dinh Dưỡng Thực Vật với đường sáng viền chuyển động liên tục */}
      <NutritionBadge />
    </div>
  );
}
