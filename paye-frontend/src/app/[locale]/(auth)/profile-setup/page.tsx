'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations, useLocale } from 'next-intl';

const profileSetupSchema = z.object({
  name: z.string().min(2, 'nameMin'),
  age: z.number().min(16, 'ageMin').max(70, 'ageMax'),
  gender: z.enum(['male', 'female', 'other']),
  interestedIn: z.enum(['MEN', 'WOMEN', 'EVERYONE']),
  preferredSports: z.array(z.string()),
  preferredSessionTypes: z.array(
    z.enum(['ONE_ON_ONE', 'ONE_ON_MANY', 'MANY_ON_MANY'])
  ),
  bio: z.string().max(500).optional(),
});

type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

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

const sessionTypeOptions = [
  { value: 'ONE_ON_ONE' as const, key: 'oneOnOne' },
  { value: 'ONE_ON_MANY' as const, key: 'oneOnMany' },
  { value: 'MANY_ON_MANY' as const, key: 'manyOnMany' },
];

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('ProfileSetupPage');
  const tSports = useTranslations('Sports');

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age || 25,
      gender: (user?.gender as 'male' | 'female' | 'other') || 'male',
      interestedIn:
        (user?.interestedIn as 'MEN' | 'WOMEN' | 'EVERYONE') || 'EVERYONE',
      preferredSports: user?.preferredSports || [],
      preferredSessionTypes:
        (user?.preferredSessionTypes as ProfileSetupForm['preferredSessionTypes']) ||
        [],
      bio: user?.bio || '',
    },
  });

  const onSubmit = async (data: ProfileSetupForm) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/profile/setup', data);
      setAuth(res.user, res.token || '');
      toast.success(t('success'));
      router.push('/explore');
    } catch (error: unknown) {
      toast.error(t('errorTitle'), {
        description:
          (error as { message?: string }).message || t('errorFallback'),
      });
    } finally {
      setLoading(false);
    }
  };

  const translateError = (message?: string) => {
    if (!message) return undefined;
    if (message === 'nameMin') return t('errors.nameMin');
    if (message === 'ageMin') return t('errors.ageMin');
    if (message === 'ageMax') return t('errors.ageMax');
    return message;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage>
                      {translateError(form.formState.errors.name?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ageLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            field.onChange(isNaN(val) ? '' : val);
                          }}
                        />
                      </FormControl>
                      <FormMessage>
                        {translateError(form.formState.errors.age?.message)}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('genderLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('genderPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">{t('gender.male')}</SelectItem>
                          <SelectItem value="female">
                            {t('gender.female')}
                          </SelectItem>
                          <SelectItem value="other">
                            {t('gender.other')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interestedIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('interestedInLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('interestedInPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEN">
                            {t('interestedIn.men')}
                          </SelectItem>
                          <SelectItem value="WOMEN">
                            {t('interestedIn.women')}
                          </SelectItem>
                          <SelectItem value="EVERYONE">
                            {t('interestedIn.everyone')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferredSports"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sportsLabel')}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {sportOptions.map((sport) => {
                        const selected = (field.value || []).includes(sport);
                        return (
                          <Button
                            key={sport}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            onClick={() => {
                              const next = selected
                                ? (field.value || []).filter(
                                    (item) => item !== sport
                                  )
                                : [...(field.value || []), sport];
                              field.onChange(next);
                            }}
                            className="rounded-full"
                          >
                            {tSports(sportKeyMap[sport])}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredSessionTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sessionTypesLabel')}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {sessionTypeOptions.map((option) => {
                        const selected = (field.value || []).includes(
                          option.value
                        );
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            onClick={() => {
                              const next = selected
                                ? (field.value || []).filter(
                                    (item) => item !== option.value
                                  )
                                : [...(field.value || []), option.value];
                              field.onChange(next);
                            }}
                            className="rounded-full"
                          >
                            {t(`sessionTypes.${option.key}`)}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bioLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('bioPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('saving') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}