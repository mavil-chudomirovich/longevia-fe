'use client';

import * as React from 'react';
import { History, ChevronLeft, ChevronRight, Scale, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetricsHistoryQuery } from '../queries/progress.queries';
import { BmiCategoryEnum } from '../types/progress.model';

export function MetricsHistory() {
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const pageSize = 10;

  const {
    data: historyData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useMetricsHistoryQuery({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    pageNumber,
    pageSize,
  });

  const getBmiBadgeStyle = (cat: BmiCategoryEnum) => {
    switch (cat) {
      case BmiCategoryEnum.NORMAL_WEIGHT:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case BmiCategoryEnum.UNDERWEIGHT:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case BmiCategoryEnum.OVERWEIGHT:
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30';
      case BmiCategoryEnum.OBESE:
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setPageNumber(1);
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <History className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Lịch sử chỉ số sinh học</CardTitle>
              <CardDescription>
                Danh sách các lần ghi nhận cân nặng và chỉ số sức khỏe có phân trang.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Bộ lọc ngày */}
        <div className="pt-3 flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="history-from-date" className="text-xs text-muted-foreground">
              Từ ngày
            </Label>
            <Input
              id="history-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPageNumber(1);
              }}
              className="h-8 text-xs w-36"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="history-to-date" className="text-xs text-muted-foreground">
              Đến ngày
            </Label>
            <Input
              id="history-to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPageNumber(1);
              }}
              className="h-8 text-xs w-36"
            />
          </div>

          {(fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs"
            >
              Đặt lại lọc
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-destructive">Không thể tải danh sách lịch sử chỉ số.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !historyData || historyData.items.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="mx-auto p-3 rounded-full bg-muted/40 w-fit text-muted-foreground">
              <Scale className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Chưa có bản ghi lịch sử nào</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto text-pretty">
              {fromDate || toDate
                ? 'Không tìm thấy số đo nào trong khoảng thời gian đã chọn.'
                : 'Bạn chưa ghi nhận mốc cân nặng nào. Hãy ghi nhận số đo đầu tiên ở form bên trên.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Thời điểm</TableHead>
                    <TableHead className="font-semibold text-xs">Cân nặng</TableHead>
                    <TableHead className="font-semibold text-xs">BMI & Phân loại</TableHead>
                    <TableHead className="font-semibold text-xs">Tỷ lệ mỡ</TableHead>
                    <TableHead className="font-semibold text-xs">Vòng eo</TableHead>
                    <TableHead className="font-semibold text-xs">Huyết áp</TableHead>
                    <TableHead className="font-semibold text-xs">Nhịp tim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {item.formattedLoggedAt}
                      </TableCell>
                      <TableCell className="font-bold tabular-nums text-foreground">
                        {item.weightKg} kg
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold tabular-nums text-xs">
                            {item.bmi.toFixed(1)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium border ${getBmiBadgeStyle(
                              item.bmiCategory
                            )}`}
                          >
                            {item.bmiCategoryLabel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {item.bodyFatPercent !== null ? `${item.bodyFatPercent}%` : '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {item.waistCircumferenceCm !== null
                          ? `${item.waistCircumferenceCm} cm`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {item.bloodPressureDisplay ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {item.restingHeartRate !== null ? `${item.restingHeartRate} bpm` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {historyData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-border/60 bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.formattedLoggedAt}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium border ${getBmiBadgeStyle(
                        item.bmiCategory
                      )}`}
                    >
                      {item.bmiCategoryLabel}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold tabular-nums text-foreground">
                        {item.weightKg}
                      </span>
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      BMI:{' '}
                      <strong className="text-foreground tabular-nums">
                        {item.bmi.toFixed(1)}
                      </strong>
                    </div>
                  </div>

                  {(item.bloodPressureDisplay ||
                    item.bodyFatPercent !== null ||
                    item.waistCircumferenceCm !== null ||
                    item.restingHeartRate !== null) && (
                    <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      {item.bloodPressureDisplay && (
                        <span>Huyết áp: {item.bloodPressureDisplay}</span>
                      )}
                      {item.restingHeartRate !== null && (
                        <span>Nhịp tim: {item.restingHeartRate} bpm</span>
                      )}
                      {item.bodyFatPercent !== null && <span>Mỡ: {item.bodyFatPercent}%</span>}
                      {item.waistCircumferenceCm !== null && (
                        <span>Vòng eo: {item.waistCircumferenceCm} cm</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Phân trang chuẩn xác theo Backend contract */}
            <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground flex-wrap gap-2">
              <span className="tabular-nums">
                Hiển thị trang <strong className="text-foreground">{historyData.pageNumber}</strong>{' '}
                / <strong className="text-foreground">{Math.max(1, historyData.totalPages)}</strong>{' '}
                (Tổng cộng {historyData.totalCount} bản ghi)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!historyData.hasPrevPage}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="size-3.5" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!historyData.hasNextPage}
                  className="h-8 gap-1 text-xs"
                >
                  Sau <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
