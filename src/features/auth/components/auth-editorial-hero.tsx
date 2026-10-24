'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, MapPin, Heart, Leaf, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthEditorialHeroProps {
  className?: string;
}

/**
 * Editorial Product Showcase dành cho cột bên trái của trang Authentication.
 * Phong cách Minimal Scandinavian kết hợp Organic Plant-based & AI-Powered SaaS.
 * 100% GPU Compositor animation, tối ưu hóa cho màn hình desktop và tablet lớn.
 */
export function AuthEditorialHero({ className }: AuthEditorialHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative flex w-full flex-col justify-between overflow-hidden p-2 lg:p-6 select-none',
        className
      )}
    >
      {/* Decorative ambient botanical glow in background */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5"
        aria-hidden="true"
      />

      {/* Top Section: Editorial Storytelling & Headlines */}
      <div className="space-y-4">
        {/* Eyebrow badge */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#075B45] shadow-xs backdrop-blur-xs dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          <Leaf className="h-3.5 w-3.5 text-[#287D32] dark:text-emerald-400" />
          <span>YOUR PLANT-BASED COMPANION</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-extrabold tracking-tight text-[#1D2B22] dark:text-[#E8F1E8] sm:text-5xl xl:text-[54px] leading-[1.12]"
        >
          Eat well.
          <br />
          <span className="text-[#287D32] dark:text-emerald-400">Connect deeply.</span>
        </motion.h1>

        {/* Supporting text */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md text-base leading-relaxed text-[#718078] dark:text-neutral-400 sm:text-lg"
        >
          Khám phá công thức, địa điểm và những lựa chọn phù hợp với hành trình ăn chay của bạn.
        </motion.p>
      </div>

      {/* Middle & Visual Section: Food Composition & Floating Ecosystem Cards */}
      <div className="relative mt-8 flex flex-1 items-center justify-center py-6">
        {/* Organic rounded backdrop canvas */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex aspect-square w-full max-w-[420px] items-center justify-center rounded-[36px] border border-border/50 bg-gradient-to-b from-[#F8F7F2] to-[#E8F1E8]/50 p-6 shadow-sm dark:border-border/30 dark:from-[#12211A]/80 dark:to-[#0B1410]/90"
        >
          {/* Subtle botanical circular backdrop element */}
          <div className="absolute inset-4 rounded-full border border-emerald-500/10 dark:border-emerald-400/10" />
          <div className="absolute inset-10 rounded-full border border-dashed border-emerald-500/15 dark:border-emerald-400/10" />

          {/* Central Vegan Food Photography */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    y: [0, -6, 0],
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative h-64 w-64 sm:h-72 sm:w-72"
          >
            <Image
              src="/hero/optimized/completed-dish.webp"
              alt="Món ăn thuần chay cân bằng dinh dưỡng - VeggieConnect"
              fill
              priority
              sizes="(max-width: 1024px) 256px, 300px"
              className="object-contain drop-shadow-[0_24px_30px_rgba(7,91,69,0.18)] dark:drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* FLOATING CARD 1: VEGGIE AI Recommendation (Top Right) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15, x: 10 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0, x: 0 }
                : {
                    opacity: 1,
                    y: [0, -8, 0],
                  }
            }
            transition={{
              opacity: { duration: 0.4, delay: 0.25 },
              y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute -top-4 -right-2 sm:-right-4 z-10 w-[200px] rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(29,43,34,0.08)] backdrop-blur-md dark:border-border/60 dark:bg-card/95 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#287D32] dark:text-emerald-400 uppercase">
              <Sparkles className="h-3 w-3" />
              <span>VEGGIE AI</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground">Gợi ý hôm nay</div>
            <div className="text-xs font-bold text-[#1D2B22] dark:text-foreground">
              Tofu Buddha Bowl
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#075B45] dark:text-emerald-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#287D32] dark:bg-emerald-400" />
              <span>Giàu đạm · Cân đối</span>
            </div>
          </motion.div>

          {/* FLOATING CARD 2: NEAR YOU Places (Bottom Left) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15, x: -10 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0, x: 0 }
                : {
                    opacity: 1,
                    y: [0, 6, 0],
                  }
            }
            transition={{
              opacity: { duration: 0.4, delay: 0.35 },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
            className="absolute -bottom-3 -left-2 sm:-left-4 z-10 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/95 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(29,43,34,0.08)] backdrop-blur-md dark:border-border/60 dark:bg-card/95 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-[#287D32] dark:bg-emerald-950/70 dark:text-emerald-300">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                GẦN BẠN
              </div>
              <div className="text-xs font-bold text-[#1D2B22] dark:text-foreground">
                12 quán chay lành tính
              </div>
            </div>
          </motion.div>

          {/* FLOATING CARD 3: COMMUNITY Connection (Bottom Right / Offset) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: 1,
                    y: [0, -5, 0],
                  }
            }
            transition={{
              opacity: { duration: 0.4, delay: 0.45 },
              y: { duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            }}
            className="absolute bottom-6 -right-2 sm:-right-6 z-10 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/95 px-3 py-2 shadow-[0_10px_28px_rgba(29,43,34,0.07)] backdrop-blur-md dark:border-border/60 dark:bg-card/95 dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                CỘNG ĐỒNG
              </div>
              <div className="text-[11px] font-semibold text-[#1D2B22] dark:text-foreground">
                Chia sẻ · Kết nối · An lành
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom feature summary pills */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 font-medium dark:bg-muted/30">
          <Utensils className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
          500+ Công thức thuần thực vật
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 font-medium dark:bg-muted/30">
          <Sparkles className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
          Đồng hành AI thông minh
        </span>
      </motion.div>
    </div>
  );
}
