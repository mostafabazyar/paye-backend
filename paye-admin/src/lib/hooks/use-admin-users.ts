"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AdminUser,
  UserListParams,
  UsersListResponse,
} from "@/lib/types/admin";

async function fetchUsers(params: UserListParams): Promise<UsersListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.isVerified) qs.set("isVerified", params.isVerified);
  if (params.isBlocked) qs.set("isBlocked", params.isBlocked);
  qs.set("skip", String(params.skip ?? 0));
  qs.set("take", String(params.take ?? 20));

  const res = await fetch(`/api/admin/users?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch users");
  }
  return json as UsersListResponse;
}

export function useAdminUsers(params: UserListParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}

/* ---------- mutations ---------- */

type ActionName = "block" | "unblock" | "verify" | "unverify";

async function userAction(id: string, action: ActionName) {
  const res = await fetch(`/api/admin/users/${id}/${action}`, {
    method: "PATCH",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? `Failed to ${action} user`);
  }
  return json;
}

function useInvalidateUsers() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };
}

export function useBlockUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => userAction(id, "block"),
    onSuccess: () => {
      toast.success("User blocked");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => userAction(id, "unblock"),
    onSuccess: () => {
      toast.success("User unblocked");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVerifyUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => userAction(id, "verify"),
    onSuccess: () => {
      toast.success("User verified");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnverifyUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => userAction(id, "unverify"),
    onSuccess: () => {
      toast.success("User unverified");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to delete user");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- single user (for detail page) ---------- */

export type UserDetailResponse = {
  success: boolean;
  user: AdminUser;
  listings: any[];
  sentRequests: any[];
  receivedRequests: any[];
};

async function fetchUser(id: string): Promise<UserDetailResponse> {
  const res = await fetch(`/api/admin/users/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? "Failed to fetch user");
  }
  return json as UserDetailResponse;
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}