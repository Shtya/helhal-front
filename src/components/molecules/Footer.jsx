'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, Globe2, BadgeCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { localImageLoader } from '@/utils/helper';

/* ===================== DATA ===================== */
export const CATEGORY_LINKS = [
  { key: 'becomeSeller', href: '/become-seller' },
  { key: 'shareJobDescription', href: '/share-job-description' },
  { key: 'uiDesign', href: '/' },
  { key: 'videoAnimation', href: '/' },
  { key: 'writingTranslation', href: '/' },
  { key: 'musicAudio', href: '/' },
  { key: 'digitalMarketing', href: '/' },
  { key: 'aiServices', href: '/' },
  { key: 'consulting', href: '/' },
  { key: 'bikeRepairMaintenance', href: '/' },
  { key: 'automation', href: '/' },
  { key: 'mechanic', href: '/' },
  { key: 'photography', href: '/' },
];

export const SOCIAL_LINKS = [
  { name: 'LinkedIn', href: '/', icon: '/images/linkedin.png' },
  { name: 'Google', href: '/', icon: '/images/google.png' },
  { name: 'TikTok', href: '/', icon: '/images/tiktok.png' },
  { name: 'Pinterest', href: '/', icon: '/images/pinterest.png' },
  { name: 'Facebook', href: '/', icon: '/images/facebook.png' },
];

const FOOTER_NAVIGATION_STRUCTURE = [
  {
    titleKey: 'categories.importantLinks',
    links: CATEGORY_LINKS.map(category => ({
      key: `categories.${category.key}`,
      href: category.href,
    })),
  },
  {
    titleKey: 'navigation_sections.forClients.title',
    links: [
      { key: 'navigation_sections.forClients.yourAccount', href: '/' },
      { key: 'navigation_sections.forClients.careers', href: '/' },
      { key: 'navigation_sections.forClients.pressNews', href: '/' },
      { key: 'navigation_sections.forClients.partnerships', href: '/' },
      { key: 'navigation_sections.forClients.ipClaims', href: '/' },
    ],
  },
  {
    titleKey: 'navigation_sections.company.title',
    links: [
      { key: 'navigation_sections.company.contact', href: '/' },
      { key: 'navigation_sections.company.inviteFriend', href: '/refer-a-friend' },
      { key: 'navigation_sections.company.privacyPolicy', href: '/' },
      { key: 'navigation_sections.company.termsOfService', href: '/' },
      { key: 'navigation_sections.company.guides', href: '/' },
      { key: 'navigation_sections.company.helpSupport', href: '/' },
    ],
  },
  {
    titleKey: 'navigation_sections.forFreelancers.title',
    links: [
      { key: 'navigation_sections.forFreelancers.trustSafety', href: '/' },
      { key: 'navigation_sections.forFreelancers.buying', href: '/' },
      { key: 'navigation_sections.forFreelancers.selling', href: '/' },
    ],
  },
  {
    titleKey: 'navigation_sections.businessSolutions.title',
    links: [
      { key: 'navigation_sections.businessSolutions.events', href: '/' },
      { key: 'navigation_sections.businessSolutions.communityStandards', href: '/' },
      { key: 'navigation_sections.businessSolutions.podcast', href: '/' },
    ],
  },
];

/* ===================== SMALL UI ===================== */
function Pill({ children, className = '' }) {
  return (
    <span className={['inline-flex items-center gap-2 rounded-full', 'bg-emerald-600 text-white text-xs font-semibold', 'px-3 py-1 shadow shadow-emerald-600/20', className].join(' ')}>
      <BadgeCheck className='w-3.5 h-3.5' />
      {children}
    </span>
  );
}

/* ===================== LINKS SECTION (Accordion mobile / Columns desktop) ===================== */
function LinksSection({ titleKey, links }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const visibleLinks = showMore ? links : links.slice(0, 5);

  return (
    <div className='w-full md:w-auto flex-1 min-w-[200px]'>
      {/* Header */}
      <button type='button' onClick={() => setExpanded(p => !p)} className='w-full py-4 md:py-2 flex items-center justify-between text-start md:cursor-default group' aria-expanded={expanded}>
        <h3 className='font-extrabold text-lg md:text-xl text-gray-900 group-hover:text-emerald-700 transition'>{t(titleKey)}</h3>
        <span className='md:hidden text-gray-500'>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>

      {/* Mobile list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul key='mobile-list' initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className='space-y-1 overflow-hidden md:hidden'>
            {visibleLinks.map(item => (
              <li key={item.key}>
                <Link href={item.href} className='text-[15px] py-2 text-gray-700 hover:text-emerald-700 hover:ps-1 transition block'>
                  {t(item.key)}
                </Link>
              </li>
            ))}
            {links.length > 5 && (
              <button onClick={() => setShowMore(!showMore)} className='text-sm text-emerald-700 hover:text-emerald-800 mt-2 w-full text-left font-semibold'>
                {showMore ? t('footer.showLess') : t('footer.showMore')}
              </button>
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Desktop list */}
      <ul className='hidden md:block space-y-1'>
        {visibleLinks.map(item => (
          <li key={item.key}>
            <Link href={item.href} className='text-[15px] py-1.5 text-gray-700 hover:text-emerald-700 hover:ps-1 transition block'>
              {t(item.key)}
            </Link>
          </li>
        ))}
        {links.length > 5 && (
          <button onClick={() => setShowMore(!showMore)} className='text-sm text-emerald-700 hover:text-emerald-800 mt-2 w-full text-left font-semibold'>
            {showMore ? t('footer.showLess') : t('footer.showMore')}
          </button>
        )}
      </ul>
    </div>
  );
}

