"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminSport, SportsListResponse } from "@/lib/types/admin";

async function fetchSports(): Promise<SportsListResponse> {
  const res = await fetch("/api/admin/sports", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load sports");
  }
  return json as SportsListResponse;
}

export function useAdminSports() {
  return useQuery({
    queryKey: ["admin", "sports"],
    queryFn: fetchSports,
    staleTime: 30_000,
  });
}

function useInvalidateSports() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "sports"] });
  };
}

export type CreateSportInput = {
  name: string;
  slug?: string;
  icon?: string | null;
  category?: string | null;
  sortOrder?: number;
};

export function useCreateSport() {
  const invalidate = useInvalidateSports();

  return useMutation({
    mutationFn: async (input: CreateSportInput) => {
      const res = await fetch("/api/admin/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to create sport");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Sport created");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export type UpdateSportInput = Partial<CreateSportInput> & {
  isActive?: boolean;
};

export function useUpdateSport() {
  const invalidate = useInvalidateSports();

  return useMutation({
    mutationFn: async (args: { id: string; input: UpdateSportInput }) => {
      const res = await fetch(`/api/admin/sports/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.input),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to update sport");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Sport updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSport() {
  const invalidate = useInvalidateSports();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/sports/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to delete sport");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Sport deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}