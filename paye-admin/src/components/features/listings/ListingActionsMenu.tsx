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
import {
  MoreHorizontal,
  Eye,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import type { AdminListing } from "@/lib/types/admin";

type Props = {
  listing: AdminListing;
  onView: (l: AdminListing) => void;
  onClose: (l: AdminListing) => void;
  onReactivate: (l: AdminListing) => void;
  onDelete: (l: AdminListing) => void;
};

export function ListingActionsMenu({
  listing,
  onView,
  onClose,
  onReactivate,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Open actions" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onView(listing)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {listing.isActive ? (
            <DropdownMenuItem onClick={() => onClose(listing)}>
              <PowerOff className="mr-2 h-4 w-4" />
              Close listing
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onReactivate(listing)}>
              <Power className="mr-2 h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(listing)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}