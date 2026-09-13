"use client";

import { useQuery } from "@tanstack/react-query";

type MeResponse = {
  success: boolean;
  user: {
    id: string;
    phone: string;
    name: string | null;
    isVerified: boolean;
  };
};

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load admin profile");
  }
  return json as MeResponse;
}

export function useAdminMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
  });
}