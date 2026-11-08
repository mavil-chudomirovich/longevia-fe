'use client';

import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { useAuthStore } from '@/store/useAuthStore';

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.user?.profile);
  return (
    <AuthGuard>
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập hồ sơ sức khỏe</CardTitle>
            <CardDescription>
              Thông tin này giúp Longevia cá nhân hóa mục tiêu và gợi ý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialProfile={profile} onSaved={() => router.push('/progress')} />
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
