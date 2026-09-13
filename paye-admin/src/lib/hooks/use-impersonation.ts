"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/* ---------- state ---------- */

export type ImpersonationState =
  | { active: false }
  | {
      active: true;
      user: { id: string; phone: string };
      impersonatedBy: string;
      expiresAt: number | null;
    };

async function fetchState(): Promise<ImpersonationState> {
  const res = await fetch("/api/admin/impersonation/state", {
    cache: "no-store",
  });
  const json = await res.json();
  return json as ImpersonationState;
}

export function useImpersonationState() {
  return useQuery({
    queryKey: ["admin", "impersonation", "state"],
    queryFn: fetchState,
    refetchInterval: 60_000, // re-check every minute to catch expiry
    staleTime: 30_000,
  });
}

/* ---------- start ---------- */

export function useStartImpersonation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/impersonation/${userId}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to start impersonation");
      }
      return json as {
        success: boolean;
        user: { id: string; phone: string; name: string | null };
        expiresIn: string;
      };
    },
    onSuccess: (data) => {
      toast.success(`Impersonating ${data.user.name ?? data.user.phone}`, {
        description: "Copy the impersonation link and paste it in the user app.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "impersonation", "state"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- stop ---------- */

export function useStopImpersonation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/impersonation/stop", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to stop impersonation");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Impersonation ended");
      qc.invalidateQueries({ queryKey: ["admin", "impersonation", "state"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- link builder ---------- */

/**
 * Builds the link the admin sends to the user app.
 * The token is NEVER exposed to the browser here — the link
 * is only useful when the user app is built to read the
 * impersonation session server-side from the admin panel.
 */
export function buildImpersonationLink(userId: string): string {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000";
  return `${base}/impersonate?userId=${encodeURIComponent(userId)}`;
}