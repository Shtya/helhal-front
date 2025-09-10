// 'use client';

// import { Link } from '@/i18n/navigation';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination } from 'swiper/modules';
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// import { useEffect, useMemo, useState } from 'react';
// import { apiService } from '@/services/GigServices';
// import Img from '@/components/atoms/Img';
// import NoResults from '@/components/common/NoResults';

// export function CardSlider({ title }) {
//   const [categories, setCategories] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const res = await apiService.getCategories('category');
//       setCategories(Array.isArray(res) ? res : []);
//     } catch (e) {
//       setCategories([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const hasData = useMemo(() => (categories?.length ?? 0) > 0, [categories]);

//   return (
//     <div className='relative !mt-12'>
//       <div className='mb-4 flex items-center justify-between'>
//         <h1 className='text-3xl max-md:text-xl font-[900]'>{title}</h1>

//         <div className='flex items-center gap-2'>
//           <button className='cards-prev cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-slate-200 duration-300 border border-slate-200' aria-label='Previous'>
//             <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
//               <path d='M15 6l-6 6 6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
//             </svg>
//           </button>

//           <button className='cards-next cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-slate-200 duration-300 border border-slate-200' aria-label='Next'>
//             <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
//               <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Skeleton Loading */}
//       {loading && (
//         <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} className='h-[132px] animate-pulse rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5'>
//               <div className='flex items-center gap-4'>
//                 <div className='h-16 w-28 rounded-md ring-1 ring-slate-200 bg-slate-200' />
//                 <div className='h-6 w-32 bg-slate-200 rounded' />
//               </div>
//               <div className='h-6 w-40 bg-slate-200 rounded mt-3' />
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Slider */}
//       {!loading && hasData && (
//         <Swiper
//           modules={[Navigation, Pagination]}
//           navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
//           pagination={{
//             el: '.cards-pagination',
//             clickable: true,
//             bulletClass: 'cards-bullet',
//             bulletActiveClass: 'cards-bullet-active',
//             renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
//           }}
//           spaceBetween={24}
//           slidesPerView={1}
//           slidesPerGroup={2}
//           breakpoints={{
//             640: { slidesPerView: 2 },
//             1024: { slidesPerView: 4 },
//           }}
//           className='mb-6'>
//           {categories.map(c => (
//             <SwiperSlide key={c.slug}>
//               <Link href={`/services/${encodeURIComponent(c.slug)}`} className='group block h-fit text-zinc-900 transition overflow-hidden border border-slate-200/60 bg-slate-50/30 hover:bg-slate-100 duration-300 rounded-2xl' title={c.name}>
//                 <div className='relative flex h-full flex-col p-5'>
//                   <div className='flex items-center gap-4'>
//                     <div className='h-16 w-28 overflow-hidden rounded-md ring-1 ring-[#108A00] bg-white'>
//                       <Img src={c.image} alt={c.name} />
//                     </div>
//                     <div className='text-[22px] whitespace-nowrap truncate font-semibold'>{c.name}</div>
//                   </div>

//                   <div className='text-[16px] mt-2 font-medium tracking-tight text-slate-600 line-clamp-1'>{c.description || '—'}</div>
//                 </div>
//               </Link>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       )}

//       {!loading && !hasData && <NoResults additionalText={'Check back later'} mainText={'No categories available yet.'} />}

//       {/* Pagination bullets container (optional) */}
//       <div className='cards-pagination flex items-center justify-center gap-2' />

//       <style jsx global>{`
//         .cards-prev.swiper-button-disabled,
//         .cards-next.swiper-button-disabled {
//           opacity: 0.35;
//           cursor: not-allowed;
//         }
//         .cards-bullet {
//           width: 12px;
//           height: 12px;
//           border-radius: 50%;
//           background: #e5e7eb;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0 4px;
//           cursor: pointer;
//           transition: all 0.3s ease;
//         }

//         .cards-bullet .inner {
//           width: 0;
//           height: 0;
//           border-radius: 50%;
//           background: transparent;
//           transition: all 0.3s ease;
//         }

//         .cards-bullet-active {
//           background: #10b981 !important;
//           transform: scale(1.2);
//           box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
//         }

//         .cards-bullet-active .inner {
//           width: 6px;
//           height: 6px;
//           background: white;
//         }
//       `}</style>
//     </div>
//   );
// }


'use client';

import { Link } from '@/i18n/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/GigServices';
import Img from '@/components/atoms/Img';
import NoResults from '@/components/common/NoResults';
import { useValues } from '@/context/GlobalContext';

