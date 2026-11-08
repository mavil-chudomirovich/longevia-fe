'use client';

import * as React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFoodsQuery, useLogMealMutation } from '../queries/diet.queries';
import type { MealSuggestionModel } from '../types/diet.model';

type SelectedFood = { foodId: string; quantity: string };

type LogMealDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggested?: MealSuggestionModel;
};

export function LogMealDialog(props: LogMealDialogProps) {
  return <LogMealDialogContent key={`${props.open}:${props.suggested?.foodId ?? ''}`} {...props} />;
}

function LogMealDialogContent({ open, onOpenChange, suggested }: LogMealDialogProps) {
  const [search, setSearch] = React.useState(suggested?.name ?? '');
  const [mealType, setMealType] = React.useState('Breakfast');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = React.useState<SelectedFood[]>(
    suggested ? [{ foodId: suggested.foodId, quantity: '1' }] : []
  );
  const [validationError, setValidationError] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const foods = useFoodsQuery({ search: debouncedSearch, pageNumber: 1, pageSize: 20 });
  const mutation = useLogMealMutation();

  const add = (foodId: string) =>
    setSelected((items) =>
      items.some((item) => item.foodId === foodId) || items.length >= 100
        ? items
        : [...items, { foodId, quantity: '1' }]
    );
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
      setValidationError('Nhập số lượng lớn hơn 0, tối đa 1.000.000 và tối đa 3 chữ số thập phân.');
      return;
    }
    setValidationError('');
    await mutation.mutateAsync({
      date,
      mealType,
      items: selected.map((item) => ({ foodId: item.foodId, quantity: Number(item.quantity) })),
    });
    onOpenChange(false);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ghi bữa ăn</DialogTitle>
          <DialogDescription>
            Chọn món và lượng ăn. Dinh dưỡng được lưu thành snapshot tại thời điểm ghi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void save(event)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-date">Ngày (UTC)</Label>
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
          <div className="space-y-2">
            <Label htmlFor="food-search">Tìm món</Label>
            <Input
              id="food-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập tên món"
            />
          </div>
          {foods.isLoading ? (
            <p>Đang tải món…</p>
          ) : foods.isError ? (
            <div>
              <p role="alert">Không thể tải danh sách món.</p>
              <Button type="button" variant="outline" onClick={() => void foods.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : foods.data?.items.length ? (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {foods.data.items.map((food) => (
                <li
                  key={food.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="min-w-0 text-sm">
                    <strong className="block truncate">{food.name}</strong>
                    <span className="text-muted-foreground">
                      {food.servingSize} {food.servingUnit} · {food.calories} kcal
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      selected.length >= 100 || selected.some((item) => item.foodId === food.id)
                    }
                    onClick={() => add(food.id)}
                  >
                    Thêm
                  </Button>
                </li>
              ))}
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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Món trong bữa ({selected.length}/100)</h3>
            {selected.map((item, index) => {
              const food = foods.data?.items.find((candidate) => candidate.id === item.foodId);
              return (
                <div
                  key={item.foodId}
                  className="grid grid-cols-[1fr_7rem_auto] items-center gap-2"
                >
                  <span className="truncate text-sm">
                    {food?.name ??
                      (suggested?.foodId === item.foodId ? suggested.name : item.foodId)}
                  </span>
                  <Input
                    aria-label="Số khẩu phần"
                    type="number"
                    required
                    min="0.001"
                    max="1000000"
                    step="0.001"
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setSelected((items) =>
                        items.filter((_, currentIndex) => currentIndex !== index)
                      )
                    }
                  >
                    Xóa
                  </Button>
                </div>
              );
            })}
          </div>
          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending || !selected.length}>
            {mutation.isPending ? 'Đang lưu…' : 'Lưu vào nhật ký'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
