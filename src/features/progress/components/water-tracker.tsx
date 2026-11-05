'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Droplets, Plus, CupSoda, Sparkles, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useWaterTodayQuery, useLogWaterMutation } from '../queries/progress.queries';
import { logWaterSchema, LogWaterFormValues } from '../schemas/progress.schema';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  useProgressSession,
} from '../utils/progress-session';

const QUICK_AMOUNTS = [
  { amount: 150, label: '150 ml', desc: 'Cốc nhỏ' },
  { amount: 250, label: '250 ml', desc: 'Cốc chuẩn' },
  { amount: 350, label: '350 ml', desc: 'Cốc lớn' },
  { amount: 500, label: '500 ml', desc: 'Chai nước' },
];

export function WaterTracker() {
  const { sessionId, userId } = useProgressSession();
  const { data: waterToday, isLoading, isError, refetch, isFetching } = useWaterTodayQuery();
  const logMutation = useLogWaterMutation();

  const form = useForm<LogWaterFormValues>({
    resolver: zodResolver(logWaterSchema),
    defaultValues: {
      amountMl: 250,
    },
  });

  // Đồng bộ hóa trạng thái form ngay tại thời điểm render khi phiên thay đổi
  const sessionRef = React.useRef(sessionId);
  if (sessionRef.current !== sessionId) {
    sessionRef.current = sessionId;
    form.reset({ amountMl: 250 });
  }

  // Reset form khi chuyển đổi tài khoản (dọn dẹp bổ sung)
  React.useEffect(() => {
    form.reset({ amountMl: 250 });
  }, [sessionId, userId, form]);

  const handleQuickAdd = async (amountMl: number) => {
    const sessionSnapshot = getProgressSessionContext();
    try {
      await logMutation.mutateAsync({ amountMl });
      if (
        !sessionSnapshot ||
        !isProgressSessionActive(sessionSnapshot.userId, sessionSnapshot.sessionId)
      ) {
        return;
      }
    } catch {
      // Đã xử lý toast tại mutation
    }
  };

  const onCustomSubmit = async (values: LogWaterFormValues) => {
    const sessionSnapshot = getProgressSessionContext();
    try {
      await logMutation.mutateAsync(values);
      if (
        !sessionSnapshot ||
        !isProgressSessionActive(sessionSnapshot.userId, sessionSnapshot.sessionId)
      ) {
        return;
      }
      form.reset({ amountMl: 250 });
    } catch {
      // Đã xử lý toast tại mutation
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
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
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-destructive">
                Không thể tải dữ liệu nước uống
              </CardTitle>
              <CardDescription>
                Đã xảy ra sự cố khi kết nối với máy chủ để lấy thông tin lượng nước hôm nay.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RotateCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const consumedMl = waterToday?.consumedMl ?? 0;
  const targetMl = waterToday?.targetMl ?? 2500;
  const percentComplete = waterToday?.percentComplete ?? 0;
  const visualPercent = waterToday?.visualPercent ?? 0;
  const remainingMl = waterToday?.remainingMl ?? targetMl;
  const isGoalReached = consumedMl >= targetMl;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Droplets className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Lượng nước uống trong ngày</CardTitle>
              <CardDescription>
                Mục tiêu tiêu chuẩn MVP: 2.500 ml mỗi ngày theo chu kỳ UTC.
              </CardDescription>
            </div>
          </div>

          {isGoalReached && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="size-3.5" /> Đã hoàn thành mục tiêu
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chỉ số chính & Thanh tiến trình */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-foreground">
                {consumedMl.toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                / {targetMl.toLocaleString('vi-VN')} ml
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg sm:text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {percentComplete}%
              </span>
              <span className="text-xs text-muted-foreground block">
                {isGoalReached
                  ? 'Vượt mục tiêu'
                  : `Còn thiếu ${remainingMl.toLocaleString('vi-VN')} ml`}
              </span>
            </div>
          </div>

          <Progress value={visualPercent} className="h-3 bg-muted/60" />
        </div>

        {/* Nút bấm thêm nhanh */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Thêm nhanh lượng nước vừa uống:
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {QUICK_AMOUNTS.map((item) => (
              <Button
                key={item.amount}
                type="button"
                variant="outline"
                onClick={() => handleQuickAdd(item.amount)}
                disabled={logMutation.isPending}
                className="h-auto py-2.5 px-3 flex flex-col items-center justify-center gap-1 border-border/70 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                <div className="flex items-center gap-1 font-bold text-sm tabular-nums text-foreground">
                  <CupSoda className="size-3.5 text-blue-500" />+{item.label}
                </div>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Nhập lượng nước tùy chỉnh */}
        <form
          onSubmit={form.handleSubmit(onCustomSubmit)}
          className="pt-2 border-t border-border/40"
        >
          <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
            <div className="space-y-1.5 grow">
              <Label htmlFor="custom-water-ml" className="text-xs font-medium">
                Ghi nhận số lượng khác (1 – 5.000 ml):
              </Label>
              <div className="relative">
                <Input
                  id="custom-water-ml"
                  type="number"
                  min={1}
                  max={5000}
                  placeholder="Nhập số ml nước..."
                  {...form.register('amountMl', { valueAsNumber: true })}
                  className="tabular-nums pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                  ml
                </span>
              </div>
              {form.formState.errors.amountMl && (
                <p className="text-xs text-destructive">{form.formState.errors.amountMl.message}</p>
              )}
            </div>

            <Button type="submit" disabled={logMutation.isPending} className="gap-1.5 shrink-0">
              <Plus className="size-4" />
              {logMutation.isPending ? 'Đang lưu...' : 'Ghi nhận'}
            </Button>
          </div>
        </form>

        {/* Ghi chú chu kỳ UTC */}
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
          <Info className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-pretty">
            Lượng nước trong ngày được tính toán lại từ mốc 00:00 UTC (tức 07:00 giờ sáng theo giờ
            Việt Nam) theo quy định chuẩn của hệ thống Longevia.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
