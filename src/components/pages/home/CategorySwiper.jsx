import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination  } from 'swiper/modules';
import { Link } from '../../../i18n/navigation';
 
import 'swiper/css';
import 'swiper/css/navigation';
import { useTranslations } from 'next-intl';


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
                <Image src={category.icon} alt={t(category.key)} width={56} height={56} className='lg:group-hover:invert lg:group-hover:brightness-0 lg:group-hover:contrast-200' />
              </div>
              <span className='text-sm font-medium group-hover:text-white transition'>{t(category.key)}</span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
