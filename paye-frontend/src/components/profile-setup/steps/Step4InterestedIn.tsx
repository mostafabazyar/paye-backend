"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  value: "MEN" | "WOMEN" | "EVERYONE" | "";
  gender: "male" | "female" | "other" | "";
  onChange: (v: "MEN" | "WOMEN" | "EVERYONE") => void;
};

export function Step4InterestedIn({ value, onChange }: Props) {
  const t = useTranslations("ProfileSetupWizard.step4");

  const options: Array<{
    value: "MEN" | "WOMEN" | "EVERYONE";
    label: string;
  }> = [
    { value: "MEN", label: t("men") },
    { value: "WOMEN", label: t("women") },
    { value: "EVERYONE", label: t("everyone") },
  ];

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
            "flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-start transition-all",
            selected
              ? "border-slate-900 bg-white text-slate-900 shadow-md"
              : "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300"
          )}
        >
          <span className="text-base font-medium">{opt.label}</span>
          {selected && <Check className="h-5 w-5 text-slate-900" />}
        </button>
        );
      })}
    </div>
  );
}