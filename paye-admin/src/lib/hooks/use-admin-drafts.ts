"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  DraftDetailResponse,
  DraftListParams,
  DraftsListResponse,
} from "@/lib/types/admin";

async function fetchDrafts(
  params: DraftListParams
): Promise<DraftsListResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.minStep != null) qs.set("minStep", String(params.minStep));
  if (params.maxStep != null) qs.set("maxStep", String(params.maxStep));
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));

  const res = await fetch(`/api/admin/drafts?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load drafts");
  }
  return json as DraftsListResponse;
}

export function useAdminDrafts(params: DraftListParams) {
  return useQuery({
    queryKey: ["admin", "drafts", params],
    queryFn: () => fetchDrafts(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAdminDraft(id: string | null) {
  return useQuery({
    queryKey: ["admin", "drafts", id],
    queryFn: async (): Promise<DraftDetailResponse> => {
      const res = await fetch(`/api/admin/drafts/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to load draft");
      }
      return json as DraftDetailResponse;
    },
    enabled: !!id,
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/drafts/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to delete draft");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Draft deleted");
      qc.invalidateQueries({ queryKey: ["admin", "drafts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}