'use client';

import * as React from 'react';
import Link from 'next/link';
import { Flame, Droplets, Moon, Scale, ArrowRight } from 'lucide-react';
export function ProgressQuickActions() {
  const actions = [
    {
      title: 'Uống nước',
      desc: 'Cập nhật lượng nước hôm nay',
      href: '/progress/water',
      icon: Droplets,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:border-blue-500/50',
    },
    {
      title: 'Nhịn ăn gián đoạn',
      desc: 'Theo dõi phiên nhịn ăn hiện tại',
      href: '/progress/fasting',
      icon: Flame,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:border-amber-500/50',
    },
    {
      title: 'Ghi nhận giấc ngủ',
      desc: 'Lưu giờ ngủ & chất lượng phục hồi',
      href: '/progress/sleep',
      icon: Moon,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/50',
    },
    {
      title: 'Ghi chỉ số cơ thể',
      desc: 'Cập nhật cân nặng và đo BMI',
      href: '/progress/metrics',
      icon: Scale,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.href}
            href={act.href}
            className={`p-3.5 rounded-xl border border-border/60 bg-card transition-all duration-150 hover:shadow-xs group flex items-start gap-3 ${act.color}`}
          >
            <div className="p-2 rounded-lg bg-background/80 shadow-2xs shrink-0">
              <Icon className="size-4" />
            </div>
            <div className="space-y-0.5 grow min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {act.title}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
