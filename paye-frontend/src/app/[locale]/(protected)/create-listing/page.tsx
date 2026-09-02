'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form/form';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import {
  ArrowRight,
  ClipboardList,
  HeartHandshake,
  LocateFixed,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

type CreateListingForm = {
  title: string;
  sports: string;
  exerciseType: 'ONE_ON_ONE' | 'ONE_ON_MANY' | 'MANY_ON_MANY';
  location: string;
  scheduledAt: string;
  genderPreference: 'ANY' | 'MALE' | 'FEMALE';
  maxInvites: string;
  moreInfo: string;
  goDutch: boolean;
};

// API values stay in English
const sportOptions = [
  'Football',
  'Basketball',
  'Tennis',
  'Swimming',
  'Running',
  'Cycling',
  'Gym',
  'Yoga',
  'Boxing',
  'Hiking',
  'Badminton',
  'Volleyball',
] as const;

const sportKeyMap: Record<(typeof sportOptions)[number], string> = {
  Football: 'football',
  Basketball: 'basketball',
  Tennis: 'tennis',
  Swimming: 'swimming',
  Running: 'running',
  Cycling: 'cycling',
  Gym: 'gym',
  Yoga: 'yoga',
  Boxing: 'boxing',
  Hiking: 'hiking',
  Badminton: 'badminton',
  Volleyball: 'volleyball',
};

const exerciseTypeValues = [
  'ONE_ON_ONE',
  'ONE_ON_MANY',
  'MANY_ON_MANY',
] as const;

const genderValues = ['ANY', 'MALE', 'FEMALE'] as const;

const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultScheduleTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setSeconds(0, 0);
  return formatDateTimeLocal(date);
};

async function reverseGeocode(lat: number, lon: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!response.ok) {
    throw new Error('Unable to resolve location');
  }
  const data = await response.json();
  const address = data?.address || {};
  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  );
}

export default function CreateListingPage() {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('CreateListingPage');
  const tSports = useTranslations('Sports');

  const form = useForm<CreateListingForm>({
    defaultValues: {
      title: '',
      sports: sportOptions[0],
      exerciseType: 'ONE_ON_ONE',
      location: '',
      scheduledAt: '',
      genderPreference: 'ANY',
      maxInvites: '1',
      moreInfo: '',
      goDutch: false,
    },
  });

  const { getValues, setValue, watch } = form;
  const exerciseType = watch('exerciseType');
  const genderPreference = watch('genderPreference');

  useEffect(() => {
    if (!getValues('scheduledAt')) {
      setValue('scheduledAt', getDefaultScheduleTime(), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [getValues, setValue]);

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t('locationUnavailable'));
      return;
    }
    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );
      const locationName = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );
      setValue('location', locationName, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast.success(t('locationAdded'));
    } catch {
      toast.error(t('locationFailed'));
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (data: CreateListingForm) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        sports: data.sports ? [data.sports] : [],
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt).toISOString()
          : null,
        maxInvites: Number(data.maxInvites) || 1,
        goDutch: !!data.goDutch,
      };
      await apiClient.post('/profile/create', payload);
      toast.success(t('success'));
      router.push('/explore');
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string }).message || t('errorFallback')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white p-4 sm:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <div className="h-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-[0_18px_35px_rgba(15,23,42,0.14)] shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {t('badge')}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {t('heading')}
                  </h1>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">{t('intro')}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50 p-4">
                  <Users className="h-5 w-5 text-slate-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">
                    {t('feature1Title')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('feature1Desc')}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50 p-4">
                  <HeartHandshake className="h-5 w-5 text-slate-700" />
                  <p className="mt-3 text-sm font-medium text-slate-950">
                    {t('feature2Title')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('feature2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {t('badge1')}
                </Badge>
                <Badge
                  variant="secondary"
                  className="border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {t('badge2')}
                </Badge>
                <Badge
                  variant="secondary"
                  className="border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {t('badge3')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-slate-50 shadow-none">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">
                  {t('tipsTitle')}
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{t('tipsBody')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Form column */}
        <Card className="border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-2xl text-slate-950">
              {t('formTitle')}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {t('formSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('titleLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('titlePlaceholder')}
                          className="rounded-[1rem] border-slate-200 bg-slate-50"
                        />
                      </FormControl>
                      <FormDescription>{t('titleHint')}</FormDescription>
                    </FormItem>
                  )}
                />

                {/* Sport */}
                <FormField
                  control={form.control}
                  name="sports"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sportLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full rounded-[1rem] border-slate-200 bg-slate-50">
                            <SelectValue placeholder={t('sportPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sportOptions.map((sport) => (
                            <SelectItem key={sport} value={sport}>
                              {tSports(sportKeyMap[sport])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{t('sportHint')}</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Exercise type */}
                  <FormField
                    control={form.control}
                    name="exerciseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('exerciseTypeLabel')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-[1rem] border-slate-200 bg-slate-50">
                              <SelectValue
                                placeholder={t('exerciseTypePlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exerciseTypeValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {t(`exerciseTypes.${value}.label`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t(`exerciseTypes.${exerciseType}.description`)}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-3">
                          <FormLabel>{t('locationLabel')}</FormLabel>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleUseLocation}
                            disabled={locating}
                            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <LocateFixed className="me-2 h-3.5 w-3.5" />
                            {locating ? t('locating') : t('useLocation')}
                          </Button>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('locationPlaceholder')}
                            className="rounded-[1rem] border-slate-200 bg-slate-50"
                          />
                        </FormControl>
                        <FormDescription>{t('locationHint')}</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Gender preference */}
                  <FormField
                    control={form.control}
                    name="genderPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('genderLabel')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-[1rem] border-slate-200 bg-slate-50">
                              <SelectValue
                                placeholder={t('genderPlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {t(`genders.${value}.label`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t(`genders.${genderPreference}.description`)}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Max invites */}
                  <FormField
                    control={form.control}
                    name="maxInvites"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maxInvitesLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="1"
                            className="rounded-[1rem] border-slate-200 bg-slate-50"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription>{t('maxInvitesHint')}</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Schedule */}
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('scheduleLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          min={getDefaultScheduleTime()}
                          className="rounded-[1rem] border-slate-200 bg-slate-50"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormDescription>{t('scheduleHint')}</FormDescription>
                    </FormItem>
                  )}
                />

                {/* More info */}
                <FormField
                  control={form.control}
                  name="moreInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('moreInfoLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('moreInfoPlaceholder')}
                          className="min-h-[140px] resize-none rounded-[1rem] border-slate-200 bg-slate-50"
                          rows={5}
                        />
                      </FormControl>
                      <FormDescription>{t('moreInfoHint')}</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{t('footerNote')}</p>
                  <Button
                    type="submit"
                    className="h-12 rounded-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 px-6 text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)]"
                    disabled={loading}
                  >
                    {loading ? t('creating') : t('submit')}
                    {!loading && (
                      <ArrowRight
                        className={`ms-2 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}