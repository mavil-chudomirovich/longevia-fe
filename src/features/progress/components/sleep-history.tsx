'use client';

import * as React from 'react';
import { BedDouble, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { useDeleteSleepMutation, useSleepHistoryQuery } from '../queries/progress.queries';
import { SleepEditDialog } from './sleep-edit-dialog';
import type { SleepRecord } from '../types/progress.model';
import {
  formatDateOnlyDisplay,
  formatDisplayDateTime,
  formatDurationHours,
} from '../utils/progress-date';

const PAGE_SIZE = 10;

export function SleepHistory() {
  const [page, setPage] = React.useState(1);
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<SleepRecord | null>(null);
  const query = useSleepHistoryQuery(page, PAGE_SIZE);
  const remove = useDeleteSleepMutation();
  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
            <BedDouble className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Lịch sử giấc ngủ</CardTitle>
            <CardDescription className="text-xs">
              Các bản ghi đã lưu, mới nhất trước.
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
              {getApiErrorMessage(query.error, 'Chưa tải được lịch sử giấc ngủ.')}
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
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatDisplayDateTime(item.sleptAt)} → {formatDisplayDateTime(item.wokeAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ngày {formatDateOnlyDisplay(item.date)} · {item.sleepQualityLabel} ·{' '}
                      {formatDurationHours(item.durationHours)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sửa bản ghi giấc ngủ"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xoá bản ghi giấc ngủ"
                    onClick={() => setPendingDelete(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {data.totalCount} bản ghi · trang {data.page}/{totalPages}
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có bản ghi giấc ngủ nào. Ghi lại giấc ngủ để xem lịch sử tại đây.
          </p>
        )}
      </CardContent>

      <SleepEditDialog
        record={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Xoá bản ghi giấc ngủ?"
        description="Bản ghi này sẽ bị xoá khỏi lịch sử và không thể khôi phục."
        confirmLabel="Xoá"
        danger
        loading={remove.isPending}
        onConfirm={async () => {
          if (pendingDelete) {
            await remove.mutateAsync(pendingDelete).catch(() => undefined);
          }
          setPendingDelete(null);
        }}
      />
    </Card>
  );
}
