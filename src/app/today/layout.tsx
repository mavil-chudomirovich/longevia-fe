'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function TodayLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SiteHeader />
      <div className="min-h-[calc(100dvh-4rem)] bg-background flex flex-col">
        <main className="grow">{children}</main>
      </div>
      <SiteFooter />
    </AuthGuard>
  );
}
