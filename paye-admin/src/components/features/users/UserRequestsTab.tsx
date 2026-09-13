"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/features/dashboard/DataTable";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import type { AdminRequest, RequestStatus } from "@/lib/types/admin";

type Props = {
  requests: AdminRequest[];
  direction: "sent" | "received";
};

function statusVariant(s: RequestStatus) {
  if (s === "APPROVED") return "success" as const;
  if (s === "REJECTED") return "danger" as const;
  return "warning" as const;
}

export function UserRequestsTab({ requests, direction }: Props) {
  const otherKey = direction === "sent" ? "receiver" : "requester";
  const otherLabel = direction === "sent" ? "Receiver" : "Requester";

  const columns: Column<AdminRequest>[] = [
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
            {r.profile.exerciseType} · {r.profile.location}
          </span>
        </div>
      ),
    },
    {
      key: "other",
      header: otherLabel,
      cell: (r) => {
        const other = r[otherKey];
        return (
          <div className="flex flex-col">
            <Link
              href={`/users/${other.id}`}
              className="font-medium text-primary hover:underline"
            >
              {other.name ?? "Unnamed"}
            </Link>
            <span className="text-xs text-muted-foreground" dir="ltr">
              {other.phone}
            </span>
          </div>
        );
      },
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
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      rowKey={(r) => String(r.id)}
      emptyMessage={
        direction === "sent"
          ? "This user hasn't sent any requests"
          : "This user hasn't received any requests"
      }
    />
  );
}