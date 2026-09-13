"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  /** When set, user must type this exact string to enable confirm */
  confirmText?: string;
  /** Label above the confirm input, defaults to "Type {confirmText} to confirm" */
  confirmLabelText?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  confirmText,
  confirmLabelText,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  const needsConfirmText = !!confirmText;
  const matches = !needsConfirmText || typed === confirmText;

  function reset() {
    setTyped("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {needsConfirmText && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {confirmLabelText ?? (
                <>
                  Type{" "}
                  <span className="font-mono text-foreground">
                    {confirmText}
                  </span>{" "}
                  to confirm.
                </>
              )}
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmText}
              autoComplete="off"
              dir="ltr"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={loading || !matches}
            onClick={async () => {
              await onConfirm();
              reset();
            }}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}