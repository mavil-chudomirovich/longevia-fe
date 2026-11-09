'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-error';
import { useLongevityQuery } from '@/features/progress/queries/progress-ai.queries';

export default function LongevityPage() {
  const [days, setDays] = React.useState(7);
  const query = useLongevityQuery(days);
  const data = query.data;
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Điểm thói quen trường thọ</h1>
          <p className="mt-1 text-muted-foreground">
            Dựa trên nhịn ăn, giấc ngủ, nước uống và dinh dưỡng {days} ngày.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/progress">Về tổng quan</Link>
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="longevity-days" className="text-sm font-medium">
          Số ngày
        </label>
        <input
          id="longevity-days"
          type="number"
          min={1}
          max={7}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 w-24 rounded-md border bg-background px-3 text-sm"
        />
      </div>
      {query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang tính điểm…</p>
      ) : query.isError ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">{getApiErrorMessage(query.error, 'Chưa tính được điểm lúc này.')}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">{data.longevityScore}/100</CardTitle>
              <CardDescription>Điểm tổng hợp</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.scoreBreakdown.map((item) => (
              <Card key={item.key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {item.key} · {item.score}/100
                  </CardTitle>
                  <CardDescription>Trọng số {item.weight}%</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gợi ý cải thiện</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {data.actionableInsights.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {data.citations.map((c, i) => (
            <p key={`${c.sourceFile}-${i}`} className="rounded bg-muted p-3 text-sm">
              “{c.quote}” — {c.chapterTitle}, tr. {c.bookPage};{' '}
              {c.verified ? 'đã xác minh' : 'chưa kiểm chứng'}
            </p>
          ))}
          <p className="text-sm text-muted-foreground">{data.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
