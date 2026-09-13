"use client";

import { useMemo, useState } from "react";
import { Users as UsersIcon, ShieldCheck, ShieldOff, Lock } from "lucide-react";

import { DataTable, type Column } from "@/components/features/dashboard/DataTable";
import { Pagination } from "@/components/features/dashboard/Pagination";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { UserActionsMenu } from "@/components/features/users/UserActionsMenu";
import {
  UserFilters,
  type StatusFilter,
} from "@/components/features/users/UserFilters";
import {
  useAdminUsers,
  useBlockUser,
  useUnblockUser,
  useVerifyUser,
  useUnverifyUser,
  useDeleteUser,
} from "@/lib/hooks/use-admin-users";
import {
  useStartImpersonation,
  buildImpersonationLink,
} from "@/lib/hooks/use-impersonation";
import type { AdminUser } from "@/lib/types/admin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPromoteDialog } from "@/components/features/admins/AdminPromoteDialog";

export default function UsersPage() {
  const router = useRouter();

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);
  const [promoteOpen, setPromoteOpen] = useState(false);


  // derive isVerified / isBlocked from status
  const listParams = useMemo(() => {
    const p: any = { search, skip, take };
    if (status === "verified") p.isVerified = "true";
    if (status === "unverified") p.isVerified = "false";
    if (status === "blocked") p.isBlocked = "true";
    if (status === "active") p.isBlocked = "false";
    return p;
  }, [search, status, skip, take]);

  const { data, isLoading, isError, error } = useAdminUsers(listParams);

  // mutations
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const verify = useVerifyUser();
  const unverify = useUnverifyUser();
  const remove = useDeleteUser();
  const impersonate = useStartImpersonation();

  // dialogs
  const [confirmBlock, setConfirmBlock] = useState<AdminUser | null>(null);
  const [confirmUnblock, setConfirmUnblock] = useState<AdminUser | null>(null);
  const [confirmVerify, setConfirmVerify] = useState<AdminUser | null>(null);
  const [confirmUnverify, setConfirmUnverify] = useState<AdminUser | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [confirmImpersonate, setConfirmImpersonate] =
    useState<AdminUser | null>(null);

  async function handleImpersonateConfirm() {
    if (!confirmImpersonate) return;
    const res = await impersonate.mutateAsync(confirmImpersonate.id);
    const link = buildImpersonationLink(res.user.id);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Impersonation link copied", {
        description: "Paste it into the user app to continue.",
      });
    } catch {
      toast.message("Impersonation started", {
        description: `Copy manually: ${link}`,
      });
    }
    setConfirmImpersonate(null);
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      cell: (u) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {u.name ?? <span className="text-muted-foreground">—</span>}
          </span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {u.phone}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.isVerified ? (
            <StatusBadge variant="success">
              <ShieldCheck className="h-3 w-3" /> Verified
            </StatusBadge>
          ) : (
            <StatusBadge variant="muted">
              <ShieldOff className="h-3 w-3" /> Unverified
            </StatusBadge>
          )}
          {u.isBlocked && (
            <StatusBadge variant="danger">
              <Lock className="h-3 w-3" /> Blocked
            </StatusBadge>
          )}
          {u.isAdmin && <StatusBadge variant="info">Admin</StatusBadge>}
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      cell: (u) => (
        <span className="text-sm text-muted-foreground">
          {u.avgRating ? u.avgRating.toFixed(1) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (u) => (
        <UserActionsMenu
          user={u}
          onView={() => router.push(`/users/${u.id}`)}
          onBlock={(x) => setConfirmBlock(x)}
          onUnblock={(x) => setConfirmUnblock(x)}
          onVerify={(x) => setConfirmVerify(x)}
          onUnverify={(x) => setConfirmUnverify(x)}
          onDelete={(x) => setConfirmDelete(x)}
          onImpersonate={(x) => setConfirmImpersonate(x)}
          onMakeAdmin={() => setPromoteOpen(true)}

        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Users</h2>
      </div>

      <UserFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setSkip(0);
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setSkip(0);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No users match your filters"
      />

      {data && (
        <Pagination
          skip={skip}
          take={take}
          total={data.total}
          onSkipChange={setSkip}
          onTakeChange={setTake}
        />
      )}

      {/* ---- Confirm Dialogs ---- */}

      <ConfirmDialog
        open={!!confirmBlock}
        onOpenChange={(o) => !o && setConfirmBlock(null)}
        title="Block this user?"
        description={
          confirmBlock ? (
            <>
              <span className="font-medium">
                {confirmBlock.name ?? "This user"}
              </span>{" "}
              will not be able to log in or use the app.
            </>
          ) : null
        }
        confirmLabel="Block"
        destructive
        loading={block.isPending}
        onConfirm={async () => {
          if (!confirmBlock) return;
          await block.mutateAsync(confirmBlock.id);
          setConfirmBlock(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmUnblock}
        onOpenChange={(o) => !o && setConfirmUnblock(null)}
        title="Unblock this user?"
        description={
          confirmUnblock ? (
            <>
              <span className="font-medium">
                {confirmUnblock.name ?? "This user"}
              </span>{" "}
              will regain access.
            </>
          ) : null
        }
        confirmLabel="Unblock"
        loading={unblock.isPending}
        onConfirm={async () => {
          if (!confirmUnblock) return;
          await unblock.mutateAsync(confirmUnblock.id);
          setConfirmUnblock(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmVerify}
        onOpenChange={(o) => !o && setConfirmVerify(null)}
        title="Verify this user?"
        confirmLabel="Verify"
        loading={verify.isPending}
        onConfirm={async () => {
          if (!confirmVerify) return;
          await verify.mutateAsync(confirmVerify.id);
          setConfirmVerify(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmUnverify}
        onOpenChange={(o) => !o && setConfirmUnverify(null)}
        title="Remove verification?"
        confirmLabel="Unverify"
        loading={unverify.isPending}
        onConfirm={async () => {
          if (!confirmUnverify) return;
          await unverify.mutateAsync(confirmUnverify.id);
          setConfirmUnverify(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this user?"
        description={
          confirmDelete ? (
            <>
              This permanently removes{" "}
              <span className="font-medium">
                {confirmDelete.name ?? confirmDelete.phone}
              </span>{" "}
              and all related data. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete user"
        destructive
        loading={remove.isPending}
        confirmText={confirmDelete?.phone}
        confirmLabelText={
          confirmDelete ? (
            <>
              Type the phone number{" "}
              <span className="font-mono text-foreground">
                {confirmDelete.phone}
              </span>{" "}
              to confirm.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (!confirmDelete) return;
          await remove.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmImpersonate}
        onOpenChange={(o) => !o && setConfirmImpersonate(null)}
        title="Start impersonation?"
        description={
          confirmImpersonate ? (
            <>
              You will be able to open{" "}
              <span className="font-medium">
                {confirmImpersonate.name ?? confirmImpersonate.phone}
              </span>
              &apos;s account in the user app. The session lasts 30 minutes.
            </>
          ) : null
        }
        confirmLabel="Start"
        loading={impersonate.isPending}
        onConfirm={handleImpersonateConfirm}
      />

      <AdminPromoteDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
      />
    </div>
  );
}