"use client";

import { SearchInput } from "@/components/features/dashboard/SearchInput";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/constants/audit";

export type AuditFilters = {
  action: string;        // "" = all
  targetType: string;    // "" = all
  targetId: string;      // free text
  adminId: string;       // free text (numeric admin id as string)
  from: string;          // yyyy-mm-dd from date input, or ""
  to: string;            // yyyy-mm-dd from date input, or ""
};

export const emptyFilters: AuditFilters = {
  action: "",
  targetType: "",
  targetId: "",
  adminId: "",
  from: "",
  to: "",
};

type Props = {
  value: AuditFilters;
  onChange: (next: AuditFilters) => void;
  /** optional: the searchable free-text field if you add one later */
  search?: string;
  onSearchChange?: (v: string) => void;
};

export function AuditLogFilters({ value, onChange }: Props) {
  const hasAny =
    value.action !== "" ||
    value.targetType !== "" ||
    value.targetId !== "" ||
    value.adminId !== "" ||
    value.from !== "" ||
    value.to !== "";

  function update<K extends keyof AuditFilters>(key: K, v: AuditFilters[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Action */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Action
          </label>
          <Select
            value={value.action || "__all__"}
            onValueChange={(v) =>
              update("action", !v || v === "__all__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All actions</SelectItem>
              {AUDIT_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Target type
          </label>
          <Select
            value={value.targetType || "__all__"}
            onValueChange={(v) =>
              update("targetType", !v || v === "__all__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All targets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All targets</SelectItem>
              {AUDIT_TARGET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target ID */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Target ID
          </label>
          <Input
            value={value.targetId}
            onChange={(e) => update("targetId", e.target.value)}
            placeholder="e.g. 42 or uuid"
            dir="ltr"
          />
        </div>

        {/* Admin ID */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Admin ID
          </label>
          <Input
            value={value.adminId}
            onChange={(e) => update("adminId", e.target.value)}
            placeholder="e.g. 1"
            dir="ltr"
            inputMode="numeric"
          />
        </div>

        {/* From */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            type="date"
            value={value.from}
            onChange={(e) => update("from", e.target.value)}
            dir="ltr"
          />
        </div>

        {/* To */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            type="date"
            value={value.to}
            onChange={(e) => update("to", e.target.value)}
            dir="ltr"
          />
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            disabled={!hasAny}
            onClick={() => onChange(emptyFilters)}
            className="text-muted-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}