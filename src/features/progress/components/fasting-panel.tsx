'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flame, Clock, Play, Square, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCurrentFastingQuery,
  useStartFastingMutation,
  useEndFastingMutation,
} from '../queries/progress.queries';
import { startFastingSchema, StartFastingFormValues } from '../schemas/progress.schema';
import {
  formatDisplayDateTime,
  formatDurationHours,
  toLocalInputDateTimeString,
} from '../utils/progress-date';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  useProgressSession,
} from '../utils/progress-session';

export function FastingPanel() {
  const { sessionId, userId } = useProgressSession();
  const {
    data: currentSession,
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    refetch: refetchCurrent,
    isFetching: isFetchingCurrent,
  } = useCurrentFastingQuery();
  const startMutation = useStartFastingMutation();
  const endMutation = useEndFastingMutation();

  const [confirmEndOpen, setConfirmEndOpen] = React.useState(false);
  const [modalState, setModalState] = React.useState<{
    data: {
      actualHours: number;
      targetHours: number;
      isGoalReached: boolean;
    };
    ownerUserId: string;
    ownerSessionId: string;
  } | null>(null);

  // Tự động xóa sạch modal kết quả và đóng dialog khi người dùng đăng xuất hoặc đổi tài khoản
  React.useEffect(() => {
    setModalState(null);
    setConfirmEndOpen(false);
  }, [sessionId, userId]);

  // Ràng buộc quyền sở hữu phiên đồng bộ tại thời điểm render:
  // Ngăn chặn mở modal kết quả nhịn ăn của User A cho User B trong frame commit đầu tiên
  const visibleModal = React.useMemo(() => {
    if (!modalState) return null;
    if (
      !userId ||
      !sessionId ||
      modalState.ownerUserId !== userId ||
      modalState.ownerSessionId !== sessionId
    ) {
      return null;
    }
    return modalState.data;
  }, [modalState, userId, sessionId]);

  // Form bắt đầu nhịn ăn
  const form = useForm<StartFastingFormValues>({
    resolver: zodResolver(startFastingSchema),
    defaultValues: {
      protocol: '16:8',
      startedAt: toLocalInputDateTimeString(new Date()),
      targetHours: 16,
    },
  });

  const selectedProtocol = form.watch('protocol');

  // Tự động gán targetHours tương ứng với preset protocol
  React.useEffect(() => {
    if (selectedProtocol === '16:8') {
      form.setValue('targetHours', 16);
    } else if (selectedProtocol === '18:6') {
      form.setValue('targetHours', 18);
    } else if (selectedProtocol === '20:4') {
      form.setValue('targetHours', 20);
    }
  }, [selectedProtocol, form]);

  // Client-side visual timer: cập nhật mỗi 30s để thanh tiến trình nhích dần
  const [nowInstant, setNowInstant] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!currentSession) return;
    const interval = setInterval(() => {
      setNowInstant(Date.now());
    }, 10000); // 10s
    return () => clearInterval(interval);
  }, [currentSession]);

  // Tính toán thời gian thực tại phía client dựa trên instant chuẩn từ server
  const liveStats = React.useMemo(() => {
    if (!currentSession) return null;
    const startMs = currentSession.startedAt.getTime();
    const targetEndMs = currentSession.targetEndedAt.getTime();
    const elapsedMs = Math.max(0, nowInstant - startMs);
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    const remainingMs = Math.max(0, targetEndMs - nowInstant);
    const remainingHours = remainingMs / (1000 * 60 * 60);

    const progressPercent =
      currentSession.targetHours > 0
        ? Math.round((elapsedHours / currentSession.targetHours) * 100)
        : 0;

    const visualPercent = Math.min(100, Math.max(0, progressPercent));
    const isGoalReached = elapsedHours >= currentSession.targetHours;

    return {
      elapsedHours,
      remainingHours,
      progressPercent,
      visualPercent,
      isGoalReached,
    };
  }, [currentSession, nowInstant]);

  const onStartSubmit = async (values: StartFastingFormValues) => {
    const sessionSnapshot = getProgressSessionContext();
    try {
      await startMutation.mutateAsync(values);
      if (
        !sessionSnapshot ||
        !isProgressSessionActive(sessionSnapshot.userId, sessionSnapshot.sessionId)
      ) {
        return;
      }
      form.reset({
        protocol: '16:8',
        startedAt: toLocalInputDateTimeString(new Date()),
        targetHours: 16,
      });
    } catch {
      // Đã toast tại mutation handler
    }
  };

  const handleConfirmEnd = async () => {
    if (!currentSession) return;
    const sessionSnapshot = getProgressSessionContext();
    try {
      const result = await endMutation.mutateAsync({
        sessionId: currentSession.sessionId,
        endedAt: toLocalInputDateTimeString(new Date()),
      });
      if (
        !sessionSnapshot ||
        !isProgressSessionActive(sessionSnapshot.userId, sessionSnapshot.sessionId)
      ) {
        setConfirmEndOpen(false);
        return;
      }
      setConfirmEndOpen(false);
      setModalState({
        data: {
          actualHours: result.actualHours,
          targetHours: result.targetHours,
          isGoalReached: result.isGoalReached,
        },
        ownerUserId: sessionSnapshot.userId,
        ownerSessionId: sessionSnapshot.sessionId,
      });
    } catch {
      // Đã toast tại mutation handler
    }
  };

  return (
    <div className="space-y-6">
      {isLoadingCurrent ? (
        <Card className="border-border/60">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <Clock className="size-4 animate-spin" /> Đang tải trạng thái nhịn ăn...
            </div>
          </CardContent>
        </Card>
      ) : isErrorCurrent ? (
        /* Trạng thái lỗi: Hiển thị thông báo và nút thử lại, không hiển thị form nhịn ăn sai ngữ cảnh */
        <Card className="border-border/60 shadow-xs border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl text-destructive">
                  Không thể tải trạng thái nhịn ăn
                </CardTitle>
                <CardDescription>
                  Đã xảy ra sự cố khi kết nối với máy chủ. Vui lòng thử lại để kiểm tra phiên nhịn
                  ăn hiện tại của bạn.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchCurrent()}
              disabled={isFetchingCurrent}
              className="gap-2"
            >
              <RotateCcw className={`size-4 ${isFetchingCurrent ? 'animate-spin' : ''}`} />
              {isFetchingCurrent ? 'Đang thử lại...' : 'Thử lại'}
            </Button>
          </CardContent>
        </Card>
      ) : currentSession ? (
        /* Trạng thái 1: Đang có phiên nhịn ăn đang hoạt động */
        <Card className="border-border/60 shadow-sm border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="gap-1 bg-amber-600 hover:bg-amber-600 text-white font-semibold"
                  >
                    <Flame className="size-3.5 fill-current" />
                    Phiên nhịn ăn đang hoạt động
                  </Badge>
                  <Badge variant="outline" className="font-semibold text-primary">
                    Giao thức {currentSession.protocol} ({currentSession.targetHours}h)
                  </Badge>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-balance">
                  {liveStats?.isGoalReached
                    ? '🎉 Chúc mừng! Bạn đã đạt mục tiêu'
                    : 'Đang trong quá trình nhịn ăn'}
                </CardTitle>
                <CardDescription className="text-pretty">
                  Bắt đầu lúc {formatDisplayDateTime(currentSession.startedAt)}
                </CardDescription>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmEndOpen(true)}
                disabled={endMutation.isPending}
                className="gap-1.5 shadow-xs"
              >
                <Square className="size-4" />
                Kết thúc phiên
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* Thanh tiến trình */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                <span className="text-muted-foreground">Tiến độ hoàn thành:</span>
                <span className="font-bold tabular-nums text-foreground">
                  {liveStats?.progressPercent}%
                </span>
              </div>
              <Progress value={liveStats?.visualPercent ?? 0} className="h-3 bg-muted/60" />
            </div>

            {/* Các con số thống kê */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-xs text-muted-foreground block">Đã nhịn được</span>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatDurationHours(liveStats?.elapsedHours ?? currentSession.elapsedHours)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60">
                <span className="text-xs text-muted-foreground block">
                  {liveStats?.isGoalReached ? 'Vượt mục tiêu' : 'Thời gian còn lại'}
                </span>
                <span
                  className={`text-lg sm:text-xl font-bold tracking-tight tabular-nums ${
                    liveStats?.isGoalReached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground'
                  }`}
                >
                  {liveStats?.isGoalReached
                    ? `+${formatDurationHours(
                        (liveStats?.elapsedHours ?? 0) - currentSession.targetHours
                      )}`
                    : formatDurationHours(
                        liveStats?.remainingHours ?? currentSession.remainingHours
                      )}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/60 col-span-2 sm:col-span-1">
                <span className="text-xs text-muted-foreground block">Mốc dự kiến kết thúc</span>
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {formatDisplayDateTime(currentSession.targetEndedAt)}
                </span>
              </div>
            </div>

            {/* Ghi chú khoa học trường thọ */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
              <Clock className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-pretty">
                Sau 12–14 giờ nhịn ăn, cơ thể bắt đầu chuyển dịch sang quá trình tự thực bào
                (Autophagy) giúp tái tạo tế bào già cỗi và cải thiện độ nhạy insulin.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Trạng thái 2: Không có phiên nhịn ăn -> Form bắt đầu phiên mới */
        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Bắt đầu phiên nhịn ăn mới</CardTitle>
                <CardDescription>
                  Chọn giao thức phù hợp với lịch sinh hoạt và mục tiêu trường thọ của bạn.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onStartSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chọn Protocol */}
                <div className="space-y-2">
                  <Label htmlFor="fasting-protocol">Giao thức nhịn ăn</Label>
                  <Select
                    value={selectedProtocol}
                    onValueChange={(val: '16:8' | '18:6' | '20:4' | 'Custom') =>
                      form.setValue('protocol', val)
                    }
                  >
                    <SelectTrigger id="fasting-protocol">
                      <SelectValue placeholder="Chọn giao thức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:8">
                        16:8 — 16 giờ nhịn / 8 giờ ăn (Khuyên dùng)
                      </SelectItem>
                      <SelectItem value="18:6">18:6 — 18 giờ nhịn / 6 giờ ăn (Nâng cao)</SelectItem>
                      <SelectItem value="20:4">
                        20:4 — 20 giờ nhịn / 4 giờ ăn (Chuyên sâu)
                      </SelectItem>
                      <SelectItem value="Custom">Custom — Tự chọn số giờ (1–24 giờ)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.protocol && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.protocol.message}
                    </p>
                  )}
                </div>

                {/* Số giờ mục tiêu */}
                <div className="space-y-2">
                  <Label htmlFor="fasting-target">Mục tiêu nhịn ăn (giờ)</Label>
                  <Input
                    id="fasting-target"
                    type="number"
                    min={1}
                    max={24}
                    disabled={selectedProtocol !== 'Custom'}
                    {...form.register('targetHours', { valueAsNumber: true })}
                    className="tabular-nums"
                  />
                  {form.formState.errors.targetHours && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.targetHours.message}
                    </p>
                  )}
                </div>

                {/* Thời điểm bắt đầu */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fasting-started-at">Thời điểm bắt đầu nhịn</Label>
                  <Input
                    id="fasting-started-at"
                    type="datetime-local"
                    {...form.register('startedAt')}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Mặc định là thời gian hiện tại. Không được chọn thời điểm trong tương lai.
                  </p>
                  {form.formState.errors.startedAt && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.startedAt.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={startMutation.isPending}
                  className="w-full sm:w-auto gap-2"
                >
                  <Play className="size-4" />
                  {startMutation.isPending ? 'Đang kích hoạt...' : 'Bắt đầu nhịn ăn ngay'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dialog xác nhận kết thúc phiên nhịn ăn */}
      <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Xác nhận kết thúc phiên nhịn ăn?
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Hệ thống sẽ ghi nhận thời gian thực tế bạn đã hoàn thành phiên nhịn ăn này vào cơ sở
              dữ liệu.
            </DialogDescription>
          </DialogHeader>

          {currentSession && liveStats && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/60 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian đã nhịn:</span>
                <span className="font-semibold tabular-nums">
                  {formatDurationHours(liveStats.elapsedHours)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mục tiêu ban đầu:</span>
                <span className="font-semibold tabular-nums">{currentSession.targetHours} giờ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span
                  className={`font-semibold ${
                    liveStats.isGoalReached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {liveStats.isGoalReached ? 'Đã đạt mục tiêu' : 'Chưa đủ mục tiêu'}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmEndOpen(false)}
              disabled={endMutation.isPending}
            >
              Hủy, tiếp tục nhịn
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmEnd}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? 'Đang lưu...' : 'Xác nhận kết thúc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chúc mừng / tổng kết kết quả phiên vừa kết thúc */}
      <Dialog open={!!visibleModal} onOpenChange={(open) => !open && setModalState(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto my-2 p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
            <CheckCircle2 className="size-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {visibleModal?.isGoalReached
                ? 'Xuất sắc! Bạn đã hoàn thành mục tiêu!'
                : 'Phiên nhịn ăn đã được ghi nhận'}
            </DialogTitle>
            <DialogDescription className="text-center text-pretty">
              {visibleModal?.isGoalReached
                ? `Bạn đã kiên trì nhịn ăn trong ${formatDurationHours(
                    visibleModal?.actualHours ?? 0
                  )}, vượt qua mốc ${visibleModal?.targetHours} giờ đề ra.`
                : `Bạn đã nhịn ăn được ${formatDurationHours(
                    visibleModal?.actualHours ?? 0
                  )}. Mọi nỗ lực đều giúp tế bào phục hồi tốt hơn.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setModalState(null)} className="gap-1.5">
              <RotateCcw className="size-4" /> Tiếp tục theo dõi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
