'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation'; // use next-intl navigation if you have it
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import * as z from 'zod';
import type { ControllerRenderProps } from 'react-hook-form';
import {
  Dumbbell,
  ArrowRight,
  Users,
  Shield,
  Target,
  Calendar,
  MapPin,
  Clock,
  Mail,
  Phone,
  MapPin as MapPinIcon,
} from 'lucide-react';

const loginSchema = z.object({
  phone: z.string().min(9, 'phoneRequired'), // message key resolved via t later if needed
});

type LoginForm = z.infer<typeof loginSchema>;

const sportKeys = [
  'football',
  'basketball',
  'tennis',
  'swimming',
  'running',
  'cycling',
  'gym',
  'yoga',
  'boxing',
  'hiking',
  'badminton',
  'volleyball',
] as const;

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const t = useTranslations('HomePage');
  const tSports = useTranslations('Sports');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/explore');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/login', data);
      toast.success(t('otpSent'));
      router.push(`/verify?phone=${encodeURIComponent(data.phone)}`);
    } catch (error: unknown) {
      toast.error((error as { message?: string }).message || t('otpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent_40%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.07),transparent_50%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                {t('nav.features')}
              </a>
              <a href="#sports" className="text-slate-300 hover:text-white transition-colors">
                {t('nav.sports')}
              </a>
              <a href="#about" className="text-slate-300 hover:text-white transition-colors">
                {t('nav.about')}
              </a>
              <Button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20"
              >
                {t('nav.signIn')}
              </Button>
            </nav>

            <Button
              onClick={() => router.push('/login')}
              className="md:hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20"
            >
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Login */}
      <section className="relative z-10 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-start">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    {t('hero.line1')}
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {t('hero.line2')}
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0">
                  {t('hero.subtitle')}
                </p>
              </div>

              {/* Features Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50">
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-sm text-slate-300">{t('pills.athletes')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-sm text-slate-300">{t('pills.cities')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50">
                  <Calendar className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="text-sm text-slate-300">{t('pills.events')}</span>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40">
                <CardHeader className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{t('login.welcome')}</CardTitle>
                  <CardDescription className="text-slate-400">{t('login.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }: { field: ControllerRenderProps<LoginForm, 'phone'> }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">{t('login.phoneLabel')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('login.phonePlaceholder')}
                                {...field}
                                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                                dir="ltr" // phone numbers stay LTR even in RTL UI
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20 py-6"
                        disabled={loading}
                      >
                        {loading ? t('login.sending') : t('login.getStarted')}
                        <ArrowRight className={`w-4 h-4 ms-2 ${isRtl ? 'rotate-180' : ''}`} />
                      </Button>

                      <p className="text-center text-sm text-slate-500">
                        {t('login.agree')}{' '}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          {t('login.terms')}
                        </a>{' '}
                        {t('login.and')}{' '}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          {t('login.privacy')}
                        </a>
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Filter Section */}
      <section id="sports" className="relative z-10 py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t.rich('sports.title', {
                highlight: (chunks) => (
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t('sports.subtitle')}</p>
          </div>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {sportKeys.map((key) => {
                  const selected = selectedSports.includes(key);
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => {
                        const next = selected
                          ? selectedSports.filter((item) => item !== key)
                          : [...selectedSports, key];
                        setSelectedSports(next);
                      }}
                      className={`rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-purple-500'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      {tSports(key)}
                    </Button>
                  );
                })}
              </div>

              {selectedSports.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {t('sports.selected', { count: selectedSports.length })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedSports([])}
                    className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                  >
                    {t('sports.clear')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t.rich('features.title', {
                highlight: (chunks) => (
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40 hover:shadow-blue-500/5 transition-all duration-300 hover:border-slate-700/80 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{t('features.partners.title')}</CardTitle>
                <CardDescription className="text-slate-400">{t('features.partners.desc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40 hover:shadow-purple-500/5 transition-all duration-300 hover:border-slate-700/80 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{t('features.events.title')}</CardTitle>
                <CardDescription className="text-slate-400">{t('features.events.desc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40 hover:shadow-pink-500/5 transition-all duration-300 hover:border-slate-700/80 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{t('features.progress.title')}</CardTitle>
                <CardDescription className="text-slate-400">{t('features.progress.desc')}</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-12 sm:py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                {t.rich('about.title', {
                  highlight: (chunks) => (
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                })}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">{t('about.body')}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-sm text-slate-300">{t('about.verified')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-sm text-slate-300">{t('about.active')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-slate-400 text-sm mt-1">{t('stats.users')}</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-slate-400 text-sm mt-1">{t('stats.events')}</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                  98%
                </div>
                <div className="text-slate-400 text-sm mt-1">{t('stats.satisfaction')}</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  50+
                </div>
                <div className="text-slate-400 text-sm mt-1">{t('stats.cities')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  {t('title')}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{t('footer.tagline')}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="text-slate-400 hover:text-white transition-colors">
                    {t('footer.aboutUs')}
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                    {t('nav.features')}
                  </a>
                </li>
                <li>
                  <a href="#sports" className="text-slate-400 hover:text-white transition-colors">
                    {t('nav.sports')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {t('footer.events')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {t('footer.help')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {t('login.privacy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {t('login.terms')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {t('footer.faq')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span dir="ltr">support@paye.com</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span dir="ltr">+98-938-041-4654</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <MapPinIcon className="w-4 h-4 shrink-0" />
                  <span>{t('footer.location')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-8 pt-8 text-center text-sm text-slate-500">
            {t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}