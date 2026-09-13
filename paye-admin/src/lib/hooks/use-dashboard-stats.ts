"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/app/api/admin/dashboard/route";

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/admin/dashboard");
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load dashboard");
  }

  return json.data as DashboardStats;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchDashboardStats,
  });
}