'use client';

import * as React from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  addBusinessWeeks,
  formatBusinessWeekRange,
  getBusinessTodayDateString,
  getBusinessWeekDays,
  getBusinessWeekStart,
  isCurrentBusinessWeek,
} from '@/lib/business-date';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export interface WeekPickerProps {
  /** Thứ Hai dạng YYYY-MM-DD. */
  value: string;
  onChange: (weekStart: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Chọn tuần dùng chung cho meal-plan và workout: lùi/tới tuần, mở lịch tháng
 * để nhảy nhanh, và luôn chuẩn hoá ngày bấm về thứ Hai.
 */
export function WeekPicker({ value, onChange, disabled, className, id }: WeekPickerProps) {
  const [open, setOpen] = React.useState(false);
  const monday = getBusinessWeekStart(value);
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date(`${monday}T00:00:00`));

  const weekDays = React.useMemo(() => new Set(getBusinessWeekDays(monday)), [monday]);
  const gridDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const shiftWeek = (delta: number) => {
    if (disabled) return;
    onChange(addBusinessWeeks(monday, delta));
  };

  const pickDay = (date: Date) => {
    onChange(getBusinessWeekStart(getBusinessTodayDateString(date)));
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Tuần trước"
        onClick={() => shiftWeek(-1)}
        disabled={disabled}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setVisibleMonth(new Date(`${monday}T00:00:00`));
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="min-w-0 flex-1 justify-start gap-2 font-medium"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{formatBusinessWeekRange(monday)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] max-w-[calc(100vw-2rem)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Tháng trước"
              onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-medium">
              {new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(
                visibleMonth
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Tháng sau"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const iso = getBusinessTodayDateString(day);
              const inSelectedWeek = weekDays.has(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDay(day)}
                  aria-pressed={inSelectedWeek}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !isSameMonth(day, visibleMonth) && 'text-muted-foreground/50',
                    inSelectedWeek && 'bg-primary/10 font-semibold text-primary',
                    isToday(day) && 'ring-1 ring-primary'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <p className="text-xs text-muted-foreground">{formatBusinessWeekRange(monday)}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isCurrentBusinessWeek(monday)}
              onClick={() => {
                onChange(getBusinessWeekStart(getBusinessTodayDateString()));
                setOpen(false);
              }}
            >
              Tuần này
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Tuần sau"
        onClick={() => shiftWeek(1)}
        disabled={disabled}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