export function CardSlider({ title }) { 
		const {categories , loadingCategory} = useValues()
  const hasData = useMemo(() => (categories?.length ?? 0) > 0, [categories]);

  return (
    <div className="relative !mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl max-md:text-xl font-[900]">{title}</h1>

        <div className="flex items-center gap-2">
          <button
            className="cards-prev cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 hover:bg-white border border-slate-200 shadow-sm transition"
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="cards-next cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 hover:bg-white border border-slate-200 shadow-sm transition"
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* === Skeleton in Swiper (same shape) === */}
      {loadingCategory && (
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
          pagination={{
            el: '.cards-pagination',
            clickable: true,
            bulletClass: 'cards-bullet',
            bulletActiveClass: 'cards-bullet-active',
            renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
          }}
          spaceBetween={24}
          slidesPerView={1}
          slidesPerGroup={2}
          breakpoints={{
            640: { slidesPerView: 2, slidesPerGroup: 2 },
            1024: { slidesPerView: 4, slidesPerGroup: 4 },
          }}
          className="mb-6"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SwiperSlide key={`sk-${i}`}>
              <SkeletonCategoryCard />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* === Slider with data === */}
      {!loadingCategory && hasData && (
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
          pagination={{
            el: '.cards-pagination',
            clickable: true,
            bulletClass: 'cards-bullet',
            bulletActiveClass: 'cards-bullet-active',
            renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
          }}
          spaceBetween={24}
          slidesPerView={1}
          slidesPerGroup={2}
          breakpoints={{
            640: { slidesPerView: 2, slidesPerGroup: 2 },
            1024: { slidesPerView: 4, slidesPerGroup: 4 },
          }}
          className="mb-6"
        >
          {categories.map((c) => (
            <SwiperSlide key={c.slug}>
              <CategoryCard c={c} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {!loadingCategory && !hasData && (
        <NoResults mainText="No categories available yet." additionalText="Check back later" />
      )}

      {/* Pagination bullets */}
      <div className="cards-pagination flex items-center justify-center gap-2" />

      <style jsx global>{`
        /* bullets */
        .cards-prev.swiper-button-disabled,
        .cards-next.swiper-button-disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .cards-bullet {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e5e7eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #fff;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
        }
        .cards-bullet .inner {
          width: 0;
          height: 0;
          border-radius: 50%;
          background: transparent;
          transition: all 0.3s ease;
        }
        .cards-bullet-active {
          background: #10b981 !important;
          transform: scale(1.15);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), 0 0 6px rgba(16, 185, 129, 0.6);
        }
        .cards-bullet-active .inner {
          width: 6px;
          height: 6px;
          background: white;
        }

        /* shimmer */
        @keyframes cardsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, rgba(226,232,240,0.8) 25%, rgba(255,255,255,0.9) 50%, rgba(226,232,240,0.8) 75%);
          background-size: 200% 100%;
          animation: cardsShimmer 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ======= UI Pieces ======= */

function CategoryCard({ c }) {
  return (
    <Link
      href={`/services/${encodeURIComponent(c.slug)}`}
      title={c.name}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-inner transition duration-300"
    >
      {/* glow on hover */}
      <span className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background:
            'radial-gradient(600px 120px at 0% 0%, rgba(16,138,0,0.08), transparent 60%), radial-gradient(600px 120px at 100% 100%, rgba(16,185,129,0.08), transparent 60%)',
        }}
      />
      {/* image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Img
          src={c.image}
          alt={c.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        {/* slug chip */}
        <span className="absolute left-3 top-3 z-[2] rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 backdrop-blur">
          {c.slug}
        </span>
      </div>

      {/* content */}
      <div className="relative z-[1] p-4">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 line-clamp-1">
          {c.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2 truncate whitespace-nowrap">
          {c.description || 'Discover curated services in this category.'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className=" !opacity-0 inline-flex items-center gap-2 text-emerald-700 text-sm font-semibold">
            Explore
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>

          {/* tiny accent ring on hover */}
          <span className="h-8 w-8 rounded-full border border-emerald-200 bg-emerald-50/70 grid place-items-center group-hover:bg-emerald-100 transition">
            <svg className="h-4 w-4 text-emerald-700" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="relative block overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden rounded-b-none">
        <div className="h-full w-full shimmer" />
        <div className="absolute left-3 top-3 h-6 w-16 rounded-full bg-white/70 border border-slate-200 shimmer" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 rounded shimmer" />
        <div className="h-4 w-full rounded shimmer" />
        <div className="h-4 w-3/5 rounded shimmer" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-5 w-24 rounded shimmer" />
          <div className="h-8 w-8 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}
