'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Clock3,
  FilterX,
  LocateFixed,
  Loader2,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

type ExploreListing = {
  id: number | string;
  title?: string;
  user?: { name?: string };
  location?: string;
  sports?: string[] | string;
  tags?: string[] | string;
  moreInfo?: string;
  exerciseType?: 'ONE_ON_ONE' | 'ONE_ON_MANY' | 'MANY_ON_MANY';
  genderPreference?: 'ANY' | 'MALE' | 'FEMALE';
  maxInvites?: number;
  isActive?: boolean;
  requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  createdAt?: string;
  updatedAt?: string;
  eventTime?: string;
  startTime?: string;
  scheduledAt?: string;
};

type CardArt = {
  src: string;
  alt: string;
  accent: string;
  labelKey: string;
};

type FilterState = {
  sport: string;
  exerciseType: 'ALL' | NonNullable<ExploreListing['exerciseType']>;
  genderPreference: 'ALL' | NonNullable<ExploreListing['genderPreference']>;
  location: string;
  sortBy: 'newest' | 'soonest' | 'oldest';
};

const defaultFilters: FilterState = {
  sport: '',
  exerciseType: 'ALL',
  genderPreference: 'ALL',
  location: '',
  sortBy: 'newest',
};

function formatTimeLabel(
  listing: ExploreListing,
  locale: string,
  t: ReturnType<typeof useTranslations<'ExplorePage'>>
) {
  const raw =
    listing.eventTime ||
    listing.startTime ||
    listing.scheduledAt ||
    listing.updatedAt ||
    listing.createdAt;

  if (!raw) {
    return {
      primary: t('timePending'),
      secondary: t('schedulePending'),
    };
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return {
      primary: raw,
      secondary: t('scheduleTime'),
    };
  }

  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';

  return {
    primary: new Intl.DateTimeFormat(dateLocale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),

    secondary: new Intl.DateTimeFormat(dateLocale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date),
  };
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPrimarySport(listing: ExploreListing) {
  const source = listing.tags ?? listing.sports;

  if (Array.isArray(source)) {
    return source[0] || '';
  }

  if (typeof source === 'string') {
    return source;
  }

  return '';
}

function getCardArt(listing: ExploreListing): CardArt {
  const sport = `${getPrimarySport(listing)} ${listing.title || ''}`.toLowerCase();

  const themes = [
    {
      match: ['swim', 'pool', 'water'],
      labelKey: 'swim',
      accent: 'from-cyan-400 via-sky-500 to-blue-600',
      alt: 'Blue swim themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#67e8f9"/>
              <stop offset="55%" stop-color="#0284c7"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <circle cx="980" cy="170" r="170" fill="rgba(255,255,255,0.14)"/>
          <circle cx="190" cy="180" r="110" fill="rgba(255,255,255,0.12)"/>
          <path d="M0 620 C140 560, 220 560, 360 620 S620 680, 760 620 S1040 560, 1200 620 L1200 900 L0 900 Z" fill="rgba(255,255,255,0.16)"/>
          <path d="M0 700 C150 650, 270 650, 410 700 S650 750, 820 700 S1040 650, 1200 700" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="14" stroke-linecap="round"/>
          <path d="M0 760 C150 710, 270 710, 410 760 S650 810, 820 760 S1040 710, 1200 760" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="10" stroke-linecap="round"/>
          <rect x="120" y="128" rx="34" ry="34" width="250" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="245" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">SWIM</text>
          <circle cx="780" cy="410" r="110" fill="rgba(255,255,255,0.18)"/>
          <circle cx="780" cy="410" r="60" fill="rgba(255,255,255,0.4)"/>
        </svg>
      `,
    },
    {
      match: ['tennis', 'court', 'racket'],
      labelKey: 'tennis',
      accent: 'from-lime-400 via-emerald-500 to-teal-700',
      alt: 'Tennis themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#bef264"/>
              <stop offset="55%" stop-color="#22c55e"/>
              <stop offset="100%" stop-color="#134e4a"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <rect x="90" y="130" width="1020" height="640" rx="64" fill="rgba(3,7,18,0.18)"/>
          <path d="M220 220h760v460H220z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)" stroke-width="10"/>
          <path d="M600 220v460" stroke="rgba(255,255,255,0.45)" stroke-width="12"/>
          <path d="M220 450h760" stroke="rgba(255,255,255,0.3)" stroke-width="12"/>
          <circle cx="855" cy="280" r="92" fill="rgba(255,255,255,0.26)"/>
          <circle cx="855" cy="280" r="56" fill="rgba(255,255,255,0.54)"/>
          <rect x="120" y="128" rx="34" ry="34" width="290" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="265" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">TENNIS</text>
        </svg>
      `,
    },
    {
      match: ['run', 'running', 'jog', 'walk', 'cardio', 'track'],
      labelKey: 'run',
      accent: 'from-orange-400 via-rose-500 to-red-600',
      alt: 'Running themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#fb923c"/>
              <stop offset="55%" stop-color="#f43f5e"/>
              <stop offset="100%" stop-color="#7f1d1d"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <path d="M0 650 C220 560, 360 560, 600 650 S980 740, 1200 650 L1200 900 L0 900 Z" fill="rgba(255,255,255,0.12)"/>
          <path d="M0 730 C230 650, 380 650, 620 730 S990 810, 1200 730" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="18" stroke-linecap="round"/>
          <circle cx="900" cy="240" r="180" fill="rgba(255,255,255,0.1)"/>
          <circle cx="900" cy="240" r="85" fill="rgba(255,255,255,0.4)"/>
          <rect x="120" y="128" rx="34" ry="34" width="240" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="240" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">RUN</text>
        </svg>
      `,
    },
    {
      match: ['bike', 'cycle', 'cycling', 'ride'],
      labelKey: 'cycle',
      accent: 'from-indigo-400 via-violet-500 to-fuchsia-700',
      alt: 'Cycling themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#818cf8"/>
              <stop offset="55%" stop-color="#8b5cf6"/>
              <stop offset="100%" stop-color="#581c87"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <circle cx="360" cy="640" r="150" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="26"/>
          <circle cx="840" cy="640" r="150" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="26"/>
          <path d="M360 640 L520 460 L690 640 L840 640" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M520 460 L650 350 L760 410" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="635" cy="340" r="34" fill="rgba(255,255,255,0.62)"/>
          <rect x="120" y="128" rx="34" ry="34" width="260" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="250" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">CYCLE</text>
        </svg>
      `,
    },
    {
      match: ['gym', 'lift', 'weight', 'strength', 'dumbbell', 'training'],
      labelKey: 'gym',
      accent: 'from-amber-400 via-orange-500 to-stone-800',
      alt: 'Strength training themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#fbbf24"/>
              <stop offset="55%" stop-color="#f97316"/>
              <stop offset="100%" stop-color="#292524"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <rect x="160" y="390" width="880" height="120" rx="60" fill="rgba(255,255,255,0.18)"/>
          <rect x="290" y="330" width="84" height="240" rx="24" fill="rgba(255,255,255,0.42)"/>
          <rect x="826" y="330" width="84" height="240" rx="24" fill="rgba(255,255,255,0.42)"/>
          <rect x="200" y="360" width="48" height="180" rx="16" fill="rgba(255,255,255,0.34)"/>
          <rect x="952" y="360" width="48" height="180" rx="16" fill="rgba(255,255,255,0.34)"/>
          <rect x="120" y="128" rx="34" ry="34" width="250" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="245" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">GYM</text>
        </svg>
      `,
    },
  ] as const;

  const theme =
    themes.find((item) => item.match.some((m) => sport.includes(m))) || {
      labelKey: 'sport',
      accent: 'from-slate-500 via-slate-700 to-slate-900',
      alt: 'Generic sports themed banner',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#94a3b8"/>
              <stop offset="55%" stop-color="#334155"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#g)"/>
          <circle cx="880" cy="220" r="190" fill="rgba(255,255,255,0.11)"/>
          <circle cx="320" cy="670" r="240" fill="rgba(255,255,255,0.08)"/>
          <rect x="120" y="128" rx="34" ry="34" width="320" height="92" fill="rgba(15,23,42,0.3)"/>
          <text x="280" y="188" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">SPORT</text>
        </svg>
      `,
    };

  return {
    src: toDataUri(theme.svg),
    alt: theme.alt,
    accent: theme.accent,
    labelKey: theme.labelKey,
  };
}

async function reverseGeocode(lat: number, lon: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
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

export default function ExplorePage() {
  const t = useTranslations('ExplorePage');
  const locale = useLocale();
  const isRtl = locale === 'fa';

  const [joining, setJoining] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] =
    useState<FilterState>(defaultFilters);
  const [activeFilters, setActiveFilters] =
    useState<FilterState>(defaultFilters);
  const [locating, setLocating] = useState(false);

  const {
    data: profiles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'profiles',
      'explore',
      activeFilters.sport,
      activeFilters.exerciseType,
      activeFilters.genderPreference,
      activeFilters.location,
      activeFilters.sortBy,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (activeFilters.sport) {
        params.append('sport', activeFilters.sport);
      }

      if (activeFilters.exerciseType !== 'ALL') {
        params.append('exerciseType', activeFilters.exerciseType);
      }

      if (activeFilters.genderPreference !== 'ALL') {
        params.append(
          'genderPreference',
          activeFilters.genderPreference
        );
      }

      if (activeFilters.location) {
        params.append('location', activeFilters.location);
      }

      if (activeFilters.sortBy) {
        params.append('sortBy', activeFilters.sortBy);
      }

      const res = await apiClient.get(
        `/profile/explore?${params.toString()}`
      );

      return res?.profiles || [];
    },
  });

  const handleApplyFilters = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setActiveFilters(draftFilters);
  };

  const handleClearFilters = () => {
    setDraftFilters(defaultFilters);
    setActiveFilters(defaultFilters);
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t('locationUnavailable'));
      return;
    }

    setLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
            }
          );
        }
      );

      const locationName = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      setDraftFilters((current) => ({
        ...current,
        location: locationName,
      }));

      toast.success(t('locationAdded'));
    } catch {
      toast.error(t('locationFailed'));
    } finally {
      setLocating(false);
    }
  };

  const handleJoin = async (profileId: number) => {
    setJoining(String(profileId));

    try {
      await apiClient.post('/requests', { profileId });

      toast.success(t('requestSent'));
      await refetch();
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.response?.data?.error ||
        (err as any)?.message ||
        t('requestFailed');

      toast.error(errorMessage);
    } finally {
      setJoining(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-white p-4 sm:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('badge')}
            </p>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t('heading')}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {t('subtitle')}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-medium text-slate-900">
              {t('filters')}
            </p>

            <form
              onSubmit={handleApplyFilters}
              className="mt-4 space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder={t('sportPlaceholder')}
                  value={draftFilters.sport}
                  onChange={(e) =>
                    setDraftFilters((c) => ({
                      ...c,
                      sport: e.target.value,
                    }))
                  }
                  className="rounded-[1rem] border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400"
                />

                <Input
                  placeholder={t('locationPlaceholder')}
                  value={draftFilters.location}
                  onChange={(e) =>
                    setDraftFilters((c) => ({
                      ...c,
                      location: e.target.value,
                    }))
                  }
                  className="rounded-[1rem] border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  value={draftFilters.exerciseType}
                  onValueChange={(value) =>
                    setDraftFilters((c) => ({
                      ...c,
                      exerciseType:
                        value as FilterState['exerciseType'],
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-[1rem] border-slate-200 bg-slate-50">
                    <SelectValue
                      placeholder={t('allSessionTypes')}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">
                      {t('allSessionTypes')}
                    </SelectItem>

                    <SelectItem value="ONE_ON_ONE">
                      {t('exerciseTypes.ONE_ON_ONE')}
                    </SelectItem>

                    <SelectItem value="ONE_ON_MANY">
                      {t('exerciseTypes.ONE_ON_MANY')}
                    </SelectItem>

                    <SelectItem value="MANY_ON_MANY">
                      {t('exerciseTypes.MANY_ON_MANY')}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={draftFilters.genderPreference}
                  onValueChange={(value) =>
                    setDraftFilters((c) => ({
                      ...c,
                      genderPreference:
                        value as FilterState['genderPreference'],
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-[1rem] border-slate-200 bg-slate-50">
                    <SelectValue placeholder={t('anyGender')} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">
                      {t('anyGender')}
                    </SelectItem>

                    <SelectItem value="ANY">
                      {t('genders.ANY')}
                    </SelectItem>

                    <SelectItem value="MALE">
                      {t('genders.MALE')}
                    </SelectItem>

                    <SelectItem value="FEMALE">
                      {t('genders.FEMALE')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={draftFilters.sortBy}
                onValueChange={(value) =>
                  setDraftFilters((c) => ({
                    ...c,
                    sortBy: value as FilterState['sortBy'],
                  }))
                }
              >
                <SelectTrigger className="w-full rounded-[1rem] border-slate-200 bg-slate-50">
                  <SelectValue placeholder={t('sortPlaceholder')} />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="newest">
                    {t('sortNewest')}
                  </SelectItem>

                  <SelectItem value="soonest">
                    {t('sortSoonest')}
                  </SelectItem>

                  <SelectItem value="oldest">
                    {t('sortOldest')}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <LocateFixed className="me-2 h-4 w-4" />
                  {locating
                    ? t('locating')
                    : t('useLocation')}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-700"
                >
                  <Search className="me-2 h-4 w-4" />
                  {t('apply')}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <FilterX className="me-2 h-4 w-4" />
                  {t('clear')}
                </Button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-4 w-4" />

              <span>
                {t('listingCount', {
                  count: profiles.length,
                })}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
          </div>
        ) : profiles.length === 0 ? (
          <Card className="border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <CardContent className="py-16 text-center">
              <p className="text-slate-500">{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile: ExploreListing) => {
              const art = getCardArt(profile);
              const time = formatTimeLabel(
                profile,
                locale,
                t
              );

              const artLabel = t(
                `artLabels.${art.labelKey}`
              );

              const sportsSource =
                profile.tags ?? profile.sports;

              const sports = Array.isArray(sportsSource)
                ? sportsSource
                : typeof sportsSource === 'string' &&
                    sportsSource.trim()
                  ? sportsSource
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : [];

              const isJoining =
                joining === String(profile.id);

              const isPending =
                profile.requestStatus === 'PENDING';

              const isApproved =
                profile.requestStatus === 'APPROVED';

              const isRejected =
                profile.requestStatus === 'REJECTED';

              const isClosed =
                profile.isActive === false;

              const isDisabled =
                isJoining ||
                isClosed ||
                isPending ||
                isApproved ||
                isRejected;

              return (
                <Card
                  key={profile.id}
                  className="group overflow-hidden border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
                >
                  <div
                    className={`relative aspect-[4/5] bg-gradient-to-br ${art.accent}`}
                  >
                    <Image
                      src={art.src}
                      alt={art.alt}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <Badge className="border-white/15 bg-white/20 text-white backdrop-blur">
                        <Clock3 className="me-1 h-3.5 w-3.5" />

                        <span dir="ltr">
                          {time.primary}
                        </span>
                      </Badge>

                      <Badge className="border-white/15 bg-white/15 text-white backdrop-blur">
                        {artLabel}
                      </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border-white/10 bg-black/35 text-white backdrop-blur">
                          {t(
                            `exerciseTypes.${
                              profile.exerciseType ||
                              'ONE_ON_ONE'
                            }`
                          )}
                        </Badge>

                        <Badge className="border-white/10 bg-black/35 text-white backdrop-blur">
                          {t(
                            `genders.${
                              profile.genderPreference ||
                              'ANY'
                            }`
                          )}
                        </Badge>
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold leading-tight">
                        {profile.title ||
                          t('lookingForPartner', {
                            sport: artLabel,
                          })}
                      </h2>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-200/90">
                        <span className="font-medium text-white">
                          {profile.user?.name || t('host')}
                        </span>

                        <span>•</span>

                        <MapPin className="h-4 w-4 shrink-0" />

                        <span>
                          {profile.location ||
                            t('locationPending')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="space-y-0 pb-3">
                    <CardTitle className="text-lg text-slate-950">
                      {t('sessionDetails')}
                    </CardTitle>

                    <CardDescription className="text-slate-500">
                      {time.secondary}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {profile.moreInfo && (
                      <p className="text-sm leading-6 text-slate-600">
                        {profile.moreInfo}
                      </p>
                    )}

                    {sports.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sports.slice(0, 4).map((sport) => (
                          <Badge
                            key={sport}
                            variant="secondary"
                            className="border border-slate-200 bg-slate-50 text-slate-700"
                          >
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-2 rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {t('sessionType')}
                        </span>

                        <span className="font-medium text-slate-950">
                          {t(
                            `exerciseTypes.${
                              profile.exerciseType ||
                              'ONE_ON_ONE'
                            }`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {t('genderPreference')}
                        </span>

                        <span className="font-medium text-slate-950">
                          {t(
                            `genders.${
                              profile.genderPreference ||
                              'ANY'
                            }`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          {t('eventTime')}
                        </span>

                        <span
                          className="font-medium text-slate-950"
                          dir="ltr"
                        >
                          {time.primary}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        handleJoin(Number(profile.id))
                      }
                      disabled={isDisabled}
                      className={`w-full rounded-full ${
                        isApproved
                          ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                          : isPending
                            ? 'bg-amber-500 text-white hover:bg-amber-500'
                            : isRejected
                              ? 'bg-red-500 text-white hover:bg-red-500'
                              : isClosed
                                ? 'bg-slate-400 text-white hover:bg-slate-400'
                                : 'bg-slate-900 text-white hover:bg-slate-700'
                      }`}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('sending')}
                        </>
                      ) : isClosed ? (
                        t('closed')
                      ) : isPending ? (
                        t('pending')
                      ) : isApproved ? (
                        t('joined')
                      ) : isRejected ? (
                        t('rejected')
                      ) : (
                        t('join')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
