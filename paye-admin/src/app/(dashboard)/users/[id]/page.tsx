"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminUser } from "@/lib/hooks/use-admin-users";
import { UserProfileCard } from "@/components/features/users/UserProfileCard";
import { UserDetailTabs } from "@/components/features/users/UserDetailTabs";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError, error } = useAdminUser(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/users")}
          aria-label="Back to users"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">User details</h2>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <UserProfileCard user={data.user} />
          <UserDetailTabs
            listings={data.listings}
            sentRequests={data.sentRequests}
            receivedRequests={data.receivedRequests}
          />
        </>
      )}
    </div>
  );
}