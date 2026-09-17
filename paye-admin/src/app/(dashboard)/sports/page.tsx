"use client";

import { useState } from "react";
import { Trophy, Plus } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SportActionsMenu } from "@/components/features/sports/SportActionsMenu";
import { SportFormDialog } from "@/components/features/sports/SportFormDialog";
import {
  useAdminSports,
  useUpdateSport,
  useDeleteSport,
} from "@/lib/hooks/use-admin-sports";
import type { AdminSport } from "@/lib/types/admin";

export default function SportsPage() {
  const { data, isLoading, isError, error } = useAdminSports();
  const update = useUpdateSport();
  const remove = useDeleteSport();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminSport | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminSport | null>(null);

  const sports = data?.sports ?? [];

  const columns: Column<AdminSport>[] = [
    {
      key: "name",
      header: "Sport",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{s.icon ?? "🏅"}</span>
          <div className="flex flex-col">
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {s.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (s) =>
        s.category ? (
          <Badge variant="outline">{s.category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "order",
      header: "Order",
      cell: (s) => (
        <span className="text-sm text-muted-foreground">{s.sortOrder}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (s) =>
        s.isActive ? (
          <StatusBadge variant="success">Active</StatusBadge>
        ) : (
          <StatusBadge variant="muted">Inactive</StatusBadge>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (s) => (
        <SportActionsMenu
          sport={s}
          // Delete button is always shown; the backend refuses non-super
          // admins with a 403 message we surface as a toast.
          canDelete={true}
          onEdit={(x) => {
            setEditTarget(x);
            setFormOpen(true);
          }}
          onToggle={(x) =>
            update.mutate({ id: x.id, input: { isActive: !x.isActive } })
          }
          onDelete={(x) => setConfirmDelete(x)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Sports</h2>
          {data && (
            <Badge variant="outline" className="ml-1">
              {data.count}
            </Badge>
          )}
        </div>

        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add sport
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sports}
        rowKey={(s) => s.id}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No sports yet. Add your first one."
      />

      <SportFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditTarget(null);
        }}
        sport={editTarget}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this sport?"
        description={
          confirmDelete ? (
            <>
              <span className="font-medium">{confirmDelete.name}</span> will be
              permanently removed. This only works if no users are linked to
              it — otherwise deactivate it instead.
            </>
          ) : null
        }
        confirmLabel="Delete sport"
        destructive
        loading={remove.isPending}
        confirmText={confirmDelete?.slug}
        confirmLabelText={
          confirmDelete ? (
            <>
              Type the slug{" "}
              <span className="font-mono text-foreground">
                {confirmDelete.slug}
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
    </div>
  );
}