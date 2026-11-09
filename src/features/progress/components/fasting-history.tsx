'use client';

import * as React from 'react';
import { CheckCircle2, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/shared/pagination';
import { getApiErrorMessage } from '@/lib/api-error';
import { useFastingHistoryQuery } from '../queries/progress.queries';
import { formatDisplayDateTime, formatDurationHours } from '../utils/progress-date';

const PAGE_SIZE = 10;

export function FastingHistory() {
  const [page, setPage] = React.useState(1);
  const query = useFastingHistoryQuery(page, PAGE_SIZE);
  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <History className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Lịch sử nhịn ăn</CardTitle>
            <CardDescription className="text-xs">
              Các phiên đã kết thúc, mới nhất trước.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>
        ) : query.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(query.error, 'Chưa tải được lịch sử nhịn ăn.')}
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
          <>
            <ul className="divide-y divide-border/50">
              {data.items.map((item) => (
                <li
                  key={item.sessionId}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatDisplayDateTime(item.startedAt)} →{' '}
                      {formatDisplayDateTime(item.endedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Giao thức {item.protocol} · mục tiêu {item.targetHours} giờ · thực tế{' '}
                      {formatDurationHours(item.actualHours)}
                    </p>
                  </div>
                  {item.isGoalReached ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Đạt mục tiêu
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Chưa đạt
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {data.totalCount} phiên · trang {data.page}/{totalPages}
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có phiên nhịn ăn nào hoàn thành. Kết thúc một phiên để xem lịch sử tại đây.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
