"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, ShieldOff, Lock, Star } from "lucide-react";
import type { AdminUser } from "@/lib/types/admin";
import { ImpersonateButton } from "@/components/features/impersonation/ImpersonateButton";

function initials(name: string | null, phone: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return phone.slice(-2);
}

export function UserProfileCard({ user }: { user: AdminUser }) {
  const primaryPhoto = user.photos?.[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Profile</CardTitle>
        <ImpersonateButton user={user} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar size="lg">
            {primaryPhoto && (
              <AvatarImage src={primaryPhoto} alt={user.name ?? user.phone} />
            )}
            <AvatarFallback>{initials(user.name, user.phone)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold">
              {user.name ?? (
                <span className="text-muted-foreground">Unnamed user</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground" dir="ltr">
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
              {user.isAdmin && <StatusBadge variant="info">Admin</StatusBadge>}
              {user.avgRating > 0 && (
                <StatusBadge variant="warning">
                  <Star className="h-3 w-3" /> {user.avgRating.toFixed(1)}
                </StatusBadge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
          <Field label="User ID" value={user.id} mono />
          <Field
            label="Joined"
            value={new Date(user.createdAt).toLocaleString()}
          />
          <Field
            label="Updated"
            value={new Date(user.updatedAt).toLocaleString()}
          />
          <Field
            label="Birth date"
            value={
              user.birthDate
                ? new Date(user.birthDate).toLocaleDateString()
                : "—"
            }
          />
          <Field label="Gender" value={user.gender ?? "—"} />
          <Field label="Interested in" value={user.interestedIn ?? "—"} />
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

        {user.photos?.length > 1 && (
          <div className="border-t pt-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Photos
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.photos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-md border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
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