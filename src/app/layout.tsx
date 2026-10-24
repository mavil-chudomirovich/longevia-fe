import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeController } from '@/components/providers/theme-controller';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Longevia — Chế độ ăn trường thọ & Sống khỏe mỗi ngày',
  description:
    'Nền tảng cá nhân hóa dinh dưỡng, chế độ ăn trường thọ dựa trên khoa học và theo dõi sức khỏe thông minh.',
  icons: {
    icon: [{ url: '/logo/logo-mark.png', type: 'image/png' }],
    apple: [{ url: '/logo/logo-mark.png', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground">
        <QueryProvider>
          <ThemeController>
            <AuthProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster position="bottom-right" duration={3000} />
              </TooltipProvider>
            </AuthProvider>
          </ThemeController>
        </QueryProvider>
      </body>
    </html>
  );
}
