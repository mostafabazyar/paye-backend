"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api";
import { saveDraftStep } from "@/lib/api/draft";

import { WizardLayout } from "@/components/profile-setup/WizardLayout";
import {
  emptyWizardData,
  type StepNumber,
  type WizardData,
} from "@/components/profile-setup/types";

import { Step1Gender } from "@/components/profile-setup/steps/Step1Gender";
import { Step2Identity } from "@/components/profile-setup/steps/Step2Identity";
import { Step3Location } from "@/components/profile-setup/steps/Step3Location";
import { Step4InterestedIn } from "@/components/profile-setup/steps/Step4InterestedIn";
import { Step5Sports } from "@/components/profile-setup/steps/Step5Sports";
import { Step6SessionTypes } from "@/components/profile-setup/steps/Step6SessionTypes";
import { Step7Bio } from "@/components/profile-setup/steps/Step7Bio";

const STEP_META: Record<StepNumber, { titleKey: string }> = {
  1: { titleKey: "step1.title" },
  2: { titleKey: "step2.title" },
  3: { titleKey: "step3.title" },
  4: { titleKey: "step4.title" },
  5: { titleKey: "step5.title" },
  6: { titleKey: "step6.title" },
  7: { titleKey: "step7.title" },
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "fa";
  const t = useTranslations("ProfileSetupWizard");

  const { user, setAuth, hasHydrated } = useAuthStore();

  const [step, setStep] = useState<StepNumber>(1);
  const [subStep, setSubStep] = useState<"name" | "birth">("name");
  const [data, setData] = useState<WizardData>(emptyWizardData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace("/login");
    }
  }, [user, hasHydrated, router]);

  useEffect(() => {
    if (!user) return;
    setData((d) => ({
      ...d,
      gender: (user.gender as WizardData["gender"]) || d.gender,
      name: user.name ?? d.name,
      interestedIn:
        (user.interestedIn as WizardData["interestedIn"]) || d.interestedIn,
      preferredSessionTypes:
        (user.preferredSessionTypes as WizardData["preferredSessionTypes"]) ||
        d.preferredSessionTypes,
      bio: user.bio ?? d.bio,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function stepIsValid(n: StepNumber): boolean {
    switch (n) {
      case 1:
        return data.gender !== "";
      case 2:
        return data.name.trim().length >= 2 && !!data.birthDate;
      case 3:
        return true;
      case 4:
        return data.interestedIn !== "";
      case 5:
        return data.sportSlugs.length > 0;
      case 6:
        return data.preferredSessionTypes.length > 0;
      case 7:
        return data.bio.length <= 500;
      default:
        return true;
    }
  }

  function handlePrimaryAction() {
  // Step 2 has two internal sub-screens driven from the footer
  if (step === 2) {
    if (subStep === "name") {
      // Only allow moving on if name is valid
      if (data.name.trim().length < 2) return;
      setSubStep("birth");
      return;
    }
    // subStep === "birth"
    if (!data.birthDate) return;
    void goNext();
    return;
  }

  void goNext();
}

// What is the footer label for the current sub-screen?
function primaryLabel(): string {
  if (step === 2) {
    // Both sub-screens show "Continue"
    return t("continue");
  }
  return step === 7 ? t("finish") : t("next");
}

// Is the footer button enabled?
  function primaryEnabled(): boolean {
    if (step === 2) {
      if (subStep === "name") return data.name.trim().length >= 2;
      return !!data.birthDate;
    }
    return stepIsValid(step);
  }

  async function goNext() {
    if (!stepIsValid(step)) return;

    void saveDraftStep({
      lastStep: step,
      gender: data.gender || undefined,
      name: data.name || undefined,
      birthDate: data.birthDate || undefined,
      countryId: data.countryId,
      cityId: data.cityId,
      neighborhoodId: data.neighborhoodId,
      latitude: data.latitude,
      longitude: data.longitude,
      interestedIn: data.interestedIn || undefined,
      sportSlugs: data.sportSlugs.length > 0 ? data.sportSlugs : undefined,
      sessionTypes:
        data.preferredSessionTypes.length > 0
          ? data.preferredSessionTypes
          : undefined,
      bio: data.bio || undefined,
    });

    if (step < 7) {
      setStep((s) => (s + 1) as StepNumber);
      return;
    }

    await submitFinal();
  }

  /**
   * Top-left back arrow behavior.
   * Inside step 2's birth sub-screen, goes back to the name sub-screen.
   * Otherwise moves to the previous wizard step.
   */
  function handleBack() {
    if (step === 2 && subStep === "birth") {
      setSubStep("name");
      return;
    }
    if (step > 1) {
      setStep((s) => (s - 1) as StepNumber);
      // When entering step 2 from step 1, always start on name
      if (step - 1 === 2) setSubStep("name");
    }
  }

async function submitFinal() {
  setSubmitting(true);
  try {
    // 1) Save the wizard's data to the DraftUser
    const setup = await apiClient.post('/profile/setup', {
      name: data.name.trim(),
      birthDate: data.birthDate,
      gender: data.gender,
      interestedIn: data.interestedIn,
      preferredSessionTypes: data.preferredSessionTypes,
      sportSlugs: data.sportSlugs,
      bio: data.bio || null,
      countryId: data.countryId,
      cityId: data.cityId,
      neighborhoodId: data.neighborhoodId,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    if (!setup?.success) {
      throw new Error(setup?.message || 'Failed to save profile');
    }

    // 2) Complete the signup — creates the real User
    const res = await apiClient.post('/draft/complete', {});

    setAuth(res.user, res.token || '');

    toast.success(t('successTitle'), {
      description: t('successDesc'),
    });

    router.replace('/explore');
  } catch (err: unknown) {
    toast.error(t('errorTitle'), {
      description:
        (err as { message?: string })?.message || t('errorFallback'),
    });
  } finally {
    setSubmitting(false);
  }
}

  if (!hasHydrated || !user) return null;

  const meta = STEP_META[step];

  return (
    <WizardLayout
      step={step}
      title={t(meta.titleKey)}
      isRtl={isRtl}
      canGoBack={step > 1 || (step === 2 && subStep === "birth")}
      isLastStep={step === 7}
      submitting={submitting}
      onBack={handleBack}
      onNext={handlePrimaryAction}
      footerLabel={primaryLabel()}
      footerEnabled={primaryEnabled()}
    >
      {step === 1 && (
        <Step1Gender value={data.gender} onChange={(v) => update("gender", v)} />
      )}

      {step === 2 && (
        <Step2Identity
          subStep={subStep}
          onSubStepChange={setSubStep}
          name={data.name}
          birthDate={data.birthDate}
          onNameChange={(v) => update("name", v)}
          onBirthDateChange={(v) => update("birthDate", v)}
        />
      )}

      {step === 3 && (
        <Step3Location
          countryId={data.countryId}
          cityId={data.cityId}
          neighborhoodId={data.neighborhoodId}
          latitude={data.latitude}
          longitude={data.longitude}
          onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
        />
      )}
      {step === 4 && (
        <Step4InterestedIn
          value={data.interestedIn}
          gender={data.gender}
          onChange={(v) => update("interestedIn", v)}
        />
      )}
      {step === 5 && (
        <Step5Sports
          selected={data.sportSlugs}
          onChange={(v) => update("sportSlugs", v)}
        />
      )}
      {step === 6 && (
        <Step6SessionTypes
          selected={data.preferredSessionTypes}
          onChange={(v) => update("preferredSessionTypes", v)}
        />
      )}
      {step === 7 && (
        <Step7Bio value={data.bio} onChange={(v) => update("bio", v)} />
      )}
    </WizardLayout>
  );
}