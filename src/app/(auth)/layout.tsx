import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/layout/brand-logo';
import { AuthEditorialHero } from '@/features/auth/components/auth-editorial-hero';
import { AuthCompactBrand } from '@/features/auth/components/auth-compact-brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-between overflow-x-hidden bg-[#FAF9F5] text-[#1D2B22] selection:bg-primary/20 selection:text-primary dark:bg-[#0B1410] dark:text-[#E6F2E7]">
      {/* Background ambient organic gradient */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(40,125,50,0.07),rgba(250,249,245,0))] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(5,150,105,0.12),rgba(11,20,16,0))]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="z-10 mx-auto flex h-16 sm:h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <BrandLogo variant="horizontal" size="md" withSubtitle="Viet Vegan Companion" priority />
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-xs transition-all hover:bg-white hover:text-foreground hover:shadow-xs active:scale-[0.98] dark:border-border/40 dark:bg-card/70 dark:hover:bg-card"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Về trang chủ</span>
            <span className="sm:hidden">Trang chủ</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area: Split 50/50 on desktop */}
      <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left Column: Editorial Product Showcase (Desktop & Tablet) */}
          <div className="hidden w-full lg:flex lg:items-center lg:justify-center">
            <AuthEditorialHero />
          </div>

          {/* Right Column: Authentication Interactive Card */}
          <div className="flex w-full flex-col items-center justify-center">
            {children}
            {/* Mobile Compact Brand Message */}
            <AuthCompactBrand />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-8">
          <span>
            © {new Date().getFullYear()} VeggieConnect. Dinh dưỡng thuần chay khoa học & lành tính.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span className="text-border/80" aria-hidden="true">
              •
            </span>
            <span className="text-muted-foreground">Đồng hành cùng lối sống xanh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
