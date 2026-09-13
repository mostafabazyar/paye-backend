"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldCheck,
  ShieldOff,
  Lock,
  Star,
  Loader2,
} from "lucide-react";
import { useAdminDetail } from "@/lib/hooks/use-admin-management";

function initials(name: string | null, phone: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2);
}

type Props = {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function AdminDetailDialog({ userId, onOpenChange }: Props) {
  const open = !!userId;
  const { data, isLoading, isError, error } = useAdminDetail(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Admin details</DialogTitle>
          <DialogDescription>
            Full profile for this admin account.
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

        {data && <Body admin={data.admin} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ admin }: { admin: NonNullable<ReturnType<typeof useAdminDetail>["data"]>["admin"] }) {
  const { user } = admin;
  const photo = user.photos?.[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          {photo && <AvatarImage src={photo} alt={user.name ?? user.phone} />}
          <AvatarFallback>{initials(user.name, user.phone)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            {user.name ?? <span className="text-muted-foreground">Unnamed</span>}
          </div>
          <div className="text-xs text-muted-foreground" dir="ltr">
            {user.phone}
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {user.isVerified ? (
              <StatusBadge variant="success">
                <ShieldCheck className="h-3 w-3" /> Verified
              </StatusBadge>
            ) : (
              <StatusBadge variant="muted">
                <ShieldOff className="h-3 w-3" /> Unverified
              </StatusBadge>
            )}
            {user.isBlocked && (
              <StatusBadge variant="danger">
                <Lock className="h-3 w-3" /> Blocked
              </StatusBadge>
            )}
            {user.avgRating > 0 && (
              <StatusBadge variant="warning">
                <Star className="h-3 w-3" /> {user.avgRating.toFixed(1)}
              </StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
        <Field label="Admin ID" value={String(admin.id)} mono />
        <Field label="User ID" value={user.id} mono />
        <Field
          label="Became admin"
          value={new Date(admin.createdAt).toLocaleString()}
        />
        <Field
          label="Updated"
          value={new Date(admin.updatedAt).toLocaleString()}
        />
        <Field
          label="User joined"
          value={new Date(user.createdAt).toLocaleString()}
        />
        <Field label="Gender" value={user.gender ?? "—"} />
        <Field label="Interested in" value={user.interestedIn ?? "—"} />
        <Field
          label="Birth date"
          value={
            user.birthDate
              ? new Date(user.birthDate).toLocaleDateString()
              : "—"
          }
        />
        <Field label="Preferred sports" value={user.preferredSports ?? "—"} />
        <Field
          label="Preferred session types"
          value={user.preferredSessionTypes ?? "—"}
        />
      </div>

      {user.bio && (
        <div className="border-t pt-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Bio
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{user.bio}</p>
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
      <span className={mono ? "font-mono text-xs" : "text-sm"}>{value}</span>
    </div>
  );
}