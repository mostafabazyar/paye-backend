"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check, User, UserRound } from "lucide-react";

type Props = {
  value: "male" | "female" | "other" | "";
  onChange: (v: "male" | "female" | "other") => void;
};

export function Step1Gender({ value, onChange }: Props) {
  const t = useTranslations("ProfileSetupWizard.step1");
  const locale = useLocale();
  const isPersian = locale === "fa";

  const options: Array<{
    value: "male" | "female" | "other";
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      value: "male",
      label: t("male"),
      icon: <User className="h-6 w-6" />,
      color: "border-blue-200 bg-blue-50/40 hover:border-blue-300",
    },
    {
      value: "female",
      label: t("female"),
      icon: <UserRound className="h-6 w-6" />,
      color: "border-pink-200 bg-pink-50/40 hover:border-pink-300",
    },
  ];

  // "other" is only offered in English
  if (!isPersian) {
    options.push({
      value: "other",
      label: t("other"),
      icon: <UserRound className="h-6 w-6" />,
      color: "border-slate-200 bg-slate-50/40 hover:border-slate-300",
    });
  }

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all",
            opt.color,
            selected && "border-slate-900 bg-white shadow-md"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
              selected ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            )}
          >
            {opt.icon}
          </div>
          <span className="text-base font-medium text-slate-900 flex-1">
            {opt.label}
          </span>
          {selected && <Check className="h-5 w-5 text-slate-900" />}
        </button>
        );
      })}
    </div>
  );
}