"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhoneForm } from "@/components/features/auth/PhoneForm";
import { OtpForm } from "@/components/features/auth/OtpForm";

type Step = { kind: "phone" } | { kind: "otp"; phone: string };

export default function LoginPage() {
  const [step, setStep] = useState<Step>({ kind: "phone" });
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Paye Admin</CardTitle>
          <CardDescription>
            {step.kind === "phone"
              ? "Sign in with your admin phone number."
              : "Verify the code to continue."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step.kind === "phone" && (
            <PhoneForm
              onSuccess={(phone) => setStep({ kind: "otp", phone })}
            />
          )}

          {step.kind === "otp" && (
            <OtpForm
              phone={step.phone}
              onBack={() => setStep({ kind: "phone" })}
              onSuccess={() => {
                window.location.href = from;
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}