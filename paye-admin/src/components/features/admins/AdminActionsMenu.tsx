"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, UserMinus } from "lucide-react";
import type { AdminRecord } from "@/lib/types/admin";

type Props = {
  admin: AdminRecord;
  isSelf: boolean;
  onView: (admin: AdminRecord) => void;
  onRemove: (admin: AdminRecord) => void;
};

export function AdminActionsMenu({ admin, isSelf, onView, onRemove }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Open actions" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onView(admin)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onClick={() => onRemove(admin)}
            title={isSelf ? "You cannot remove your own admin access" : undefined}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remove admin
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}