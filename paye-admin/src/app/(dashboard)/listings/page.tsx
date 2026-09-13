"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Users, CheckCircle2 } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { Pagination } from "@/components/features/dashboard/Pagination";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { ListingActionsMenu } from "@/components/features/listings/ListingActionsMenu";
import {
  ListingFilters,
  type ActiveFilter,
} from "@/components/features/listings/ListingFilters";
import {
  useAdminListings,
  useCloseListing,
  useReactivateListing,
  useDeleteListing,
} from "@/lib/hooks/use-admin-listings";
import type { AdminListing } from "@/lib/types/admin";

export default function ListingsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [exerciseType, setExerciseType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const params = useMemo(() => {
    const p: any = { page, limit, search };
    if (active === "active") p.isActive = "true";
    if (active === "closed") p.isActive = "false";
    if (exerciseType) p.exerciseType = exerciseType;
    return p;
  }, [search, active, exerciseType, page, limit]);

  const { data, isLoading, isError, error } = useAdminListings(params);
  const listings = data?.data?.listings ?? [];
  const pagination = data?.data?.pagination;

  const closeListing = useCloseListing();
  const reactivateListing = useReactivateListing();
  const deleteListing = useDeleteListing();

  const [confirmClose, setConfirmClose] = useState<AdminListing | null>(null);
  const [confirmReactivate, setConfirmReactivate] =
    useState<AdminListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminListing | null>(null);

  const columns: Column<AdminListing>[] = [
    {
      key: "title",
      header: "Listing",
      cell: (l) => (
        <div className="flex flex-col">
          <span className="font-medium">{l.title}</span>
          <span className="text-xs text-muted-foreground">
            {l.location}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (l) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{l.exerciseType}</span>
          <span className="text-xs text-muted-foreground">
            {l.genderPreference}
          </span>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (l) => (
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{l.approvedCount}</span>
          <span className="text-muted-foreground">/ {l.maxInvites}</span>
        </div>
      ),
    },
    {
      key: "requests",
      header: "Requests",
      cell: (l) => (
        <span className="text-sm text-muted-foreground">
          {l.requestCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (l) =>
        l.isActive ? (
          <StatusBadge variant="success">
            <CheckCircle2 className="h-3 w-3" /> Active
          </StatusBadge>
        ) : (
          <StatusBadge variant="muted">Closed</StatusBadge>
        ),
    },
    {
      key: "created",
      header: "Created",
      cell: (l) => (
        <span className="text-xs text-muted-foreground">
          {new Date(l.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (l) => (
        <ListingActionsMenu
          listing={l}
          onView={(x) => router.push(`/listings/${x.id}`)}
          onClose={(x) => setConfirmClose(x)}
          onReactivate={(x) => setConfirmReactivate(x)}
          onDelete={(x) => setConfirmDelete(x)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Listings</h2>
      </div>

      <ListingFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        active={active}
        onActiveChange={(v) => {
          setActive(v);
          setPage(1);
        }}
        exerciseType={exerciseType}
        onExerciseTypeChange={(v) => {
          setExerciseType(v);
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={listings}
        rowKey={(l) => String(l.id)}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No listings match your filters"
      />

      {pagination && (
        <Pagination
          skip={(pagination.page - 1) * pagination.limit}
          take={pagination.limit}
          total={pagination.total}
          onSkipChange={(s) => setPage(Math.floor(s / pagination.limit) + 1)}
          onTakeChange={(t) => {
            setLimit(t);
            setPage(1);
          }}
        />
      )}

      {/* ---- Dialogs ---- */}

      <ConfirmDialog
        open={!!confirmClose}
        onOpenChange={(o) => !o && setConfirmClose(null)}
        title="Close this listing?"
        description={
          confirmClose ? (
            <>
              <span className="font-medium">{confirmClose.title}</span> will
              no longer accept new requests.
            </>
          ) : null
        }
        confirmLabel="Close listing"
        loading={closeListing.isPending}
        onConfirm={async () => {
          if (!confirmClose) return;
          await closeListing.mutateAsync(confirmClose.id);
          setConfirmClose(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmReactivate}
        onOpenChange={(o) => !o && setConfirmReactivate(null)}
        title="Reactivate this listing?"
        description={
          confirmReactivate ? (
            <>
              <span className="font-medium">{confirmReactivate.title}</span>{" "}
              will start accepting requests again. The listing must have free
              capacity and a future schedule.
            </>
          ) : null
        }
        confirmLabel="Reactivate"
        loading={reactivateListing.isPending}
        onConfirm={async () => {
          if (!confirmReactivate) return;
          await reactivateListing.mutateAsync(confirmReactivate.id);
          setConfirmReactivate(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this listing?"
        description={
          confirmDelete ? (
            <>
              This permanently removes{" "}
              <span className="font-medium">{confirmDelete.title}</span> and{" "}
              {confirmDelete.requestCount} related request(s). Cannot be
              undone.
            </>
          ) : null
        }
        confirmLabel="Delete listing"
        destructive
        loading={deleteListing.isPending}
        confirmText={String(confirmDelete?.id ?? "")}
        confirmLabelText={
          confirmDelete ? (
            <>
              Type the listing ID{" "}
              <span className="font-mono text-foreground">
                {confirmDelete.id}
              </span>{" "}
              to confirm.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteListing.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}