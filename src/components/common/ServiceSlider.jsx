'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import api from '@/lib/axios';
import { swiperSettings } from '@/config/Swiper';
import ServiceCard from '../pages/services/ServiceCard';
import ServiceCardSkeleton from '../skeleton/ServiceCardSkeleton';
import NoResults from '@/components/common/NoResults';

/* ---------- small states ---------- */
function ErrorState({ message, onRetry }) {
  return (
    <div className='col-span-full grid place-items-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-700'>
      <p className='font-medium'>Failed to load services</p>
      <p className='mt-1 text-sm opacity-80'>{message}</p>
      <button onClick={onRetry} className='mt-4 rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700'>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className='col-span-full grid place-items-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-600'>
      <NoResults onClick={onReset} buttonText='Reset' mainText='No services found.' additionalText='Try again later.' />
    </div>
  );
}

export default function ServiceSlider({ title, className, swiperConfig = swiperSettings }) {
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // keep a stable controller across re-renders for cleanup
  const controllerRef = useRef(null);

  const fetchServices = async () => {
    setErr(null);
    setLoading(true);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      const params = { limit: 8 };
      const res = await api.get('/services/top', {
        params,
        signal: controllerRef.current.signal,
      });
      const list = (res?.data?.services || []).slice(0, 8);
      setServices(list);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.message !== 'canceled') {
        setErr(e?.response?.data?.message || e?.message || 'Failed to load services');
        setServices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchServices();
    return () => controllerRef.current?.abort();
  }, []);

  // --- header (shared) ---
  const Header = (
    <div className='mb-8 flex items-center justify-between'>
      <h1 className='text-3xl max-md:text-xl font-[900]'>{title}</h1>

      <div className='flex items-center gap-2'>
        <button className='cards-prev2 cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-slate-200 duration-300 border border-slate-200' aria-label='Previous'>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
            <path d='M15 6l-6 6 6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>

        <button className='cards-next2 cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-slate-200 duration-300 border border-slate-200' aria-label='Next'>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
            <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative mt-12 ${className || ''}`}>
      {Header}

      {/* 1) Initial mount skeleton (prevents hydration jank) */}
      {!mounted ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>{Array.from({ length: 4 }).map((_, i) => (ServiceCardSkeleton ? <ServiceCardSkeleton key={i} /> : <ServiceCard loading key={i} />))}</div>
      ) :  loading ? (
        <Swiper modules={[Navigation, Pagination]} navigation={{ prevEl: '.cards-prev2', nextEl: '.cards-next2' }} pagination={{ clickable: true }} {...swiperConfig}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SwiperSlide key={`sk-${i}`} className='py-4'>
              {ServiceCardSkeleton ? <ServiceCardSkeleton /> : <ServiceCard loading />}
            </SwiperSlide>
          ))}
        </Swiper>
      ) :  err ? (
        <ErrorState message={err} onRetry={fetchServices} />
      ) :  services.length === 0 ? (
        <EmptyState onReset={fetchServices} />
      ) : (
        /* 5) Data state */
        <Swiper modules={[Navigation, Pagination]} navigation={{ prevEl: '.cards-prev2', nextEl: '.cards-next2' }} pagination={{ clickable: true }} {...swiperConfig}>
          {services.map((service, index) => (
            <SwiperSlide key={service.id || service.slug || index} className='py-4'>
              <ServiceCard isHoverScale={false} service={service} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
