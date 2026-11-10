'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SiteHeader />
      <main className="min-h-[calc(100dvh-8rem)] bg-background">{children}</main>
      <SiteFooter />
    </AuthGuard>
  );
}
