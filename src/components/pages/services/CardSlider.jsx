'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Img from '@/components/atoms/Img';
import NoResults from '@/components/common/NoResults';
import { useValues } from '@/context/GlobalContext';

/**
 * Why this is better:
 * - Clear content hierarchy: bold name → short helper text → tiny affordance.
 * - Stronger cards: depth, hover scale, soft glow edges; readable over images.
 * - Larger hit areas for nav; keyboard + a11y friendly; reduced motion respect.
 * - Skeleton matches final layout (no layout shift).
 * - Bullets use sane classes (no selector escaping headaches).
 */

export function CardSlider({ title = 'Categories' }) {
  const { categories, loadingCategory } = useValues();
  const hasData = useMemo(() => (categories?.length ?? 0) > 0, [categories]);

  return (
    <section className='relative mt-10'>
      {/* Header */}
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900'>{title}</h2>

        {/* Nav controls */}
        <div className='flex items-center gap-2'>
          <NavButton dir='prev' />
          <NavButton dir='next' />
        </div>
      </div>

      {/* Loading (skeleton inside Swiper to keep controls aligned) */}
      {loadingCategory && (
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
          pagination={{
            el: '.cards-pagination',
            clickable: true,
            bulletClass: 'cards-bullet',
            bulletActiveClass: 'cards-bullet-active',
            renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
          }}
          a11y={{ enabled: true }}
          spaceBetween={20}
          slidesPerView={1}
          slidesPerGroup={2}
          breakpoints={{
            640: { slidesPerView: 2, slidesPerGroup: 2 },
            1024: { slidesPerView: 4, slidesPerGroup: 4 },
            1224: { slidesPerView: 5, slidesPerGroup: 5 },
          }}
          className='mb-6'>
          {Array.from({ length: 8 }).map((_, i) => (
            <SwiperSlide key={`sk-${i}`}>
              <SkeletonCard />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Data */}
      {!loadingCategory && hasData && (
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
          pagination={{
            el: '.cards-pagination',
            clickable: true,
            bulletClass: 'cards-bullet',
            bulletActiveClass: 'cards-bullet-active',
            renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
          }}
          a11y={{ enabled: true }}
          spaceBetween={20}
          slidesPerView={1}
          slidesPerGroup={2}
          watchSlidesProgress
          breakpoints={{
            640: { slidesPerView: 2, slidesPerGroup: 2 },
            1024: { slidesPerView: 4, slidesPerGroup: 4 },
            1224: { slidesPerView: 5, slidesPerGroup: 5 },
          }}
          className='mb-6'>
          {categories.map(c => (
            <SwiperSlide key={c.slug}>
              <CategoryCard c={c} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Empty */}
      {!loadingCategory && !hasData && <NoResults mainText='No categories yet' additionalText='We’re curating the best for you. Check back soon.' />}

      {/* Bullets */}
      <div className='cards-pagination flex items-center justify-center gap-2' aria-label='Carousel pagination' />

      {/* Global styles just for bullets + shimmer */}
      <style jsx global>{`
        .cards-prev.swiper-button-disabled,
        .cards-next.swiper-button-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .cards-bullet {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #e5e7eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 4px;
          cursor: pointer;
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
          border: 2px solid #fff;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
        }
        .cards-bullet .inner {
          width: 0;
          height: 0;
          border-radius: 9999px;
          background: transparent;
          transition: width 0.25s ease, height 0.25s ease, background 0.25s ease;
        }
        .cards-bullet-active {
          background: #10b981 !important;
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), 0 0 8px rgba(16, 185, 129, 0.45);
        }
        .cards-bullet-active .inner {
          width: 6px;
          height: 6px;
          background: white;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(226, 232, 240, 0.85) 25%, rgba(255, 255, 255, 0.95) 50%, rgba(226, 232, 240, 0.85) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cards-bullet,
          .cards-bullet .inner {
            transition: none !important;
          }
          .shimmer {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ---------- Pieces ---------- */

function NavButton({ dir }) {
  const isPrev = dir === 'prev';
  const label = isPrev ? 'Previous' : 'Next';
  const cls = 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
  return (
    <button className={`${cls} cards-${dir}`} aria-label={label} title={label} type='button'>
      {isPrev ? (
        <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true' fill='none'>
          <path d='M15 6l-6 6 6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      ) : (
        <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true' fill='none'>
          <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      )}
    </button>
  );
}
function CategoryCard({ c }) {
  const href = `/services/${encodeURIComponent(c.slug)}`;

  return (
    <Link href={href} className='group relative block overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-[0_1px_0_rgb(0_0_0/0.02),0_10px_20px_-10px_rgb(2_6_23/0.15)] transition hover:shadow-lg'>
      {/* Soft corners glow */}
      <span
        aria-hidden='true'
        className='pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300'
        style={{
          background: 'radial-gradient(600px 120px at 0% 0%, rgba(16,138,0,0.08), transparent 60%), radial-gradient(600px 120px at 100% 100%, rgba(16,185,129,0.08), transparent 60%)',
        }}
      />

      {/* Media */}
      <div className='relative aspect-[16/10] overflow-hidden'>
        <Img src={c.image} alt={c.name} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]' loading='lazy' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent' />

        {/* slug chip */}
        <span className='absolute left-3 top-3 z-10 rounded-lg bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 backdrop-blur'>{c.name}</span>

        {/* Arrow badge (appears on hover, purely visual; link wraps entire card) */}
        <span
          className=' group-hover:rotate-[-45deg] absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/80 backdrop-blur-md
                     opacity-0 translate-y-[-4px] transition duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-sm'
          aria-hidden='true'>
          <svg className='h-4 w-4 text-slate-700' viewBox='0 0 24 24' fill='none'>
            <path d='M9 5l7 7-7 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </span>

        {/* Sliding description overlay */}
        <div className='absolute  inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300'>
          <div className='m-3 !rounded-xl !overflow-hidden bg-white/80 backdrop-blur-md p-2 shadow-sm'>
            <p className='text-[12px] text-center leading-5 text-slate-700'>{c.description || 'Discover curated services in this category.'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
function SkeletonCard() {
  return (
    <div className='group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_1px_0_rgb(0_0_0/0.02),0_10px_20px_-10px_rgb(2_6_23/0.15)]'>
      {/* Media */}
      <div className='relative aspect-[16/10] overflow-hidden'>
        {/* image */}
        <div className='h-full w-full shimmer' />

        {/* slug chip */}
        <div className='absolute left-3 top-3 h-6 w-20 rounded-full bg-white/80 border border-slate-200 shimmer' />

        {/* arrow badge placeholder (appears on hover in real card) */}
        <div className='absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/80 backdrop-blur-md opacity-80'>
          <div className='h-4 w-4 rounded-full shimmer' />
        </div>

        {/* sliding overlay placeholder (same height as real description box) */}
        <div className='absolute inset-x-0 bottom-0 translate-y-0'>
          <div className='m-3 rounded-xl border border-white/60 bg-white/80 backdrop-blur-md p-3 shadow-sm'>
            <div className='h-4 w-5/6 rounded shimmer' />
            <div className='mt-2 h-4 w-2/3 rounded shimmer' />
          </div>
        </div>
      </div>
    </div>
  );
}
