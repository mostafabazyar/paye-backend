'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { getChatPath } from '@/lib/chat';
import { formatDistanceToNow } from 'date-fns';
import { faIR, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

type Conversation = {
  sessionId: string;
  partner: { id: string; name: string | null };
  profile?: { title?: string; location?: string };
  lastMessage?: string;
  updatedAt: string;
};

export default function ChatListPage() {
  const t = useTranslations('ChatListPage');
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const dateLocale = locale === 'fa' ? faIR : enUS;

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.getConversations() as Promise<Conversation[]>,
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white pb-28" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-white/80 to-white backdrop-blur-xl border-b border-slate-100 px-6 py-5">
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      <div className="mx-auto max-w-3xl p-6">
        {isLoading ? (
          <p className="text-center text-slate-500">{t('loading')}</p>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 py-20 text-center shadow-sm">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-800">{t('emptyTitle')}</p>
            <p className="mt-2 text-sm text-slate-500">{t('emptyDesc')}</p>
            <Link
              href="/requests"
              className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-slate-800 transition"
            >
              {t('viewRequests')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const name = conversation.partner?.name || t('fallbackUser');
              const subtitle =
                conversation.profile?.title ||
                conversation.profile?.location ||
                t('sessionMatch');

              return (
                <Link
                  key={conversation.sessionId}
                  href={getChatPath(conversation.sessionId)}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:border-slate-200"
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold shrink-0">
                    {getInitials(conversation.partner?.name)}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {conversation.lastMessage || subtitle}
                    </p>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-slate-400 shrink-0">
                    {formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}