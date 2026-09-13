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
  ShieldCheck,
  ShieldOff,
  Lock,
  Unlock,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { AdminUser } from "@/lib/types/admin";
import { Eye as EyeIcon } from "lucide-react";


type Props = {
  user: AdminUser;
  onView: (user: AdminUser) => void;
  onBlock: (user: AdminUser) => void;
  onUnblock: (user: AdminUser) => void;
  onVerify: (user: AdminUser) => void;
  onUnverify: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onImpersonate: (user: AdminUser) => void;
  onMakeAdmin: (user: AdminUser) => void;

};


export function UserActionsMenu({
  onImpersonate,
  onMakeAdmin,
  user,
  onView,
  onBlock,
  onUnblock,
  onVerify,
  onUnverify,
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
          <DropdownMenuItem onClick={() => onView(user)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

  <DropdownMenuSeparator />

        {user.isVerified ? (
          <DropdownMenuItem onClick={() => onUnverify(user)}>
            <ShieldOff className="mr-2 h-4 w-4" />
            Unverify
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onVerify(user)}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify
          </DropdownMenuItem>
        )}

        {user.isBlocked ? (
          <DropdownMenuItem onClick={() => onUnblock(user)}>
            <Unlock className="mr-2 h-4 w-4" />
            Unblock
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onBlock(user)}>
            <Lock className="mr-2 h-4 w-4" />
            Block
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(user)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.isAdmin || user.isBlocked}
          onClick={() => onImpersonate(user)}
        >
          <EyeIcon className="mr-2 h-4 w-4" />
          Impersonate
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={user.isAdmin || user.isBlocked}
          onClick={() => onMakeAdmin(user)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Make admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}