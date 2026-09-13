"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  delay = 500,
}: Props) {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, delay);

  // Sync outward when debounce settles
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Sync inward if parent resets value (e.g. clear filter)
  useEffect(() => {
    if (value !== local && value !== debounced) setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8"
      />
      {local && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
          onClick={() => setLocal("")}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}