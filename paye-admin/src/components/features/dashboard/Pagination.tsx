"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  skip: number;
  take: number;
  total: number;
  onSkipChange: (skip: number) => void;
  onTakeChange: (take: number) => void;
};

export function Pagination({
  skip,
  take,
  total,
  onSkipChange,
  onTakeChange,
}: Props) {
  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + take, total);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 pt-4 sm:flex-row">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>
        –<span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows</span>
          <Select
            value={String(take)}
            onValueChange={(v) => {
              onTakeChange(Number(v));
              onSkipChange(0);
            }}
          >
            <SelectTrigger size="sm" className="w-[68px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Page <span className="font-medium text-foreground">{page}</span> /{" "}
          {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canPrev}
            onClick={() => onSkipChange(Math.max(0, skip - take))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={() => onSkipChange(skip + take)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}