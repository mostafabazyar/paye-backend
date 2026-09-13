"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

type Props = {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
};

export function OtpForm({ phone, onBack, onSuccess }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: OtpFormValues) => {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: values.otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Invalid or expired OTP");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Welcome back.");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="space-y-4"
    >
      <div className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to <span dir="ltr">{phone}</span>
      </div>

      <Controller
        control={control}
        name="otp"
        render={({ field }) => (
          <Field data-invalid={!!errors.otp}>
            <FieldLabel htmlFor="otp">OTP code</FieldLabel>
            <Input
              id="otp"
              placeholder="------"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              className="text-center tracking-[0.5em] text-lg"
              aria-invalid={!!errors.otp}
              {...field}
            />
            <FieldError errors={errors.otp ? [{ message: errors.otp.message }] : undefined} />
          </Field>
        )}
      />

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Verifying..." : "Verify & Login"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
        disabled={mutation.isPending}
      >
        Change phone number
      </Button>
    </form>
  );
}