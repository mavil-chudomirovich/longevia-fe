'use client';

import * as React from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { ProgressSubNav } from '@/features/progress/components/progress-subnav';
import { ProgressCacheSync } from '@/features/progress/components/progress-cache-sync';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SiteHeader />
      <div className="min-h-[calc(100dvh-4rem)] bg-background flex flex-col">
        {/* Đồng bộ vòng đời cache & chuyển ngày UTC cho module Tiến trình */}
        <ProgressCacheSync />

        {/* Sub-navigation */}
        <ProgressSubNav />

        {/* Nội dung chính */}
        <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 grow space-y-6">
          {children}
        </main>
      </div>
      <SiteFooter />
    </AuthGuard>
  );
}
