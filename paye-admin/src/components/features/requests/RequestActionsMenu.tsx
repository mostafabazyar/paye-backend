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
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { AdminRequestFull } from "@/lib/types/admin";

type Props = {
  request: AdminRequestFull;
  onView: (r: AdminRequestFull) => void;
  onApprove: (r: AdminRequestFull) => void;
  onReject: (r: AdminRequestFull) => void;
  onPending: (r: AdminRequestFull) => void;
  onDelete: (r: AdminRequestFull) => void;
};

export function RequestActionsMenu({
  request,
  onView,
  onApprove,
  onReject,
  onPending,
  onDelete,
}: Props) {
  const { status } = request;

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
          <DropdownMenuItem onClick={() => onView(request)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {status !== "APPROVED" && (
            <DropdownMenuItem onClick={() => onApprove(request)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}

          {status !== "REJECTED" && (
            <DropdownMenuItem onClick={() => onReject(request)}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          )}

          {status !== "PENDING" && (
            <DropdownMenuItem onClick={() => onPending(request)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Move to pending
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(request)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}