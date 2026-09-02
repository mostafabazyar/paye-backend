/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { MessageCircle, UserRound } from "lucide-react";
import { getChatPath } from "@/lib/chat";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ChatSidebar({ conversations, activeId }: any) {
  return (
    <div className="hidden md:flex w-72 flex-col border-r border-slate-200 bg-white">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((c: any) => {
          const isActive = c.sessionId === activeId;

          return (
            <Link
              key={c.sessionId}
              href={getChatPath(c.sessionId)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 cursor-pointer transition 
                ${isActive ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                <UserRound className="h-5 w-5 text-slate-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {c.partner?.name || "User"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {c.profile?.title || c.profile?.location || "Match"}
                </p>
              </div>

              <MessageCircle className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
