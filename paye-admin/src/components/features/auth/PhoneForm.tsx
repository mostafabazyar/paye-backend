"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\s]+$/, "Only digits, + and spaces allowed"),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;

type Props = {
  defaultPhone?: string;
  onSuccess: (phone: string) => void;
};

export function PhoneForm({ defaultPhone, onSuccess }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: defaultPhone ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: PhoneFormValues) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "Failed to send OTP");
      }
      return json;
    },
    onSuccess: (_data, variables) => {
      toast.success("OTP sent. Check your phone.");
      onSuccess(variables.phone);
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
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone number</FieldLabel>
            <Input
              id="phone"
              placeholder="09xxxxxxxxx"
              autoComplete="tel"
              inputMode="tel"
              dir="ltr"
              aria-invalid={!!errors.phone}
              {...field}
            />
            <FieldError errors={errors.phone ? [{ message: errors.phone.message }] : undefined} />
          </Field>
        )}
      />

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending OTP..." : "Send OTP"}
      </Button>
    </form>
  );
}