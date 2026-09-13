"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/features/dashboard/SearchInput";
import { StatusBadge } from "@/components/features/dashboard/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import { useAdminUsers } from "@/lib/hooks/use-admin-users";
import { useCreateAdmin } from "@/lib/hooks/use-admin-management";
import type { AdminUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminPromoteDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const { data, isLoading } = useAdminUsers({
    search,
    skip: 0,
    take: 20,
  });

  // filter out admins and blocked users
  const candidates = useMemo(() => {
    return (data?.users ?? []).filter(
      (u) => !u.isAdmin && !u.isBlocked
    );
  }, [data]);

  const createAdmin = useCreateAdmin();

  function reset() {
    setSearch("");
    setSelected(null);
  }

  async function handleConfirm() {
    if (!selected) return;
    await createAdmin.mutateAsync(selected.id);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Promote a user to admin</DialogTitle>
          <DialogDescription>
            Search by name or phone. Only non-blocked, non-admin users appear here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
            delay={400}
          />

          <div className="max-h-72 overflow-y-auto rounded-lg border">
            {isLoading && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}

            {!isLoading && candidates.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No eligible users found
              </div>
            )}

            {candidates.map((u) => {
              const isSelected = selected?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelected(u)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors last:border-b-0",
                    isSelected
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {(u.name ?? u.phone).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {u.name ?? <span className="text-muted-foreground">Unnamed</span>}
                    </span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {u.phone}
                    </span>
                  </div>

                  {u.isVerified && (
                    <StatusBadge variant="success">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </StatusBadge>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">
                  {selected.name ?? selected.phone}
                </span>{" "}
                will gain full admin access to the panel.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected || createAdmin.isPending}
            onClick={handleConfirm}
          >
            {createAdmin.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Promote to admin
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}