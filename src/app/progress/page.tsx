'use client';

import * as React from 'react';
import Link from 'next/link';
import { Moon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSummaryCards } from '@/features/progress/components/progress-summary-cards';
import { ProgressQuickActions } from '@/features/progress/components/progress-quick-actions';
import { FastingPanel } from '@/features/progress/components/fasting-panel';
import { WaterTracker } from '@/features/progress/components/water-tracker';
import { WeightTrendChart } from '@/features/progress/components/weight-trend-chart';
import {
  useDashboardSummaryQuery,
  useMetricsHistoryQuery,
} from '@/features/progress/queries/progress.queries';

export default function ProgressDashboardPage() {
  const { data: summary, isLoading: isLoadingSummary } = useDashboardSummaryQuery();
  const { data: historyData, isLoading: isLoadingHistory } = useMetricsHistoryQuery({
    pageNumber: 1,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
            Tiến trình & Chỉ số trường thọ
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            Theo dõi nhịn ăn gián đoạn, mức tiêu thụ nước, chất lượng giấc ngủ và biến thiên cân
            nặng theo chuẩn khoa học.
          </p>
        </div>
      </div>

      {/* Thẻ tóm tắt tổng quan */}
      <ProgressSummaryCards summary={summary} isLoading={isLoadingSummary} />

      {/* Phím tắt hành động nhanh */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Thao tác nhanh trong ngày
        </h2>
        <ProgressQuickActions />
      </div>

      {/* Bố cục 2 cột chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Fasting & Nước uống (7 cột) */}
        <div className="lg:col-span-7 space-y-6">
          <FastingPanel />
          <WaterTracker />
        </div>

        {/* Cột phải: Biểu đồ xu hướng cân nặng & Giấc ngủ (5 cột) */}
        <div className="lg:col-span-5 space-y-6">
          <WeightTrendChart metrics={historyData?.items ?? []} isLoading={isLoadingHistory} />

          {/* Card thông tin giấc ngủ */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Moon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Chất lượng giấc ngủ</CardTitle>
                    <CardDescription className="text-xs">
                      Chu kỳ ngủ 7 ngày gần nhất
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                  <Link href="/progress/sleep">
                    Ghi nhận <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                  <span className="text-xs text-muted-foreground">Thời lượng trung bình:</span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {summary?.averageSleepHours !== null && summary?.averageSleepHours !== undefined
                      ? `${summary.averageSleepHours.toFixed(1)} giờ/đêm`
                      : 'Chưa có dữ liệu'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">
                  Chế độ ăn trường thọ khuyến nghị duy trì giấc ngủ từ 7 đến 8 giờ đều đặn để tối ưu
                  hóa sự phục hồi thần kinh.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
