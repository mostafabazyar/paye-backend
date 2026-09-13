"use client";

import { SearchInput } from "@/components/features/dashboard/SearchInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActiveFilter = "all" | "active" | "closed";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  active: ActiveFilter;
  onActiveChange: (v: ActiveFilter) => void;
  exerciseType: string;
  onExerciseTypeChange: (v: string) => void;
};

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

const EXERCISE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "ONE_ON_ONE", label: "1-on-1" },
  { value: "ONE_ON_MANY", label: "1-on-many" },
  { value: "MANY_ON_MANY", label: "Many-on-many" },
];

export function ListingFilters({
  search,
  onSearchChange,
  active,
  onActiveChange,
  exerciseType,
  onExerciseTypeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search title, location, tags, creator..."
        delay={500}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={exerciseType}
          onChange={(e) => onExerciseTypeChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
        >
          {EXERCISE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
          {ACTIVE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={active === opt.value ? "default" : "ghost"}
              size="xs"
              className={cn(
                "rounded-md",
                active !== opt.value && "text-muted-foreground"
              )}
              onClick={() => onActiveChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}