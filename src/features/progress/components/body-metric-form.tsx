'use client';

import * as React from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Activity, Heart, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLogBodyMetricMutation } from '../queries/progress.queries';
import { logBodyMetricSchema, LogBodyMetricFormValues } from '../schemas/progress.schema';
import { BodyMetricRecord, BmiCategoryEnum } from '../types/progress.model';
import { toLocalInputDateTimeString } from '../utils/progress-date';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  useProgressSession,
} from '../utils/progress-session';

interface BodyMetricFormProps {
  onSuccessLogged?: (record: BodyMetricRecord) => void;
}

const toNullableNumber = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

interface SavedMetricState {
  record: BodyMetricRecord;
  ownerUserId: string;
  ownerSessionId: string;
}

export function BodyMetricForm({ onSuccessLogged }: BodyMetricFormProps) {
  const { sessionId } = useProgressSession();
  // Finding C: Khóa phiên ổn định (stable session key) giúp React tái khởi tạo form sạch sẽ
  // khi phiên đăng nhập thay đổi mà không gọi form.reset() trong render phase.
  // Trong quá trình token refresh âm thầm cùng phiên, sessionId được giữ nguyên nên form không bị unmount.
  return (
    <BodyMetricFormInner key={sessionId || 'unauthenticated'} onSuccessLogged={onSuccessLogged} />
  );
}

