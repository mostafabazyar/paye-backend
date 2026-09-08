'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { ArrowLeft, Mic, SendHorizonal, Smile } from 'lucide-react';
import { createSocket } from '@/lib/socket';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { faIR, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  sessionId: string;
  createdAt: string;
  sender?: { id: string; name: string | null };
}

type Conversation = {
  sessionId: string;
  partner: { id: string; name: string | null };
  profile?: { title?: string; location?: string };
};

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, token } = useAuthStore();
  const t = useTranslations('ChatPage');
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const dateLocale = locale === 'fa' ? faIR : enUS;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.getConversations() as Promise<Conversation[]>,
    enabled: !!token,
  });

  const conversation = conversations.find(
    (item) => item.sessionId === sessionId
  );
  const partnerName = conversation?.partner?.name || t('fallbackUser');

  // Load messages + socket
  useEffect(() => {
    if (!sessionId || !token) return;

    chatApi.getMessages(sessionId).then(setMessages).catch(console.error);

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_session', sessionId);
    });

    socket.on('new_message', (msg: ChatMessage) => {
      if (msg.sessionId !== sessionId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    });

    socket.on('typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, token]);

  // Auto scroll
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const socket = socketRef.current;

    if (!text.trim() || !sessionId || !socket?.connected) return;

    socket.emit('send_message', {
      sessionId,
      text: text.trim(),
    });

    setText('');
    setReplyTo(null);
  };

  const handleSwipeReply = (msg: ChatMessage) => {
    setReplyTo(msg);
  };

  const handleReaction = () => {
    setShowReactionsFor(null);
  };

  return (
    <div className="flex h-screen bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar (desktop only) */}
      <ChatSidebar conversations={conversations} activeId={sessionId} />

      {/* Chat Area */}
      <div className="flex flex-col flex-1 relative bg-white pb-50">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
          <Link
            href="/chat"
            className="md:hidden rounded-full p-2 text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft
              className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`}
            />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 text-base">
              {partnerName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {conversation?.profile?.title || t('approvedMatch')}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50"
        >
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  onClick={() => handleSwipeReply(msg)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowReactionsFor(msg.id);
                  }}
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm cursor-pointer active:scale-[0.98] transition ${
                    isMe
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed" dir="auto">
                    {msg.text}
                  </p>
                </div>

                {showReactionsFor === msg.id && (
                  <div className="flex gap-2 mt-1 bg-white shadow-md rounded-full px-3 py-1">
                    {['❤️', '😂', '👍', '😮', '😢', '👎'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleReaction()}
                        className="text-xl"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1 text-[10px] text-slate-400" dir="ltr">
                  {format(new Date(msg.createdAt), 'p', { locale: dateLocale })}
                </p>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-150">•</span>
                <span className="animate-bounce delay-300">•</span>
              </div>
              {t('typing')}
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-white border-t border-slate-200 text-sm flex justify-between gap-2">
            <span className="text-slate-600 truncate max-w-[80%]">
              {t('replyingTo')} {replyTo.text}
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Floating Input Bar */}
        <div className="fixed md:static bottom-20 left-0 right-0 md:bottom-0 px-4 md:px-0">
          <div className="bg-white shadow-xl rounded-full flex items-center gap-3 px-4 py-3 border border-slate-200">
            <Smile className="text-slate-500 shrink-0" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder={t('placeholder')}
              dir="auto"
            />
            {text.length === 0 ? (
              <Mic className="text-slate-700 shrink-0" />
            ) : (
              <button
                onClick={sendMessage}
                className="rounded-full bg-black p-2 text-white shrink-0"
              >
                <SendHorizonal
                  className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}