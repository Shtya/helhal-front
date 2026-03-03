'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import { useValues } from '@/context/GlobalContext';
import { Link } from '@/i18n/navigation';

export default function HeaderCategoriesSwiper({ category }) {
  const t = useTranslations('Explore');
  const { categories = [], loadingCategory } = useValues();
  const locale = useLocale()
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const hasData = categories && categories.length > 0;
  const isAllActive = category == 'all';

  // Shared chip styles to keep code DRY
  const chipBaseClass = "inline-flex items-center rounded-full px-5 py-2 text-sm font-medium transition duration-300 ";
  const inactiveClass = "text-slate-700 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-card hover:text-white hover:bg-gradient-to-r hover:to-main-500 hover:from-main-600 dark:hover:border-main-400/60";
  const activeClass = "gradient text-white border-transparent";


  return (
    <div className='mb-6 border-y border-y-slate-200 dark:border-dark-border transition-colors'>
      <div className='flex items-center gap-2 w-full'>
        {/* Prev Arrow */}
        <button
          id='cat-prev'
          disabled={isBeginning || loadingCategory || isLocked}
          className={`rounded-full border border-slate-200 dark:border-dark-border ltr:rotate-180 bg-white dark:bg-dark-bg-card shadow p-1 transition ${isBeginning || loadingCategory || isLocked ? 'opacity-50 pointer-events-none' : 'hover:bg-main-50 dark:hover:bg-main-900/20'}`}
          aria-label='Previous'
          style={{ marginRight: '2px' }}
        >
          <ChevronRight className='w-7 h-7 text-main-700 dark:text-main-400 ' />
        </button>

        {/* Swiper and categories */}
        <div className='flex-1 min-w-0'>
          {/* Fade Gradients */}
          {/* {!isBeginning && !loadingCategory && (
            <div className='pointer-events-none absolute left-0 top-0 z-10 h-full w-14 bg-gradient-to-r from-white dark:from-dark-bg-base to-transparent' />
          )}
          {!isEnd && !loadingCategory && (
            <div className='pointer-events-none absolute right-0 top-0 z-10 h-full w-14 bg-gradient-to-l from-white dark:from-dark-bg-base to-transparent' />
          )} */}

          {/* LOADING State */}
          {loadingCategory && (
            <Swiper
              modules={[FreeMode, Navigation]}
              freeMode
              spaceBetween={5}
              slidesPerView='auto'
              navigation={{ prevEl: '#cat-prev', nextEl: '#cat-next' }}
              className='px-2'
              onAfterInit={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
              onActiveIndexChange={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
              onResize={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
            >
              <SwiperSlide className='!w-auto py-2'>
                <span className={chipBaseClass + inactiveClass}>{t('categories.all')}</span>
              </SwiperSlide>
              {SKELETON_WIDTHS.map((w, i) => (
                <SwiperSlide key={`sk-${i}`} className='!w-auto py-2'>
                  <span
                    className='inline-flex items-center rounded-full h-[38px] border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-card relative overflow-hidden animate-pulse'
                    style={{ width: w }}
                  >
                    <span className='shimmer absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-slate-100 dark:via-dark-border to-transparent' />
                  </span>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* DATA State */}
          {!loadingCategory && hasData && (
            <Swiper
              modules={[FreeMode, Navigation]}
              freeMode
              spaceBetween={8}
              slidesPerView='auto'
              navigation={{ prevEl: '#cat-prev', nextEl: '#cat-next' }}
              onAfterInit={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
              onActiveIndexChange={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
              onResize={swiper => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setIsLocked(swiper.isLocked);
              }}
              className='!px-2'
            >
              <SwiperSlide className='!w-auto py-2'>
                <Link
                  href='/services/all'
                  aria-current={isAllActive ? 'page' : undefined}
                  className={chipBaseClass + (isAllActive ? activeClass : inactiveClass)}
                  title={t('categories.allServices')}
                >
                  {t('categories.all')}
                </Link>
              </SwiperSlide>
              {categories.map(c => {
                const active = c.slug === category;
                return (
                  <SwiperSlide key={c.slug} className='!w-auto py-2'>
                    <Link
                      href={`/services/${c.slug}`}
                      aria-current={active ? 'page' : undefined}
                      className={chipBaseClass + (active ? activeClass : inactiveClass)}
                    >
                      {locale === 'ar' ? c.name_ar : c.name_en}
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}

          {/* EMPTY State */}
          {!loadingCategory && !hasData && (
            <div className='px-2 py-2'>
              <span className='inline-flex items-center rounded-full border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-card px-5 py-2 text-sm text-slate-600 dark:text-dark-text-secondary'>
                {t('categories.noCategoriesAvailable')}
              </span>
            </div>
          )}
        </div>
        {/* Next Arrow */}
        <button
          id='cat-next'
          disabled={isEnd || loadingCategory || isLocked}
          className={`rounded-full border border-slate-200 dark:border-dark-border ltr:-rotate-180 bg-white dark:bg-dark-bg-card shadow p-1 transition ${isEnd || loadingCategory || isLocked ? 'opacity-50 pointer-events-none' : 'hover:bg-main-50 dark:hover:bg-main-900/20'}`}
          aria-label='Next'
          style={{ marginLeft: '2px' }}
        >
          <ChevronLeft className='w-7 h-7 text-main-700 dark:text-main-400' />
        </button>
      </div>
    </div>
  );
}

const SKELETON_WIDTHS = ['84px', '96px', '110px', '88px', '102px', '94px', '120px', '86px'];