function BodyMetricFormInner({ onSuccessLogged }: BodyMetricFormProps) {
  const { sessionId, userId } = useProgressSession();
  const logMutation = useLogBodyMetricMutation();
  const [savedRecordState, setSavedRecordState] = React.useState<SavedMetricState | null>(null);

  // Ràng buộc quyền sở hữu phiên đồng bộ tại thời điểm render:
  // Loại bỏ triệt để nguy cơ hiển thị flash kết quả riêng tư của User A trong frame commit đầu tiên của User B
  const visibleRecord = React.useMemo(() => {
    if (!savedRecordState) return null;
    if (
      !userId ||
      !sessionId ||
      savedRecordState.ownerUserId !== userId ||
      savedRecordState.ownerSessionId !== sessionId
    ) {
      return null;
    }
    return savedRecordState.record;
  }, [savedRecordState, userId, sessionId]);

  const form = useForm<LogBodyMetricFormValues>({
    resolver: zodResolver(logBodyMetricSchema),
    defaultValues: {
      loggedAt: toLocalInputDateTimeString(new Date()),
      weightKg: 70.0,
      bodyFatPercent: null,
      waistCircumferenceCm: null,
      systolicBloodPressure: null,
      diastolicBloodPressure: null,
      restingHeartRate: null,
    },
  });

  const onSubmit = async (values: LogBodyMetricFormValues) => {
    const sessionSnapshot = getProgressSessionContext();
    try {
      const record = await logMutation.mutateAsync(values);
      if (
        !sessionSnapshot ||
        !isProgressSessionActive(sessionSnapshot.userId, sessionSnapshot.sessionId)
      ) {
        return;
      }
      setSavedRecordState({
        record,
        ownerUserId: sessionSnapshot.userId,
        ownerSessionId: sessionSnapshot.sessionId,
      });
      if (onSuccessLogged) {
        onSuccessLogged(record);
      }
      form.reset({
        loggedAt: toLocalInputDateTimeString(new Date()),
        weightKg: values.weightKg,
        bodyFatPercent: null,
        waistCircumferenceCm: null,
        systolicBloodPressure: null,
        diastolicBloodPressure: null,
        restingHeartRate: null,
      });
    } catch {
      // Đã xử lý toast tại mutation hook
    }
  };

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

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Ghi nhận chỉ số cơ thể & BMI</CardTitle>
              <CardDescription>
                Hệ thống tự động đồng bộ chiều cao từ hồ sơ để tính toán chỉ số khối cơ thể (BMI)
                chuẩn xác.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hàng 1: Thời điểm & Cân nặng (Bắt buộc) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric-weight" className="flex items-center gap-1 font-semibold">
                  Cân nặng (kg) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="metric-weight"
                    type="number"
                    step="0.1"
                    min="25.0"
                    max="300.0"
                    defaultValue={70.0}
                    placeholder="VD: 68.5"
                    {...form.register('weightKg', {
                      setValueAs: (v) => (v === '' ? NaN : Number(v)),
                    })}
                    className="tabular-nums pr-12 font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                    kg
                  </span>
                </div>
                {form.formState.errors.weightKg && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.weightKg.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-logged-at" className="font-semibold">
                  Thời điểm ghi nhận
                </Label>
                <Input
                  id="metric-logged-at"
                  type="datetime-local"
                  defaultValue={toLocalInputDateTimeString(new Date())}
                  {...form.register('loggedAt')}
                />
                {form.formState.errors.loggedAt && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.loggedAt.message}
                  </p>
                )}
              </div>
            </div>

            {/* Hàng 2: Tỷ lệ mỡ & Vòng eo (Không bắt buộc) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="space-y-2">
                <Label htmlFor="metric-body-fat" className="text-xs text-muted-foreground">
                  Tỷ lệ mỡ cơ thể (tùy chọn)
                </Label>
                <div className="relative">
                  <Input
                    id="metric-body-fat"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100.0"
                    placeholder="VD: 18.5"
                    {...form.register('bodyFatPercent', {
                      setValueAs: toNullableNumber,
                    })}
                    className="tabular-nums pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
                {form.formState.errors.bodyFatPercent && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bodyFatPercent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-waist" className="text-xs text-muted-foreground">
                  Vòng eo (tùy chọn)
                </Label>
                <div className="relative">
                  <Input
                    id="metric-waist"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="300.0"
                    placeholder="VD: 78.0"
                    {...form.register('waistCircumferenceCm', {
                      setValueAs: toNullableNumber,
                    })}
                    className="tabular-nums pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    cm
                  </span>
                </div>
                {form.formState.errors.waistCircumferenceCm && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.waistCircumferenceCm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Hàng 3: Huyết áp (đi theo cặp) & Nhịp tim */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Heart className="size-3.5 text-rose-500" />
                <span>Chỉ số tim mạch (tùy chọn):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric-systolic" className="text-xs text-muted-foreground">
                    Huyết áp tâm thu (Systolic)
                  </Label>
                  <div className="relative">
                    <Input
                      id="metric-systolic"
                      type="number"
                      placeholder="VD: 120"
                      {...form.register('systolicBloodPressure', {
                        setValueAs: toNullableNumber,
                      })}
                      className="tabular-nums pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                      mmHg
                    </span>
                  </div>
                  {form.formState.errors.systolicBloodPressure && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.systolicBloodPressure.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric-diastolic" className="text-xs text-muted-foreground">
                    Huyết áp tâm trương (Diastolic)
                  </Label>
                  <div className="relative">
                    <Input
                      id="metric-diastolic"
                      type="number"
                      placeholder="VD: 80"
                      {...form.register('diastolicBloodPressure', {
                        setValueAs: toNullableNumber,
                      })}
                      className="tabular-nums pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                      mmHg
                    </span>
                  </div>
                  {form.formState.errors.diastolicBloodPressure && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.diastolicBloodPressure.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric-heart-rate" className="text-xs text-muted-foreground">
                    Nhịp tim lúc nghỉ (Heart Rate)
                  </Label>
                  <div className="relative">
                    <Input
                      id="metric-heart-rate"
                      type="number"
                      placeholder="VD: 65"
                      {...form.register('restingHeartRate', {
                        setValueAs: toNullableNumber,
                      })}
                      className="tabular-nums pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                      bpm
                    </span>
                  </div>
                  {form.formState.errors.restingHeartRate && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.restingHeartRate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={logMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              <Activity className="size-4" />
              {logMutation.isPending ? 'Đang lưu và tính BMI...' : 'Lưu chỉ số cơ thể'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Banner kết quả phản hồi BMI chính thức từ backend sau khi lưu */}
      {visibleRecord && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-xs">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-semibold text-foreground block">
                  Đã ghi nhận chỉ số thành công vào cơ sở dữ liệu!
                </span>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Cân nặng:{' '}
                    <strong className="text-foreground tabular-nums">
                      {visibleRecord.weightKg} kg
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="text-xs text-muted-foreground">
                    Chỉ số BMI:{' '}
                    <strong className="text-foreground tabular-nums">
                      {visibleRecord.bmi.toFixed(1)}
                    </strong>
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-semibold ${getBmiBadgeStyle(
                      visibleRecord.bmiCategory
                    )}`}
                  >
                    {visibleRecord.bmiCategoryLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner trợ giúp khi gặp lỗi thiếu chiều cao hồ sơ */}
      {logMutation.isError &&
        axios.isAxiosError(logMutation.error) &&
        logMutation.error?.response?.status === 422 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-sm font-bold text-foreground">
                Cần cập nhật chiều cao trong Hồ sơ người dùng
              </span>
              <p className="text-xs text-muted-foreground text-pretty">
                Dịch vụ Progress cần thông tin chiều cao để tính toán BMI chuẩn xác. Vui lòng mở
                trang Hồ sơ cá nhân để thiết lập chiều cao.
              </p>
              <div className="pt-1">
                <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                  <Link href="/profile">
                    Đến trang Hồ sơ cá nhân <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
