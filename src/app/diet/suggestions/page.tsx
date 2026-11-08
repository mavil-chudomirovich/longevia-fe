'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogMealDialog } from '@/features/diet/components/log-meal-dialog';
import { useRecommendationsQuery } from '@/features/diet/queries/diet.queries';
import type { MealSuggestionModel } from '@/features/diet/types/diet.model';
import { getApiErrorCode } from '@/lib/api-error';

export default function SuggestionsPage() {
  const [mealType, setMealType] = React.useState('Breakfast');
  const [goal, setGoal] = React.useState('Longevity');
  const [requested, setRequested] = React.useState(false);
  const [selected, setSelected] = React.useState<MealSuggestionModel>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const query = useRecommendationsQuery(mealType, goal, requested);
  const errorCode = getApiErrorCode(query.error);
  const choose = (setter: (value: string) => void, value: string) => {
    setter(value);
    setRequested(false);
  };
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Gợi ý bữa ăn bằng AI</h1>
          <p className="mt-1 text-muted-foreground">
            Gợi ý dựa trên mục tiêu, hồ sơ và nhật ký hiện tại.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/diet">Về nhật ký</Link>
        </Button>
      </div>
      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <label htmlFor="suggest-meal" className="text-sm font-medium">
              Bữa ăn
            </label>
            <select
              id="suggest-meal"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={mealType}
              onChange={(event) => choose(setMealType, event.target.value)}
            >
              <option value="Breakfast">Bữa sáng</option>
              <option value="Lunch">Bữa trưa</option>
              <option value="Dinner">Bữa tối</option>
              <option value="Snack">Bữa phụ</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="suggest-goal" className="text-sm font-medium">
              Mục tiêu
            </label>
            <select
              id="suggest-goal"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={goal}
              onChange={(event) => choose(setGoal, event.target.value)}
            >
              <option value="LoseWeight">Giảm cân</option>
              <option value="Maintain">Duy trì</option>
              <option value="BuildMuscle">Tăng cơ</option>
              <option value="Longevity">Sống trường thọ</option>
            </select>
          </div>
          <Button disabled={query.isFetching} onClick={() => setRequested(true)}>
            {query.isFetching ? 'Đang tìm…' : 'Tạo gợi ý'}
          </Button>
        </CardContent>
      </Card>
      {!requested ? (
        <p className="mt-6 text-sm text-muted-foreground">Chọn bữa ăn và mục tiêu rồi tạo gợi ý.</p>
      ) : query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang phân tích hồ sơ và nhật ký…</p>
      ) : query.isError ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">
              {errorCode === 'diet.weight_not_found'
                ? 'Hãy ghi nhận cân nặng trước khi tạo gợi ý.'
                : errorCode === 'diet.profile_not_found' || errorCode === 'diet.profile_incomplete'
                  ? 'Hoàn thiện hồ sơ sức khỏe trước khi tạo gợi ý.'
                  : errorCode === 'diet.no_safe_candidate'
                    ? 'Chưa có món đủ thông tin dị ứng để đưa ra gợi ý an toàn.'
                    : errorCode === 'diet.ai_timeout' || errorCode === 'diet.ai_unavailable'
                      ? 'Dịch vụ gợi ý đang bận. Bạn có thể thử lại.'
                      : 'Không thể tạo gợi ý lúc này.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {errorCode === 'diet.weight_not_found' ? (
                <Button asChild variant="outline">
                  <Link href="/progress/metrics">Ghi cân nặng</Link>
                </Button>
              ) : errorCode === 'diet.profile_not_found' ||
                errorCode === 'diet.profile_incomplete' ? (
                <Button asChild variant="outline">
                  <Link href="/profile">Cập nhật hồ sơ</Link>
                </Button>
              ) : errorCode === 'diet.no_safe_candidate' ? (
                <Button asChild variant="outline">
                  <Link href="/diet/foods">Thêm món và dị nguyên</Link>
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        query.data && (
          <div className="mt-6 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Nguyên tắc an toàn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{query.data.safetyNote}</p>
                <p className="text-sm text-muted-foreground">{query.data.disclaimer}</p>
                {query.data.calorieCapReached && (
                  <p className="rounded bg-amber-500/10 p-3 text-sm">
                    Đã chạm ngưỡng calo trong ngày; không thêm món mới.
                  </p>
                )}
                <p className="text-sm">
                  Calo còn lại hôm nay: <strong>{query.data.remainingCalories}</strong>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mẹo trường thọ</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{query.data.longevityTip}</p>
                {query.data.tipCitations.map((citation, index) => (
                  <p
                    key={`${citation.sourceFile}-${index}`}
                    className="mt-3 rounded bg-muted p-3 text-sm"
                  >
                    “{citation.quote}”{' '}
                    <span className="text-muted-foreground">
                      — {citation.chapterTitle}, trang {citation.bookPage};{' '}
                      {citation.verified ? 'đã xác minh' : 'chưa kiểm chứng'}
                    </span>
                  </p>
                ))}
              </CardContent>
            </Card>
            <section className="grid gap-4 md:grid-cols-2">
              {query.data.recommendedMeals.map((meal) => (
                <Card key={meal.foodId}>
                  <CardHeader>
                    <CardTitle>{meal.name}</CardTitle>
                    <CardDescription>
                      {meal.servingSize} {meal.servingUnit} · {meal.calories} kcal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{meal.description}</p>
                    <p className="text-sm text-muted-foreground">{meal.rationale}</p>
                    <p className="text-sm">
                      P {meal.proteinGrams}g · C {meal.carbsGrams}g · F {meal.fatGrams}g
                    </p>
                    {meal.citations.map((citation, index) => (
                      <p
                        key={`${citation.sourceFile}-${index}`}
                        className="rounded bg-muted p-3 text-sm"
                      >
                        “{citation.quote}”{' '}
                        <span className="text-muted-foreground">
                          — {citation.chapterTitle}, tr. {citation.bookPage};{' '}
                          {citation.verified ? 'đã xác minh' : 'chưa kiểm chứng'}
                        </span>
                      </p>
                    ))}
                    {!query.data?.calorieCapReached && (
                      <Button
                        onClick={() => {
                          setSelected(meal);
                          setDialogOpen(true);
                        }}
                      >
                        Ghi vào nhật ký
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
            {!query.data.recommendedMeals.length && (
              <p className="text-sm text-muted-foreground">Hiện chưa có món phù hợp để gợi ý.</p>
            )}
          </div>
        )
      )}
      <LogMealDialog open={dialogOpen} onOpenChange={setDialogOpen} suggested={selected} />
    </div>
  );
}
