"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function Step7Bio({ value, onChange }: Props) {
  const t = useTranslations("ProfileSetupWizard.step7");
  const MAX = 500;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-900">
        {t("bioLabel")}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={t("bioPlaceholder")}
        className="min-h-[180px] resize-none rounded-2xl border-slate-200 bg-slate-50/40 focus-visible:bg-white"
        rows={6}
        maxLength={MAX}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("bioHint")}</span>
        <span>
          {value.length} / {MAX}
        </span>
      </div>
    </div>
  );
}