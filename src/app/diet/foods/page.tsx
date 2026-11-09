'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { createFoodSchema, type CreateFoodValues } from '@/features/diet/schemas/diet.schema';
import {
  useCreateFoodMutation,
  useDeleteFoodMutation,
  useFoodsQuery,
  useUpdateFoodMutation,
} from '@/features/diet/queries/diet.queries';
import type { FoodModel } from '@/features/diet/types/diet.model';

const defaults: CreateFoodValues = {
  name: '',
  category: '',
  servingSize: '100',
  servingUnit: 'g',
  calories: '0',
  proteinGrams: '0',
  carbsGrams: '0',
  fatGrams: '0',
  fiberGrams: '0',
  allergens: [],
};
const nutrientFields = [
  'calories',
  'proteinGrams',
  'carbsGrams',
  'fatGrams',
  'fiberGrams',
] as const;

function toValues(food: FoodModel): CreateFoodValues {
  return {
    name: food.name,
    category: food.category,
    servingSize: String(food.servingSize),
    servingUnit: food.servingUnit,
    calories: String(food.calories),
    proteinGrams: String(food.proteinGrams),
    carbsGrams: String(food.carbsGrams),
    fatGrams: String(food.fatGrams),
    fiberGrams: String(food.fiberGrams),
    allergens: food.allergens ?? [],
  };
}

function CreateFoodForm({ initial, onDone }: { initial?: FoodModel; onDone?: () => void }) {
  const form = useForm<CreateFoodValues>({
    resolver: zodResolver(createFoodSchema),
    defaultValues: initial ? toValues(initial) : defaults,
  });
  const createMutation = useCreateFoodMutation();
  const updateMutation = useUpdateFoodMutation();
  const mutation = initial ? updateMutation : createMutation;
  const isEditing = Boolean(initial);
  const [allergen, setAllergen] = React.useState('');
  const add = () => {
    const value = allergen.trim();
    const current = form.getValues('allergens');
    if (value && !current.includes(value) && current.length < 32)
      form.setValue('allergens', [...current, value]);
    setAllergen('');
  };
  const submit = form.handleSubmit(async (values) => {
    try {
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, values });
        onDone?.();
      } else {
        await createMutation.mutateAsync(values);
        form.reset(defaults);
      }
    } catch {
      // Lỗi đã được báo bằng thông báo thân thiện trong mutation; giữ nguyên dữ liệu đã nhập.
    }
  });
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="food-name">Tên món</Label>
          <Input id="food-name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="food-category">Nhóm món</Label>
          <Input id="food-category" placeholder="Ví dụ: Ngũ cốc" {...form.register('category')} />
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="food-servingSize">Khẩu phần cơ sở</Label>
          <Input
            id="food-servingSize"
            type="number"
            min="0.001"
            max="1000000"
            step="0.001"
            {...form.register('servingSize')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="food-servingUnit">Đơn vị</Label>
          <Input
            id="food-servingUnit"
            placeholder="g, ml, quả..."
            {...form.register('servingUnit')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {nutrientFields.map((name) => (
          <div key={name} className="space-y-1">
            <Label htmlFor={`food-${name}`}>
              {
                {
                  calories: 'Calo (kcal)',
                  proteinGrams: 'Protein (g)',
                  carbsGrams: 'Carbohydrate (g)',
                  fatGrams: 'Chất béo (g)',
                  fiberGrams: 'Chất xơ (g)',
                }[name]
              }
            </Label>
            <Input
              id={`food-${name}`}
              type="number"
              min="0"
              max="1000000"
              step="0.001"
              {...form.register(name)}
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="allergen">Dị nguyên (tối đa 32)</Label>
        <div className="flex gap-2">
          <Input
            id="allergen"
            value={allergen}
            maxLength={50}
            onChange={(event) => setAllergen(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
            placeholder="Nhập rồi nhấn Enter"
          />
          <Button type="button" variant="outline" onClick={add}>
            Thêm
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.watch('allergens').map((item, index) => (
            <span key={`${item}-${index}`} className="rounded-full bg-muted px-3 py-1 text-sm">
              {item}
              <button
                type="button"
                className="ml-2"
                aria-label={`Xóa ${item}`}
                onClick={() =>
                  form.setValue(
                    'allergens',
                    form.getValues('allergens').filter((_, current) => current !== index)
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Thêm món tự tạo'}
        </Button>
        {isEditing && (
          <Button type="button" variant="outline" onClick={onDone}>
            Huỷ sửa
          </Button>
        )}
      </div>
    </form>
  );
}

export default function FoodsPage() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [pageNumber, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<FoodModel | undefined>();
  const removeFood = useDeleteFoodMutation();
  const query = useFoodsQuery({
    search: useDebounce(search, 300),
    category: useDebounce(category, 300),
    pageNumber,
    pageSize: 20,
  });
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Thực phẩm</h1>
          <p className="mt-1 text-muted-foreground">
            Tìm món hoặc thêm món riêng cho tài khoản của bạn.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/diet">Về nhật ký</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Danh mục món ăn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="food-search">Tìm tên món</Label>
                <Input
                  id="food-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-filter-category">Nhóm</Label>
                <Input
                  id="food-filter-category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            {query.isLoading ? (
              <p>Đang tải món…</p>
            ) : query.isError ? (
              <div>
                <p role="alert">Không thể tải danh sách món.</p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : query.data?.items.length ? (
              <ul className="divide-y">
                {query.data.items.map((food) => (
                  <li key={food.id} className="py-3">
                    <div className="flex justify-between gap-3">
                      <strong>{food.name}</strong>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{food.calories} kcal</span>
                        {food.isCustom && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setEditing(food)}>
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={removeFood.isPending}
                              onClick={() => {
                                if (window.confirm(`Xoá món “${food.name}”?`))
                                  removeFood.mutate(food.id);
                              }}
                            >
                              Xoá
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {food.category} · {food.servingSize} {food.servingUnit} · P{' '}
                      {food.proteinGrams}g · C {food.carbsGrams}g · F {food.fatGrams}g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dị nguyên:{' '}
                      {food.allergens === null
                        ? 'Chưa khai báo'
                        : food.allergens.length
                          ? food.allergens.join(', ')
                          : 'Đã khai báo không có nhãn'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">Chưa tìm thấy món nào.</p>
            )}
            {query.data && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={!query.data.hasPreviousPage}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {query.data.pageNumber} / {Math.max(1, query.data.totalPages)}
                </span>
                <Button
                  variant="outline"
                  disabled={!query.data.hasNextPage}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Tiếp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Sửa món tự tạo' : 'Thêm món tự tạo'}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateFoodForm
              key={editing?.id ?? 'new'}
              initial={editing}
              onDone={() => setEditing(undefined)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
