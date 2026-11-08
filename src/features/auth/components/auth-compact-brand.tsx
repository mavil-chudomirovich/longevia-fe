'use client';

import * as React from 'react';
import { Activity, Leaf, Sparkles, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthCompactBrandProps {
  className?: string;
}

/**
 * Khối tóm tắt thông điệp thương hiệu tinh gọn trên mobile.
 * Xuất hiện phía dưới thẻ authentication card, tôn trọng thứ tự phân cấp thị giác:
 * Logo -> Authentication Card -> Compact Brand Message.
 */
export function AuthCompactBrand({ className }: AuthCompactBrandProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-3 pt-6 pb-2 text-center lg:hidden',
        className
      )}
    >
      {/* Brand slogan pill */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1 text-[11px] font-semibold text-[#075B45] dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Leaf className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
        <span>Dinh dưỡng trường thọ · Sống khỏe mỗi ngày</span>
      </div>

      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        Theo dõi dinh dưỡng và tiến trình sức khỏe, nhận gợi ý phù hợp với hồ sơ của bạn.
      </p>

      {/* Feature micro-badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium">
          <Sparkles className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
          Gợi ý AI
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium">
          <Activity className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
          Tiến trình
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium">
          <UserRound className="h-3 w-3 text-[#287D32] dark:text-emerald-400" />
          Hồ sơ sức khỏe
        </span>
      </div>
    </div>
  );
}
