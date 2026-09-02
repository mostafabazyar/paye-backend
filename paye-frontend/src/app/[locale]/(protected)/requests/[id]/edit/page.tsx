'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  DollarSign,
  Users,
  Layers,
  Sparkle,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

type RequestProfile = {
  id: number | string;
  title: string;
  location: string;
  moreInfo?: string;
  exerciseType: string;
  genderPreference: string;
  sports?: string[] | string;
  tags?: string[] | string;
  isActive: boolean;
  maxInvites?: number;
  goDutch?: boolean;
  scheduledAt?: string;
};

type UpdateProfilePayload = {
  title: string;
  location: string;
  exerciseType: string;
  genderPreference: string;
  maxInvites: number;
  goDutch: boolean;
  moreInfo?: string;
  sports: string[];
  isActive: boolean;
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const listingId = params.id;
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('EditListingPage');

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [exerciseType, setExerciseType] = useState('ONE_ON_ONE');
  const [genderPreference, setGenderPreference] = useState('ANY');
  const [maxInvites, setMaxInvites] = useState(1);
  const [goDutch, setGoDutch] = useState(false);
  const [moreInfo, setMoreInfo] = useState('');
  const [sportsInput, setSportsInput] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: profile, isLoading, error } = useQuery<{
    success: boolean;
    profiles?: RequestProfile[];
  }>({
    queryKey: ['profiles', 'my-listings'],
    queryFn: async () => {
      const response = await apiClient.get('/profile/my-listings');
      return response;
    },
  });

  useEffect(() => {
    if (profile?.profiles) {
      const currentListing = profile.profiles.find(
        (p) => String(p.id) === String(listingId)
      );
      if (currentListing) {
        setTitle(currentListing.title || '');
        setLocation(currentListing.location || '');
        setExerciseType(currentListing.exerciseType || 'ONE_ON_ONE');
        setGenderPreference(currentListing.genderPreference || 'ANY');
        setMaxInvites(currentListing.maxInvites || 1);
        setGoDutch(!!currentListing.goDutch);
        setMoreInfo(currentListing.moreInfo || '');
        setIsActive(
          currentListing.isActive !== undefined
            ? currentListing.isActive
            : true
        );

        if (Array.isArray(currentListing.tags)) {
          setSportsInput(currentListing.tags.join(', '));
        } else if (typeof currentListing.tags === 'string') {
          setSportsInput(currentListing.tags);
        } else if (Array.isArray(currentListing.sports)) {
          setSportsInput(currentListing.sports.join(', '));
        } else if (typeof currentListing.sports === 'string') {
          setSportsInput(currentListing.sports);
        }
      }
    }
  }, [profile, listingId]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: UpdateProfilePayload) => {
      const response = await apiClient.patch(
        `/profile/my-listings/${listingId}`,
        updatedData
      );
      return response;
    },
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my-listings'] });
      router.push('/requests');
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { message?: string })?.message || t('updateFailed')
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !location.trim()) {
      toast.error(t('requiredFields'));
      return;
    }

    const sportsArray = sportsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const updatePayload: UpdateProfilePayload = {
      title: title.trim(),
      location: location.trim(),
      exerciseType,
      genderPreference,
      maxInvites: Number(maxInvites),
      goDutch: Boolean(goDutch),
      sports: sportsArray,
      isActive: Boolean(isActive),
    };

    if (moreInfo.trim()) {
      updatePayload.moreInfo = moreInfo.trim();
    }

    updateMutation.mutate(updatePayload);
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-slate-800 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (
    error ||
    (profile?.profiles &&
      !profile.profiles.find((p) => String(p.id) === String(listingId)))
  ) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white p-4"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Card className="max-w-md w-full border-slate-100 shadow-[0_16px_40px_rgba(15,23,42,0.06)] text-center p-6">
          <p className="text-slate-900 font-semibold text-lg">
            {t('notFoundTitle')}
          </p>
          <p className="text-sm text-slate-500 mt-2">{t('notFoundDesc')}</p>
          <Button
            asChild
            className="mt-5 rounded-full bg-slate-900 text-white"
            variant="default"
          >
            <Link href="/requests">{t('returnToRequests')}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white p-4 sm:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            className="rounded-full text-slate-600 hover:text-slate-900 -ms-2"
          >
            <Link href="/requests">
              <ArrowLeft
                className={`me-2 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`}
              />
              {t('back')}
            </Link>
          </Button>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('badge')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {t('heading')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-hidden border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <CardTitle className="text-xl text-slate-950 flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-slate-700" />
                {t('paramsTitle')}
              </CardTitle>
              <CardDescription>{t('paramsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Visibility */}
              <div className="flex items-center justify-between rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Layers className="h-4 w-4 text-slate-400 shrink-0" />
                  {t('visibility')}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t('active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      !isActive
                        ? 'border-slate-300 bg-slate-100 text-slate-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t('expired')}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950">
                  {t('titleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />{' '}
                  {t('locationLabel')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('locationPlaceholder')}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Sports */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />{' '}
                  {t('sportsLabel')}
                </label>
                <input
                  type="text"
                  value={sportsInput}
                  onChange={(e) => setSportsInput(e.target.value)}
                  placeholder={t('sportsPlaceholder')}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-xs text-slate-400">{t('sportsHint')}</p>
              </div>

              {/* Exercise type & gender */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-950">
                    {t('exerciseTypeLabel')}
                  </label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ONE_ON_ONE">{t('exercise.ONE_ON_ONE')}</option>
                    <option value="GROUP">{t('exercise.GROUP')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-950">
                    {t('genderLabel')}
                  </label>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ANY">{t('gender.ANY')}</option>
                    <option value="WOMEN_ONLY">{t('gender.WOMEN_ONLY')}</option>
                    <option value="MEN_ONLY">{t('gender.MEN_ONLY')}</option>
                  </select>
                </div>
              </div>

              {/* Max invites & Go Dutch */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />{' '}
                    {t('maxInvites')}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={maxInvites}
                    onChange={(e) => setMaxInvites(Number(e.target.value))}
                    className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setGoDutch(!goDutch)}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all text-start ${
                    goDutch
                      ? 'border-slate-900 bg-slate-950 text-white shadow-sm'
                      : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <DollarSign
                      className={`h-4 w-4 ${goDutch ? 'text-white' : 'text-slate-400'}`}
                    />{' '}
                    {t('goDutch')}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      goDutch
                        ? 'border-white bg-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {goDutch && (
                      <div className="h-2 w-2 rounded-full bg-slate-950" />
                    )}
                  </div>
                </button>
              </div>

              {/* More info */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950">
                  {t('moreInfoLabel')}
                </label>
                <textarea
                  value={moreInfo}
                  onChange={(e) => setMoreInfo(e.target.value)}
                  placeholder={t('moreInfoPlaceholder')}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none leading-6"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 justify-end flex-wrap">
            <Button
              type="button"
              variant="secondary"
              className="h-11 px-6 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => router.push('/requests')}
              disabled={updateMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-11 px-6 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="me-2 h-4 w-4" />
                  {t('save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}