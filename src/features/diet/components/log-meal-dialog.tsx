'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { getBusinessTodayDateString, formatDateOnlyDisplay } from '@/lib/business-date';
import { mealTypeLabel } from '@/common/constants/meal-labels';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toDisplayAllergens } from '@/common/constants/allergen-labels';
import { useFoodsQuery, useLogMealMutation, useReplaceMealMutation } from '../queries/diet.queries';
import { findConflictedAllergens, hasAllergenConflict } from '../utils/allergen-conflicts';
import type { MealSuggestionModel } from '../types/diet.model';

/**
 * `quantity` gửi lên BE tính theo `servingUnit` của món (vd. gam), KHÔNG phải số khẩu phần:
 * BE quy đổi dinh dưỡng = giá trị trên 1 khẩu phần × quantity / servingSize.
 * Mặc định điền đúng 1 khẩu phần (= servingSize).
 */
type SelectedFood = {
  foodId: string;
  name: string;
  quantity: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  allergens: string[] | null;
};

type FoodLike = {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  allergens?: string[] | null;
};

function toSelected(foodId: string, food: FoodLike): SelectedFood {
  return {
    foodId,
    name: food.name,
    quantity: String(food.servingSize),
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    calories: food.calories,
    allergens: food.allergens ?? null,
  };
}

function estimateCalories(item: SelectedFood): number | null {
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || item.servingSize <= 0) return null;
  return Math.round((item.calories * quantity) / item.servingSize);
}

type LogMealDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggested?: MealSuggestionModel;
  initialMealType?: string;
  initialItems?: MealPrefillItem[];
  /** `replace`: thay thế bữa đã có thay vì ghi thêm (dùng ở nút Sửa). */
  mode?: 'log' | 'replace';
  initialDate?: string;
};

export type MealPrefillItem = {
  foodId: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
};

function prefillKey(items?: MealPrefillItem[]): string {
  return items?.map((item) => item.foodId).join(',') ?? '';
}

export function LogMealDialog(props: LogMealDialogProps) {
  return (
    <LogMealDialogContent
      key={`${props.open}:${props.mode ?? 'log'}:${props.initialDate ?? ''}:${props.suggested?.foodId ?? ''}:${props.initialMealType ?? ''}:${prefillKey(props.initialItems)}`}
      {...props}
    />
  );
}

