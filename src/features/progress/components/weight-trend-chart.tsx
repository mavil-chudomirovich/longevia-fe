'use client';

import * as React from 'react';
import { LineChart as ChartIcon, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BodyMetricRecord } from '../types/progress.model';
import { formatDateOnlyDisplay } from '../utils/progress-date';

interface WeightTrendChartProps {
  metrics: BodyMetricRecord[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function WeightTrendChart({ metrics, isLoading, isError, onRetry }: WeightTrendChartProps) {
  // Sắp xếp theo thứ tự thời gian tăng dần để vẽ biểu đồ
  const chronologicalMetrics = React.useMemo(() => {
    return [...metrics].sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted/60 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="h-full w-full bg-muted/30 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-border/60 shadow-xs border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-destructive">
                Không thể tải biểu đồ xu hướng
              </CardTitle>
              <CardDescription>
                Đã xảy ra lỗi khi kết nối với máy chủ để lấy lịch sử chỉ số cân nặng.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6 text-center space-y-3">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs">
              <RotateCcw className="size-3.5" /> Thử lại
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (chronologicalMetrics.length < 2) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <ChartIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Xu hướng cân nặng & BMI</CardTitle>
              <CardDescription>Theo dõi sự biến thiên cân nặng theo thời gian.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center space-y-2">
          <div className="mx-auto p-3 rounded-full bg-muted/50 w-fit text-muted-foreground">
            <ChartIcon className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Chưa đủ dữ liệu để vẽ biểu đồ xu hướng
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto text-pretty">
            Hãy ghi nhận thêm ít nhất 2 mốc cân nặng để hệ thống hiển thị biểu đồ trực quan.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Chuẩn bị tọa độ SVG
  const weights = chronologicalMetrics.map((m) => m.weightKg);
  const minWeight = Math.floor(Math.min(...weights) - 1);
  const maxWeight = Math.ceil(Math.max(...weights) + 1);
  const weightRange = Math.max(1, maxWeight - minWeight);

  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = chronologicalMetrics.map((m, index) => {
    const x = paddingX + (index / (chronologicalMetrics.length - 1)) * innerWidth;
    const y = height - paddingY - ((m.weightKg - minWeight) / weightRange) * innerHeight;
    return { x, y, metric: m };
  });

  const pathD = points.reduce((acc, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
    height - paddingY
  } Z`;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <ChartIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Xu hướng cân nặng & BMI</CardTitle>
              <CardDescription>
                Dựa trên {chronologicalMetrics.length} mốc đo thực tế được lưu trữ.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-muted-foreground font-medium">Cân nặng (kg)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[320px] select-none"
            aria-label="Biểu đồ xu hướng cân nặng"
          >
            {/* Grid ngang */}
            {[0, 0.5, 1].map((ratio) => {
              const y = height - paddingY - ratio * innerHeight;
              const val = (minWeight + ratio * weightRange).toFixed(1);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/40 stroke-dasharray-[4,4]"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-muted-foreground tabular-nums font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Gradient Fill Area */}
            <defs>
              <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#weightAreaGrad)" />

            {/* Đường biểu đồ */}
            <path
              d={pathD}
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Các điểm mốc */}
            {points.map((pt, i) => (
              <g key={pt.metric.id || i} className="group cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  className="fill-background stroke-emerald-600 dark:stroke-emerald-400 stroke-2 group-hover:r-5 transition-all"
                />
                <title>
                  {`${pt.metric.weightKg} kg (BMI: ${pt.metric.bmi.toFixed(1)}) - ${formatDateOnlyDisplay(
                    pt.metric.loggedAt.toISOString().slice(0, 10)
                  )}`}
                </title>

                {/* Nhãn ngày mốc đầu và cuối */}
                {(i === 0 || i === points.length - 1) && (
                  <text
                    x={pt.x}
                    y={height - paddingY + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground tabular-nums"
                  >
                    {pt.metric.loggedAt.getDate()}/{pt.metric.loggedAt.getMonth() + 1}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
