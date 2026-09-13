"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { DataTable, type Column } from "@/components/features/dashboard/DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  AdminListingCreator,
  AdminListingRequestItem,
  ListingDetail,
  RequestStatus,
} from "@/lib/types/admin";

function statusVariant(s: RequestStatus) {
  if (s === "APPROVED") return "success" as const;
  if (s === "REJECTED") return "danger" as const;
  return "warning" as const;
}

function initials(name: string | null, phone: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2);
}

function UserCell({ user }: { user: AdminListingCreator | null }) {
  if (!user) return <span className="text-muted-foreground">—</span>;
  const photo = user.photos?.[0];

  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        {photo && <AvatarImage src={photo} alt={user.name ?? user.phone} />}
        <AvatarFallback>{initials(user.name, user.phone)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {user.name ?? <span className="text-muted-foreground">Unnamed</span>}
        </span>
        <span className="text-xs text-muted-foreground" dir="ltr">
          {user.phone}
        </span>
      </div>
    </div>
  );
}

export function ListingDetailTabs({ listing }: { listing: ListingDetail }) {
  const { requests } = listing;

  const columns: Column<AdminListingRequestItem>[] = [
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
      key: "requester",
      header: "Requester",
      cell: (r) => <UserCell user={r.requester} />,
    },
    {
      key: "receiver",
      header: "Receiver",
      cell: (r) => <UserCell user={r.receiver} />,
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
    <Tabs defaultValue="all" className="w-full">
      <TabsList variant="line">
        <TabsTrigger value="all">All ({requests.total})</TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({requests.pending})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({requests.approved})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({requests.rejected})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="pt-4">
        <DataTable
          columns={columns}
          data={requests.items}
          rowKey={(r) => String(r.id)}
          emptyMessage="No requests yet"
        />
      </TabsContent>

      <TabsContent value="pending" className="pt-4">
        <DataTable
          columns={columns}
          data={requests.items.filter((r) => r.status === "PENDING")}
          rowKey={(r) => String(r.id)}
          emptyMessage="No pending requests"
        />
      </TabsContent>

      <TabsContent value="approved" className="pt-4">
        <DataTable
          columns={columns}
          data={requests.items.filter((r) => r.status === "APPROVED")}
          rowKey={(r) => String(r.id)}
          emptyMessage="No approved requests"
        />
      </TabsContent>

      <TabsContent value="rejected" className="pt-4">
        <DataTable
          columns={columns}
          data={requests.items.filter((r) => r.status === "REJECTED")}
          rowKey={(r) => String(r.id)}
          emptyMessage="No rejected requests"
        />
      </TabsContent>
    </Tabs>
  );
}