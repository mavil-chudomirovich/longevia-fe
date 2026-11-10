'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FastingPanel } from '@/features/progress/components/fasting-panel';
import { FastingHistory } from '@/features/progress/components/fasting-history';

export default function FastingPage() {
  const fastingStages = [
    {
      hours: '0 – 4 giờ',
      title: 'Đồng hóa & Tiêu hóa thức ăn',
      desc: 'Cơ thể hấp thu chất dinh dưỡng, đường huyết và insulin tăng nhẹ sau bữa ăn cuối.',
    },
    {
      hours: '4 – 12 giờ',
      title: 'Chuyển hóa & Giảm Insulin',
      desc: 'Insulin giảm dần về mức nền, cơ thể bắt đầu đốt cháy glycogen dự trữ trong gan.',
    },
    {
      hours: '12 – 18 giờ',
      title: 'Ketosis nhẹ & Khởi phát Autophagy',
      desc: 'Gan bắt đầu tạo thể ketone, kích hoạt cơ chế tự thực bào (Autophagy) dọn dẹp tế bào lão hóa.',
    },
    {
      hours: '18 – 24 giờ',
      title: 'Tự thực bào chuyên sâu',
      desc: 'Tái tạo ty thể, giảm viêm toàn thân và kích thích sản sinh hormone tăng trưởng tự nhiên.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 rounded-full">
              <Link href="/progress" aria-label="Quay lại Tổng quan">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Nhịn ăn gián đoạn (Intermittent Fasting)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-pretty ml-9">
            Kích hoạt cơ chế tự sửa chữa tế bào, ổn định đường huyết và tăng cường tuổi thọ khỏe
            mạnh.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột chính: Bảng điều khiển Fasting (7 cột) */}
        <div className="lg:col-span-7">
          <FastingPanel />
        </div>

        {/* Cột thông tin khoa học (5 cột) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Các giai đoạn chuyển hóa sinh học
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Diễn biến sinh lý trong một chu kỳ nhịn ăn chuẩn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {fastingStages.map((stage, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="font-bold text-primary tabular-nums shrink-0 w-20 pt-0.5">
                    {stage.hours}
                  </span>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block text-pretty">
                      {stage.title}
                    </span>
                    <span className="text-muted-foreground block text-pretty leading-relaxed">
                      {stage.desc}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs bg-muted/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold">Lưu ý an toàn sức khỏe</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 text-pretty">
              <p>
                • Trong thời gian nhịn, bạn vẫn có thể uống nước lọc, trà thảo mộc hoặc cà phê đen
                nguyên chất (không đường, không sữa).
              </p>
              <p>
                • Phụ nữ mang thai, cho con bú hoặc người có bệnh nền tiểu đường type 1 cần tham
                khảo ý kiến bác sĩ trước khi áp dụng giao thức trên 16 giờ.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <FastingHistory />
    </div>
  );
}
