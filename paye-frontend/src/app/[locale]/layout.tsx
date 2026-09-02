import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Outfit, Poppins, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import LanguageDropdown from '@/components/layout/LanguageDropdown';
import { routing } from '@/i18n/routing';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Paye - Find Your Hambash',
  description: 'Workout with the right partner',
  icons: { icon: '/favicon.ico' },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'fa')) {
    notFound();
  }

  // Required for next-intl static rendering / correct request config
  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <html
      dir={direction}
      lang={locale}
      className={
      locale === "fa"
      ? "h-full antialiased"
      : `${outfit.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased`
  }
    >
      <body className="min-h-full bg-background">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageDropdown />
          <QueryProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}