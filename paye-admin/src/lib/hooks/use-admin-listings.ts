"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AdminListing,
  ListingListParams,
  ListingsListResponse,
} from "@/lib/types/admin";

async function fetchListings(
  params: ListingListParams
): Promise<ListingsListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.sport) qs.set("sport", params.sport);
  if (params.exerciseType) qs.set("exerciseType", params.exerciseType);
  if (params.location) qs.set("location", params.location);
  if (params.isActive) qs.set("isActive", params.isActive);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));

  const res = await fetch(`/api/admin/listings?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch listings");
  }
  return json as ListingsListResponse;
}

export function useAdminListings(params: ListingListParams) {
  return useQuery({
    queryKey: ["admin", "listings", params],
    queryFn: () => fetchListings(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/* ---------- mutations ---------- */

function useInvalidateListings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };
}

export function useCloseListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/close`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to close listing");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Listing closed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivateListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/reactivate`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to reactivate listing");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Listing reactivated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to delete listing");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- single listing (for detail page) ---------- */

export type ListingDetailResponse = {
  success: boolean;
  data: { listing: AdminListing & {
    creator: any;
    capacity: { maxInvites: number; approved: number; remaining: number };
    requests: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      items: any[];
    };
  } };
};

async function fetchListing(id: string): Promise<ListingDetailResponse> {
  const res = await fetch(`/api/admin/listings/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch listing");
  }
  return json as ListingDetailResponse;
}

export function useAdminListing(id: string) {
  return useQuery({
    queryKey: ["admin", "listings", id],
    queryFn: () => fetchListing(id),
    enabled: !!id,
  });
}

