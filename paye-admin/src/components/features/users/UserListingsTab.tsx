"use client";

import { DataTable, type Column } from "@/components/features/dashboard/DataTable";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import type { AdminProfile } from "@/lib/types/admin";

export function UserListingsTab({ listings }: { listings: AdminProfile[] }) {
  const columns: Column<AdminProfile>[] = [
    {
      key: "title",
      header: "Title",
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.title}</span>
          <span className="text-xs text-muted-foreground">
            {p.location}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (p) => <span className="text-sm">{p.exerciseType}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) =>
        p.isActive ? (
          <StatusBadge variant="success">Active</StatusBadge>
        ) : (
          <StatusBadge variant="muted">Closed</StatusBadge>
        ),
    },
    {
      key: "invites",
      header: "Invites",
      cell: (p) => (
        <span className="text-sm text-muted-foreground">
          {p.maxInvites}
        </span>
      ),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      cell: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.scheduledAt
            ? new Date(p.scheduledAt).toLocaleString()
            : "—"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (p) => (
        <span className="text-xs text-muted-foreground">
          {new Date(p.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={listings}
      rowKey={(p) => String(p.id)}
      emptyMessage="This user has no listings"
    />
  );
}