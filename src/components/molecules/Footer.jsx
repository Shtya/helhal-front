import Image from 'next/image';
import { Link } from '../../i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

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

export function LinksSection({ titleKey, links }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const visibleLinks = showMore ? links : links.slice(0, 4);

  return (
    <div className='w-full md:w-auto flex-1 sm:flex-initial'>
      <button type='button' onClick={() => setExpanded(prev => !prev)} className='w-full py-4 md:py-2 flex items-center justify-between text-start md:cursor-default'>
        <h3 className='font-semibold text-xl text-gray-900'>{t(titleKey)}</h3>
        <span className='md:hidden text-gray-500'>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul key='mobile-list' initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className='space-y-1 overflow-hidden md:hidden'>
            {visibleLinks.map(item => (
              <li key={item.key}>
                <Link href={item.href} className='text-base py-1 text-gray-600 hover:text-accent transition block'>
                  {t(item.key)}
                </Link>
              </li>
            ))}
            {links.length > 4 && (
              <button onClick={() => setShowMore(!showMore)} className='text-sm text-blue-600 hover:text-blue-800 mt-2 w-full text-left'>
                {showMore ? 'Show Less' : 'Show More'}
              </button>
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      <ul className='hidden md:block'>
        {visibleLinks.map(item => (
          <li key={item.key}>
            <Link href={item.href} className='text-base py-1 text-gray-600 hover:text-accent transition block'>
              {t(item.key)}
            </Link>
          </li>
        ))}
        {links.length > 4 && (
          <button onClick={() => setShowMore(!showMore)} className='text-sm text-blue-600 hover:text-blue-800 mt-2 w-full text-left'>
            {showMore ? 'Show Less' : 'Show More'}
          </button>
        )}
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useTranslations();

  return (
    <footer className='bg-gray-50 border border-gray-100/70 container !mt-12 !pt-12 rounded-2xl text-gray-900'>
      <div className='  container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col md:flex-row flex-wrap justify-between gap-10 md:gap-20 pb-10 lg:pb-0'>
          {FOOTER_NAVIGATION_STRUCTURE.map((section, index) => (
            <LinksSection key={index} titleKey={section.titleKey} links={section.links} />
          ))}
        </div>

        <div className='mt-10 '>
          <div className='lg:flex justify-between items-center'>
            <div className='flex flex-col sm:flex-row gap-6 items-center'>
              <div className='flex gap-6'>
                {/* Social Media Icons */}
                {SOCIAL_LINKS.map(item => (
                  <Link key={item.name} href={item.href} aria-label={item.name}>
                    <Image src={item.icon} alt={item.name} width={40} height={40} className='transition-opacity hover:opacity-80' />
                  </Link>
                ))}
              </div>
            </div>

            <div className=' '>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mt-4 border-t py-6 border-gray-200 text-center text-sm'>
          <p className='text-gray-500'>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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
    <div className='w-[150px]'>
      <div className='flex justify-between text-lg font-medium'>
        {languages.map(({ code, label }) => (
          <button key={code} disabled={isPending} onClick={() => handleChange(code)} className={`w-1/2 text-center pb-1 transition-colors cursor-pointer ${locale === code ? 'text-accent border-b-2 border-accent' : 'text-gray-700'}`} aria-label={`Switch to ${label}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
