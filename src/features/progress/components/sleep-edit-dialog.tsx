'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SleepRecord } from '../types/progress.model';
import { useUpdateSleepMutation } from '../queries/progress.queries';
import { logSleepSchema, type LogSleepFormValues } from '../schemas/progress.schema';
import { toLocalInputDateTimeString } from '../utils/progress-date';

const QUALITY_OPTIONS = [
  { value: 'Poor', label: 'Kém' },
  { value: 'Fair', label: 'Trung bình' },
  { value: 'Good', label: 'Tốt' },
  { value: 'Excellent', label: 'Rất tốt' },
] as const;

export function SleepEditDialog({
  record,
  onOpenChange,
}: {
  record: SleepRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateSleepMutation();
  const form = useForm<LogSleepFormValues>({
    resolver: zodResolver(logSleepSchema),
    defaultValues: { sleptAt: '', wokeAt: '', sleepQuality: undefined },
  });

  React.useEffect(() => {
    if (!record) return;
    form.reset({
      sleptAt: toLocalInputDateTimeString(record.sleptAt),
      wokeAt: toLocalInputDateTimeString(record.wokeAt),
      sleepQuality: record.sleepQuality,
    });
  }, [record, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!record) return;
    try {
      await mutation.mutateAsync({ id: record.id, values });
      onOpenChange(false);
    } catch {
      // Toast/hiển thị lỗi đã có ở mutation.
    }
  });

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa bản ghi giấc ngủ</DialogTitle>
          <DialogDescription>
            Cập nhật giờ đi ngủ, giờ thức dậy và chất lượng giấc ngủ. Ngày ghi nhận được tính lại
            theo giờ thức dậy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-slept-at">Thời điểm đi ngủ</Label>
            <Input id="edit-slept-at" type="datetime-local" {...form.register('sleptAt')} />
            {form.formState.errors.sleptAt && (
              <p className="text-xs text-destructive">{form.formState.errors.sleptAt.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-woke-at">Thời điểm thức dậy</Label>
            <Input id="edit-woke-at" type="datetime-local" {...form.register('wokeAt')} />
            {form.formState.errors.wokeAt && (
              <p className="text-xs text-destructive">{form.formState.errors.wokeAt.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sleep-quality">Chất lượng giấc ngủ</Label>
            <select
              id="edit-sleep-quality"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...form.register('sleepQuality')}
            >
              <option value="" disabled>
                Chọn chất lượng
              </option>
              {QUALITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.sleepQuality && (
              <p className="text-xs text-destructive">
                {form.formState.errors.sleepQuality.message}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
