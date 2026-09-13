"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { Pagination } from "@/components/features/dashboard/Pagination";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { RequestActionsMenu } from "@/components/features/requests/RequestActionsMenu";
import {
  RequestFilters,
  type StatusFilter,
} from "@/components/features/requests/RequestFilters";
import {
  useAdminRequests,
  useApproveRequest,
  useRejectRequest,
  usePendingRequest,
  useDeleteRequest,
} from "@/lib/hooks/use-admin-requests";
import type {
  AdminRequestFull,
  RequestStatus,
} from "@/lib/types/admin";

function statusVariant(s: RequestStatus) {
  if (s === "APPROVED") return "success" as const;
  if (s === "REJECTED") return "danger" as const;
  return "warning" as const;
}

export default function RequestsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);

  const params = useMemo(() => {
    const p: any = { search, skip, take };
    if (status !== "all") p.status = status;
    return p;
  }, [search, status, skip, take]);

  const { data, isLoading, isError, error } = useAdminRequests(params);

  const approve = useApproveRequest();
  const reject = useRejectRequest();
  const toPending = usePendingRequest();
  const remove = useDeleteRequest();

  const [confirmApprove, setConfirmApprove] = useState<AdminRequestFull | null>(
    null
  );
  const [confirmReject, setConfirmReject] = useState<AdminRequestFull | null>(
    null
  );
  const [confirmPending, setConfirmPending] = useState<AdminRequestFull | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<AdminRequestFull | null>(
    null
  );

  const columns: Column<AdminRequestFull>[] = [
    {
      key: "id",
      header: "#",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.id}
        </span>
      ),
    },
    {
      key: "profile",
      header: "Listing",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.profile.title}</span>
          <span className="text-xs text-muted-foreground">
            {r.profile.location}
          </span>
        </div>
      ),
    },
    {
      key: "requester",
      header: "Requester",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {r.requester.name ?? (
              <span className="text-muted-foreground">Unnamed</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {r.requester.phone}
          </span>
        </div>
      ),
    },
    {
      key: "receiver",
      header: "Receiver",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {r.receiver.name ?? (
              <span className="text-muted-foreground">Unnamed</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {r.receiver.phone}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge variant={statusVariant(r.status)}>
          {r.status}
        </StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (r) => (
        <RequestActionsMenu
          request={r}
          onView={(x) => router.push(`/requests/${x.id}`)}
          onApprove={(x) => setConfirmApprove(x)}
          onReject={(x) => setConfirmReject(x)}
          onPending={(x) => setConfirmPending(x)}
          onDelete={(x) => setConfirmDelete(x)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Requests</h2>
      </div>

      <RequestFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setSkip(0);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setSkip(0);
        }}
      />

      <DataTable
        columns={columns}
        data={data?.requests ?? []}
        rowKey={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No requests match your filters"
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

      {/* ---- Dialogs ---- */}

      <ConfirmDialog
        open={!!confirmApprove}
        onOpenChange={(o) => !o && setConfirmApprove(null)}
        title="Approve this request?"
        description={
          confirmApprove ? (
            <>
              <span className="font-medium">
                {confirmApprove.requester.name ?? confirmApprove.requester.phone}
              </span>{" "}
              will be approved for{" "}
              <span className="font-medium">{confirmApprove.profile.title}</span>.
              The listing may auto-close if capacity becomes full.
            </>
          ) : null
        }
        confirmLabel="Approve"
        loading={approve.isPending}
        onConfirm={async () => {
          if (!confirmApprove) return;
          await approve.mutateAsync(confirmApprove.id);
          setConfirmApprove(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmReject}
        onOpenChange={(o) => !o && setConfirmReject(null)}
        title="Reject this request?"
        description={
          confirmReject ? (
            <>
              <span className="font-medium">
                {confirmReject.requester.name ?? confirmReject.requester.phone}
              </span>{" "}
              will be rejected for{" "}
              <span className="font-medium">{confirmReject.profile.title}</span>.
            </>
          ) : null
        }
        confirmLabel="Reject"
        destructive
        loading={reject.isPending}
        onConfirm={async () => {
          if (!confirmReject) return;
          await reject.mutateAsync(confirmReject.id);
          setConfirmReject(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmPending}
        onOpenChange={(o) => !o && setConfirmPending(null)}
        title="Move back to pending?"
        description={
          confirmPending ? (
            <>
              If this request was <strong>APPROVED</strong>, moving it back to
              pending may free up a spot on the listing and reopen it.
            </>
          ) : null
        }
        confirmLabel="Move to pending"
        loading={toPending.isPending}
        onConfirm={async () => {
          if (!confirmPending) return;
          await toPending.mutateAsync(confirmPending.id);
          setConfirmPending(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this request?"
        description={
          confirmDelete ? (
            <>
              This permanently removes request{" "}
              <span className="font-mono">#{confirmDelete.id}</span> from{" "}
              <span className="font-medium">
                {confirmDelete.requester.name ?? confirmDelete.requester.phone}
              </span>{" "}
              → {confirmDelete.profile.title}.
            </>
          ) : null
        }
        confirmLabel="Delete request"
        destructive
        loading={remove.isPending}
        confirmText={String(confirmDelete?.id ?? "")}
        confirmLabelText={
          confirmDelete ? (
            <>
              Type the request ID{" "}
              <span className="font-mono text-foreground">
                {confirmDelete.id}
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