function LogMealDialogContent({
  open,
  onOpenChange,
  suggested,
  initialMealType,
  initialItems,
  mode = 'log',
  initialDate,
}: LogMealDialogProps) {
  const replaceMode = mode === 'replace';
  const [search, setSearch] = React.useState(suggested?.name ?? '');
  const [mealType, setMealType] = React.useState(initialMealType ?? 'Breakfast');
  const [date, setDate] = React.useState(() => initialDate ?? getBusinessTodayDateString());
  const [selected, setSelected] = React.useState<SelectedFood[]>(
    initialItems?.length
      ? initialItems.map((item) => toSelected(item.foodId, item))
      : suggested
        ? [toSelected(suggested.foodId, suggested)]
        : []
  );
  const [validationError, setValidationError] = React.useState('');
  const [acknowledgedAllergens, setAcknowledgedAllergens] = React.useState(false);
  const userAllergies = useAuthStore((state) => state.user?.profile?.allergies ?? []);
  const debouncedSearch = useDebounce(search, 300);
  const foods = useFoodsQuery({ search: debouncedSearch, pageNumber: 1, pageSize: 20 });
  const mutation = useLogMealMutation();
  const replaceMutation = useReplaceMealMutation();
  const isSaving = replaceMode ? replaceMutation.isPending : mutation.isPending;

  // Gom cảnh báo dị ứng của các món đã chọn (khớp tag canonical của BE với hồ sơ).
  const allergenWarnings = React.useMemo(
    () =>
      selected.flatMap((item) =>
        findConflictedAllergens(item.allergens, userAllergies).map((conflict) => ({
          foodName: item.name,
          foodId: item.foodId,
          tag: conflict.tag,
          allergy: conflict.allergy,
        }))
      ),
    [selected, userAllergies]
  );
  const hasAllergenWarnings = allergenWarnings.length > 0;

  const add = (foodId: string, food: FoodLike) => {
    if (selected.some((item) => item.foodId === foodId) || selected.length >= 100) return;
    setAcknowledgedAllergens(false);
    setSelected((items) => [...items, toSelected(foodId, food)]);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !selected.length ||
      selected.some(
        (item) =>
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          Number(item.quantity) > 1_000_000 ||
          (Number(item.quantity) * 1000) % 1 !== 0
      )
    ) {
      setValidationError(
        'Nhập lượng ăn lớn hơn 0 (theo đơn vị của món), tối đa 1.000.000 và tối đa 3 chữ số thập phân.'
      );
      return;
    }
    setValidationError('');
    if (hasAllergenWarnings && !acknowledgedAllergens) {
      setValidationError(
        'Có món trùng với dị ứng trong hồ sơ của bạn. Hãy xác nhận “Tôi vẫn muốn ghi món này” hoặc bỏ món đó.'
      );
      return;
    }
    try {
      const payload = {
        date,
        mealType,
        items: selected.map((item) => ({ foodId: item.foodId, quantity: Number(item.quantity) })),
      };
      if (replaceMode) {
        await replaceMutation.mutateAsync(payload);
      } else {
        await mutation.mutateAsync(payload);
      }
    } catch {
      // Lỗi đã được báo trong mutation; giữ dialog mở để người dùng sửa và gửi lại.
      return;
    }
    onOpenChange(false);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{replaceMode ? 'Sửa bữa ăn' : 'Ghi bữa ăn'}</DialogTitle>
          <DialogDescription>
            {replaceMode
              ? 'Thay thế toàn bộ món của bữa này. Các bữa khác trong ngày không bị ảnh hưởng.'
              : 'Chọn món và lượng ăn theo đơn vị của món (vd. gam). Mặc định điền sẵn 1 khẩu phần. Giá trị dinh dưỡng được ghi lại đúng như lúc bạn lưu.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          {replaceMode ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              Đang sửa <strong>{mealTypeLabel(mealType)}</strong> ngày{' '}
              <strong>{formatDateOnlyDisplay(date)}</strong>.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meal-date">Ngày</Label>
                <Input
                  id="meal-date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-type">Bữa</Label>
                <select
                  id="meal-type"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                >
                  <option value="Breakfast">Sáng</option>
                  <option value="Lunch">Trưa</option>
                  <option value="Dinner">Tối</option>
                  <option value="Snack">Bữa phụ</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="space-y-2">
              <Label htmlFor="food-search">Chọn món</Label>
              <Input
                id="food-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập tên món để tìm"
              />
              {foods.isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải món…</p>
              ) : foods.isError ? (
                <div className="space-y-2">
                  <p role="alert" className="text-sm text-destructive">
                    Không thể tải danh sách món.
                  </p>
                  <Button type="button" variant="outline" onClick={() => void foods.refetch()}>
                    Thử lại
                  </Button>
                </div>
              ) : foods.data?.items.length ? (
                <ul className="max-h-[42dvh] space-y-2 overflow-y-auto rounded-lg border p-2">
                  {foods.data.items.map((food) => {
                    const conflict = hasAllergenConflict(food.allergens, userAllergies);
                    return (
                      <li
                        key={food.id}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                      >
                        <span className="min-w-0 text-sm">
                          <strong className="flex items-center gap-1.5 truncate">
                            {food.name}
                            {conflict && (
                              <Badge variant="destructive" className="shrink-0 text-[10px]">
                                Dị ứng
                              </Badge>
                            )}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {food.servingSize} {food.servingUnit} · {food.calories} kcal
                          </span>
                          {conflict && (
                            <span className="block text-[11px] text-destructive">
                              Trùng dị ứng: {toDisplayAllergens(food.allergens).join(', ')}
                            </span>
                          )}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            selected.length >= 100 ||
                            selected.some((item) => item.foodId === food.id)
                          }
                          onClick={() => add(food.id, food)}
                        >
                          Thêm
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy món. Bạn có thể{' '}
                  <a className="text-primary underline" href="/diet/foods">
                    tạo món riêng
                  </a>
                  .
                </p>
              )}
            </section>

            <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Món đã chọn ({selected.length}/100)</h3>
                {selected.length > 0 && (
                  <span className="text-xs font-medium text-foreground">
                    ≈ {selected.reduce((sum, item) => sum + (estimateCalories(item) ?? 0), 0)} kcal
                  </span>
                )}
              </div>
              {selected.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                  Chưa chọn món nào.
                  <br />
                  Bấm “Thêm” ở danh sách bên trái.
                </div>
              ) : (
                <div className="max-h-[42dvh] space-y-2 overflow-y-auto pr-1">
                  {selected.map((item, index) => {
                    const estimated = estimateCalories(item);
                    return (
                      <div
                        key={item.foodId}
                        className="space-y-1.5 rounded-md border bg-background p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              1 khẩu phần = {item.servingSize} {item.servingUnit}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Xoá ${item.name}`}
                            onClick={() => {
                              setAcknowledgedAllergens(false);
                              setSelected((items) =>
                                items.filter((_, currentIndex) => currentIndex !== index)
                              );
                            }}
                          >
                            Xoá
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Lượng ăn (${item.servingUnit})`}
                            type="number"
                            required
                            min="0.001"
                            max="1000000"
                            step="0.001"
                            className="h-8 w-24"
                            value={item.quantity}
                            onChange={(event) => {
                              setValidationError('');
                              setSelected((items) =>
                                items.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? { ...current, quantity: event.target.value }
                                    : current
                                )
                              );
                            }}
                          />
                          <span className="text-xs text-muted-foreground">{item.servingUnit}</span>
                          <span className="ml-auto text-xs font-medium text-foreground">
                            {estimated !== null ? `≈ ${estimated} kcal` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {hasAllergenWarnings && (
            <div
              role="alert"
              className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
            >
              <p className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Món đã chọn trùng với dị ứng trong hồ sơ
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-destructive">
                {allergenWarnings.map((warning) => (
                  <li key={`${warning.foodId}-${warning.tag}`}>
                    {warning.foodName}: chứa “{warning.tag}”, bạn đã khai báo dị ứng “
                    {warning.allergy}”.
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={acknowledgedAllergens}
                  onChange={(event) => {
                    setAcknowledgedAllergens(event.target.checked);
                    if (event.target.checked) setValidationError('');
                  }}
                />
                Tôi vẫn muốn ghi món này (đã hiểu nguy cơ dị ứng).
              </label>
            </div>
          )}

          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}

          <div className="flex justify-end border-t pt-3">
            <Button type="submit" disabled={isSaving || !selected.length}>
              {isSaving ? 'Đang lưu…' : replaceMode ? 'Lưu thay đổi' : 'Lưu vào nhật ký'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
