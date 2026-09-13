"use client";

import { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminActionsMenu } from "@/components/features/admins/AdminActionsMenu";
import { AdminDetailDialog } from "@/components/features/admins/AdminDetailDialog";
import { AdminPromoteDialog } from "@/components/features/admins/AdminPromoteDialog";
import {
  useAdmins,
  useDeleteAdmin,
} from "@/lib/hooks/use-admin-management";
import { useAdminMe } from "@/lib/hooks/use-admin-me";
import type { AdminRecord } from "@/lib/types/admin";

export default function AdminsPage() {
  const { data, isLoading, isError, error } = useAdmins();
  const { data: me } = useAdminMe();
  const remove = useDeleteAdmin();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<AdminRecord | null>(null);

  const admins = data?.admins ?? [];
  const myUserId = me?.user?.id;

  const columns: Column<AdminRecord>[] = [
    {
      key: "name",
      header: "Admin",
      cell: (a) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {a.user.name ?? (
              <span className="text-muted-foreground">Unnamed</span>
            )}
            {a.userId === myUserId && (
              <Badge variant="outline" className="ml-2">
                You
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {a.user.phone}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.user.isVerified ? (
            <StatusBadge variant="success">Verified</StatusBadge>
          ) : (
            <StatusBadge variant="muted">Unverified</StatusBadge>
          )}
          {a.user.isBlocked && (
            <StatusBadge variant="danger">Blocked</StatusBadge>
          )}
        </div>
      ),
    },
    {
      key: "since",
      header: "Admin since",
      cell: (a) => (
        <span className="text-xs text-muted-foreground">
          {new Date(a.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (a) => (
        <AdminActionsMenu
          admin={a}
          isSelf={a.userId === myUserId}
          onView={(x) => setDetailId(x.userId)}
          onRemove={(x) => setConfirmRemove(x)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Admins</h2>
          {data && (
            <Badge variant="outline" className="ml-1">
              {data.count}
            </Badge>
          )}
        </div>

        <Button onClick={() => setPromoteOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Add admin
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={admins}
        rowKey={(a) => a.userId}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No admins yet"
      />

      {/* View details modal */}
      <AdminDetailDialog
        userId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />

      {/* Promote dialog */}
      <AdminPromoteDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
      />

      {/* Remove confirm — type phone to confirm */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title="Remove admin access?"
        description={
          confirmRemove ? (
            <>
              <span className="font-medium">
                {confirmRemove.user.name ?? confirmRemove.user.phone}
              </span>{" "}
              will lose all admin privileges. Their user account stays
              intact.
            </>
          ) : null
        }
        confirmLabel="Remove admin"
        destructive
        loading={remove.isPending}
        confirmText={confirmRemove?.user.phone}
        confirmLabelText={
          confirmRemove ? (
            <>
              Type the phone number{" "}
              <span className="font-mono text-foreground">
                {confirmRemove.user.phone}
              </span>{" "}
              to confirm.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (!confirmRemove) return;
          await remove.mutateAsync(confirmRemove.userId);
          setConfirmRemove(null);
        }}
      />
    </div>
  );
}