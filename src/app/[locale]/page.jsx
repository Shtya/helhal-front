'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { Link } from '@/i18n/navigation';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Search, ShieldCheck, Zap, Stars, Users, CheckCircle, ArrowLeft, TrendingUp, MessageSquare, Mail, Send } from 'lucide-react';
import ReactPlayer from 'react-player';
import { localImageLoader, resolveUrl } from '@/utils/helper';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useValues } from '@/context/GlobalContext';
import Button from '@/components/atoms/Button';
import toast from 'react-hot-toast';



// ========================= PAGE =========================
export default function ExplorePage() {

  return (
    <main className='relative dark:bg-dark-bg-base'>
      <Hero />
      {/* <CategorySwiper /> */}
      <PopularServicesSwiper />
      <WhyChoose />
      <ClientsExperiences />
      <VideoAndContactSection />
      <CTAStrip />
    </main>
  );
}

// ========================= DATA =========================

export const POPULAR_SERVICES = [
  {
    id: '23654d6f54d545df45d',
    slug: 'ios-app-development',
    categorySlug: 'mobile-development',
    categoryIconUrl: '/icons/services/ios-app-development.svg',
    title: 'iOS App Development',
    startingPrice: 50,
  },
  {
    id: '156123dsfsdfsdf',
    slug: 'wordpress-developers',
    categorySlug: 'web-development',
    categoryIconUrl: '/icons/services/wordpress-developers.svg',
    title: 'WordPress Developers',
    startingPrice: 30,
  },
  {
    id: '1564dsfsfsf',
    slug: 'uxpin-experts',
    categorySlug: 'ux-design',
    categoryIconUrl: '/icons/services/uxpin.svg',
    title: 'UXPin',
    startingPrice: 27,
  },
  {
    id: '135d4g65df46g5df',
    slug: 'invision-studio',
    categorySlug: 'ui-design',
    categoryIconUrl: '/icons/services/invision-studio.svg',
    title: 'Invision Studio',
    startingPrice: 50,
  },
];

const WHY_CHOOSE_ITEMS = [
  { key: 'categories', icon: '/icons/why-choose/categories.svg' },
  { key: 'pricing', icon: '/icons/why-choose/pricing.svg' },
  { key: 'quality', icon: '/icons/why-choose/quality.svg' },
  { key: 'support', icon: '/icons/why-choose/support.svg' },
];


