"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepNumber } from "./types";

const STEP_KEYS = [
  "gender",
  "identity",
  "location",
  "interestedIn",
  "sports",
  "sessions",
  "bio",
] as const;

type Props = {
  current: StepNumber;
  total?: number;
  labelFor: (key: (typeof STEP_KEYS)[number]) => string;
};

export function Stepper({ current, total = 7, labelFor }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const n = (i + 1) as StepNumber;
          const done = n < current;
          const active = n === current;

          return (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  done && "border-slate-900 bg-slate-900 text-white",
                  active &&
                    "border-slate-900 bg-white text-slate-900 ring-2 ring-slate-900/20",
                  !done &&
                    !active &&
                    "border-slate-200 bg-white text-slate-300"
                )}
                aria-label={labelFor(STEP_KEYS[i])}
                title={labelFor(STEP_KEYS[i])}
              >
                {done ? <Check className="h-4 w-4" /> : null}
              </div>

              {n !== total && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1 transition-colors",
                    done ? "bg-slate-900" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}