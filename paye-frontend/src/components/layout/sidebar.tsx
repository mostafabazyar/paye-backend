'use client';

import {
  Heart,
  MessageCircle,
  PlusCircle,
  Search,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const navItems = [
  { href: '/create-listing', labelKey: 'create', icon: PlusCircle },
  { href: '/requests', labelKey: 'requests', icon: Heart },
  { href: '/explore', labelKey: 'explore', icon: Search },
  { href: '/chat', labelKey: 'messages', icon: MessageCircle },
  { href: '/profile', labelKey: 'profile', icon: UserRound },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('Sidebar');

  return (
    <div
      className="fixed bottom-[10px] left-1/2 z-50 w-[calc(100%-1rem)] -translate-x-1/2 rounded-[18px] border border-white/60 bg-white/75 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:w-1/2"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex items-center justify-between gap-1 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] sm:px-5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.4rem] px-2 py-2 text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-b from-slate-900 to-slate-600 text-white shadow-[0_14px_30px_rgba(15,23,42,0.26)]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}