'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Scale,
  HeartPulse,
  Flame,
  Moon,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSummary, BmiCategoryEnum } from '../types/progress.model';

interface ProgressSummaryCardsProps {
  summary?: DashboardSummary | null;
  isLoading?: boolean;
}

export function ProgressSummaryCards({ summary, isLoading }: ProgressSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getBmiBadgeVariant = (cat: BmiCategoryEnum | null) => {
    switch (cat) {
      case BmiCategoryEnum.NORMAL_WEIGHT:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case BmiCategoryEnum.UNDERWEIGHT:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case BmiCategoryEnum.OVERWEIGHT:
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30';
      case BmiCategoryEnum.OBESE:
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cân nặng & Thay đổi */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cân nặng hiện tại
            </CardTitle>
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {summary?.currentWeightKg !== null && summary?.currentWeightKg !== undefined ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                    {summary.currentWeightKg.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">kg</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {summary.weightDeltaKg !== null && summary.weightDeltaKg !== undefined ? (
                    <span
                      className={`inline-flex items-center font-medium tabular-nums ${
                        summary.weightDeltaKg <= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {summary.weightDeltaKg <= 0 ? (
                        <TrendingDown className="size-3 mr-0.5 inline" />
                      ) : (
                        <TrendingUp className="size-3 mr-0.5 inline" />
                      )}
                      {summary.weightDeltaKg > 0 ? '+' : ''}
                      {summary.weightDeltaKg.toFixed(1)} kg
                    </span>
                  ) : (
                    <span>Mốc đo đầu tiên</span>
                  )}
                  <span>so với tuần trước</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-0.5">
                <p className="text-sm text-muted-foreground">Chưa ghi nhận số đo</p>
                <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                  <Link href="/progress/metrics">
                    Ghi cân nặng <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: BMI & Thể trạng */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chỉ số BMI</CardTitle>
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HeartPulse className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {summary?.currentBmi !== null && summary?.currentBmi !== undefined ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                    {summary.currentBmi.toFixed(1)}
                  </span>
                  {summary.bmiCategoryLabel && (
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold border ${getBmiBadgeVariant(
                        summary.bmiCategory
                      )}`}
                    >
                      {summary.bmiCategoryLabel}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chuẩn WHO cho người trưởng thành
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-0.5">
                <p className="text-sm text-muted-foreground">Chưa tính được BMI</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Cần cập nhật chiều cao và cân nặng
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Chuỗi thói quen (Streak) */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chuỗi duy trì
            </CardTitle>
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
                {summary?.currentStreakDays ?? 0}
              </span>
              <span className="text-sm font-medium text-muted-foreground">ngày liên tiếp</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Kỷ lục cá nhân:{' '}
              <span className="font-medium text-foreground">
                {summary?.bestStreakDays ?? 0} ngày
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Nhịn ăn & Giấc ngủ tổng quan */}
        <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nhịn ăn & Giấc ngủ
            </CardTitle>
            <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Moon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Fasting tuần này:</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {summary?.fastingThisWeekCompleted ?? 0} phiên
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Ngủ trung bình:</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {summary?.averageSleepHours !== null && summary?.averageSleepHours !== undefined
                    ? `${summary.averageSleepHours.toFixed(1)} giờ`
                    : 'Chưa có'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ghi chú minh bạch về chuỗi ngày theo ADR005 */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
        <Info className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-pretty">
          Chuỗi ngày liên tiếp tổng hợp từ nhật ký dinh dưỡng và số đo cơ thể hợp lệ theo chu kỳ
          UTC.
        </span>
      </div>
    </div>
  );
}
