"use client";

import { useTranslations } from "next-intl";
import { Check, Users, UsersRound, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SessionType = "ONE_ON_ONE" | "ONE_ON_MANY" | "MANY_ON_MANY";

type Props = {
  selected: SessionType[];
  onChange: (v: SessionType[]) => void;
};

const ALL_TYPES: SessionType[] = [
  "ONE_ON_ONE",
  "ONE_ON_MANY",
  "MANY_ON_MANY",
];

export function Step6SessionTypes({ selected, onChange }: Props) {
  const t = useTranslations("ProfileSetupWizard.step6");

  const allSelected = selected.length === ALL_TYPES.length;

  const options: Array<{
    value: SessionType;
    label: string;
    description: string;
    Icon: typeof Users;
    accent: string;
  }> = [
    {
      value: "ONE_ON_ONE",
      label: t("oneOnOne"),
      description: t("oneOnOneDesc"),
      Icon: Users,
      accent: "from-blue-50 to-blue-100/40 border-blue-100",
    },
    {
      value: "ONE_ON_MANY",
      label: t("oneOnMany"),
      description: t("oneOnManyDesc"),
      Icon: UsersRound,
      accent: "from-purple-50 to-purple-100/40 border-purple-100",
    },
    {
      value: "MANY_ON_MANY",
      label: t("manyOnMany"),
      description: t("manyOnManyDesc"),
      Icon: Building2,
      accent: "from-emerald-50 to-emerald-100/40 border-emerald-100",
    },
  ];

  function toggle(value: SessionType) {
    const next = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(next);
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_TYPES]);
  }

  return (
    <div className="space-y-4">
      {/* Select all pill */}
      <button
        type="button"
        onClick={toggleAll}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-start transition-all",
          allSelected
            ? "border-slate-900 bg-white shadow-sm"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
        )}
      >
        <span className="text-sm font-medium text-slate-900">
          {allSelected ? t("clearAll") : t("selectAll")}
        </span>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            allSelected
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white"
          )}
        >
          {allSelected && <Check className="h-3 w-3" />}
        </span>
      </button>

      {/* Options */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const Icon = opt.Icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all",
                isSelected
                  ? "border-slate-900 bg-white shadow-md"
                  : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isSelected
                    ? "bg-slate-900 text-white"
                    : cn("bg-gradient-to-br", opt.accent, "text-slate-700")
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {opt.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {opt.description}
                </div>
              </div>

              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}