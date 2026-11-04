'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Moon, Clock, Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLogSleepMutation } from '../queries/progress.queries';
import { logSleepSchema, LogSleepFormValues } from '../schemas/progress.schema';
import { SleepRecord } from '../types/progress.model';
import { formatDurationHours, toLocalInputDateTimeString } from '../utils/progress-date';

const QUALITY_OPTIONS: Array<{
  value: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  label: string;
  desc: string;
}> = [
  { value: 'Poor', label: 'Kém', desc: 'Trằn trọc, thức giấc nhiều lần' },
  { value: 'Fair', label: 'Trung bình', desc: 'Ngủ đủ nhưng còn uể oải' },
  { value: 'Good', label: 'Tốt', desc: 'Ngủ sâu, hồi phục năng lượng' },
  { value: 'Excellent', label: 'Rất tốt', desc: 'Tỉnh táo, sảng khoái tối đa' },
];

export function SleepLogForm() {
  const logMutation = useLogSleepMutation();
  const [lastLoggedSleep, setLastLoggedSleep] = React.useState<SleepRecord | null>(null);

  // Mặc định: Giấc ngủ từ 23:00 tối qua đến 07:00 sáng nay
  const getDefaultTimes = () => {
    const now = new Date();
    const wake = new Date(now);
    const slept = new Date(now);
    slept.setHours(slept.getHours() - 8);

    return {
      sleptAt: toLocalInputDateTimeString(slept),
      wokeAt: toLocalInputDateTimeString(wake),
    };
  };

  const form = useForm<LogSleepFormValues>({
    resolver: zodResolver(logSleepSchema),
    defaultValues: {
      ...getDefaultTimes(),
      sleepQuality: 'Good',
    },
  });

  const sleptAtWatch = form.watch('sleptAt');
  const wokeAtWatch = form.watch('wokeAt');
  const sleepQualityWatch = form.watch('sleepQuality');

  // Preview thời lượng giấc ngủ theo thời gian thực
  const durationPreview = React.useMemo(() => {
    if (!sleptAtWatch || !wokeAtWatch) return null;
    const slept = new Date(sleptAtWatch);
    const woke = new Date(wokeAtWatch);

    if (isNaN(slept.getTime()) || isNaN(woke.getTime())) return null;
    if (woke.getTime() <= slept.getTime()) return null;

    const diffHours = (woke.getTime() - slept.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) return null;

    return diffHours;
  }, [sleptAtWatch, wokeAtWatch]);

  const onSubmit = async (values: LogSleepFormValues) => {
    try {
      const record = await logMutation.mutateAsync(values);
      setLastLoggedSleep(record);
      // Giữ nguyên form nhưng reset sang giá trị mặc định mới
      form.reset({
        ...getDefaultTimes(),
        sleepQuality: 'Good',
      });
    } catch {
      // Đã xử lý toast tại mutation
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Moon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Ghi nhận giấc ngủ</CardTitle>
              <CardDescription>
                Giấc ngủ sâu kích hoạt tái tạo tế bào và cân bằng hormone melatonin trường thọ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Giờ đi ngủ */}
              <div className="space-y-2">
                <Label htmlFor="sleep-slept-at">Thời điểm đi ngủ (Slept At)</Label>
                <Input id="sleep-slept-at" type="datetime-local" {...form.register('sleptAt')} />
                {form.formState.errors.sleptAt && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.sleptAt.message}
                  </p>
                )}
              </div>

              {/* Giờ thức dậy */}
              <div className="space-y-2">
                <Label htmlFor="sleep-woke-at">Thời điểm thức dậy (Woke At)</Label>
                <Input id="sleep-woke-at" type="datetime-local" {...form.register('wokeAt')} />
                {form.formState.errors.wokeAt && (
                  <p className="text-xs text-destructive">{form.formState.errors.wokeAt.message}</p>
                )}
              </div>
            </div>

            {/* Preview thời lượng */}
            {durationPreview !== null ? (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-foreground">
                    Tổng thời lượng ước tính:
                  </span>
                </div>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatDurationHours(durationPreview)}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  Thời điểm thức dậy phải sau thời điểm đi ngủ và thời lượng tối đa không vượt quá
                  24 giờ.
                </span>
              </div>
            )}

            {/* Chọn chất lượng giấc ngủ */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Chất lượng giấc ngủ</Label>
              <RadioGroup
                value={sleepQualityWatch}
                onValueChange={(val: 'Poor' | 'Fair' | 'Good' | 'Excellent') =>
                  form.setValue('sleepQuality', val)
                }
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {QUALITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`quality-${opt.value}`}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      sleepQualityWatch === opt.value
                        ? 'border-indigo-600 bg-indigo-500/5 ring-1 ring-indigo-600'
                        : 'border-border/70 hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`quality-${opt.value}`}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-foreground block">
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground block text-pretty">
                        {opt.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {form.formState.errors.sleepQuality && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.sleepQuality.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={logMutation.isPending || durationPreview === null}
              className="w-full sm:w-auto gap-2"
            >
              <Sparkles className="size-4" />
              {logMutation.isPending ? 'Đang lưu giấc ngủ...' : 'Lưu ghi nhận giấc ngủ'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Xác nhận kết quả vừa lưu (Tuân thủ hợp đồng: không hiển thị fake lịch sử) */}
      {lastLoggedSleep && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-semibold text-foreground block">
                  Bản ghi giấc ngủ vừa lưu thành công vào cơ sở dữ liệu
                </span>
                <p className="text-xs text-muted-foreground">
                  Thời lượng:{' '}
                  <strong className="text-foreground">{lastLoggedSleep.formattedDuration}</strong> •
                  Chất lượng:{' '}
                  <strong className="text-foreground">{lastLoggedSleep.sleepQualityLabel}</strong>.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/90 pt-1">
                  <Info className="size-3 shrink-0" />
                  <span>
                    Chỉ số giấc ngủ trung bình dài hạn được tổng hợp và hiển thị trực quan tại trang
                    Tổng quan.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
