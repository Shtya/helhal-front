import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Link } from '../../../i18n/navigation';

import 'swiper/css';
import 'swiper/css/pagination';
import { useTranslations } from 'next-intl';
import { localImageLoader } from '@/utils/helper';


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
