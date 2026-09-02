'use client';

import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('Navbar');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav
      className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 px-4 py-4 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl sm:px-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/explore" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 shadow-[0_16px_30px_rgba(15,23,42,0.18)] shrink-0">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              {t('brand')}
            </p>
            <p className="text-xs font-medium text-slate-500">{t('tagline')}</p>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              asChild
              variant="secondary"
              className="hidden rounded-full bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200 sm:inline-flex"
            >
              <Link href="/explore">{t('explore')}</Link>
            </Button>

            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500 md:flex">
              <span>{t('welcome')}</span>
              <span className="font-semibold text-slate-900">{user.name}</span>
            </div>

            <Avatar
              className="h-11 w-11 cursor-pointer ring-2 ring-slate-100"
              onClick={() => router.push('/profile')}
            >
              <AvatarImage src={user.photos?.[0]} />
              <AvatarFallback>
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label={t('logout')}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-slate-900 to-slate-600 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] hover:from-slate-800 hover:to-slate-500"
          >
            <Link href="/login">{t('signIn')}</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}