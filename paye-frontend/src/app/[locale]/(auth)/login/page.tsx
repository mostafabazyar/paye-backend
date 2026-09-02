'use client';

import { useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form/form';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useRouter } from '@/i18n/navigation'; // next-intl navigation
import { useTranslations, useLocale } from 'next-intl';
import { Dumbbell, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  phone: z.string().min(9, 'phoneRequired'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('LoginPage');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/login', data);
      toast.success(t('otpSent'));
      router.push(`/verify?phone=${encodeURIComponent(data.phone)}`);
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string }).message || t('otpFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background accents (same language as home) */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.12),transparent_40%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

      <Card className="relative z-10 w-full max-w-md bg-slate-900/50 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-base text-slate-400">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginForm, 'phone'>;
                }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">
                      {t('phoneLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('phonePlaceholder')}
                        {...field}
                        dir="ltr"
                        className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.phone?.message === 'phoneRequired'
                        ? t('phoneRequired')
                        : form.formState.errors.phone?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20 py-6 text-base"
                disabled={loading}
              >
                {loading ? t('sending') : t('sendOtp')}
                {!loading && (
                  <ArrowRight
                    className={`w-4 h-4 ms-2 ${isRtl ? 'rotate-180' : ''}`}
                  />
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('agree')}{' '}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('terms')}
            </a>{' '}
            {t('and')}{' '}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('privacy')}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}