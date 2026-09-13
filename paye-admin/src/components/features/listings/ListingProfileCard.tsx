"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Wallet,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import type { ListingDetail } from "@/lib/types/admin";

function initials(name: string | null, phone: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2);
}

export function ListingProfileCard({ listing }: { listing: ListingDetail }) {
  const creator = listing.creator;
  const primaryPhoto = creator?.photos?.[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Listing</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">{listing.title}</div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {listing.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {listing.exerciseType}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {listing.scheduledAt
                  ? new Date(listing.scheduledAt).toLocaleString()
                  : "Not scheduled"}
              </span>
              {listing.goDutch && (
                <span className="inline-flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Go Dutch
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {listing.isActive ? (
                <StatusBadge variant="success">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </StatusBadge>
              ) : (
                <StatusBadge variant="muted">Closed</StatusBadge>
              )}
              <StatusBadge variant="info">
                {listing.genderPreference}
              </StatusBadge>
            </div>
          </div>

          <div className="flex min-w-[180px] flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Capacity
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">
                {listing.capacity.approved}
              </span>
              <span className="text-sm text-muted-foreground">
                / {listing.capacity.maxInvites}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {listing.capacity.remaining} spots remaining
            </div>
          </div>
        </div>

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t pt-4">
            {listing.tags.map((tag, i) => (
              <StatusBadge key={i} variant="muted">
                {tag}
              </StatusBadge>
            ))}
          </div>
        )}

        {listing.moreInfo && (
          <div className="border-t pt-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              More info
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {listing.moreInfo}
            </p>
          </div>
        )}

        {creator && (
          <div className="border-t pt-4">
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Creator
            </div>

            <div className="flex items-start gap-3">
              <Avatar>
                {primaryPhoto && (
                  <AvatarImage src={primaryPhoto} alt={creator.name ?? creator.phone} />
                )}
                <AvatarFallback>
                  {initials(creator.name, creator.phone)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-0.5">
                <div className="font-medium">
                  {creator.name ?? (
                    <span className="text-muted-foreground">Unnamed</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {creator.phone}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {creator.isVerified ? (
                    <StatusBadge variant="success">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="muted">
                      <ShieldOff className="h-3 w-3" /> Unverified
                    </StatusBadge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
          <Field label="Listing ID" value={String(listing.id)} mono />
          <Field
            label="Created"
            value={new Date(listing.createdAt).toLocaleString()}
          />
          <Field
            label="Updated"
            value={new Date(listing.updatedAt).toLocaleString()}
          />
        </div>
      </CardContent>
    </Card>
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