'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en' as const, label: 'English', flag: '🇺🇸' },
  { code: 'fa' as const, label: 'فارسی', flag: '🇮🇷' },
];

export default function LanguageDropdown() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = languages.find((lang) => lang.code === locale) ?? languages[0];

  const switchLocale = (nextLocale: 'en' | 'fa') => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] end-3 sm:end-4 z-[60]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Change language"
            className="flex h-10 w-10 sm:w-auto sm:px-3 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md transition hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
          >
            <Globe className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-base leading-none">{current.flag}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-40 sm:w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
        >
          {languages.map((language) => {
            const active = locale === language.code;
            return (
              <DropdownMenuItem
                key={language.code}
                onClick={() => switchLocale(language.code)}
                className={`cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-11 text-sm ${
                  active
                    ? 'bg-slate-50 text-slate-950 font-medium'
                    : 'text-slate-700 focus:bg-slate-50'
                }`}
              >
                <span className="text-base leading-none">{language.flag}</span>
                <span
                  className={
                    language.code === 'fa' ? 'persian-font-label' : undefined
                  }
                >
                  {language.label}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}