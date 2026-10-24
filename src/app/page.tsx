'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  HeartPulse,
  Leaf,
  Apple,
  CalendarDays,
  LineChart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Scale,
  Brain,
  Timer,
  Salad,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

const PILLARS = [
  {
    icon: Salad,
    title: 'Thực vật & Thảo mộc dồi dào',
    desc: 'Ưu tiên rau củ, họ đậu, ngũ cốc nguyên hạt và nấm giàu chất chống oxy hóa giúp kích hoạt gen trường thọ sirtuins.',
  },
  {
    icon: Timer,
    title: 'Nhịn ăn có chu kỳ (Fasting)',
    desc: 'Áp dụng khung ăn uống 12-16 giờ và chu kỳ nhịn ăn định kỳ kích thích cơ chế dọn dẹp tế bào lỗi (Autophagy).',
  },
  {
    icon: Scale,
    title: 'Kiểm soát Protein & mTOR',
    desc: 'Cân bằng nguồn đạm thực vật sạch, hạn chế kích thích quá mức con đường tăng sinh mTOR để làm chậm lão hóa tế bào.',
  },
  {
    icon: Brain,
    title: 'Trí tuệ nhân tạo cá nhân hóa',
    desc: 'Hệ thống AI phân tích chỉ số sinh học và thói quen hàng ngày để đề xuất thực đơn tối ưu hóa độ tuổi sinh học.',
  },
];

const FEATURES = [
  {
    title: 'Thiết kế bữa ăn thông minh',
    desc: 'Tự động tính toán lượng calo, tỷ lệ macronutrients (Carbs chậm, Chất béo tốt, Đạm sạch) và vi chất cần thiết.',
    badge: 'Tự động hóa',
    icon: CalendarDays,
  },
  {
    title: 'Theo dõi chỉ số sinh học & Tiến trình',
    desc: 'Ghi nhận huyết áp, chỉ số khối lượng cơ thể (BMI), năng lượng và chất lượng giấc ngủ để đánh giá tốc độ trẻ hóa.',
    badge: 'Theo thời gian thực',
    icon: LineChart,
  },
  {
    title: 'Kho tri thức chuyên sâu từ sách & y văn',
    desc: 'Được trích xuất và tra cứu qua mô hình RAG hiện đại, mang đến thông tin khoa học đã qua kiểm chứng tin cậy.',
    badge: 'RAG AI Verified',
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-primary">
                <Sparkles className="w-4 h-4 text-primary animate-spin-slow" />
                <span>Khoa học dinh dưỡng & Lối sống trường thọ</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Sống khỏe hơn, trẻ lâu hơn cùng{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Longevia
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Khám phá bí quyết sống thọ từ các Vùng Xanh (Blue Zones) kết hợp cùng công nghệ AI
                hiện đại nhằm kiến tạo chế độ dinh dưỡng tối ưu nhất cho riêng bạn.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 h-12 px-6 gap-2"
                  asChild
                >
                  <Link href="/diet">
                    Khám phá chế độ ăn
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 gap-2"
                  asChild
                >
                  <Link href="/assistant">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Trò chuyện cùng AI
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dựa trên cơ sở khoa học y sinh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Cá nhân hóa theo thể trạng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Bảo mật dữ liệu sức khỏe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 PILLARS OF LONGEVITY */}
        <section className="py-20 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <Badge variant="outline" className="text-primary border-primary/30">
                4 Trụ Cột Cốt Lõi
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Triết lý dinh dưỡng trường thọ
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Chế độ ăn của Longevia tập trung vào việc kích hoạt cơ chế sinh học bảo vệ tế bào và
                giảm stress oxy hóa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PILLARS.map((pillar, idx) => (
                <Card
                  key={idx}
                  className="relative overflow-hidden border border-border/80 bg-card hover:shadow-md transition-shadow"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <pillar.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW */}
        <section className="py-20 bg-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <Badge variant="outline" className="text-primary border-primary/30">
                Nền Tảng Đột Phá
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Giải pháp toàn diện cho hành trình sống khỏe
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Đồng bộ hóa giữa vi chất dinh dưỡng, tiến trình cơ thể và sự cố vấn liên tục từ mô
                hình tri thức AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURES.map((feature, idx) => (
                <Card
                  key={idx}
                  className="border border-border/80 bg-card flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {feature.badge}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Sẵn sàng nâng cấp tuổi sinh học của bạn?
            </h2>
            <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
              Bắt đầu thiết lập thói quen dinh dưỡng trường thọ ngay hôm nay cùng hệ thống gợi ý và
              cố vấn thông minh của Longevia.
            </p>
            <div className="pt-2">
              <Button
                size="lg"
                className="bg-white text-emerald-800 hover:bg-emerald-50 h-12 px-8 font-semibold shadow-sm"
                asChild
              >
                <Link href="/register">Tham gia ngay hoàn toàn miễn phí</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
