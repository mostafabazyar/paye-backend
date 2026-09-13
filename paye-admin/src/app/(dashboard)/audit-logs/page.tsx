"use client";

import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/features/dashboard/DataTable";
import { Pagination } from "@/components/features/dashboard/Pagination";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import {
  AuditLogFilters,
  emptyFilters,
  type AuditFilters,
} from "@/components/features/audit-logs/AuditLogFilters";
import { AuditLogDetailDialog } from "@/components/features/audit-logs/AuditLogDetailDialog";
import { useAuditLogs } from "@/lib/hooks/use-admin-audit-logs";
import { actionVariant } from "@/lib/constants/audit";
import type { AuditLog } from "@/lib/types/admin";

/**
 * Convert yyyy-mm-dd to an ISO string.
 * `from` → start of day, `to` → end of day.
 */
function fromToIso(v: string, endOfDay = false): string | undefined {
  if (!v) return undefined;
  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return `${v}T${time}Z`;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit,
      action: filters.action || undefined,
      adminId: filters.adminId || undefined,
      targetType: filters.targetType || undefined,
      targetId: filters.targetId || undefined,
      from: fromToIso(filters.from, false),
      to: fromToIso(filters.to, true),
    }),
    [page, limit, filters]
  );

  const { data, isLoading, isError, error } = useAuditLogs(params);
  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  const columns: Column<AuditLog>[] = [
    {
      key: "time",
      header: "Time",
      cell: (l) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(l.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (l) => (
        <StatusBadge variant={actionVariant(l.action)}>{l.action}</StatusBadge>
      ),
    },
    {
      key: "target",
      header: "Target",
      cell: (l) => (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{l.targetType}</span>
          <span className="font-mono text-xs">{l.targetId ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      cell: (l) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {l.admin?.user?.name ?? (
              <span className="text-muted-foreground">Admin #{l.adminId}</span>
            )}
          </span>
          {l.admin?.user?.phone && (
            <span className="text-xs text-muted-foreground" dir="ltr">
              {l.admin.user.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP",
      cell: (l) => (
        <span className="font-mono text-xs text-muted-foreground">
          {l.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[48px]",
      className: "text-right",
      cell: (l) => (
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => setDetailId(l.id)}
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Audit Logs</h2>
      </div>

      <AuditLogFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={logs}
        rowKey={(l) => l.id}
        loading={isLoading}
        error={isError ? (error as Error).message : null}
        emptyMessage="No audit logs match your filters"
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

      <AuditLogDetailDialog
        logId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  );
}