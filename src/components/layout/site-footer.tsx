'use client';

import Link from 'next/link';
import { Heart, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './brand-logo';

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/50 text-card-foreground">
      <div className="container mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <BrandLogo withSubtitle="Chế độ ăn trường thọ" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Longevia giúp bạn theo dõi dinh dưỡng và xây dựng thói quen sống khỏe mỗi ngày.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Khám phá</h2>
          <nav className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <Link href="/diet" className="hover:text-primary">
              Nhật ký dinh dưỡng
            </Link>
            <Link href="/diet/suggestions" className="hover:text-primary">
              Gợi ý AI
            </Link>
            <Link href="/progress" className="hover:text-primary">
              Theo dõi tiến trình
            </Link>
            <Link href="/profile" className="hover:text-primary">
              Hồ sơ cá nhân
            </Link>
          </nav>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Thông tin</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Gợi ý dinh dưỡng chỉ mang tính tham khảo, không thay thế tư vấn y khoa.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Bảo vệ dữ liệu sức khỏe cá nhân
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Longevia · Xây dựng với{' '}
        <Heart className="inline h-3.5 w-3.5 fill-red-500 text-red-500" /> cho hành trình sống khỏe.
      </div>
    </footer>
  );
}
