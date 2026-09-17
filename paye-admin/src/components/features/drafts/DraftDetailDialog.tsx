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
import { Loader2 } from "lucide-react";
import { useAdminDraft } from "@/lib/hooks/use-admin-drafts";

type Props = {
  draftId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function DraftDetailDialog({ draftId, onOpenChange }: Props) {
  const open = !!draftId;
  const { data, isLoading, isError, error } = useAdminDraft(draftId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft details</DialogTitle>
          <DialogDescription>
            Captured during the signup wizard for CRM follow-up.
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

        {data && <Body draft={data.draft} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  draft,
}: {
  draft: import("@/lib/types/admin").AdminDraft;
}) {
  const sports = parseJsonArray(draft.sportsSlugs);
  const sessions = draft.sessionTypes
    ? draft.sessionTypes.split(",").filter(Boolean)
    : [];

  const status: { label: string; variant: "success" | "warning" | "danger" | "muted" } =
    draft.completedAt
      ? { label: "Completed", variant: "success" }
      : draft.abandonedAt
        ? { label: "Abandoned", variant: "danger" }
        : { label: "In progress", variant: "warning" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
        <StatusBadge variant="muted">Step {draft.lastStep} / 7</StatusBadge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone" value={draft.phone} mono />
        <Field label="Name" value={draft.name ?? "—"} />
        <Field
          label="Birth date"
          value={
            draft.birthDate
              ? new Date(draft.birthDate).toLocaleDateString()
              : "—"
          }
        />
        <Field label="Gender" value={draft.gender ?? "—"} />
        <Field label="Interested in" value={draft.interestedIn ?? "—"} />
        <Field
          label="Country ID"
          value={draft.countryId != null ? String(draft.countryId) : "—"}
        />
        <Field
          label="City ID"
          value={draft.cityId != null ? String(draft.cityId) : "—"}
        />
        <Field
          label="Neighborhood ID"
          value={draft.neighborhoodId != null ? String(draft.neighborhoodId) : "—"}
        />
        <Field
          label="Latitude"
          value={draft.latitude != null ? draft.latitude.toFixed(6) : "—"}
          mono
        />
        <Field
          label="Longitude"
          value={draft.longitude != null ? draft.longitude.toFixed(6) : "—"}
          mono
        />
      </div>

      {sports.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Sports
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {sports.map((s) => (
              <StatusBadge key={s} variant="info">
                {s}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Session types
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {sessions.map((s) => (
              <StatusBadge key={s} variant="muted">
                {s}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {draft.bio && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Bio
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{draft.bio}</p>
        </div>
      )}

      <div className="grid gap-3 border-t pt-3 sm:grid-cols-3">
        <Field
          label="Created"
          value={new Date(draft.createdAt).toLocaleString()}
        />
        <Field
          label="Updated"
          value={new Date(draft.updatedAt).toLocaleString()}
        />
        <Field
          label="Completed"
          value={
            draft.completedAt
              ? new Date(draft.completedAt).toLocaleString()
              : "—"
          }
        />
      </div>
    </div>
  );
}

function parseJsonArray(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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