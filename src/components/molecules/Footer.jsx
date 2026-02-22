'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, Globe2, BadgeCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { localImageLoader } from '@/utils/helper';
import { useValues } from '@/context/GlobalContext';
import { useSearchParams } from 'next/navigation';
import { useLangSwitcher } from '@/hooks/useLangSwitcher';
import { useAuth } from '@/context/AuthContext';

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


/* ===================== SMALL UI ===================== */
function Pill({ children, className = '' }) {
  return (
    <span className={['inline-flex items-center gap-2 rounded-full', 'bg-main-600 text-white text-xs font-semibold', 'px-3 py-1 shadow shadow-main-600/20', className].join(' ')}>
      <BadgeCheck className='w-3.5 h-3.5' />
      {children}
    </span>
  );
}

/* ===================== LINKS SECTION (Accordion mobile / Columns desktop) ===================== */
// LinksSection Component
function LinksSection({ titleKey, links, directTexts = false }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Logic preserved as requested
  const visibleLinks = showMore ? links : links?.slice(0, 4);

  return (
    <div className='w-full md:w-auto flex-1 min-w-[200px]'>
      {/* Header */}
      <button
        type='button'
        onClick={() => setExpanded(p => !p)}
        // Mobile: Reduced py-3 (was py-4)
        className='w-full py-3 md:py-2 flex items-center justify-between text-start md:cursor-default group'
        aria-expanded={expanded}
      >
        {/* Mobile: Reduced text-base (was text-lg) */}
        <h3 className='font-extrabold text-base sm:text-lg md:text-xl text-gray-900 dark:text-dark-text-primary group-hover:text-main-700 dark:group-hover:text-main-400 transition'>
          {t(titleKey)}
        </h3>
        <span className='md:hidden text-gray-500 dark:text-dark-text-secondary'>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Mobile list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            key='mobile-list'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='space-y-1 overflow-hidden md:hidden'
          >
            {visibleLinks.map(item => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  // Mobile: Reduced text-sm (was text-[15px])
                  className='text-sm py-2 text-gray-700 dark:text-dark-text-secondary hover:text-main-700 dark:hover:text-main-400 hover:ps-1 transition block'
                >
                  {directTexts ? item.key : t(item.key)}
                </Link>
              </li>
            ))}
            {links.length > 5 && (
              <button
                onClick={() => setShowMore(!showMore)}
                // Fixed typo: 'w-fullfont' -> 'w-full font'
                className='text-xs sm:text-sm text-main-700 hover:text-main-800 mt-2 w-full text-start font-semibold'
              >
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
            <Link
              href={item.href}
              className='text-[15px] py-1.5 text-gray-700 dark:text-dark-text-secondary hover:text-main-700 dark:hover:text-main-400 hover:ps-1 transition block'
            >
              {directTexts ? item.key : t(item.key)}
            </Link>
          </li>
        ))}
        {links.length > 5 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className='text-sm text-main-700 hover:text-main-800 mt-2 w-full text-start font-semibold'
          >
            {showMore ? t('footer.showLess') : t('footer.showMore')}
          </button>
        )}
      </ul>
    </div>
  );
}

