'use client';

import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form/form';
import { useTranslations, useLocale } from 'next-intl';

type EditProfileForm = {
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  interestedIn?: 'MEN' | 'WOMEN' | 'EVERYONE';
  preferredSports?: string[];
  preferredSessionTypes?: (
    | 'ONE_ON_ONE'
    | 'ONE_ON_MANY'
    | 'MANY_ON_MANY'
  )[];
  bio?: string;
  location?: string;
};

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

export default function EditProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const t = useTranslations('EditProfilePage');
  const tSports = useTranslations('Sports');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<EditProfileForm>({
    defaultValues: {
      preferredSports: [],
      preferredSessionTypes: [],
      bio: '',
    },
  });

  const { reset, watch } = form;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiClient.get('/profile/me');
        reset({
          ...res.user,
          preferredSports: res.user.preferredSports || [],
          preferredSessionTypes: res.user.preferredSessionTypes || [],
        });
      } catch {
        toast.error(t('loadFailed'));
      } finally {
        setInitialLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmit = async (data: EditProfileForm) => {
    setLoading(true);
    try {
      await apiClient.post('/profile/setup', data);
      toast.success(t('updateSuccess'));
      router.push('/profile');
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || t('updateFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        className="container max-w-4xl py-10"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }

  const name = watch('name');
  const location = watch('location');
  const bio = watch('bio');

  return (
    <div
      className="container max-w-4xl py-8 margin-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Profile Preview */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="-mt-14">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="h-24 w-24 rounded-full border-4 border-background bg-primary flex items-center justify-center shrink-0">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {name || t('fallbackName')}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {location || t('noLocation')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('personalTitle')}</CardTitle>
              <CardDescription>{t('personalDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('namePlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phoneLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('phonePlaceholder')}
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ageLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Number(e.target.value)
                              : undefined
                          )
                        }
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('locationLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('locationPlaceholder')}
                      />
                    </FormControl>
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
                      value={field.value}
                      onValueChange={field.onChange}
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
            </CardContent>
          </Card>

          {/* Sports */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sportsTitle')}</CardTitle>
              <CardDescription>{t('sportsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferredSports"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sportOptions.map((sport) => {
                        const selected = (field.value || []).includes(
                          sport
                        );
                        return (
                          <Button
                            key={sport}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            className="justify-center"
                            onClick={() => {
                              const next = selected
                                ? (field.value || []).filter(
                                    (x) => x !== sport
                                  )
                                : [...(field.value || []), sport];
                              field.onChange(next);
                            }}
                          >
                            {tSports(sportKeyMap[sport])}
                          </Button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Session Type */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sessionTitle')}</CardTitle>
              <CardDescription>{t('sessionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferredSessionTypes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-3">
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
                                    (x) => x !== option.value
                                  )
                                : [
                                    ...(field.value || []),
                                    option.value,
                                  ];
                              field.onChange(next);
                            }}
                          >
                            {t(`sessionTypes.${option.key}`)}
                          </Button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>{t('aboutTitle')}</CardTitle>
              <CardDescription>{t('aboutDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>{t('bioLabel')}</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {bio?.length || 0}/250
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={5}
                        maxLength={250}
                        placeholder={t('bioPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}