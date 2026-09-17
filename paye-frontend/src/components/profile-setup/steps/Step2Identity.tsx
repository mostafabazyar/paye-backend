"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toGregorian, toJalaali } from "jalaali-js";
import { ArrowLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollWheel } from "../ScrollWheel";

type Props = {
  subStep: "name" | "birth";
  onSubStepChange: (s: "name" | "birth") => void;
  name: string;
  birthDate: string;
  onNameChange: (v: string) => void;
  onBirthDateChange: (v: string) => void;
};

const FA_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInGregorianMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function daysInJalaliMonth(m: number) {
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  return 29;
}

export function Step2Identity({
  subStep,
  onSubStepChange,
  name,
  birthDate,
  onNameChange,
  onBirthDateChange,
}: Props) {
  const locale = useLocale();
  const isPersian = locale === "fa";
  const t = useTranslations("ProfileSetupWizard.step2");

  const today = new Date();
  const gy = today.getUTCFullYear();
  const gm = today.getUTCMonth() + 1;
  const gd = today.getUTCDate();
  const jalaliToday = isPersian ? toJalaali(gy, gm, gd) : null;

  const currentYear = isPersian ? jalaliToday!.jy : gy;
  const minYear = currentYear - 70;
  const maxYear = currentYear - 16;

  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
        .reverse(),
    [minYear, maxYear]
  );

  const months = isPersian ? FA_MONTHS : EN_MONTHS;

  const parsed = useMemo(() => {
    if (!birthDate) return null;
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    if (isPersian) {
      const j = toJalaali(y, m, d);
      return { year: j.jy, month: j.jm, day: j.jd };
    }
    return { year: y, month: m, day: d };
  }, [birthDate, isPersian]);

  const year = parsed?.year ?? maxYear;
  const month = parsed?.month ?? 1;
  const day = parsed?.day ?? 1;

  const daysCount = isPersian
    ? daysInJalaliMonth(month)
    : daysInGregorianMonth(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  function emit(newY: number, newM: number, newD: number) {
    if (isPersian) {
      const g = toGregorian(newY, newM, newD);
      onBirthDateChange(
        `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(
          2,
          "0"
        )}-${String(g.gd).padStart(2, "0")}`
      );
    } else {
      onBirthDateChange(
        `${String(newY).padStart(4, "0")}-${String(newM).padStart(
          2,
          "0"
        )}-${String(newD).padStart(2, "0")}`
      );
    }
  }

  if (subStep === "name") {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900">
          {t("nameLabel")}
        </label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="h-12 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white text-base"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-900 text-center block">
        {t("birthLabel")}
      </label>

      <div
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-4"
        dir="ltr"
      >
        <ScrollWheel
          values={days}
          value={day}
          labelFor={(d) => String(d).padStart(2, "0")}
          onChange={(d) => emit(year, month, d)}
          width="w-16"
        />
        <ScrollWheel
          values={months}
          value={months[month - 1]}
          onChange={(label) => {
            const idx = months.indexOf(label) + 1;
            const maxD = isPersian
              ? daysInJalaliMonth(idx)
              : daysInGregorianMonth(year, idx);
            emit(year, idx, Math.min(day, maxD));
          }}
          width="w-28"
        />
        <ScrollWheel
          values={years}
          value={year}
          onChange={(y) => emit(y, month, day)}
          width="w-20"
        />
      </div>

      {/* Internal back to name */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSubStepChange("name")}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft
            className={`h-4 w-4 ${isPersian ? "ml-2 rotate-180" : "mr-2"}`}
          />
          {t("backShort")}
        </Button>
      </div>
    </div>
  );
}