/* ===================== LANGUAGE SWITCHER ===================== */
function LanguageSwitcher() {
  const { isPending, toggleLocale, languages, locale } = useLangSwitcher()

  return (
    <div className='w-[180px]'>
      <div className='flex justify-between text-sm font-bold rounded-xl border border-main-200 dark:border-dark-border overflow-hidden'>
        {languages.map(({ code, label }) => (
          <button key={code} disabled={isPending} onClick={() => toggleLocale(code)} className={['w-1/2 text-center py-2 transition-colors cursor-pointer', locale === code ? 'bg-main-600 text-white' : 'text-main-700 dark:text-dark-text-secondary hover:bg-main-50 dark:hover:bg-dark-bg-card'].join(' ')} aria-label={`Switch to ${label}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== TRUST ROW ===================== */
function TrustRow() {
  const t = useTranslations('Home');
  return (
    <div className='flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-4 pt-1'>
      <Pill>{t('hero.trust.offers')}</Pill>
      <Pill>{t('hero.trust.pricing')}</Pill>
      <Pill>{t('hero.trust.safepay')}</Pill>
    </div>
  );
}

/* ===================== FOOTER ===================== */
export function Footer() {
  const t = useTranslations();
  const locale = useLocale()
  const { role } = useAuth()
  const { categories, settings, loadingSettings } = useValues();

  const SOCIAL_LINKS = [
    { name: 'Facebook', href: settings?.facebook, icon: '/images/facebook.png' },
    { name: 'Twitter', href: settings?.twitter, icon: '/images/twitter.png' },
    { name: 'LinkedIn', href: settings?.linkedin, icon: '/images/linkedin.png' },
    { name: 'Instagram', href: settings?.instagram, icon: '/images/instagram.png' },
    { name: 'Pinterest', href: settings?.pinterest, icon: '/images/pinterest.png' },
    { name: 'TikTok', href: settings?.tiktok, icon: '/images/tiktok.png' },
    { name: 'Email', href: settings?.contactEmail ? `mailto:${settings.contactEmail}` : null, icon: '/images/google.png' },
  ];
  // Build top 10 category links

  const categoryLinks = useMemo(() => categories ? (categories)
    ?.slice(0, 10)
    .map(cat => ({
      key: locale === 'ar' ? cat.name_ar : cat.name_en, // translation key
      href: `/services/${cat.slug}`, // link path
    })) : [{ key: t('navigation_sections.categories.noCategories'), href: '#' }], [categories, locale]);

  const FOOTER_NAVIGATION_STRUCTURE = [
    {
      titleKey: 'categories.importantLinks',
      directTexts: true,
      links: categoryLinks,
    },
    ...(role === 'buyer' ? [{
      titleKey: 'navigation_sections.forClients.title',
      links: [
        { key: 'navigation_sections.forClients.yourAccount', href: '/profile' },
        { key: 'navigation_sections.forClients.shareYourJob', href: '/share-job-description' },
        { key: 'navigation_sections.forClients.becomeSeller', href: '/become-seller' },
        // { key: 'navigation_sections.forClients.topServices', href: '/services' },
        // { key: 'navigation_sections.forClients.careers', href: '/' },
        // { key: 'navigation_sections.forClients.pressNews', href: '/' },
        // { key: 'navigation_sections.forClients.partnerships', href: '/' },
        // { key: 'navigation_sections.forClients.ipClaims', href: '/' },
      ],
    }] : []),
    ...(role === 'seller' ? [{
      titleKey: 'navigation_sections.forFreelancers.title',
      links: [
        { key: 'navigation_sections.forFreelancers.createService', href: '/create-gig' },
        { key: 'navigation_sections.forFreelancers.jobs', href: '/jobs' },
        { key: 'navigation_sections.forFreelancers.yourProposals', href: '/jobs/proposals' },
        //       { key: 'navigation_sections.forFreelancers.buying', href: '/' },
        // { key: 'navigation_sections.forFreelancers.selling', href: '/' },
      ],
    }] : []),
    {
      titleKey: 'navigation_sections.company.title',
      links: [
        // { key: 'navigation_sections.company.contact', href: '/contact' },
        { key: 'navigation_sections.company.privacyPolicy', href: '/privacy-policy' },
        { key: 'navigation_sections.company.termsOfService', href: '/terms' },
        { key: 'navigation_sections.company.inviteFriend', href: '/invite' },
        // { key: 'navigation_sections.company.guides', href: '/' },
        // { key: 'navigation_sections.company.helpSupport', href: '/' },
      ],
    },
  ];

  return (
    <footer className='relative mt-5  md:mt-10 lg:mt-16 xl:mt-22'>
      {/* Top gradient band */}
      <div className='absolute inset-x-0 -top-8 h-24 pointer-events-none'>
        <div className='mx-auto max-w-6xl h-full blur-2xl opacity-10 bg-gradient-to-r from-main-300 via-main-500 to-main-300 rounded-full' />
      </div>

      {/* Main card */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className={['rounded-3xl border border-main-100/70 dark:border-dark-border bg-white dark:bg-dark-bg-card', 'shadow-[0_20px_60px_rgba(16,185,129,0.10)] dark:shadow-none'].join(' ')}>
          {/* Brand + Social + Language */}
          <div className='px-6 md:px-10 pt-8 pb-6 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start lg:items-center justify-between'>
            <div className='flex items-center gap-4'>
              <img src='/logo.png' alt='Helhal' width={50} height={50} className='rounded-xl' />
              <div>
                <h2 className='text-2xl font-extrabold text-gray-900 dark:text-dark-text-primary'>Helhal</h2>
                <p className='text-sm text-gray-600 dark:text-dark-text-secondary'>{t('footer.description')}</p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-6 sm:items-center'>
              {/* Social icons */}
              <div className='flex gap-4'>
                {loadingSettings ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 bg-slate-200 dark:bg-dark-bg-card rounded-full animate-pulse"
                    />
                  ))
                ) : SOCIAL_LINKS.map(item => {
                  // After load, only show if link exists
                  if (!item.href) return null;
                  return (
                    <Link key={item.name} href={item.href} aria-label={item.name}>
                      <Image
                        src={item.icon}
                        loader={localImageLoader}
                        alt={item.name}
                        width={36}
                        height={36}
                        className="transition-transform hover:-translate-y-0.5 hover:opacity-90"
                      />
                    </Link>
                  );
                })}
              </div>

              <LanguageSwitcher />
            </div>
          </div>

          {/* Divider */}
          <div className='px-6 md:px-10'>
            <div className='h-px w-full bg-gradient-to-r from-transparent via-main-100 dark:via-dark-border to-transparent' />
          </div>

          {/* Links grid */}
          <div className='px-4 sm:px-6 md:px-10 py-8'>
            <div className='flex flex-col md:flex-row flex-wrap justify-between gap-8 md:gap-12'>
              {FOOTER_NAVIGATION_STRUCTURE.map((section, idx) => (
                <LinksSection
                  key={idx}
                  titleKey={section.titleKey}
                  links={section.links}
                  directTexts={section?.directTexts}
                />
              ))}
            </div>
          </div>

          {/* Trust row */}
          <div className='px-6 md:px-10 pb-8'>
            <TrustRow />
          </div>

          {/* Bottom bar */}
          <div className='px-6 md:px-10'>
            <div className='h-px w-full bg-gradient-to-r from-transparent via-main-100 dark:via-dark-border to-transparent' />
          </div>
        </div>
      </div>
    </footer>
  );
}
