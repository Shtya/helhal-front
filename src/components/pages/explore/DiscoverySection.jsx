'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ServiceCard from '../services/ServiceCard';
import Tabs from '@/components/common/Tabs';
import { useValues } from '@/context/GlobalContext';
import Button from '@/components/atoms/Button';
import api from '@/lib/axios';
import NoResults from '@/components/common/NoResults';

const TTL_MS = 2 * 60 * 1000; // 2 minutes

export default function DiscoverySection() {
  const { categories = [], loadingCategory } = useValues();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or category slug
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // cache: Map<tab, { data: any[]; at: number }>
  const cacheRef = useRef(new Map());

  const fetchServices = async tab => {
    setErr(null);

    // cache hit (valid within TTL)
    const cached = cacheRef.current.get(tab);
    if (cached && Date.now() - cached.at < TTL_MS) {
      setServices(cached.data);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    try {
      const params = { limit: 8 };
      let baseUrl = '/services';
      if (tab !== 'all') baseUrl = `/services/category/${tab}`;

      let res;
      try {
        res = await api.get(baseUrl, { params, signal: controller.signal });
      } catch (e) { }

      const list = res.data.services.slice(0, 8);
      cacheRef.current.set(tab, { data: list, at: Date.now() });
      setServices(list);

    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.message !== 'canceled') {
        setErr(e?.response?.data?.message || e?.message || 'Failed to load services');
        setServices([]);
      }
    } finally {
      setLoading(false);
    }
    // cleanup on caller side (useEffect)
    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = fetchServices(activeTab);
    return () => {
      // if fetchServices returned a cleanup (in case of overlapping), call it
      if (typeof cleanup === 'function') cleanup();
    };
  }, [activeTab]);

  // build tabs: 'All' + first 4 categories
  const tabs = useMemo(() => {
    const base = [{ label: 'All', value: 'all' }];
    const extra = (categories || [])
      .slice(0, 4)
      .map(c => ({ label: c?.name || c?.slug || 'Category', value: c?.slug || String(c?.id || '').toLowerCase() }))
      .filter(Boolean);
    return [...base, ...extra];
  }, [categories]);

  const moreHref = activeTab === 'all' ? '/services' : `/services/category=${encodeURIComponent(activeTab)}`;

  return (
    <section className='mt-14'>
      <p className='text-3xl max-md:text-xl font-[900]'>Find by category</p>

      {/* Tabs */}
      <div className='mt-4 flex items-center justify-between gap-2 flex-wrap'>
        <Tabs tabs={tabs} setActiveTab={setActiveTab} activeTab={activeTab} />
        <Button name='Show more' href={moreHref} className='!w-fit' />
      </div>

      {/* Grid */}
      <motion.div className=' mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        {loading || loadingCategory ? (
          Array.from({ length: 8 }).map((_, i) => <ServiceCard loading={true} key={`sk-${i}`} />)
        ) : err ? (
          <ErrorState message={err} onRetry={() => fetchServices(activeTab)} />
        ) : services.length === 0 ? (
          <EmptyState onReset={() => setActiveTab('all')} />
        ) : (
          services.map(svc => (
            <motion.div key={svc.id || svc.slug} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <ServiceCard service={svc} />
            </motion.div>
          ))
        )}
      </motion.div>
    </section>
  );
}

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
      <NoResults onClick={onReset} buttonText={"Reset filters"} mainText={"No services found."} additionalText={"Try another category or view all services."} />

    </div>
  );
}
