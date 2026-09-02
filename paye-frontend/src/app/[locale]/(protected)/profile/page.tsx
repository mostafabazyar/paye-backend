'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Loader2, Edit2, Heart, MapPin, UserRound } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

type ProfileUser = {
  name?: string;
  bio?: string;
  photos?: string[];
  age?: number;
  gender?: string;
  interestedIn?: 'MEN' | 'WOMEN' | 'EVERYONE';
  preferredSports?: string[];
  preferredSessionTypes?: string[];
  phone?: string;
  location?: string;
};

const sportKeyMap: Record<string, string> = {
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

const sessionTypeKeyMap: Record<string, string> = {
  ONE_ON_ONE: 'oneOnOne',
  ONE_ON_MANY: 'oneOnMany',
  MANY_ON_MANY: 'manyOnMany',
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('ProfilePage');
  const tSports = useTranslations('Sports');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/profile/me');
        setUser(res.user);
      } catch {
        console.log('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="text-slate-500">{t('loadFailed')}</p>
      </div>
    );
  }

  const interestedInKey = user.interestedIn || 'EVERYONE';
  const genderLabel = user.gender
    ? t(`genderValues.${user.gender}` as 'genderValues.male')
    : t('notSpecified');

  return (
    <div
      className="min-h-screen bg-white p-4 sm:p-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="overflow-hidden border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="h-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-18 w-18 border border-slate-100 shadow-sm shrink-0">
                  <AvatarImage src={user.photos?.[0]} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {t('badge')}
                  </p>
                  <CardTitle className="text-3xl text-slate-950">
                    {user.name || t('fallbackName')}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-slate-600">
                    {user.bio || t('fallbackBio')}
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => router.push('/profile/edit')}
                className="rounded-full bg-slate-900 text-white hover:bg-slate-700 shrink-0"
              >
                <Edit2 className="me-2 h-4 w-4" />
                {t('edit')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-3">
              <CardDescription>{t('interestedInLabel')}</CardDescription>
              <CardTitle className="text-2xl text-slate-950">
                {t(`interestedIn.${interestedInKey}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-sm text-slate-500">{t('interestedInHint')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-3">
              <CardDescription>{t('identityLabel')}</CardDescription>
              <CardTitle className="text-2xl text-slate-950">
                {genderLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-sm text-slate-500">
                  {t('ageLine', { age: user.age ?? t('na') })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-xl text-slate-950">
              {t('discoveryTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-400">
                {t('sportsLabel')}
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.preferredSports || []).length > 0 ? (
                  user.preferredSports?.map((sport) => (
                    <Badge
                      key={sport}
                      variant="secondary"
                      className="border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {sportKeyMap[sport]
                        ? tSports(sportKeyMap[sport])
                        : sport}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{t('noSports')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">
                {t('sessionLabel')}
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.preferredSessionTypes || []).length > 0 ? (
                  user.preferredSessionTypes?.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {sessionTypeKeyMap[type]
                        ? t(`sessionTypes.${sessionTypeKeyMap[type]}`)
                        : type}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{t('noSessions')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-xl text-slate-950">
              {t('personalTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-400">
                  {t('ageLabel')}
                </label>
                <p className="mt-1 text-lg text-slate-900">
                  {user.age ?? t('notSpecified')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">
                  {t('genderLabel')}
                </label>
                <p className="mt-1 text-lg text-slate-900">{genderLabel}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">
                  {t('interestedInLabel')}
                </label>
                <p className="mt-1 text-lg text-slate-900">
                  {t(`interestedIn.${interestedInKey}`)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">
                  {t('phoneLabel')}
                </label>
                <p className="mt-1 text-lg text-slate-900" dir="ltr">
                  {user.phone || t('notSpecified')}
                </p>
              </div>
              {user.location && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-400">
                    {t('locationLabel')}
                  </label>
                  <p className="mt-1 flex items-center gap-2 text-lg text-slate-900">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    {user.location}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="border border-slate-200 bg-slate-50 text-slate-700"
              >
                {t('badgeClean')}
              </Badge>
              <Badge
                variant="secondary"
                className="border border-slate-200 bg-slate-50 text-slate-700"
              >
                {t('badgeInterest')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}