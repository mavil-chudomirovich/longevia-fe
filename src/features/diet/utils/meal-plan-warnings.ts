import type { MealPlanWarningModel } from '@/features/diet/types/meal-plan.model';

export interface PartitionedWarnings {
  /** Cảnh báo toàn kế hoạch (không gắn với ngày cụ thể). */
  global: MealPlanWarningModel[];
  /** Cảnh báo theo từng ngày, key là `scope` (ISO date). */
  byDate: Record<string, MealPlanWarningModel[]>;
}

/**
 * Backend gắn `scope = <ngày ISO>` cho các cảnh báo theo ngày (ví dụ thiếu chất
 * xơ). Đưa cảnh báo vào đúng card ngày để người đọc thấy ngay tại nơi nó có
 * nghĩa, thay vì một danh sách rời phía trên.
 */
export function partitionWarnings(
  warnings: MealPlanWarningModel[],
  dayDates: string[]
): PartitionedWarnings {
  const dates = new Set(dayDates);
  const byDate: Record<string, MealPlanWarningModel[]> = {};
  const global: MealPlanWarningModel[] = [];

  for (const warning of warnings) {
    if (dates.has(warning.scope)) {
      (byDate[warning.scope] ??= []).push(warning);
    } else {
      global.push(warning);
    }
  }

  return { global, byDate };
}
