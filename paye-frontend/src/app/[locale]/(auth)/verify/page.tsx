'use client';

import { useState, useEffect, Suspense } from 'react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form/form';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

const verifySchema = z.object({
  otp: z.string().length(6, 'otpLength'),
});

type VerifyForm = z.infer<typeof verifySchema>;

function VerifyContent() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const { setAuth } = useAuthStore();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('VerifyPage');

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: VerifyForm) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify', {
        phone,
        otp: data.otp,
      });

      setAuth(res.user, res.token);
      if (res.user?.name) {
        router.push('/explore');
      } else {
        router.push('/profile-setup');
      }

      toast.success(t('success'));
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string }).message || t('invalidOtp')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('sentTo')}{' '}
            <span dir="ltr" className="inline-block">
              {phone}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<VerifyForm, 'otp'>;
                }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-3xl tracking-[0.5em]"
                        dir="ltr"
                        inputMode="numeric"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.otp?.message === 'otpLength'
                        ? t('otpLength')
                        : form.formState.errors.otp?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('verifying') : t('verify')}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-4">
            {countdown > 0 ? (
              <p>{t('resendIn', { countdown })}</p>
            ) : (
              <Button variant="link" onClick={() => router.push('/login')}>
                {t('resend')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" />}>
      <VerifyContent />
    </Suspense>
  );
}