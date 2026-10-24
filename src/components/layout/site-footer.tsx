'use client';

import * as React from 'react';
import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import { Heart, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/50 text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <BrandLogo withSubtitle="Chế độ ăn trường thọ" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Longevia ứng dụng khoa học dinh dưỡng trường thọ và trí tuệ nhân tạo để cá nhân hóa
              lối sống, nâng cao tuổi thọ và chất lượng sống mỗi ngày.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Dự án phục vụ mục đích học tập & nghiên cứu</span>
            </div>
          </div>

          {/* Col 2: Chức năng */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Tính năng
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/diet" className="hover:text-primary transition-colors">
                  Chế độ ăn trường thọ
                </Link>
              </li>
              <li>
                <Link href="/meal-plans" className="hover:text-primary transition-colors">
                  Kế hoạch bữa ăn thông minh
                </Link>
              </li>
              <li>
                <Link href="/progress" className="hover:text-primary transition-colors">
                  Theo dõi tiến trình & chỉ số
                </Link>
              </li>
              <li>
                <Link
                  href="/assistant"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Trợ lý dinh dưỡng AI</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tri thức & Tài nguyên */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Tri thức
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/knowledge" className="hover:text-primary transition-colors">
                  Thư viện kiến thức trường thọ
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-primary transition-colors">
                  Nguyên tắc dinh dưỡng khoa học
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Tuyên bố miễn trừ trách nhiệm y tế */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Miễn trừ trách nhiệm
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mọi phân tích, gợi ý dinh dưỡng từ Longevia chỉ mang tính chất tham khảo khoa học,
              không thay thế chẩn đoán hoặc tư vấn y khoa chuyên sâu từ bác sĩ.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Longevia Project. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Xây dựng với <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> vì một
            cuộc sống khỏe mạnh & trường thọ.
          </p>
        </div>
      </div>
    </footer>
  );
}
