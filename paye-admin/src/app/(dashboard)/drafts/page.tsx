"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { Pagination } from "@/components/features/dashboard/Pagination";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { SearchInput } from "@/components/features/dashboard/SearchInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DraftDetailDialog } from "@/components/features/drafts/DraftDetailDialog";
import {
  useAdminDrafts,
  useDeleteDraft,
} from "@/lib/hooks/use-admin-drafts";
import type { AdminDraft } from "@/lib/types/admin";

type StatusFilter = "all" | "inProgress" | "completed" | "abandoned";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inProgress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

export default function DraftsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminDraft | null>(null);

  const params = useMemo(
    () => ({ search, status, page, limit }),
    [search, status, page, limit]
  );

  const { data, isLoading, isError, error } = useAdminDrafts(params);
  const remove = useDeleteDraft();

  const drafts = data?.drafts ?? [];
  const pagination = data?.pagination;

  const columns: Column<AdminDraft>[] = [
    {
      key: "phone",
      header: "Phone",
      cell: (d) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm" dir="ltr">
            {d.phone}
          </span>
          <span className="text-xs text-muted-foreground">
            {d.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "step",
      header: "Step",
      cell: (d) => (
        <span className="text-xs text-muted-foreground">
          {d.lastStep} / 7
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (d) =>
        d.completedAt ? (
          <StatusBadge variant="success">Completed</StatusBadge>
        ) : d.abandonedAt ? (
          <StatusBadge variant="danger">Abandoned</StatusBadge>
        ) : (
          <StatusBadge variant="warning">In progress</StatusBadge>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (d) => (
        <span className="text-xs text-muted-foreground">
          {new Date(d.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[112px]",
      className: "text-right",
      cell: (d) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailId(d.id)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDelete(d)}
            aria-label="Delete draft"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Drafts</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by phone..."
        />

        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={status === opt.value ? "default" : "ghost"}
              size="xs"
              className={cn(
                "rounded-md",
                status !== opt.value && "text-muted-foreground"
              )}
              onClick={() => {
                setStatus(opt.value);
                setPage(1);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={drafts}
        rowKey={(d) => d.id}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No drafts yet"
      />

      {pagination && (
        <Pagination
          skip={(pagination.page - 1) * pagination.limit}
          take={pagination.limit}
          total={pagination.total}
          onSkipChange={(s) =>
            setPage(Math.floor(s / pagination.limit) + 1)
          }
          onTakeChange={(t) => {
            setLimit(t);
            setPage(1);
          }}
        />
      )}

      <DraftDetailDialog
        draftId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this draft?"
        description={
          confirmDelete ? (
            <>
              This permanently removes the CRM record for{" "}
              <span className="font-mono">{confirmDelete.phone}</span>. Use it
              after you&apos;ve finished calling the user.
            </>
          ) : null
        }
        confirmLabel="Delete draft"
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await remove.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}