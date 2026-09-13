"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ConfirmDialog } from "@/components/features/dashboard/ConfirmDialog";
import { useStartImpersonation } from "@/lib/hooks/use-impersonation";
import { useState } from "react";
import type { AdminUser } from "@/lib/types/admin";

type Props = {
  user: Pick<AdminUser, "id" | "phone" | "name" | "isAdmin" | "isBlocked">;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
};

export function ImpersonateButton({ user, variant = "outline", size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const start = useStartImpersonation();

  const disabled = user.isAdmin || user.isBlocked;

  const reason = user.isAdmin
    ? "Cannot impersonate admins"
    : user.isBlocked
      ? "Cannot impersonate blocked users"
      : undefined;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        title={reason}
        onClick={() => setOpen(true)}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Impersonate
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Start impersonation?"
        description={
          <>
            You will be able to open{" "}
            <span className="font-medium">
              {user.name ?? user.phone}
            </span>
            &apos;s account in the user app. The session lasts 30 minutes.
          </>
        }
        confirmLabel="Start"
        loading={start.isPending}
        onConfirm={async () => {
          await start.mutateAsync(user.id);
          setOpen(false);
        }}
      />
    </>
  );
}