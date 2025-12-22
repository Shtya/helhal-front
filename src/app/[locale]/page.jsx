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
import { ArrowRight, Search, ShieldCheck, Zap, Stars, Users } from 'lucide-react';
import ReactPlayer from 'react-player';
import { localImageLoader, resolveUrl } from '@/utils/helper';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


// ========================= PAGE =========================
export default function ExplorePage() {

  return (
    <main className='relative'>
      <Hero />
      <CategorySwiper />
      <PopularServicesSwiper />
      <WhyChoose />
      <ClientsExperiences />
      <VideoSlider />
      <CTAStrip />
    </main>
  );
}

// ========================= DATA =========================

const CATEGORIES_FALLBACK = [
  { id: 'dev-1', slug: 'app-development', name: 'App Development', iconUrl: '/icons/categories/app-development.svg' },
  { id: 'dev-2', slug: 'programming-tech', name: 'Programming & Tech', iconUrl: '/icons/categories/programming-tech.svg' },
  { id: 'dev-3', slug: 'ui-design', name: 'UI Design', iconUrl: '/icons/categories/ui-design.svg' },
  { id: 'dev-4', slug: 'video-animation', name: 'Video & Animation', iconUrl: '/icons/categories/video-animation.svg' },
  { id: 'dev-5', slug: 'writing-translation', name: 'Writing & Translation', iconUrl: '/icons/categories/writing-translation.svg' },
  { id: 'dev-6', slug: 'music-audio', name: 'Music & Audio', iconUrl: '/icons/categories/music-audio.svg' },
];

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
      <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
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
          'w-full bg-white/95 border border-emerald-200/60 shadow-sm',
          'focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500',
          'rounded-xl text-gray-700 placeholder-gray-400',
          large ? 'py-4 ps-12 pe-16 text-base' : 'py-2 ps-10 pe-12 text-sm',
        ].join(' ')}
      />
      <button
        type="submit"
        className={[
          'absolute top-1/2 -translate-y-1/2 rounded-lg',
          'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
          'text-white font-medium shadow-lg shadow-emerald-600/20',
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
  const locale = useLocale();

  return (
    <section className='relative h-[68vh] md:h-[76vh] w-full overflow-hidden'>
      <Image src='/images/hero-background.jpg' alt={t('hero.alt')} fill priority className='object-cover object-center' />

      {/* Green gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-emerald-900/35 to-black/60' />

      <div className='relative z-10 h-full flex items-center'>
        <div className='container !px-4 sm:!px-6 lg:!px-8'>
          <div className='max-w-3xl text-white space-y-6'>
            <span className='inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase bg-white/10 border border-white/20 rounded-full px-3 py-1 backdrop-blur'>
              <Zap className='w-4 h-4' /> {t('hero.badge')}
            </span>

            <h1 className='text-4xl md:text-6xl font-extrabold leading-[1.1] drop-shadow'>{t('hero.title')}</h1>

            <p className='text-emerald-50/95 text-lg md:text-xl'>{t('hero.subtitle')}</p>

            <SearchBar large className='mt-2' />

            <div className='flex flex-wrap items-center gap-4 pt-4 text-emerald-50/90'>
              <Badge icon={<ShieldCheck className='w-4 h-4' />} label={t('hero.trust.safepay')} />
              <Badge icon={<Stars className='w-4 h-4' />} label={t('hero.trust.rated')} />
              <Badge icon={<Users className='w-4 h-4' />} label={t('hero.trust.talent')} />
            </div>

            <p className='text-sm md:text-base text-emerald-50/80'>{t('hero.tagline')}</p>
          </div>
        </div>
      </div>

      {/* subtle bottom curve */}
      <div className='absolute -bottom-8 left-0 right-0 h-16 bg-white rounded-t-[32px]' />
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
              991: { slidesPerView: 4, spaceBetween: 16 },
              640: { slidesPerView: 3, spaceBetween: 16 },
              0: { slidesPerView: 2.1, spaceBetween: 8 },
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
                      'rounded-xl border border-emerald-100/70 bg-white',
                      'px-5 py-8 transition-all duration-200',
                    ].join(' ')}
                    aria-hidden
                  >
                    <span className="absolute inset-0 rounded-xl bg-emerald-50 opacity-0 transition-opacity" />
                    <div className="relative w-12 h-12 mb-3">
                      <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />
                    </div>
                    <div className="w-24 h-4 rounded bg-gray-100 animate-pulse" />
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
                      'rounded-xl border border-emerald-100/70 bg-white',
                      'px-5 py-8 transition-all duration-200',
                      'shadow-sm hover:shadow-emerald-200/60 hover:shadow-lg',
                      'hover:-translate-y-0.5',
                    ].join(' ')}
                    aria-label={t('categories.browse', { name })}
                  >
                    <span className="absolute inset-0 rounded-xl bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-12 h-12 mb-3">
                      <Image src={category.topIconUrl ? resolveUrl(category.topIconUrl) : '/icons/service.png'} alt={name} fill sizes="48px" className="object-contain" />
                    </div>
                    <span className="text-nowrap truncate relative text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('popularServices.title')}</h2>
        <Link href="/services" className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold underline underline-offset-4">
          {t('popularServices.seeAll')}
        </Link>
      </div>

      <Swiper
        breakpoints={{
          1024: { slidesPerView: 4, spaceBetween: 24 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          557: { slidesPerView: 2, spaceBetween: 12 },
          0: { slidesPerView: 1.15, spaceBetween: 10 },
        }}
        pagination={{ clickable: true }}
        modules={[Pagination]}
        className="popular-services-swiper"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <SwiperSlide key={`ps-skel-${i}`}>
              <div
                className={[
                  'group relative flex flex-col items-center text-center',
                  'bg-white rounded-2xl border border-emerald-100/70',
                  'px-6 py-10 h-full',
                  'transition-all duration-200',
                ].join(' ')}
                aria-hidden
              >
                <div className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full opacity-0" />
                <div className="relative w-14 h-14 mb-4">
                  <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />
                </div>
                <div className="w-32 h-4 rounded bg-gray-100 animate-pulse mx-auto" />
                <div className="mt-3 w-20 h-3 rounded bg-gray-100 animate-pulse mx-auto" />
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
                  'bg-white rounded-2xl border border-emerald-100/70',
                  'px-6 py-10 h-full',
                  'shadow-[0_6px_24px_rgba(16,185,129,0.06)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.15)]',
                  'transition-all duration-200 hover:-translate-y-0.5',
                ].join(' ')}
                aria-label={service.title}
              >
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{t('popularServices.from', { price: minPrice })}</span>
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
                <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">{service.title}</span>
                <span className="mt-2 text-xs text-emerald-700/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t('popularServices.bookNow')}</span>
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
      <div className='rounded-3xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100/70 p-6 md:p-10'>
        <h2 className='text-3xl md:text-4xl font-extrabold mb-8'>{t('whyChoose.title')}</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {WHY_CHOOSE_ITEMS.map(item => (
            <div key={item.key} className={['flex flex-col rounded-2xl bg-white border border-emerald-100/70', 'px-6 py-8 shadow-sm hover:shadow-emerald-200/50 hover:shadow-lg', 'transition-all duration-200 hover:-translate-y-0.5'].join(' ')}>
              <div className='w-12 h-12 mb-4 relative'>
                <Image src={item.icon} loader={localImageLoader} alt={t(`whyChoose.items.${item.key}.title`)} fill sizes='48px' className='object-contain' />
              </div>
              <h3 className='text-lg font-semibold mb-1'>{t(`whyChoose.items.${item.key}.title`)}</h3>
              <p className='text-sm text-gray-700'>{t(`whyChoose.items.${item.key}.description`)}</p>
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
      <h2 className='text-3xl md:text-4xl font-extrabold mb-6'>{t('clientsExperiences.title')}</h2>

      <Swiper
        modules={[Navigation]}
        navigation
        className='clients-experiences-swiper'
        breakpoints={{
          1024: { slidesPerView: 3, spaceBetween: 24 },
          768: { slidesPerView: 2.15, spaceBetween: 20 },
          0: { slidesPerView: 1, spaceBetween: 12 },
        }}
        wrapperClass='items-stretch'>
        {experiences.map(item => (
          <SwiperSlide key={item.id} className='!min-h-[444px]'>
            <article className={['bg-white rounded-2xl border border-emerald-100/70', 'p-4 h-full flex flex-col gap-5', 'shadow-[0_6px_24px_rgba(16,185,129,0.06)]'].join(' ')}>
              <div className='relative  w-full rounded-xl overflow-hidden aspect-[16/10]'>
                <Image src={item.image} loader={localImageLoader} alt={item.clientName} fill sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw' className='object-cover  h-full max-h-[300px]' />
              </div>

              <blockquote className='text-gray-900 text-base leading-7'>
                “{item.quote}”<span className='text-xs ms-2 inline-block text-gray-600 italic'> — {item.company}</span>
              </blockquote>

              <footer className='pt-4 border-t border-emerald-100/70'>
                <p className='text-base font-semibold'>{item.clientName}</p>
                <p className='text-sm text-gray-500'>{item.title}</p>
              </footer>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export function VideoSlider() {
  const swiperRef = React.useRef(null);
  const sectionRef = React.useRef(null);
  const [isSectionInView, setIsSectionInView] = React.useState(false);
  const userExplicitlyPaused = React.useRef(new Set());
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const playerRefs = React.useRef(new Map());

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

  return (
    <section ref={sectionRef} className='container !px-4 sm:!px-6 lg:!px-8 !pt-6 !pb-12'>
      <Swiper ref={swiperRef} slidesPerView={1} spaceBetween={24} navigation modules={[Navigation]} onSlideChange={handleSlideChange} className='video-slider'>
        {VIDEO_SLIDER_ITEMS.map((video, index) => (
          <SwiperSlide key={video.id}>
            <div className='w-full mx-auto aspect-video relative'>
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
    </section>
  );
}

export function CTAStrip() {
  const t = useTranslations('Home');
  const { role } = useAuth();


  const isBuyer = role === 'buyer';
  const isSeller = role === 'seller';

  // Optional: hide CTA for admin
  if (role === 'admin') return null;

  let primaryHref = '/auth?tab=login';
  let primaryLabel = t('cta.loginToPost');

  if (isBuyer) {
    primaryHref = '/share-job-description';
    primaryLabel = t('cta.postOrder');
  } else if (isSeller) {
    primaryHref = '/create-gig';
    primaryLabel = t('cta.createService');
  }

  return (
    <section className="container !px-4 sm:!px-6 lg:!px-8 !pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600">
        <div className="absolute -inset-1 opacity-20 [mask-image:radial-gradient(closest-side,white,transparent)] bg-[conic-gradient(at_top_left,white,transparent_30%)]" />
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold">
              {isSeller
                ? t('cta.sellerTitle')
                : t('cta.title')}
            </h3>
            <p className="text-emerald-50/90 mt-1">
              {isSeller
                ? t('cta.sellerSubtitle')
                : t('cta.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold shadow-lg hover:shadow-xl transition"
            >
              {primaryLabel} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/services/all"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-white/80 text-white font-semibold hover:bg-white/10 transition"
            >
              {t('cta.browse')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}