'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toGregorian, toJalaali } from 'jalaali-js';

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

import {
  Card,
  CardContent,
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
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations, useLocale } from 'next-intl';

/* =========================================================
   Schema
========================================================= */

const profileSetupSchema = z.object({
  name: z.string().min(2, 'nameMin'),

  birthYear: z.number().int('birthYearInvalid'),
  birthMonth: z.number().int('birthMonthInvalid'),
  birthDay: z.number().int('birthDayInvalid'),

  gender: z.enum(['male', 'female', 'other']),

  interestedIn: z.enum([
    'MEN',
    'WOMEN',
    'EVERYONE',
  ]),

  preferredSports: z.array(z.string()),

  preferredSessionTypes: z.array(
    z.enum([
      'ONE_ON_ONE',
      'ONE_ON_MANY',
      'MANY_ON_MANY',
    ])
  ),

  bio: z.string().max(500).optional(),
});

type ProfileSetupForm = z.infer<
  typeof profileSetupSchema
>;

/* =========================================================
   Sports
========================================================= */

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

const sportKeyMap: Record<
  (typeof sportOptions)[number],
  string
> = {
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

/* =========================================================
   Session Types
========================================================= */

const sessionTypeOptions = [
  {
    value: 'ONE_ON_ONE' as const,
    key: 'oneOnOne',
  },
  {
    value: 'ONE_ON_MANY' as const,
    key: 'oneOnMany',
  },
  {
    value: 'MANY_ON_MANY' as const,
    key: 'manyOnMany',
  },
];

/* =========================================================
   Helpers
========================================================= */

/**
 * Return number of days in a month.
 *
 * Gregorian:
 * new Date(year, month, 0).getDate()
 *
 * Jalali:
 * jalaali-js check is used below.
 */
const getGregorianDaysInMonth = (
  year: number,
  month: number
) => {
  return new Date(
    year,
    month,
    0
  ).getDate();
};

/**
 * Convert selected local calendar date
 * to Gregorian YYYY-MM-DD.
 *
 * fa:
 * Jalali -> Gregorian
 *
 * en:
 * Gregorian -> Gregorian
 */
const convertToGregorianDate = (
  year: number,
  month: number,
  day: number,
  isPersian: boolean
): string | null => {
  try {
    let gregorianYear = year;
    let gregorianMonth = month;
    let gregorianDay = day;

    if (isPersian) {
      const result = toGregorian(
        year,
        month,
        day
      );

      gregorianYear = result.gy;
      gregorianMonth = result.gm;
      gregorianDay = result.gd;
    } else {
      const date = new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
      ) {
        return null;
      }
    }

    return [
      String(gregorianYear).padStart(4, '0'),
      String(gregorianMonth).padStart(2, '0'),
      String(gregorianDay).padStart(2, '0'),
    ].join('-');
  } catch {
    return null;
  }
};

/**
 * Get default birth date.
 *
 * Default = 25 years ago today.
 *
 * For fa, convert today's Gregorian date
 * into Jalali.
 */
const getDefaultBirthDate = (
  isPersian: boolean
) => {
  const today = new Date();

  const year =
    today.getUTCFullYear() - 25;

  const month =
    today.getUTCMonth() + 1;

  const day =
    today.getUTCDate();

  if (isPersian) {
    const jalali = toJalaali(
      year,
      month,
      day
    );

    return {
      year: jalali.jy,
      month: jalali.jm,
      day: jalali.jd,
    };
  }

  return {
    year,
    month,
    day,
  };
};

/* =========================================================
   Component
========================================================= */

