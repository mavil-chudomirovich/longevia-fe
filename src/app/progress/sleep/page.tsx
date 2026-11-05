'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, BedDouble, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SleepLogForm } from '@/features/progress/components/sleep-log-form';

export default function SleepPage() {
  const sleepHygienePrinciples = [
    {
      title: 'Tối ưu nhịp sinh học (Circadian Rhythm)',
      desc: 'Cố định giờ đi ngủ và thức dậy mỗi ngày giúp đồng bộ hormone cortisol và melatonin tự nhiên.',
    },
    {
      title: 'Giảm ánh sáng xanh trước 1 giờ',
      desc: 'Hạn chế màn hình điện thoại, máy tính để não bộ giải phóng tín hiệu chuẩn bị đi vào giấc ngủ sâu.',
    },
    {
      title: 'Nhiệt độ phòng ngủ lý tưởng 19–21°C',
      desc: 'Thân nhiệt hạ nhẹ tự nhiên là điều kiện tiên quyết để kích hoạt chu kỳ sóng não chậm (Slow-wave sleep).',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 rounded-full">
              <Link href="/progress" aria-label="Quay lại Tổng quan">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Nhật ký & Chất lượng giấc ngủ
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-pretty ml-9">
            Theo dõi thời lượng và mức độ hồi phục để tái tạo hệ thần kinh và cân bằng hormone
            trường thọ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <SleepLogForm />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <BedDouble className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Vệ sinh giấc ngủ chuẩn khoa học
                  </CardTitle>
                  <CardDescription className="text-xs">
                    3 thói quen cốt lõi để nâng cao chất lượng phục hồi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sleepHygienePrinciples.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground block text-pretty leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
