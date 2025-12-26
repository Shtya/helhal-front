'use client';

import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { Link } from '@/i18n/navigation';

import 'swiper/css';
import 'swiper/css/navigation';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Search } from 'lucide-react';

import ReactPlayer from 'react-player';
import { localImageLoader } from '@/utils/helper';

const page = () => {
  return (
    <div className=''>
      <Hero />
      {/* <CategorySwiper /> */}
      {/* <PopularServicesSwiper />
      <WhyChoose /> */}
    </div>
  );
};

export default page;

const CATEGORY_SWIPER_ITEMS = [
  {
    key: 'appDevelopment',
    href: '/',
    icon: '/icons/categories/app-development.svg',
  },
  {
    key: 'programmingTech',
    href: '/',
    icon: '/icons/categories/programming-tech.svg',
  },
  {
    key: 'uiDesign',
    href: '/',
    icon: '/icons/categories/ui-design.svg',
  },
  {
    key: 'videoAnimation',
    href: '/',
    icon: '/icons/categories/video-animation.svg',
  },
  {
    key: 'writingTranslation',
    href: '/',
    icon: '/icons/categories/writing-translation.svg',
  },
  {
    key: 'musicAudio',
    href: '/',
    icon: '/icons/categories/music-audio.svg',
  },
];

