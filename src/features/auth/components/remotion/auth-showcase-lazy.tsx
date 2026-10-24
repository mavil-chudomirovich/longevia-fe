'use client';

import dynamic from 'next/dynamic';
import { Leaf } from 'lucide-react';

export function AuthShowcaseSkeleton() {
  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 text-center shadow-2xl">
      <div className="animate-pulse space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
          <Leaf className="h-7 w-7" />
        </div>
        <div className="mx-auto h-7 w-48 rounded-full bg-white/15" />
        <div className="mx-auto h-4 w-72 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export const AuthShowcaseLazy = dynamic(
  () => import('./auth-showcase-player').then((mod) => mod.AuthShowcasePlayer),
  {
    ssr: false,
    loading: () => <AuthShowcaseSkeleton />,
  }
);
