'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ImProfile } from "react-icons/im";
import { RiMenuSearchLine } from "react-icons/ri";
import { useLocale, useTranslations } from 'next-intl';
// ---------- ADDED IMPORTS ----------
import api from '@/lib/axios';
import { resolveUrl } from '@/utils/helper';
// ---------- /ADDED IMPORTS ----------
import { LuChartNetwork } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";
import { useValues } from '@/context/GlobalContext';
import FAQSection from '@/components/common/Faqs';

const page = () => {
  return (
    <div className='space-y-4 '>
      <Hero />
      <WhyChoose />
      <CustomFeatures />
      <HowStart />
      {/* <FreelanceTop /> */}
      <BannerCTA />
      <FAQs />
    </div>
  );
};



export function Hero() {
  const t = useTranslations('freelance');

  return (
    <section className='relative h-[calc(100vh-64px)] md:h-[calc(100vh-88px)] w-full overflow-hidden'>
      <Image loading='eager' src='/images/hero-background.jpg' alt='Helhal Hero Background' fill priority className='object-cover object-center' />

      <div className='absolute inset-0 bg-black/50 z-10' />

      <div className='relative z-20 flex items-center justify-center h-full px-4'>
        <div className='text-center max-w-2xl text-white space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold leading-tight'>{t('title')}</h1>

          <p className='text-gray-200 text-lg'>{t('subTitle')}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link
              href="/auth?tab=register&type=seller"
              className=" inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md min-w-[165px] bg-emerald-600 text-white text-sm md:text-base font-medium hover:shadow-lg hover:bg-emerald-700 transition-all
  "
            >
              {t('getStarted')}
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}


export function WhyChoose() {
  const t = useTranslations('freelance');

  const WHY_CHOOSE_ITEMS = [
    {
      key: 'wideReach',
    },
    {
      key: 'securePayments',
    },
    {
      key: 'flexibleWork',
    },
    {
      key: 'supportiveCommunity',
    },
    {
      key: 'growthOpportunities',
    },
    {
      key: 'userFriendlyPlatform',
    }
  ];


  return (
    <section className='container !px-4 sm:!px-6 lg:!px-8'>
      <div className='rounded-3xl p-6 md:p-10'>
        <h2 className='text-2xl md:text-3xl font-extrabold mb-8 text-center'>{t('whyChoose.title')}</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {WHY_CHOOSE_ITEMS.map(item => (
            <div key={item.key} className={['flex flex-col rounded-2xl bg-white border border-emerald-100/70', 'px-6 py-8 shadow-xs hover:shadow-emerald-200/30 hover:shadow-lg', 'transition-all duration-200 hover:-translate-y-0.5'].join(' ')}>
              <h3 className='text-lg font-semibold mb-1'>{t(`whyChoose.items.${item.key}.title`)}</h3>
              <p className='text-sm text-gray-700'>{t(`whyChoose.items.${item.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export function HowStart() {
  const t = useTranslations('freelance');

  const steps = [
    {
      key: 'createProfile',
      title: t('howStart.steps.createProfile.title'),
      description: t('howStart.steps.createProfile.description'),
      icon: ImProfile,
    },
    {
      key: 'browseProjects',
      title: t('howStart.steps.browseProjects.title'),
      description: t('howStart.steps.browseProjects.description'),
      icon: RiMenuSearchLine,
    },
    {
      key: 'submitProposals',
      title: t('howStart.steps.submitProposals.title'),
      description: t('howStart.steps.submitProposals.description'),
      icon: LuChartNetwork,
    },
  ];

  return (
    <section className='container !px-4 sm:!px-6 lg:!px-8'>
      <div className='rounded-3xl p-6 md:p-10'>
        <h2 className='text-2xl md:text-3xl font-extrabold mb-8 text-center'>{t('howStart.title')}</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {steps.map(step => (
            <div key={step.key} className={['flex flex-col rounded-2xl bg-white border border-emerald-100/70', 'px-6 py-8 shadow-xs hover:shadow-emerald-200/30 hover:shadow-lg', 'transition-all duration-200 hover:-translate-y-0.5'].join(' ')}>
              <div className='p-2.5 flex justify-center items-center bg-emerald-100 rounded-full  w-fit mx-auto mb-4'>
                <step.icon className='text-4xl  text-emerald-500' />
              </div>
              <h3 className='text-lg font-semibold mb-1 text-center'>{step.title}</h3>
              <p className='text-sm text-gray-700 text-center'>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export function FAQs() {
  const { settings, loadingSettings } = useValues();
  const locale = useLocale();
  const faqs = locale === 'ar' ? settings?.sellerFaqs_ar : settings?.sellerFaqs_en;

  {/* FAQ */ }
  return (<section className='container !px-4 sm:!px-6 lg:!px-8  ' >
    <div className='p-6 md:p-10'>

      <FAQSection faqs={faqs} loading={loadingSettings} />
    </div>
  </section>)
}


export function CustomFeatures() {
  const t = useTranslations('freelance.customFeatures');

  const FEATURES = [
    { key: 'qualityProjects', icon: FiCheckCircle },
    { key: 'securePayments', icon: FiCheckCircle },
    { key: 'profileShowcase', icon: FiCheckCircle },
    { key: 'support', icon: FiCheckCircle },
    { key: 'growth', icon: FiCheckCircle },
    { key: 'community', icon: FiCheckCircle },
  ];

  return (
    <section className='container !px-4 sm:!px-6 lg:!px-8'>
      <div className='rounded-3xl p-6 md:p-10'>
        <h2 className='text-2xl md:text-3xl font-extrabold mb-8 text-center'>
          {t('title')}
        </h2>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {FEATURES.map(item => (
            <div
              key={item.key}
              className='flex items-start gap-4 rounded-2xl bg-white border border-emerald-100/70 px-6 py-6 shadow-xs hover:shadow-lg transition-all'
            >
              <div className='mt-1'>
                <item.icon className='text-emerald-500 text-2xl' />
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-1'>{t(`features.${item.key}.title`)}</h3>
                <p className='text-sm text-gray-700 tracking-wide'>{t(`features.${item.key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- REPLACED COMPONENT: FreelanceTop ----------
function FreelanceTop() {
  const t = useTranslations('freelance.top');
  const locale = useLocale();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchTop = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/categories/freelance-top/list');
        const data = res?.data || res?.data?.records || [];
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('fetch freelance-top failed', e);
        if (mounted) setError(t('error.loadFailed') || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTop();
    return () => { mounted = false; };
  }, [t]);

  if (error) {
    return (
      <section className="container !px-4 sm:!px-6 lg:!px-8">
        <div className="mt-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t('error.message') || 'Unable to load top items.'}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && items.length === 0) return null;

  // Grid: 2 cols mobile, 3 cols md, 4 cols lg — large icon, centered text
  return (
    <section className="container !px-4 sm:!px-6 lg:!px-8 !py-10">
      <div className="mt-8">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-center">{t('title') || 'Top categories'}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="flex flex-col items-center text-center rounded-xl border border-emerald-100/70 bg-white px-6 py-8 shadow-xs">
                <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-32 h-4 rounded bg-gray-100 animate-pulse" />
              </div>
            ))
            : items.map(item => {
              const name = locale === 'ar' ? (item.name_ar || item.title_ar || item.name) : (item.name_en || item.title_en || item.name);
              const id = item.id || '';
              const icon = item.topIconUrl || item.icon || item.iconUrl || '/icons/service.png';
              return (
                <Link
                  key={item.id || id}
                  href={`/jobs?category=${encodeURIComponent(id)}`}
                  className="group flex flex-col items-center text-center rounded-xl border border-emerald-100/70 bg-white px-6 py-8 shadow-sm hover:shadow-emerald-200/50 transition-transform duration-200 hover:-translate-y-1" >

                  <div className="relative w-20 h-20 mb-4 rounded-full overflow-hidden">
                    <Image src={icon ? resolveUrl(icon) : '/icons/service.png'} alt={name} fill sizes="80px" className="object-contain" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">{name}</span>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
}

// ---------- NEW COMPONENT: BannerCTA ----------
function BannerCTA() {
  const t = useTranslations('freelance.banner');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <section className="w-full py-12 relative overflow-hidden bg-gradient-to-tr from-green-100 to-green-50">
      {/* Decorative Shapes */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] bg-emerald-200 rounded-full opacity-30 rotate-[30deg] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-300 rounded-full opacity-25 rotate-[-45deg] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto text-center flex flex-col items-center justify-center gap-6">
        <h3 className="text-3xl md:text-4xl font-extrabold text-emerald-900">
          {t('title')}
        </h3>
        <p className="text-lg md:text-xl text-emerald-800 max-w-xl">
          {t('subtitle')}
        </p>

        <Link
          href="/auth?tab=register&type=seller"
          className="mt-4 inline-flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-700 text-white font-semibold shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}

export default page;