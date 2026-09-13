"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AdminDetailResponse,
  AdminsListResponse,
  CreateAdminResponse,
} from "@/lib/types/admin";

/* ---------- list ---------- */

async function fetchAdmins(): Promise<AdminsListResponse> {
  const res = await fetch("/api/admin/admins", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load admins");
  }
  return json as AdminsListResponse;
}

export function useAdmins() {
  return useQuery({
    queryKey: ["admin", "admins"],
    queryFn: fetchAdmins,
    staleTime: 30_000,
  });
}

/* ---------- detail ---------- */

async function fetchAdminDetail(id: string): Promise<AdminDetailResponse> {
  const res = await fetch(`/api/admin/admins/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to load admin");
  }
  return json as AdminDetailResponse;
}

export function useAdminDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "admins", id],
    queryFn: () => fetchAdminDetail(id as string),
    enabled: !!id,
  });
}

/* ---------- create ---------- */

export function useCreateAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to create admin");
      }
      return json as CreateAdminResponse;
    },
    onSuccess: (data) => {
      toast.success(`${data.admin.user.name ?? data.admin.user.phone} is now an admin`);
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- delete ---------- */

export function useDeleteAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/admins/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to remove admin");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Admin access removed");
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}