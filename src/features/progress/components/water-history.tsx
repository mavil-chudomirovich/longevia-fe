'use client';

import * as React from 'react';
import { Droplets } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useWaterHistoryQuery } from '../queries/progress.queries';
import { formatDateOnlyDisplay } from '../utils/progress-date';

const RANGE_OPTIONS = [7, 30, 90] as const;

export function WaterHistory() {
  const [days, setDays] = React.useState<number>(30);
  const query = useWaterHistoryQuery(days);
  const data = query.data;
  const reached = data?.items.filter((item) => item.goalReached).length ?? 0;
  const average =
    data && data.items.length > 0
      ? Math.round(data.items.reduce((sum, item) => sum + item.consumedMl, 0) / data.items.length)
      : 0;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Droplets className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Lịch sử uống nước</CardTitle>
              <CardDescription className="text-xs">
                {data
                  ? `${reached}/${data.items.length} ngày đạt mục tiêu · trung bình ${average} ml/ngày`
                  : 'Tổng hợp theo ngày'}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                aria-pressed={days === option}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  days === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {option} ngày
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>
        ) : query.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(query.error, 'Chưa tải được lịch sử uống nước.')}
            </p>
            <button
              type="button"
              className="text-sm font-medium text-primary underline"
              onClick={() => void query.refetch()}
            >
              Thử lại
            </button>
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {[...data.items].reverse().map((item) => (
              <li key={item.date} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span
                    className={cn(
                      'font-medium',
                      item.goalReached && 'text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    {formatDateOnlyDisplay(item.date)}
                  </span>
                  <span className="text-muted-foreground">
                    {item.consumedMl} / {item.targetMl} ml
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={Math.round(item.visualPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Nước ngày ${formatDateOnlyDisplay(item.date)}`}
                >
                  <div
                    className={cn(
                      'h-full rounded-full',
                      item.goalReached ? 'bg-emerald-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${item.visualPercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có dữ liệu uống nước trong khoảng này.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