/* ===================== LANGUAGE SWITCHER ===================== */
function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const isRTL = locale === 'ar';

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ];

  const handleChange = nextLocale => {
    if (nextLocale !== locale) {
      startTransition(() => {
        router.push(pathname, { locale: nextLocale });
      });
    }
  };

  return (
    <div className='w-[180px]'>
      <div className='flex justify-between text-sm font-bold rounded-xl border border-emerald-200 overflow-hidden'>
        {languages.map(({ code, label }) => (
          <button key={code} disabled={isPending} onClick={() => handleChange(code)} className={['w-1/2 text-center py-2 transition-colors cursor-pointer', locale === code ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'].join(' ')} aria-label={`Switch to ${label}`}>
            {label}
          </button>
        ))}
      </div>
      {/* <div className={`mt-2 flex items-center gap-2 text-xs ${isRTL ? 'justify-end' : ''}`}>
        <Globe2 className='w-3.5 h-3.5 text-emerald-700' />
        <span className='text-gray-600'>
          {locale === 'ar' ? 'اللغة' : 'Language'}
        </span>
      </div> */}
    </div>
  );
}

/* ===================== TRUST ROW ===================== */
function TrustRow() {
  const t = useTranslations('home');
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Pill>{t('trust.safepay', { default: 'Secure Escrow' })}</Pill>
      <Pill>{t('trust.rated', { default: '4.9★ average' })}</Pill>
      <Pill>{t('trust.talent', { default: 'Curated talent' })}</Pill>
    </div>
  );
}

/* ===================== FOOTER ===================== */
export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className='relative mt-22'>
      {/* Top gradient band */}
      <div className='absolute inset-x-0 -top-8 h-24 pointer-events-none'>
        <div className='mx-auto max-w-6xl h-full blur-2xl opacity-10 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 rounded-full' />
      </div>

      {/* Main card */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className={['rounded-3xl border border-emerald-100/70 bg-white', 'shadow-[0_20px_60px_rgba(16,185,129,0.10)]'].join(' ')}>
          {/* Brand + Social + Language */}
          <div className='px-6 md:px-10 pt-8 pb-6 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start lg:items-center justify-between'>
            <div className='flex items-center gap-4'>
              <img src='/logo.png' alt='Helhal' width={50} height={50} className='rounded-xl' />
              <div>
                <h2 className='text-2xl font-extrabold text-gray-900'>Helhal</h2>
                <p className='text-sm text-gray-600'>{locale === 'ar' ? 'سوق خدمات موثوق بتسعير واضح ودفع آمن.' : 'A trusted services marketplace with clear pricing & secure escrow.'}</p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-6 sm:items-center'>
              {/* Social icons */}
              <div className='flex gap-4'>
                {SOCIAL_LINKS.map(item => (
                  <Link key={item.name} href={item.href} aria-label={item.name}>
                    <Image src={item.icon} loader={localImageLoader} alt={item.name} width={36} height={36} className='transition-transform hover:-translate-y-0.5 hover:opacity-90' />
                  </Link>
                ))}
              </div>

              <LanguageSwitcher />
            </div>
          </div>

          {/* Divider */}
          <div className='px-6 md:px-10'>
            <div className='h-px w-full bg-gradient-to-r from-transparent via-emerald-100 to-transparent' />
          </div>

          {/* Links grid */}
          <div className='px-6 md:px-10 py-8'>
            <div className='flex flex-col md:flex-row flex-wrap justify-between gap-6 md:gap-12'>
              {FOOTER_NAVIGATION_STRUCTURE.map((section, idx) => (
                <LinksSection key={idx} titleKey={section.titleKey} links={section.links} />
              ))}
            </div>
          </div>

          {/* Trust row */}
          <div className='px-6 md:px-10 pb-8'>
            <TrustRow />
          </div>

          {/* Bottom bar */}
          <div className='px-6 md:px-10'>
            <div className='h-px w-full bg-gradient-to-r from-transparent via-emerald-100 to-transparent' />
          </div>
        </div>
      </div>
    </footer>
  );
}