const VIDEO_SLIDER_ITEMS = [
  { id: 'video-3', url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490550/video-3.mp4' },
  { id: 'video-1', url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490553/video-1.mp4' },
  { id: 'video-2', url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490552/video-2.mp4' },
];

const CLIENT_EXPERIENCES = {
  en: [
    {
      id: '1',
      image: '/images/clients/client1.jpg',
      quote: 'Finding the perfect photographer used to be a struggle—until we found Helhal. The results exceeded our expectations.  The results exceeded our expectations.',
      company: 'Lumière Co.',
      clientName: 'Sarah J.',
      title: 'Marketing Director at Lumière Co.',
    },
    {
      id: '2',
      image: '/images/clients/client2.jpg',
      quote: 'Helhal connected us with a talented photographer who captured our brand perfectly. Fast, friendly, and flawless service.',
      company: 'Nova Brands',
      clientName: 'Daniel R.',
      title: 'Creative Lead at Nova Brands',
    },
    {
      id: '3',
      image: '/images/clients/client3.jpg',
      quote: 'What impressed us most was how easy and smooth the entire process was. The photos were stunning—we’ll be back.',
      company: 'Bloom Boutique',
      clientName: 'Fatima K.',
      title: 'Owner of Bloom Boutique',
    },
  ],
  ar: [
    {
      id: '1',
      image: '/images/clients/client1.jpg',
      quote: 'كنا نواجه صعوبة في إيجاد المصور المناسب، حتى اكتشفنا Helhal. كانت النتائج مذهلة وتفوقت على توقعاتنا.',
      company: 'Lumière Co.',
      clientName: 'سارة ج.',
      title: 'مديرة التسويق في Lumière Co.',
    },
    {
      id: '2',
      image: '/images/clients/client2.jpg',
      quote: 'Helhal سهّلت علينا الوصول إلى مصور محترف فهم رؤيتنا تمامًا ونفذها بدقة. الخدمة كانت سريعة وراقية.',
      company: 'Nova Brands',
      clientName: 'دانيال ر.',
      title: 'المدير الإبداعي في Nova Brands',
    },
    {
      id: '3',
      image: '/images/clients/client3.jpg',
      quote: 'ما أعجبني حقًا هو سهولة وسلاسة التجربة بالكامل. الصور كانت رائعة وسنعود بالتأكيد لاستخدام الخدمة مرة أخرى.',
      company: 'Bloom Boutique',
      clientName: 'فاطمة ك.',
      title: 'مالكة Bloom Boutique',
    },
  ],
};

function SearchBar({ className = '', large = false }) {
  const t = useTranslations('layout');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();

  const [query, setQuery] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/services/all?page=1&q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center w-full ${className}`}>
      <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} text-gray-400 dark:text-dark-text-secondary ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = query.trim();
            if (trimmed) {
              router.push(`/services/all?page=1&q=${encodeURIComponent(trimmed)}`);
            }
          }
        }}
        className={[
          'w-full bg-white/95 dark:bg-dark-bg-input border border-main-200/60 dark:border-dark-border shadow-sm',
          'focus:outline-none focus:ring-4 focus:ring-main-500/20 focus:border-main-500',
          'rounded-xl text-gray-700 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-secondary',
          large ? 'py-4 ps-12 pe-16 text-base' : 'py-2 ps-10 pe-12 text-sm',
        ].join(' ')}
      />
      <button
        type="submit"
        className={[
          'absolute top-1/2 -translate-y-1/2 rounded-lg',
          'bg-main-600 hover:bg-main-700 active:bg-main-800',
          'text-white font-medium shadow-lg shadow-main-600/20',
          large
            ? isRTL
              ? 'left-2 py-2 px-4'
              : 'right-2 py-2 px-4'
            : isRTL
              ? 'left-2 py-1.5 px-3'
              : 'right-2 py-1.5 px-3',
        ].join(' ')}
      >
        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
      </button>
    </form>
  );
}

function Hero() {
  const t = useTranslations('Home');
  const { role } = useAuth();

  const isBuyer = role === 'buyer';
  let primaryHref = isBuyer ? '/share-job-description' : '/auth?tab=login&redirect=/share-job-description';

  return (
    <section className='relative w-full overflow-hidden'>
      <div className='relative min-h-[85svh] md:min-h-[76vh] flex flex-col justify-center py-20 md:py-0'>

        {/* 1. Remove -z-10 and use z-0. Ensure object-cover is still there */}
        <Image
          priority
          loading='eager'
          src='/images/hero-background.jpg'
          alt={t('hero.alt')}
          fill
          className='hero-image object-cover object-center z-0'
        />

        {/* 2. The Overlay - Set to z-10 so it sits on the image but under the text */}
        <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-main-900/35 to-black/60 dark:from-black/70 dark:via-main-900/40 dark:to-black/80 z-10' />

        {/* 3. The Content - Wrap in a relative container with a higher z-index (z-20) */}
        <div className='container relative z-20 !px-4 sm:!px-6 lg:!px-8'>
          <div className='max-w-3xl mx-auto md:mx-0 text-white text-center md:text-start space-y-5 md:space-y-6'>

            {/* Badge */}
            <div className='flex justify-center md:justify-start'>
              <span className='inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase bg-white/10 border border-white/20 rounded-full px-3 py-1 backdrop-blur'>
                <Zap className='w-3.5 h-3.5' /> {t('hero.badge')}
              </span>
            </div>

            {/* Title + Subtitle */}
            <div className='space-y-3'>
              <h1 className='text-3xl sm:text-4xl md:text-6xl font-extrabold leading-[1.2] md:leading-[1.1] drop-shadow-lg'>
                {t('hero.title')}
              </h1>
              <p className='text-main-50/95 text-sm sm:text-lg md:text-xl max-w-xl mx-auto md:mx-0 leading-relaxed'>
                {t('hero.subtitle')}
              </p>
            </div>

            {/* Search */}
            <div className='w-full max-w-xl mx-auto md:mx-0'>
              <SearchBar large />
            </div>

            {/* CTAs */}
            <div className='flex flex-col xs:flex-row justify-center md:justify-start items-stretch xs:items-center gap-3 w-full max-w-sm mx-auto md:mx-0 md:max-w-none'>
              <Link
                href={primaryHref}
                className='inline-flex items-center justify-center h-12 px-6 rounded-xl bg-main-600 text-white text-sm md:text-base font-bold hover:shadow-lg hover:bg-main-700 transition-all'
              >
                {t('hero.postOrder')}
              </Link>
              <Link
                href='/freelance'
                className='inline-flex items-center justify-center h-12 px-6 rounded-xl border border-white/30 text-white text-sm md:text-base font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all'
              >
                {t('hero.search')}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className='flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-4 pt-1 text-main-50/90'>
              <Badge icon={<CheckCircle className='w-4 h-4' />} label={t('hero.trust.offers')} />
              <Badge icon={<Stars className='w-4 h-4' />} label={t('hero.trust.pricing')} />
              <Badge icon={<ShieldCheck className='w-4 h-4' />} label={t('hero.trust.safepay')} />
            </div>

          </div>
        </div>

        {/* Bottom curve - Keep z-30 to ensure it cuts the image */}
        <div className='absolute -bottom-8 left-0 right-0 h-16 bg-white dark:bg-dark-bg-base rounded-t-[32px] z-30' />
      </div>
    </section>
  );
}

function Badge({ icon, label }) {
  return (
    <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur text-xs'>
      {icon} {label}
    </span>
  );
}

export function CategorySwiper() {
  const t = useTranslations('Home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const locale = useLocale()
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/categories/top/list`);
        const data = res?.data || [];
        setItems(data);
      } catch (err) {

        setError(t('categories.error.loadFailed'));

      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);


  if (error) {
    return (
      <section className="relative -mt-6 pb-4">
        <div className="container !px-4 sm:!px-6 lg:!px-8">
          <div className="mt-8">
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
              {t('categories.error.loadFailedMessage')}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative -mt-6 pb-4">
      <div className="container !px-4 sm:!px-6 lg:!px-8">
        <div className="mt-8">
          <Swiper
            breakpoints={{
              1199: { slidesPerView: 6, spaceBetween: 24 },
              991: { slidesPerView: 4, spaceBetween: 20 },
              640: { slidesPerView: 3, spaceBetween: 18 },
              0: { slidesPerView: 2.1, spaceBetween: 14 },
            }}
            pagination={{ clickable: true }}
            modules={[Pagination]}
            className="category-swiper !px-4 !py-8"
          >
            {loading
              ? // render skeleton slides inside Swiper while loading
              Array.from({ length: 6 }).map((_, i) => (
                <SwiperSlide key={`skeleton-${i}`} className="py-2">
                  <div
                    className={[
                      'group relative flex flex-col items-center justify-center h-full',
                      'rounded-xl border border-main-100/70 dark:border-dark-border bg-white dark:bg-dark-bg-card',
                      'px-5 py-8 transition-all duration-200',
                    ].join(' ')}
                    aria-hidden
                  >
                    <span className="absolute inset-0 rounded-xl bg-main-50 dark:bg-dark-bg-base opacity-0 transition-opacity" />
                    <div className="relative w-12 h-12 mb-3">
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-dark-border animate-pulse" />
                    </div>
                    <div className="w-24 h-4 rounded bg-gray-100 dark:bg-dark-border animate-pulse" />
                  </div>
                </SwiperSlide>
              ))
              : items.map(category => {
                const name = locale === 'ar' ? category.name_ar : category.name_en;
                return <SwiperSlide key={category.id} className="py-2">
                  <Link
                    href={`/services/${encodeURIComponent(category.slug)}`}
                    className={[
                      'group relative flex flex-col items-center justify-center h-full',
                      'rounded-xl border border-main-100/70 dark:border-dark-border bg-white dark:bg-dark-bg-card',
                      'px-5 py-8 transition-all duration-200',
                      'shadow-sm hover:shadow-main-200/60 hover:shadow-lg',
                      'hover:-translate-y-0.5',
                    ].join(' ')}
                    aria-label={t('categories.browse', { name })}
                  >
                    <span className="absolute inset-0 rounded-xl bg-main-50 dark:bg-dark-bg-base opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-12 h-12 mb-3">
                      <Image src={category.topIconUrl ? resolveUrl(category.topIconUrl) : '/icons/service.png'} alt={name} fill sizes="48px" className="object-contain" />
                    </div>
                    <span className="text-nowrap truncate relative text-sm font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-main-700 dark:group-hover:text-main-400">
                      {name}
                    </span>
                  </Link>
                </SwiperSlide>
              }
              )}
          </Swiper>
        </div>
      </div>
    </section>
  );
}


export function PopularServicesSwiper() {
  const t = useTranslations('Home');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/services/popular/list');
        const data = res?.data || res?.data?.records || [];

        setItems(data);
      } catch (err) {
        setError(t('popularServices.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, [t]);

  if (error) {
    return (
      <section className="relative -mt-6 pb-4">
        <div className="container !px-4 sm:!px-6 lg:!px-8">
          <div className="mt-8">
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
              {t('popularServices.error.loadFailedMessage')}
            </div>
          </div>
        </div>
      </section>
    );
  }


  if (!loading && items.length === 0) return null;

  return (
    <section className="container !px-4 sm:!px-6 lg:!px-8 !py-12">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight dark:text-dark-text-primary">{t('popularServices.title')}</h2>
        <Link href="/services" className="text-main-700 dark:text-main-400 hover:text-main-800 dark:hover:text-main-300 text-sm font-semibold underline underline-offset-4">
          {t('popularServices.seeAll')}
        </Link>
      </div>

      <Swiper
        breakpoints={{
          1199: { slidesPerView: 6, spaceBetween: 24 },
          991: { slidesPerView: 4, spaceBetween: 20 },
          640: { slidesPerView: 3, spaceBetween: 18 },
          480: { slidesPerView: 2, spaceBetween: 14 },
          0: { slidesPerView: 1, spaceBetween: 10 },
        }}
        pagination={{ clickable: true }}
        modules={[Pagination]}
        className="popular-services-swiper !px-4 !py-8"

      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <SwiperSlide key={`ps-skel-${i}`}>
              <div
                className={[
                  'group relative flex flex-col items-center text-center',
                  'bg-white dark:bg-dark-bg-card rounded-2xl border border-main-100/70 dark:border-dark-border',
                  'px-6 py-10 h-full',
                  'transition-all duration-200',
                ].join(' ')}
                aria-hidden
              >
                <div className="absolute top-3 right-3 text-[10px] font-bold bg-main-600 text-white px-2 py-0.5 rounded-full opacity-0" />
                <div className="relative w-14 h-14 mb-4">
                  <div className="w-full h-full rounded-full bg-gray-100 dark:bg-dark-border animate-pulse" />
                </div>
                <div className="w-32 h-4 rounded bg-gray-100 dark:bg-dark-border animate-pulse mx-auto" />
                <div className="mt-3 w-20 h-3 rounded bg-gray-100 dark:bg-dark-border animate-pulse mx-auto" />
              </div>
            </SwiperSlide>
          ))
          : items.map(service => {
            const minPrice = Array.isArray(service?.packages) && service.packages.length ? Math.min(...service.packages.map(p => Number(p.price || 0))) : null;
            return (<SwiperSlide key={service.slug}>
              <Link
                // primary target: service detail using service.slug
                href={`/services/${encodeURIComponent(service?.category?.slug)}/${encodeURIComponent(service.slug)}`}
                className={[
                  'group relative flex flex-col items-center text-center',
                  'bg-white dark:bg-dark-bg-card rounded-2xl border border-main-100/70 dark:border-dark-border',
                  'px-6 py-10 h-full',
                  'shadow-[0_6px_24px_rgba(16,185,129,0.06)] dark:shadow-none hover:shadow-[0_16px_40px_rgba(16,185,129,0.15)] dark:hover:shadow-none',
                  'transition-all duration-200 hover:-translate-y-0.5',
                ].join(' ')}
                aria-label={service.title}
              >
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-main-600 text-white px-2 py-0.5 rounded-full">{t('popularServices.from', { price: minPrice })}</span>
                <div className="relative w-14 h-14 mb-4">
                  <Image
                    src={service.iconUrl ? resolveUrl(service.iconUrl) : '/icons/service.png'}
                    loader={localImageLoader}
                    alt={service.title}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-main-700 dark:group-hover:text-main-400 line-clamp-2 text-ellipsis overflow-hidden">
                  {service.title}
                </span>
                <span className="mt-2 text-xs text-main-700/80 dark:text-main-400/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t('popularServices.bookNow')}</span>
              </Link>
            </SwiperSlide>)
          })}
      </Swiper>
    </section>
  );
}

export function WhyChoose() {
  const t = useTranslations('Home');


  return (
    <section className='container !px-4 sm:!px-6 lg:!px-8 !py-12'>
      <div className='rounded-3xl bg-gradient-to-r from-main-50 to-white dark:from-dark-bg-base dark:to-dark-bg-card border border-main-100/70 dark:border-dark-border p-4 md:p-6 lg:p-10'>
        <h2 className='text-2xl md:text-3xl font-extrabold mb-4 md-:mb-6 lg:mb-8 dark:text-dark-text-primary'>{t('whyChoose.title')}</h2>
        {/* Subtitle */}
        <p className="text-base md:text-lg text-slate-700 dark:text-dark-text-secondary mb-4 md-:mb-6 lg:mb-8">
          {t('whyChoose.subtitle')}
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {WHY_CHOOSE_ITEMS.map(item => (
            <div key={item.key} className={['flex flex-col rounded-2xl bg-white dark:bg-dark-bg-card border border-main-100/70 dark:border-dark-border', 'px-6 py-8 shadow-sm hover:shadow-main-200/50 dark:hover:shadow-none hover:shadow-lg', 'transition-all duration-200 hover:-translate-y-0.5'].join(' ')}>
              <div className='w-12 h-12 mb-4 relative'>
                <Image src={item.icon} loader={localImageLoader} alt={t(`whyChoose.items.${item.key}.title`)} fill sizes='48px' className='object-contain' />
              </div>
              <h3 className='text-lg font-semibold mb-1 dark:text-dark-text-primary'>{t(`whyChoose.items.${item.key}.title`)}</h3>
              <p className='text-sm text-gray-700 dark:text-dark-text-secondary'>{t(`whyChoose.items.${item.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClientsExperiences() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const experiences = CLIENT_EXPERIENCES[locale === 'ar' ? 'ar' : 'en'];

  return (
    <section className='container !px-4 sm:!px-6 lg:!px-8 !pt-12 !pb-8'>
      <h2 className='text-2xl md:text-3xl font-extrabold mb-6 dark:text-dark-text-primary'>{t('clientsExperiences.title')}</h2>

      <Swiper
        modules={[Navigation]}
        navigation
        className='clients-experiences-swiper'
        breakpoints={{
          1024: { slidesPerView: 3, spaceBetween: 24 },
          768: { slidesPerView: 2.15, spaceBetween: 20 },
          0: { slidesPerView: 1, spaceBetween: 16 },
        }}
        wrapperClass='items-stretch'>
        {experiences.map(item => (
          <SwiperSlide key={item.id} className='!min-h-[444px]'>
            <article className={['bg-white dark:bg-dark-bg-card rounded-2xl border border-main-100/70 dark:border-dark-border', 'p-4 h-full flex flex-col gap-5', 'shadow-[0_6px_24px_rgba(16,185,129,0.06)] dark:shadow-none'].join(' ')}>
              <div className='relative  w-full rounded-xl overflow-hidden aspect-[16/10]'>
                <Image src={item.image} loader={localImageLoader} alt={item.clientName} fill sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw' className='object-cover  h-full max-h-[300px]' />
              </div>

              <blockquote className='text-gray-900 dark:text-dark-text-primary text-base leading-7'>
                “{item.quote}”<span className='text-xs ms-2 inline-block text-gray-600 dark:text-dark-text-secondary italic'> — {item.company}</span>
              </blockquote>

              <footer className='pt-4 border-t border-main-100/70 dark:border-dark-border'>
                <p className='text-base font-semibold dark:text-dark-text-primary'>{item.clientName}</p>
                <p className='text-sm text-gray-500 dark:text-dark-text-secondary'>{item.title}</p>
              </footer>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}


export function VideoAndContactSection() {
  const t = useTranslations('Home.contact');
  const { user } = useAuth();
  const { settings, loadingSettings } = useValues();
  const contactEmail = settings?.contactEmail;

  // Video slider state
  const swiperRef = React.useRef(null);
  const sectionRef = React.useRef(null);
  const [isSectionInView, setIsSectionInView] = React.useState(false);
  const userExplicitlyPaused = React.useRef(new Set());
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const playerRefs = React.useRef(new Map());

  // Contact form state
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSlideChange = React.useCallback(swiperInstance => {
    setActiveVideoIndex(swiperInstance.activeIndex);
  }, []);

  React.useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isSectionInView) {
            setIsSectionInView(true);
            setActiveVideoIndex(0);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(currentSectionRef);

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [isSectionInView]);

  const handleSendMessage = async () => {
    // Validation
    if (!user && !email.trim()) {
      toast.error(t('errors.emailRequired'));
      return;
    }

    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('errors.invalidEmail'));
      return;
    }

    if (message.trim().length < 10) {
      toast.error(t('errors.messageTooShort'));
      return;
    }

    setSending(true);

    try {
      await api.post('/invite/contact', {
        email: user ? user.email : email.trim(),
        message: message.trim(),
        senderName: user ? user.username : null,
      });

      toast.success(t('successfullySent'));
      setMessage('');
      if (!user) setEmail('');
    } catch (e) {
      toast.error(t('errors.failedToSend'));
    } finally {
      setSending(false);
    }
  };

  const canSend = user ? message.trim().length >= 10 : email.trim() && message.trim().length >= 10;

  return (
    <section ref={sectionRef} className='container !px-4 sm:!px-6 lg:!px-8 !pt-12 !pb-8'>
      <div className='bg-white dark:bg-dark-bg-card rounded-2xl border border-slate-200 dark:border-dark-border mx-auto px-6 py-8 shadow-xs hover:shadow-main-100/80 dark:hover:shadow-none hover:shadow-sm'>
        <div className='container !px-4 sm:!px-6 lg:!px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>

            {/* Left: Video Slider */}
            <div className='order-2 lg:order-1'>
              <div className='mb-6'>
                <h2 className='text-3xl md:text-4xl font-bold text-slate-900 dark:text-dark-text-primary mb-3'>
                  {t('videoTitle')}
                </h2>
                <p className='text-slate-600 dark:text-dark-text-secondary text-lg'>
                  {t('videoSubtitle')}
                </p>
              </div>

              <Swiper
                ref={swiperRef}
                slidesPerView={1}
                spaceBetween={24}
                navigation
                modules={[Navigation]}
                onSlideChange={handleSlideChange}
                className='video-slider rounded-2xl overflow-hidden shadow-xl dark:shadow-none border border-slate-200 dark:border-dark-border'
              >
                {VIDEO_SLIDER_ITEMS.map((video, index) => (
                  <SwiperSlide key={video.id}>
                    <div className='w-full aspect-video relative bg-slate-900'>
                      <ReactPlayer
                        ref={player => {
                          playerRefs.current.set(index, player);
                        }}
                        src={video.url}
                        controls={true}
                        playing={isSectionInView && index === activeVideoIndex && !userExplicitlyPaused.current.has(index)}
                        muted={true}
                        loop={true}
                        width='100%'
                        height='100%'
                        onPlay={() => {
                          userExplicitlyPaused.current.delete(index);
                        }}
                        onPause={() => {
                          if (index === activeVideoIndex && isSectionInView && !userExplicitlyPaused.current.has(index)) {
                            userExplicitlyPaused.current.add(index);
                          }
                        }}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Right: Contact Form */}
            <div className='order-1 lg:order-2'>
              <div className=''>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-12 h-12 rounded-full bg-main-100 dark:bg-dark-bg-base flex items-center justify-center'>
                    <MessageSquare className='w-6 h-6 text-main-600 dark:text-main-400' />
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold text-slate-900 dark:text-dark-text-primary'>{t('title')}</h3>
                    <p className='text-sm text-slate-500 dark:text-dark-text-secondary'>{t('subtitle')}</p>
                  </div>
                </div>

                <div className='space-y-4'>
                  {/* Show email input only for non-logged users */}
                  {!user && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2'>
                        {t('emailLabel')}
                      </label>
                      <div className='relative'>
                        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-dark-text-secondary' />
                        <input
                          type='email'
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder={t('emailPlaceholder')}
                          className='w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg-input text-slate-900 dark:text-dark-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent transition-all'
                        />
                      </div>
                    </div>
                  )}

                  {/* Message textarea for all users */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2'>
                      {t('messageLabel')}
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={t('messagePlaceholder')}
                      rows={5}
                      className='w-full px-4 py-3 border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg-input text-slate-900 dark:text-dark-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent transition-all resize-none'
                    />
                    <p className='text-xs text-slate-500 dark:text-dark-text-secondary mt-1'>
                      {message.length}/500 {t('characters')}
                    </p>
                  </div>

                  {/* Send button */}
                  <Button
                    name={sending ? t('sending') : t('sendMessage')}
                    onClick={handleSendMessage}
                    disabled={!canSend || sending}
                    loading={sending}
                    color='green'
                    className='w-full h-12 rounded-xl text-base font-semibold'
                  >
                    <Send className='w-4 h-4 mr-2' />
                  </Button>

                  {/* Contact email display */}
                  {contactEmail && (
                    <div className='pt-4 border-t border-slate-200 dark:border-dark-border'>
                      <p className='text-sm text-slate-600 dark:text-dark-text-secondary text-center'>
                        {t('orEmailUs')}{' '}
                        <a href={`mailto:${contactEmail}`} className='text-main-600 dark:text-main-400 font-medium hover:underline'>
                          {contactEmail}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust indicators below form */}
              <div className='mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-dark-text-secondary'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-green-500' />
                  <span>{t('responseTime')}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-blue-500' />
                  <span>{t('secureConnection')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export function CTAStrip() {
  const t = useTranslations('Home');
  const { role } = useAuth();

  const isBuyer = role === 'buyer';

  // Optional: hide CTA for admin
  if (role === 'admin' || role === 'seller') return null;

  const primaryHref = isBuyer ? '/share-job-description' : '/auth?tab=login&redirect=/share-job-description';
  let primaryLabel = t('cta.postOrder');

  return (
    // Mobile: Reduced bottom margin (!pb-8)
    <section className="container !px-4 sm:!px-6 lg:!px-8 !pb-8 sm:!pb-16">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-main-100/70 dark:border-dark-border bg-gradient-to-r from-main-600 via-main-500 to-main-600">
        <div className="absolute -inset-1 opacity-20 [mask-image:radial-gradient(closest-side,white,transparent)] bg-[conic-gradient(at_top_left,white,transparent_30%)]" />

        {/* Mobile: Reduced padding (p-5), reduced gap (gap-4) */}
        <div className="relative p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-white">

          {/* Mobile: Center text alignment for better balance */}
          <div className="text-center md:text-start">
            {/* Mobile: Smaller font (text-xl) */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold">
              {t('cta.title')}
            </h3>
            {/* Mobile: Smaller font (text-sm) and tighter margin */}
            <p className="text-main-50/90 mt-1.5 text-sm sm:text-base">
              {t('cta.subtitle')}
            </p>
          </div>

          <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-3">
            <Link
              href={primaryHref}
              // Mobile: Smaller text (text-sm), tighter padding (py-2.5)
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white text-main-700 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
            </Link>

            <Link
              href="/services"
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border-2 border-white/80 text-white text-sm sm:text-base font-semibold hover:bg-white/10 transition"
            >
              {t('cta.browse')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}