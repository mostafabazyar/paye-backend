"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  RequestDetailResponse,
  RequestListParams,
  RequestsListResponse,
} from "@/lib/types/admin";

async function fetchRequests(
  params: RequestListParams
): Promise<RequestsListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.profileId) qs.set("profileId", String(params.profileId));
  qs.set("skip", String(params.skip ?? 0));
  qs.set("take", String(params.take ?? 20));

  const res = await fetch(`/api/admin/requests?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch requests");
  }
  return json as RequestsListResponse;
}

export function useAdminRequests(params: RequestListParams) {
  return useQuery({
    queryKey: ["admin", "requests", params],
    queryFn: () => fetchRequests(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/* ---------- mutations ---------- */

type ActionName = "approve" | "reject" | "pending";

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "requests"] });
    qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };
}

async function requestAction(id: number, action: ActionName) {
  const res = await fetch(`/api/admin/requests/${id}/${action}`, {
    method: "PATCH",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? `Failed to ${action} request`);
  }
  return json;
}

export function useApproveRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => requestAction(id, "approve"),
    onSuccess: () => {
      toast.success("Request approved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => requestAction(id, "reject"),
    onSuccess: () => {
      toast.success("Request rejected");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePendingRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => requestAction(id, "pending"),
    onSuccess: () => {
      toast.success("Request moved back to pending");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRequest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to delete request");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Request deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- single request (for detail page) ---------- */

async function fetchRequest(id: string): Promise<RequestDetailResponse> {
  const res = await fetch(`/api/admin/requests/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch request");
  }
  return json as RequestDetailResponse;
}

export function useAdminRequest(id: string) {
  return useQuery({
    queryKey: ["admin", "requests", id],
    queryFn: () => fetchRequest(id),
    enabled: !!id,
  });
}