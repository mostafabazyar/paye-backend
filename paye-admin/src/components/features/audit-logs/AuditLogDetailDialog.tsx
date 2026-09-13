"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useAuditLog } from "@/lib/hooks/use-admin-audit-logs";
import { actionVariant } from "@/lib/constants/audit";

type Props = {
  logId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function AuditLogDetailDialog({ logId, onOpenChange }: Props) {
  const open = !!logId;
  const { data, isLoading, isError, error } = useAuditLog(logId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit log details</DialogTitle>
          <DialogDescription>
            Immutable record of an admin action.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}

        {data && <Body log={data.log} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ log }: { log: import("@/lib/types/admin").AuditLog }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge variant={actionVariant(log.action)}>
          {log.action}
        </StatusBadge>
        <StatusBadge variant="muted">{log.targetType}</StatusBadge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Log ID" value={log.id} mono />
        <Field
          label="Time"
          value={new Date(log.createdAt).toLocaleString()}
        />
        <Field
          label="Admin"
          value={
            log.admin?.user
              ? `${log.admin.user.name ?? "Unnamed"} (${log.admin.user.phone})`
              : "—"
          }
        />
        <Field label="Admin ID" value={String(log.adminId)} mono />
        <Field label="Target ID" value={log.targetId ?? "—"} mono />
        <Field label="IP address" value={log.ipAddress ?? "—"} mono />
      </div>

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="border-t pt-4">
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Metadata
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs break-all" : "text-sm"}>
        {value}
      </span>
    </div>
  );
}