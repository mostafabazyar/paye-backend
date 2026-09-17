"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import {
  useCreateSport,
  useUpdateSport,
} from "@/lib/hooks/use-admin-sports";
import type { AdminSport } from "@/lib/types/admin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in edit mode */
  sport?: AdminSport | null;
};

export function SportFormDialog({ open, onOpenChange, sport }: Props) {
  const isEdit = !!sport;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const create = useCreateSport();
  const update = useUpdateSport();

  const loading = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setName(sport?.name ?? "");
      setSlug(sport?.slug ?? "");
      setIcon(sport?.icon ?? "");
      setCategory(sport?.category ?? "");
      setSortOrder(sport?.sortOrder ?? 0);
    }
  }, [open, sport]);

  async function handleSubmit() {
    if (!name.trim()) return;

    if (isEdit && sport) {
      await update.mutateAsync({
        id: sport.id,
        input: {
          name: name.trim(),
          icon: icon.trim() || null,
          category: category.trim() || null,
          sortOrder,
        },
      });
    } else {
      await create.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        icon: icon.trim() || null,
        category: category.trim() || null,
        sortOrder,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sport" : "Add sport"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Rename, re-icon, or re-categorize this sport."
              : "Create a new sport. Slug is auto-derived from the name if left blank."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Padel"
            />
          </div>

          {!isEdit && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Slug (optional)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="padel"
                dir="ltr"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Icon (emoji)
              </label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎾"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Sort order
              </label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Category (optional)
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="racket"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : isEdit ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}