"use client";

import { useEffect, useState } from "react";
import { Eye, LogOut, Copy, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useImpersonationState,
  useStopImpersonation,
  buildImpersonationLink,
} from "@/lib/hooks/use-impersonation";

function formatRemaining(ms: number) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ImpersonationBanner() {
  const { data } = useImpersonationState();
  const stop = useStopImpersonation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!data || !data.active) return null;

  const remaining =
    data.expiresAt != null ? Math.max(0, data.expiresAt - now) : null;

  async function copyLink() {
    if (!data || !data.active) return;
    const link = buildImpersonationLink(data.user.id);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied", {
        description: "Open it in the user app to complete impersonation.",
      });
    } catch {
      toast.error("Clipboard blocked. Copy manually: " + link);
    }
  }

  return (
    <div className="sticky top-0 z-50 border-b border-amber-300/60 bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Impersonating</span>
            <span className="font-mono text-xs" dir="ltr">
              {data.user.phone}
            </span>
            {remaining != null && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-mono">
                expires in {formatRemaining(remaining)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="h-7 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy link
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => stop.mutate()}
            disabled={stop.isPending}
            className="h-7"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}