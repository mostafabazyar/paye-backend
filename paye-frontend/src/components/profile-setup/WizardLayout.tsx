"use client";

import { ReactNode } from "react";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { StepNumber } from "./types";

type Props = {
  step: StepNumber;
  title: string;
  isRtl?: boolean;
  children: ReactNode;
  canGoBack: boolean;
  isLastStep: boolean;
  submitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  footerLabel: string;
  footerEnabled: boolean;
};

export function WizardLayout({
  step,
  title,
  isRtl,
  children,
  canGoBack,
  isLastStep,
  submitting,
  onBack,
  onNext,
  footerLabel,
  footerEnabled,
}: Props) {
  const t = useTranslations("ProfileSetupWizard");

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className="w-full max-w-xl border-slate-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        {/* Top bar: back arrow */}
        <div className="flex items-center px-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={!canGoBack || submitting}
            aria-label={t("back")}
            className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
        </div>

        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-slate-950 text-center">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div key={step} className="wizard-step min-h-[300px]">
            {children}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="button"
              disabled={!footerEnabled || submitting}
              onClick={onNext}
              className="min-w-[220px] h-12 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:from-slate-800 hover:to-slate-600 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      isRtl ? "ml-2" : "mr-2"
                    }`}
                  />
                  {isLastStep ? t("finishing") : t("saving")}
                </>
              ) : (
                <>
                  {footerLabel}
                  <ArrowRight
                    className={`h-4 w-4 ${
                      isRtl ? "mr-2 rotate-180" : "ml-2"
                    }`}
                  />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}