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

  const hasData = categories && categories.length > 0;
  const isAllActive = category == 'all'; // active when no category selected

  return (
    <div className='relative mb-6 border-y border-y-slate-200 '>
      {/* Prev/Next */}
      <button id='cat-prev' disabled={isBeginning || loadingCategory} className={`absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white shadow p-1 transition ${isBeginning || loadingCategory ? 'opacity-0 pointer-events-none' : 'hover:bg-emerald-50'}`} aria-label='Previous'>
        <ChevronLeft className='w-7 h-7 text-emerald-700' />
      </button>

      <button id='cat-next' disabled={isEnd || loadingCategory} className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white shadow p-1 transition ${isEnd || loadingCategory ? 'opacity-0 pointer-events-none' : 'hover:bg-emerald-50'}`} aria-label='Next'>
        <ChevronRight className='w-7 h-7 text-emerald-700' />
      </button>

      {!isBeginning && !loadingCategory && <div className='pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent' />}
      {!isEnd && !loadingCategory && <div className='pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent' />}

      {/* LOADING: skeleton chips in swiper */}
      {loadingCategory && (
        <Swiper
          modules={[FreeMode, Navigation]}
          freeMode
          spaceBetween={5}
          slidesPerView='auto'
          navigation={{ prevEl: '#cat-prev', nextEl: '#cat-next' }}
          className='px-12'
          onAfterInit={swiper => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}>
          <SwiperSlide className='!w-auto py-2'>
            <span className='inline-flex items-center rounded-full px-5 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-600'>{t('categories.all')}</span>
          </SwiperSlide>

          {SKELETON_WIDTHS.map((w, i) => (
            <SwiperSlide key={`sk-${i}`} className='!w-auto py-2'>
              <span className='inline-flex items-center rounded-full h-[40px] px-5 py-2 text-sm font-medium border border-slate-200 bg-white relative overflow-hidden' style={{ width: w }}>
                <span className='sr-only'>{t('categories.loading')}</span>
                <span className='shimmer absolute inset-0 rounded-full' />
              </span>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* DATA: real chips */}
      {!loadingCategory && hasData && (
        <Swiper
          modules={[FreeMode, Navigation]}
          freeMode
          spaceBetween={5}
          slidesPerView='auto'
          navigation={{ prevEl: '#cat-prev', nextEl: '#cat-next' }}
          onSlideChange={swiper => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onResize={swiper => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onAfterInit={swiper => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          className='!px-2'>
          <SwiperSlide className='!w-auto py-2 '>
            <Link href='/services/all' aria-current={isAllActive ? 'page' : undefined} className={'inline-flex items-center rounded-full px-5 py-2 text-sm font-medium transition duration-300 ' + (isAllActive ? ' gradient text-white ' : 'hover:text-white hover:bg-gradient-to-r to-emerald-500 from-emerald-600 text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-emerald-400/60 hover:text-emerald-700')} title={t('categories.allServices')}>
              {t('categories.all')}
            </Link>
          </SwiperSlide>

          {categories.map(c => {
            const active = c.slug === category;
            return (
              <SwiperSlide key={c.slug} className='!w-auto py-2 '>
                <Link href={`/services/${c.slug}`} aria-current={active ? 'page' : undefined} className={'inline-flex items-center rounded-full px-5 py-2 text-sm font-medium transition duration-300 ease-out ' + (active ? ' gradient text-white ' : 'hover:text-white hover:bg-gradient-to-r to-emerald-500 from-emerald-600 text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-emerald-400/60 hover:text-emerald-700')}>
                  {locale === 'ar' ? c.name_ar : c.name_en}
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

      {/* EMPTY: no categories after loading */}
      {!loadingCategory && !hasData && (
        <div className='px-12 py-2'>
          <span className='inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm text-slate-600'>{t('categories.noCategoriesAvailable')}</span>
        </div>
      )}
    </div>
  );
}

const SKELETON_WIDTHS = ['84px', '96px', '110px', '88px', '102px', '94px', '120px', '86px'];
