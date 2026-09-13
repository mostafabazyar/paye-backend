"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";
import { Users, Home, Clock, CheckCircle2, XCircle, LayoutDashboard } from "lucide-react";

export default function DashboardHome() {
  const { data, isLoading, isError, error } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load dashboard"}
        </div>
      )}

      {isLoading && <StatsSkeleton />}

      {data && !isLoading && <StatsGrid stats={data} />}
    </div>
  );
}

function StatsGrid({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>["data"]> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={stats.users.total}
        icon={<Users className="h-4 w-4" />}
        description="All registered accounts"
      />

      <StatCard
        title="Listings"
        value={stats.listings.total}
        hint={`${stats.listings.active} active`}
        icon={<Home className="h-4 w-4" />}
        description="Total profiles/listings"
      />

      <StatCard
        title="Pending Requests"
        value={stats.requests.pending}
        icon={<Clock className="h-4 w-4" />}
        description="Awaiting admin action"
        accent="amber"
      />

      <StatCard
        title="Approved"
        value={stats.requests.approved}
        icon={<CheckCircle2 className="h-4 w-4" />}
        description="Successfully approved"
        accent="emerald"
      />

      <StatCard
        title="Rejected"
        value={stats.requests.rejected}
        icon={<XCircle className="h-4 w-4" />}
        description="Rejected requests"
        accent="rose"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  hint,
  icon,
  accent,
}: {
  title: string;
  value: number;
  description?: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "amber" | "emerald" | "rose";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-600 bg-amber-50"
      : accent === "emerald"
      ? "text-emerald-600 bg-emerald-50"
      : accent === "rose"
      ? "text-rose-600 bg-rose-50"
      : "text-muted-foreground bg-muted";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-md p-1.5 ${accentClass}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <CardDescription className="mt-1 flex items-center gap-2">
          {description}
          {hint && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {hint}
            </span>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}