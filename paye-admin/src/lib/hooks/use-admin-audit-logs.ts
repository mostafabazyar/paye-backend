"use client";

import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  AuditLogDetailResponse,
  AuditLogListParams,
  AuditLogsListResponse,
} from "@/lib/types/admin";

/* ---------- list ---------- */

async function fetchAuditLogs(
  params: AuditLogListParams
): Promise<AuditLogsListResponse> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));
  if (params.action) qs.set("action", params.action);
  if (params.adminId) qs.set("adminId", params.adminId);
  if (params.targetType) qs.set("targetType", params.targetType);
  if (params.targetId) qs.set("targetId", params.targetId);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const res = await fetch(`/api/admin/audit-logs?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load audit logs");
  }
  return json as AuditLogsListResponse;
}

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/* ---------- detail ---------- */

async function fetchAuditLog(id: string): Promise<AuditLogDetailResponse> {
  const res = await fetch(`/api/admin/audit-logs/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load audit log");
  }
  return json as AuditLogDetailResponse;
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: ["admin", "audit-logs", id],
    queryFn: () => fetchAuditLog(id as string),
    enabled: !!id,
  });
}