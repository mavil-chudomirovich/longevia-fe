'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WaterTracker } from '@/features/progress/components/water-tracker';
import { WaterHistory } from '@/features/progress/components/water-history';

export default function WaterPage() {
  const tips = [
    {
      title: 'Khởi đầu ngày mới với 350ml nước ấm',
      desc: 'Giúp kích hoạt hệ tiêu hóa, thải độc tố thận sau một đêm dài và hỗ trợ nhu động ruột.',
    },
    {
      title: 'Uống từng ngụm nhỏ trải đều trong ngày',
      desc: 'Không nên uống dồn dập lượng lớn cùng một lúc để tế bào có thời gian thẩm thấu tốt nhất.',
    },
    {
      title: 'Dừng uống nhiều nước 1 giờ trước khi ngủ',
      desc: 'Hạn chế thức giấc giữa đêm làm gián đoạn các chu kỳ giấc ngủ sâu (NREM).',
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
              Theo dõi lượng nước uống
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-pretty ml-9">
            Duy trì độ ẩm nội bào tối ưu để hỗ trợ trao đổi chất và duy trì độ đàn hồi của mạch máu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <WaterTracker />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Nguyên tắc cấp nước trường thọ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tối ưu hóa khả năng hấp thụ nước của ty thể tế bào
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tips.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">{t.title}</span>
                    <span className="text-xs text-muted-foreground block text-pretty leading-relaxed">
                      {t.desc}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <WaterHistory />
    </div>
  );
}
