'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { useLogBodyMetricMutation } from '@/features/progress/queries/progress.queries';
import { toLocalInputDateTimeString } from '@/features/progress/utils/progress-date';
import { useAuthStore } from '@/store/useAuthStore';

const MIN_WEIGHT_KG = 25;
const MAX_WEIGHT_KG = 300;

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.user?.profile);
  const logWeight = useLogBodyMetricMutation();
  const [weightKg, setWeightKg] = React.useState('');
  const [weightError, setWeightError] = React.useState('');

  const parsedWeight = Number(weightKg);
  const hasWeight = weightKg.trim() !== '';

  const handleSaved = async () => {
    if (hasWeight) {
      if (
        !Number.isFinite(parsedWeight) ||
        parsedWeight < MIN_WEIGHT_KG ||
        parsedWeight > MAX_WEIGHT_KG
      ) {
        setWeightError(`Cân nặng cần nằm trong khoảng ${MIN_WEIGHT_KG} – ${MAX_WEIGHT_KG} kg.`);
        return;
      }
      try {
        await logWeight.mutateAsync({
          loggedAt: toLocalInputDateTimeString(new Date()),
          weightKg: parsedWeight,
          bodyFatPercent: null,
          waistCircumferenceCm: null,
          systolicBloodPressure: null,
          diastolicBloodPressure: null,
          restingHeartRate: null,
        });
      } catch {
        // Lỗi đã được báo bằng toast; hồ sơ vẫn đã lưu nên cho người dùng đi tiếp.
      }
    }
    router.push('/progress');
  };

  return (
    <AuthGuard>
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập hồ sơ sức khỏe</CardTitle>
            <CardDescription>
              Thông tin này giúp Longevia cá nhân hóa mục tiêu và gợi ý. Bạn có thể bỏ qua và bổ
              sung sau trong Hồ sơ cá nhân.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileForm initialProfile={profile} onSaved={handleSaved} />

            <div className="space-y-2 border-t border-border/60 pt-5">
              <Label htmlFor="onboarding-weight">Cân nặng hiện tại (kg, tùy chọn)</Label>
              <Input
                id="onboarding-weight"
                type="number"
                min={MIN_WEIGHT_KG}
                max={MAX_WEIGHT_KG}
                step="0.1"
                inputMode="decimal"
                placeholder="Ví dụ: 65.5"
                value={weightKg}
                onChange={(event) => {
                  setWeightKg(event.target.value);
                  setWeightError('');
                }}
              />
              <p className="text-xs text-muted-foreground">
                Giúp tính BMI và mục tiêu calo ngay sau khi thiết lập. Bạn có thể ghi lại bất cứ lúc
                nào ở trang Tiến trình.
              </p>
              {weightError && (
                <p role="alert" className="text-sm text-destructive">
                  {weightError}
                </p>
              )}
              {logWeight.isPending && (
                <p className="text-xs text-muted-foreground">Đang lưu cân nặng…</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <Button variant="ghost" asChild>
                <Link href="/today">Bỏ qua, để sau</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
