'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { CitationChipList } from '@/components/shared/citation-chip';
import { useNutrientGapsQuery } from '@/features/diet/queries/diet.queries';

export default function NutrientGapsPage() {
  const [days, setDays] = React.useState(7);
  const [enabled, setEnabled] = React.useState(true);
  const query = useNutrientGapsQuery(days, enabled);
  const data = query.data;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Phân tích thiếu hụt vi chất</h1>
          <p className="mt-1 text-muted-foreground">
            Dựa trên nhật ký ăn uống {days} ngày gần nhất.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <label htmlFor="gap-days" className="text-sm font-medium">
              Số ngày
            </label>
            <Input
              id="gap-days"
              type="number"
              min={1}
              max={7}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </div>
          <Button onClick={() => setEnabled(true)} disabled={query.isFetching}>
            {query.isFetching ? 'Đang phân tích…' : 'Phân tích lại'}
          </Button>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang tổng hợp vi chất…</p>
      ) : query.isError ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">
              {getApiErrorMessage(query.error, 'Chưa phân tích được vi chất lúc này.')}
            </p>
            <Button variant="outline" onClick={() => setEnabled(true)}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Dữ liệu từ {data.daysWithData}/{days} ngày.
          </p>
          {data.dataWarnings.map((warning) => (
            <p key={warning} className="rounded bg-amber-500/10 p-3 text-sm">
              {warning}
            </p>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tổng quan</CardTitle>
              <CardDescription>{data.analysisSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.gaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa phát hiện thiếu hụt rõ ràng.</p>
              ) : (
                data.gaps.map((gap) => (
                  <div key={gap.nutrient} className="rounded border p-3 text-sm">
                    <p className="font-medium">
                      {gap.nutrient}: thiếu {Math.round(gap.deficit)} {gap.unit} ({gap.severity})
                    </p>
                    <p className="text-muted-foreground">
                      Trung bình {Math.round(gap.averageIntake)} / {Math.round(gap.target)}{' '}
                      {gap.unit}
                    </p>
                  </div>
                ))
              )}
              {data.suggestedFoods.length > 0 && (
                <p className="text-sm">
                  Gợi ý bổ sung: <strong>{data.suggestedFoods.join(', ')}</strong>
                </p>
              )}
            </CardContent>
          </Card>
          <CitationChipList citations={data.citations} />
          <p className="text-sm text-muted-foreground">{data.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
