"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users } from "lucide-react";
import type {
  AdminRequestDetail,
  RequestDetailUser,
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

export function RequestDetailView({
  request,
}: {
  request: AdminRequestDetail;
}) {
  return (
    <div className="space-y-4">
      {/* Status + timing summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Request #{request.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={statusVariant(request.status)}>
              {request.status}
            </StatusBadge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Created"
              value={new Date(request.createdAt).toLocaleString()}
            />
            <Field
              label="Updated"
              value={new Date(request.updatedAt).toLocaleString()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Listing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href={`/listings/${request.profile.id}`}
            className="text-base font-semibold text-primary hover:underline"
          >
            {request.profile.title}
          </Link>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {request.profile.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {request.profile.exerciseType} · {request.profile.maxInvites} max
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {request.profile.scheduledAt
                ? new Date(request.profile.scheduledAt).toLocaleString()
                : "Not scheduled"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {request.profile.isActive ? (
              <StatusBadge variant="success">Active</StatusBadge>
            ) : (
              <StatusBadge variant="muted">Closed</StatusBadge>
            )}
            <StatusBadge variant="info">
              {request.profile.genderPreference}
            </StatusBadge>
          </div>
        </CardContent>
      </Card>

      {/* Users side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <UserCard title="Requester" user={request.requester} />
        <UserCard title="Receiver" user={request.receiver} />
      </div>
    </div>
  );
}

function UserCard({
  title,
  user,
}: {
  title: string;
  user: RequestDetailUser;
}) {
  const photo = user.photos?.[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar>
            {photo && <AvatarImage src={photo} alt={user.name ?? user.phone} />}
            <AvatarFallback>
              {initials(user.name, user.phone)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/users/${user.id}`}
              className="font-medium text-primary hover:underline"
            >
              {user.name ?? "Unnamed"}
            </Link>
            <span className="text-xs text-muted-foreground" dir="ltr">
              {user.phone}
            </span>
            <div className="flex flex-wrap gap-1 pt-1">
              {user.isVerified ? (
                <StatusBadge variant="success">Verified</StatusBadge>
              ) : (
                <StatusBadge variant="muted">Unverified</StatusBadge>
              )}
              {user.isBlocked && (
                <StatusBadge variant="danger">Blocked</StatusBadge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 border-t pt-3 sm:grid-cols-2">
          <Field label="Gender" value={user.gender ?? "—"} />
          <Field label="Interested in" value={user.interestedIn ?? "—"} />
          <Field
            label="Rating"
            value={user.avgRating ? user.avgRating.toFixed(1) : "—"}
          />
          <Field
            label="Joined"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
        </div>

        {user.bio && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground">Bio</div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}