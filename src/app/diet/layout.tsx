'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { DietSubNav } from '@/features/diet/components/diet-subnav';

export default function DietLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SiteHeader />
      <div className="min-h-[calc(100dvh-4rem)] bg-background flex flex-col">
        <DietSubNav />
        <main className="grow">{children}</main>
      </div>
      <SiteFooter />
    </AuthGuard>
  );
}
