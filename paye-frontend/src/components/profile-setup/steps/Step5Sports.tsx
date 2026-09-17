"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSports } from "@/lib/api/sports";

type Props = {
  selected: string[];
  onChange: (v: string[]) => void;
};

export function Step5Sports({ selected, onChange }: Props) {
  const t = useTranslations("ProfileSetupWizard.step5");
  const tSports = useTranslations("Sports");
  const locale = useLocale();
  const isPersian = locale === "fa";

  const { data: sports = [], isLoading, isError } = useQuery({
    queryKey: ["sports", "active"],
    queryFn: fetchSports,
    staleTime: 10 * 60_000,
  });

  // next-intl's useTranslations does not expose `.has()` reliably
  // across versions, so we use a strict check via a lookup set
  // derived from the existing translations we know about.
  const KNOWN_SPORT_SLUGS = new Set([
    "football",
    "basketball",
    "volleyball",
    "tennis",
    "badminton",
    "table-tennis",
    "swimming",
    "running",
    "cycling",
    "hiking",
    "gym",
    "crossfit",
    "yoga",
    "pilates",
    "boxing",
    "martial-arts",
    "climbing",
    "skiing",
    "skateboarding",
    "dance",
  ]);

  function labelFor(slug: string, fallback: string) {
    if (!isPersian) return fallback;
    if (KNOWN_SPORT_SLUGS.has(slug)) {
      return tSports(slug as Parameters<typeof tSports>[0]);
    }
    return fallback;
  }

  function toggle(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChange(next);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {t("loadFailed")}
      </div>
    );
  }

  if (sports.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sports.map((sport) => {
        const isSelected = selected.includes(sport.slug);
        return (
          <button
            key={sport.id}
            type="button"
            onClick={() => toggle(sport.slug)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all",
              isSelected
                ? "border-slate-900 bg-white shadow-md"
                : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
            )}
          >
            <span className="text-2xl leading-none">{sport.icon ?? "🏅"}</span>
            <span className="text-xs font-medium text-slate-900 text-center">
              {labelFor(sport.slug, sport.name)}
            </span>
          </button>
        );
      })}
    </div>
  );
}