export function CategorySwiper() {
  const t = useTranslations('categories');

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8  relative z-10'>
      <Swiper
        breakpoints={{
          1199: {
            slidesPerView: 6,
            spaceBetween: 24,
          },
          991: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          640: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          0: {
            slidesPerView: 2,
            spaceBetween: 4,
          },
        }}
        pagination={true}
        modules={[Pagination]}
        className='category-swiper'>
        {CATEGORY_SWIPER_ITEMS.map(category => (
          <SwiperSlide key={category.key} className=' py-[40px]'>
            <Link href={category.href} className='group flex flex-col bg-white lg:hover:bg-accent transition px-4 py-10 md:py-6 rounded-md lg:rounded-xl h-full shadow-[0_0_10px_rgba(0,0,0,0.1)] lg:hover:shadow-[0_4px_20px_rgba(14,138,0,0.3)] lg:hover:scale-[1.01]'>
              <div className='w-8 h-8 md:w-12 md:h-12 mb-3 transition-colors duration-200'>
                <Image src={category.icon} loader={localImageLoader} alt={t(category.key)} width={56} height={56} className='lg:group-hover:invert lg:group-hover:brightness-0 lg:group-hover:contrast-200' />
              </div>
              <span className='text-sm font-medium group-hover:text-white transition'>{t(category.key)}</span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

const CLIENT_EXPERIENCES = {
  en: [
    {
      id: '1',
      image: '/images/clients/client1.jpg',
      quote: 'Finding the perfect photographer used to be a struggle—until we found Helhal. The results exceeded our expectations.',
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
      quote: 'What impressed us most was how easy and smooth the entire process was. The photos turned out stunning, and we’ll be back.',
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

export function ClientsExperiences() {
  const t = useTranslations('home');
  const locale = useLocale();

  const experiences = CLIENT_EXPERIENCES[locale === 'ar' ? 'ar' : 'en'];

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8'>
      <h2 className='text-2xl md:text-3xl font-semibold mb-8'>{t('clientsExperiencesTitle')}</h2>

      <Swiper
        modules={[Navigation]}
        navigation={true}
        className='clients-experiences-swiper'
        breakpoints={{
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          768: {
            slidesPerView: 2.2,
            spaceBetween: 20,
          },
          0: {
            slidesPerView: 1,
            spaceBetween: 12,
          },
        }}>
        {experiences.map(item => (
          <SwiperSlide key={item.id}>
            <div className='bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.08)] p-3 h-full flex flex-col gap-6'>
              <div className='relative w-full rounded-md overflow-hidden aspect-[16/10]'>
                <Image src={item.image} loader={localImageLoader} alt={item.clientName} fill sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw' className='object-cover' />
              </div>

              <blockquote className={`${locale === 'ar' ? 'text-lg leading-8' : 'text-md leading-6'} text-gray-900`}>
                "{item.quote}" <span className='text-sm inline-block text-gray-700 italic'>_ {item.company}</span>
              </blockquote>

              <div className='py-6 border-t border-gray-300'>
                <p className='text-lg font-semibold mb-1'>{item.clientName}</p>
                <p className='text-md text-gray-500'>{item.title}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}


export function Hero() {
  const t = useTranslations('freelance');

  return (
    <section className='relative h-[calc(100vh-64px)] md:h-[calc(100vh-88px)] w-full overflow-hidden'>
      <Image src='/images/hero-background.jpg' alt='Helhal Hero Background' fill priority className='object-cover object-center' />

      <div className='absolute inset-0 bg-black/50 z-10' />

      <div className='relative z-20 flex items-center justify-center h-full px-4'>
        <div className='text-center max-w-2xl text-white space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold leading-tight'>{t('title')}</h1>

          <p className='text-gray-200 text-lg'>{t('subTitle')}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link
              href="/freelance"
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

const POPULAR_SERVICES = [
  {
    key: 'iosAppDevelopment',
    icon: '/icons/services/ios-app-development.svg',
    href: '/',
  },
  {
    key: 'wordpressDevelopers',
    icon: '/icons/services/wordpress-developers.svg',
    href: '/',
  },
  {
    key: 'uxpin',
    icon: '/icons/services/uxpin.svg',
    href: '/',
  },
  {
    key: 'invisionStudio',
    icon: '/icons/services/invision-studio.svg',
    href: '/',
  },
];

export function PopularServicesSwiper() {
  const t = useTranslations('home');

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <h2 className='text-2xl font-semibold mb-2'>{t('popularServicesTitle')}</h2>

      <Swiper
        breakpoints={{
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          557: {
            slidesPerView: 2,
            spaceBetween: 8,
          },
          0: {
            slidesPerView: 1.1,
            spaceBetween: 8,
          },
        }}
        pagination={true}
        modules={[Pagination]}
        className='popular-services-swiper'>
        {POPULAR_SERVICES.map(service => (
          <SwiperSlide key={service.key}>
            <Link href={service.href} className='group flex flex-col items-center text-center bg-white transition-all duration-200 px-4 py-10 rounded-xl h-full shadow-[0_0_10px_rgba(0,0,0,0.1)] lg:hover:bg-gray-50 lg:hover:scale-[1.03] lg:hover:shadow-[0_0_12px_rgba(0,0,0,0.15)]'>
              <div className='w-14 h-14 mb-3 relative'>
                <Image src={service.icon} loader={localImageLoader} alt={t(service.key)} fill={true} className='h-14 w-auto mx-auto' />
              </div>
              <span className='text-sm font-medium transition'>{t(service.key)}</span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

const VIDEO_SLIDER_ITEMS = [
  {
    id: 'video-3',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490550/video-3.mp4',
  },
  {
    id: 'video-1',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490553/video-1.mp4',
  },
  {
    id: 'video-2',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490552/video-2.mp4',
  },
];

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
    <section ref={sectionRef} className='container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12'>
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

const WHY_CHOOSE_ITEMS = [
  {
    key: 'categories',
    icon: '/icons/why-choose/categories.svg',
  },
  {
    key: 'pricing',
    icon: '/icons/why-choose/pricing.svg',
  },
  {
    key: 'quality',
    icon: '/icons/why-choose/quality.svg',
  },
  {
    key: 'support',
    icon: '/icons/why-choose/support.svg',
  },
];

export function WhyChoose() {
  const t = useTranslations('home');

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <h2 className='text-3xl md:text-4xl font-semibold mb-10'>{t('whyChoose.title')}</h2>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {WHY_CHOOSE_ITEMS.map(item => (
          <div key={item.key} className='flex flex-col bg-white px-6 py-8 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.08)] hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition'>
            <div className='w-12 h-12 mb-4'>
              <Image src={item.icon} loader={localImageLoader} alt={t(`whyChoose.items.${item.key}.title`)} width={56} height={56} className='mx-auto' />
            </div>
            <h3 className='text-lg font-medium mb-2'>{t(`whyChoose.items.${item.key}.title`)}</h3>
            <p className='text-base text-gray-800'>{t(`whyChoose.items.${item.key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
