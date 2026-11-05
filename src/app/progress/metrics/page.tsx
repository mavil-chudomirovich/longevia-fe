'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BodyMetricForm } from '@/features/progress/components/body-metric-form';
import { WeightTrendChart } from '@/features/progress/components/weight-trend-chart';
import { MetricsHistory } from '@/features/progress/components/metrics-history';
import { useMetricsHistoryQuery } from '@/features/progress/queries/progress.queries';

export default function MetricsPage() {
  const { data: historyData, isLoading } = useMetricsHistoryQuery({
    pageNumber: 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 rounded-full">
              <Link href="/progress" aria-label="Quay lại Tổng quan">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Chỉ số cơ thể & Lịch sử đo lường
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-pretty ml-9">
            Theo dõi cân nặng, snapshot BMI, tỷ lệ mỡ, vòng eo và huyết áp theo thời gian thực.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form ghi nhận số đo (5 cột) */}
        <div className="lg:col-span-5 space-y-6">
          <BodyMetricForm />
        </div>

        {/* Biểu đồ xu hướng (7 cột) */}
        <div className="lg:col-span-7 space-y-6">
          <WeightTrendChart metrics={historyData?.items ?? []} isLoading={isLoading} />
        </div>
      </div>

      {/* Danh sách lịch sử chỉ số có phân trang */}
      <div className="pt-2">
        <MetricsHistory />
      </div>
    </div>
  );
}
