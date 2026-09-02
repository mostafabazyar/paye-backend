'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';
import { useTranslations, useLocale } from 'next-intl';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('ProtectedLayout');

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router, hasHydrated]);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-white text-slate-700"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {t('loading')}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-white overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-auto px-4 py-5 pb-28 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <Sidebar />
    </div>
  );
}