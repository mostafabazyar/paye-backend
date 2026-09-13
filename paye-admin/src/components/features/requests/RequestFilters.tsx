"use client";

import { SearchInput } from "@/components/features/dashboard/SearchInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types/admin";

export type StatusFilter = "all" | RequestStatus;

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
};

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function RequestFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search by user or listing..."
        delay={500}
      />

      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "ghost"}
            size="xs"
            className={cn(
              "rounded-md",
              status !== opt.value && "text-muted-foreground"
            )}
            onClick={() => onStatusChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}