import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { Cairo, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
// import '@/../public/fonts/fonts.css';
import React from 'react';
import Layout from '../../components/molecules/Layout';
export const dynamic = "force-dynamic";

const englishSans = IBM_Plex_Sans({
  variable: '--font-english',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const arabicSans = Cairo({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

const metadata = {
  title: 'Helhal',
  description: 'Helhal connects businesses with independent professionals and agencies around the globe. Where companies and freelancers work together in new ways that unlock their potential.',

  openGraph: {
    title: 'Helhal',
    description: 'Helhal connects businesses with independent professionals and agencies around the globe. Where companies and freelancers work together in new ways that unlock their potential.',
    url: 'https://yourdomain.com',
    siteName: 'Helhal',
    images: [
      {
        url: 'https://yourdomain.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Helhal Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Helhal connects businesses with independent professionals and agencies around the globe.',
    images: ['https://yourdomain.com/images/twitter-card.jpg'],
    creator: '@formflow',
  },

  icons: {
    icon: '/main-favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

// Dynamically generate metadata using settings from backend (siteName & siteLogo)
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  let settings = {};

  try {
    const res = await fetch(`${backend}/api/v1/settings/public`, { cache: 'no-store' });
    if (res.ok) settings = await res.json();
  } catch (e) {
    // fail silently — fallback to static metadata
    console.log(e)
    settings = {};
  }

  const siteName = settings.siteName || 'Helhal';
  const rawLogo = settings.siteLogo || '';
  // resolve to absolute URL if logo is relative
  const siteLogo = rawLogo.startsWith('http') ? rawLogo : (rawLogo ? `${backend.replace(/\/$/, '')}${rawLogo}` : null);
  console.log(siteName, siteLogo)
  return {
    title: siteName,
    description: metadata.description,
    openGraph: {
      ...metadata.openGraph,
      title: siteName,
      siteName: siteName,
      images: siteLogo ? [{ url: siteLogo, width: 1200, height: 630, alt: siteName }] : metadata.openGraph.images,
    },
    twitter: {
      ...metadata.twitter,
      title: siteName,
      images: siteLogo ? [siteLogo] : metadata.twitter.images,
    },
    icons: {
      icon: siteLogo || metadata.icons.icon,
      shortcut: siteLogo || metadata.icons.shortcut,
      apple: siteLogo || metadata.icons.apple,
    },
  };
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();


  return (
    <html lang={locale} dir={locale == 'en' ? 'ltr' : 'rtl'} suppressHydrationWarning>
      <body className={`bg-[#fff] scroll ${arabicSans.variable} ${englishSans.variable}`}>
        <NextIntlClientProvider locale={locale}>
          <Layout>
            {children}
          </Layout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