export default function ProfileSetupPage() {
  const [loading, setLoading] =
    useState(false);

  const router = useRouter();

  const {
    user,
    setAuth,
  } = useAuthStore();

  const locale = useLocale();

  const isRtl =
    locale === 'fa';

  const isPersian =
    locale === 'fa';

  const t =
    useTranslations(
      'ProfileSetupPage'
    );

  const tSports =
    useTranslations('Sports');

  /* =======================================================
     Default Birth Date
  ======================================================= */

  const defaultBirthDate =
    getDefaultBirthDate(isPersian);

  /* =======================================================
     Form
  ======================================================= */

  const form =
    useForm<ProfileSetupForm>({
      resolver:
        zodResolver(
          profileSetupSchema
        ),

      defaultValues: {
        name:
          user?.name || '',

        birthYear:
          defaultBirthDate.year,

        birthMonth:
          defaultBirthDate.month,

        birthDay:
          defaultBirthDate.day,

        gender:
          (user?.gender as
            | 'male'
            | 'female'
            | 'other') ||
          'male',

        interestedIn:
          (user?.interestedIn as
            | 'MEN'
            | 'WOMEN'
            | 'EVERYONE') ||
          'EVERYONE',

        preferredSports:
          user?.preferredSports ||
          [],

        preferredSessionTypes:
          (user?.preferredSessionTypes as ProfileSetupForm['preferredSessionTypes']) ||
          [],

        bio:
          user?.bio || '',
      },
    });

  /* =======================================================
     Years
  ======================================================= */

  const currentYear =
    isPersian
      ? toJalaali(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth() + 1,
          new Date().getUTCDate()
        ).jy
      : new Date().getUTCFullYear();

  const minYear =
    currentYear - 70;

  const maxYear =
    currentYear - 16;

  const years = Array.from(
    {
      length:
        maxYear - minYear + 1,
    },
    (_, index) =>
      minYear + index
  ).reverse();

  /* =======================================================
     Months
  ======================================================= */

  const months = isPersian
    ? [
        { value: 1, label: 'فروردین' },
        { value: 2, label: 'اردیبهشت' },
        { value: 3, label: 'خرداد' },
        { value: 4, label: 'تیر' },
        { value: 5, label: 'مرداد' },
        { value: 6, label: 'شهریور' },
        { value: 7, label: 'مهر' },
        { value: 8, label: 'آبان' },
        { value: 9, label: 'آذر' },
        { value: 10, label: 'دی' },
        { value: 11, label: 'بهمن' },
        { value: 12, label: 'اسفند' },
      ]
    : [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
      ];

  /* =======================================================
     Calculate Days
  ======================================================= */

  const selectedYear =
    form.watch('birthYear');

  const selectedMonth =
    form.watch('birthMonth');

  let daysInMonth = 31;

  if (isPersian) {
    daysInMonth =
      selectedMonth <= 6
        ? 31
        : selectedMonth <= 11
          ? 30
          : 30;
  } else {
    daysInMonth =
      getGregorianDaysInMonth(
        selectedYear,
        selectedMonth
      );
  }

  const days = Array.from(
    {
      length: daysInMonth,
    },
    (_, index) =>
      index + 1
  );

  /* =======================================================
     Submit
  ======================================================= */

  const onSubmit = async (
    data: ProfileSetupForm
  ) => {
    setLoading(true);

    try {
      /* -----------------------------------------------------
         Convert local calendar to Gregorian
      ----------------------------------------------------- */

      const birthDate =
        convertToGregorianDate(
          data.birthYear,
          data.birthMonth,
          data.birthDay,
          isPersian
        );

      if (!birthDate) {
        toast.error(
          t('errorTitle'),
          {
            description:
              t('invalidBirthDate'),
          }
        );

        return;
      }

      /* -----------------------------------------------------
         Backend payload
      ----------------------------------------------------- */

      const payload = {
        name: data.name,

        birthDate,

        gender: data.gender,

        interestedIn:
          data.interestedIn,

        preferredSports:
          data.preferredSports,

        preferredSessionTypes:
          data.preferredSessionTypes,

        bio: data.bio,
      };

      console.log(
        '📤 Profile setup payload:',
        payload
      );

      const res =
        await apiClient.post(
          '/profile/setup',
          payload
        );

      setAuth(
        res.user,
        res.token || ''
      );

      toast.success(
        t('success')
      );

      router.push('/explore');
    } catch (
      error: unknown
    ) {
      console.error(
        'Profile setup error:',
        error
      );

      toast.error(
        t('errorTitle'),
        {
          description:
            (
              error as {
                message?: string;
              }
            ).message ||
            t('errorFallback'),
        }
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     Error Translation
  ======================================================= */

  const translateError = (
    message?: string
  ) => {
    if (!message) {
      return undefined;
    }

    if (
      message === 'nameMin'
    ) {
      return t(
        'errors.nameMin'
      );
    }

    if (
      message ===
      'birthYearInvalid'
    ) {
      return t(
        'errors.birthYearInvalid'
      );
    }

    if (
      message ===
      'birthMonthInvalid'
    ) {
      return t(
        'errors.birthMonthInvalid'
      );
    }

    if (
      message ===
      'birthDayInvalid'
    ) {
      return t(
        'errors.birthDayInvalid'
      );
    }

    return message;
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      dir={
        isRtl
          ? 'rtl'
          : 'ltr'
      }
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {t('title')}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-6"
            >
              {/* =================================================
                  Name
              ================================================= */}

              <FormField
                control={form.control}
                name="name"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'nameLabel'
                      )}
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder={t(
                          'namePlaceholder'
                        )}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage>
                      {translateError(
                        form.formState
                          .errors
                          .name
                          ?.message
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* =================================================
                  Birth Date
              ================================================= */}

              <FormItem>
                <FormLabel>
                  {t(
                    'birthDateLabel'
                  )}
                </FormLabel>

                <div className="grid grid-cols-3 gap-3">

                  {/* Year */}

                  <FormField
                    control={form.control}
                    name="birthYear"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <Select
                          value={String(
                            field.value
                          )}
                          onValueChange={(
                            value
                          ) => {
                            field.onChange(
                              Number(value)
                            );

                            /*
                             * Fix day when changing
                             * month/year.
                             */
                            const currentDay =
                              form.getValues(
                                'birthDay'
                              );

                            const newYear =
                              Number(value);

                            let maxDays =
                              daysInMonth;

                            if (
                              isPersian
                            ) {
                              maxDays =
                                form.getValues(
                                  'birthMonth'
                                ) <= 6
                                  ? 31
                                  : form.getValues(
                                      'birthMonth'
                                    ) <= 11
                                    ? 30
                                    : 30;
                            } else {
                              maxDays =
                                getGregorianDaysInMonth(
                                  newYear,
                                  form.getValues(
                                    'birthMonth'
                                  )
                                );
                            }

                            if (
                              currentDay >
                              maxDays
                            ) {
                              form.setValue(
                                'birthDay',
                                maxDays
                              );
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'birthYearPlaceholder'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            {years.map(
                              (
                                year
                              ) => (
                                <SelectItem
                                  key={
                                    year
                                  }
                                  value={String(
                                    year
                                  )}
                                >
                                  {year}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <FormMessage>
                          {translateError(
                            form.formState
                              .errors
                              .birthYear
                              ?.message
                          )}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* Month */}

                  <FormField
                    control={form.control}
                    name="birthMonth"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <Select
                          value={String(
                            field.value
                          )}
                          onValueChange={(
                            value
                          ) => {
                            const month =
                              Number(
                                value
                              );

                            field.onChange(
                              month
                            );

                            const currentDay =
                              form.getValues(
                                'birthDay'
                              );

                            let maxDays =
                              31;

                            if (
                              isPersian
                            ) {
                              maxDays =
                                month <= 6
                                  ? 31
                                  : month <=
                                      11
                                    ? 30
                                    : 30;
                            } else {
                              maxDays =
                                getGregorianDaysInMonth(
                                  form.getValues(
                                    'birthYear'
                                  ),
                                  month
                                );
                            }

                            if (
                              currentDay >
                              maxDays
                            ) {
                              form.setValue(
                                'birthDay',
                                maxDays
                              );
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'birthMonthPlaceholder'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            {months.map(
                              (
                                month
                              ) => (
                                <SelectItem
                                  key={
                                    month.value
                                  }
                                  value={String(
                                    month.value
                                  )}
                                >
                                  {
                                    month.label
                                  }
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <FormMessage>
                          {translateError(
                            form.formState
                              .errors
                              .birthMonth
                              ?.message
                          )}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* Day */}

                  <FormField
                    control={form.control}
                    name="birthDay"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <Select
                          value={String(
                            field.value
                          )}
                          onValueChange={(
                            value
                          ) =>
                            field.onChange(
                              Number(value)
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'birthDayPlaceholder'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            {days.map(
                              (
                                day
                              ) => (
                                <SelectItem
                                  key={
                                    day
                                  }
                                  value={String(
                                    day
                                  )}
                                >
                                  {day}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <FormMessage>
                          {translateError(
                            form.formState
                              .errors
                              .birthDay
                              ?.message
                          )}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                </div>
              </FormItem>

              {/* =================================================
                  Gender + Interested In
              ================================================= */}

              <div className="grid grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="gender"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'genderLabel'
                        )}
                      </FormLabel>

                      <Select
                        onValueChange={
                          field.onChange
                        }
                        value={
                          field.value
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'genderPlaceholder'
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="male">
                            {t(
                              'gender.male'
                            )}
                          </SelectItem>

                          <SelectItem value="female">
                            {t(
                              'gender.female'
                            )}
                          </SelectItem>

                          <SelectItem value="other">
                            {t(
                              'gender.other'
                            )}
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
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'interestedInLabel'
                        )}
                      </FormLabel>

                      <Select
                        onValueChange={
                          field.onChange
                        }
                        value={
                          field.value
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'interestedInPlaceholder'
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="MEN">
                            {t(
                              'interestedIn.men'
                            )}
                          </SelectItem>

                          <SelectItem value="WOMEN">
                            {t(
                              'interestedIn.women'
                            )}
                          </SelectItem>

                          <SelectItem value="EVERYONE">
                            {t(
                              'interestedIn.everyone'
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* =================================================
                  Sports
              ================================================= */}

              <FormField
                control={form.control}
                name="preferredSports"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'sportsLabel'
                      )}
                    </FormLabel>

                    <div className="flex flex-wrap gap-2">
                      {sportOptions.map(
                        (
                          sport
                        ) => {
                          const selected =
                            (
                              field.value ||
                              []
                            ).includes(
                              sport
                            );

                          return (
                            <Button
                              key={
                                sport
                              }
                              type="button"
                              variant={
                                selected
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() => {
                                const next =
                                  selected
                                    ? (
                                        field.value ||
                                        []
                                      ).filter(
                                        (
                                          item
                                        ) =>
                                          item !==
                                          sport
                                      )
                                    : [
                                        ...(field.value ||
                                          []),
                                        sport,
                                      ];

                                field.onChange(
                                  next
                                );
                              }}
                              className="rounded-full"
                            >
                              {tSports(
                                sportKeyMap[
                                  sport
                                ]
                              )}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* =================================================
                  Session Types
              ================================================= */}

              <FormField
                control={form.control}
                name="preferredSessionTypes"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'sessionTypesLabel'
                      )}
                    </FormLabel>

                    <div className="flex flex-wrap gap-2">
                      {sessionTypeOptions.map(
                        (
                          option
                        ) => {
                          const selected =
                            (
                              field.value ||
                              []
                            ).includes(
                              option.value
                            );

                          return (
                            <Button
                              key={
                                option.value
                              }
                              type="button"
                              variant={
                                selected
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() => {
                                const next =
                                  selected
                                    ? (
                                        field.value ||
                                        []
                                      ).filter(
                                        (
                                          item
                                        ) =>
                                          item !==
                                          option.value
                                      )
                                    : [
                                        ...(field.value ||
                                          []),
                                        option.value,
                                      ];

                                field.onChange(
                                  next
                                );
                              }}
                              className="rounded-full"
                            >
                              {t(
                                `sessionTypes.${option.key}`
                              )}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* =================================================
                  Bio
              ================================================= */}

              <FormField
                control={form.control}
                name="bio"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'bioLabel'
                      )}
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        placeholder={t(
                          'bioPlaceholder'
                        )}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* =================================================
                  Submit
              ================================================= */}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? t('saving')
                  : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}