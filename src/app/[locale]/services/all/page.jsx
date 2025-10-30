// File: AllServicesPage.jsx
'use client';

import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import ServiceCard from '@/components/pages/services/ServiceCard';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Pagination from '@/components/atoms/Pagination';
import { apiService } from '@/services/GigServices';
import CardSkeleton from '@/components/skeleton/CardSkeleton';
import NoResults from '@/components/common/NoResults';
import SellerDetailsDropdown from '@/components/common/Filters/SellerDetailsDropdown';
import SellerBudgetDropdown from '@/components/common/Filters/SellerBudgetDropdown';
import DeliveryTimeDropdown from '@/components/common/Filters/DeliveryTimeDropdown';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname, useSearchParams } from 'next/navigation';
import { updateUrlParams } from '@/utils/helper';

const defaultFilters = {

  priceRange: '',
  customBudget: '',
  rating: '',
  sortBy: '',
  sellerLevel: [],
  sellerAvailability: [],
  sellerSpeaks: [],
  sellerCountries: [],
  deliveryTime: '',
  customDeliveryTime: '',
  revisions: '',
  fastDelivery: false,
  additionalRevision: false,
};

function buildQuery(formData, pagination) {
  return {
    page: pagination.page,
    limit: pagination.limit,

    ...(formData.priceRange && { priceRange: formData.priceRange }),
    ...(formData.customBudget && { customBudget: formData.customBudget }),
    ...(formData.rating && { rating: formData.rating.id }),
    ...(formData.sortBy && { sortBy: formData.sortBy.id }),
    ...(formData.sellerLevel.length > 0 && { sellerLevel: formData.sellerLevel.join(',') }),
    ...(formData.sellerAvailability.length > 0 && { sellerAvailability: formData.sellerAvailability.join(',') }),
    ...(formData.sellerSpeaks.length > 0 && { sellerSpeaks: formData.sellerSpeaks.join(',') }),
    ...(formData.sellerCountries.length > 0 && { sellerCountries: formData.sellerCountries.join(',') }),
    ...(formData.deliveryTime && { deliveryTime: formData.deliveryTime }),
    ...(formData.customDeliveryTime && { customDeliveryTime: formData.customDeliveryTime }),
    ...(formData.revisions && { revisions: formData.revisions.id }),
    ...(formData.fastDelivery && { fastDelivery: formData.fastDelivery }),
    ...(formData.additionalRevision && { additionalRevision: formData.additionalRevision }),
  };
}

export default function AllServicesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname()

  const t = useTranslations('CategoryPage'); // reuse same keys
  const [services, setServices] = useState([]);
  const [filterOptions, setFilterOptions] = useState();

  const ratingsOptions = [
    { id: 'rating-5', name: '⭐⭐⭐⭐⭐ 5' },
    { id: 'rating-4', name: '⭐⭐⭐⭐ 4+' },
    { id: 'rating-3', name: '⭐⭐⭐ 3+' },
    { id: 'rating-2', name: '⭐⭐ 2+' },
    { id: 'rating-1', name: '⭐ 1+' },
  ];



  const sortByOptions = [
    { id: 's0', name: t('sort.all') },
    { id: 's1', name: t('sort.priceLowHigh') },
    { id: 's2', name: t('sort.priceHighLow') },
    { id: 's3', name: t('sort.rating') },
    { id: 's4', name: t('sort.newest') },
  ];


  const revisionsOptions = [
    { id: 1, name: '1' },
    { id: 2, name: '2' },
    { id: 3, name: '3' },
    { id: 4, name: '4+' },
  ];
  const [formData, setFormData] = useState(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      priceRange: params.priceRange ?? '',
      customBudget: params.customBudget ?? '',
      rating: params.rating ? ratingsOptions.find(r => r.id == params.rating) : '',
      sortBy: params.sortBy ? sortByOptions.find(s => s.id == params.sortBy) : '',
      sellerLevel: params.sellerLevel ? params.sellerLevel.split(',') : [],
      sellerAvailability: params.sellerAvailability ? params.sellerAvailability.split(',') : [],
      sellerSpeaks: params.sellerSpeaks ? params.sellerSpeaks.split(',') : [],
      sellerCountries: params.sellerCountries ? params.sellerCountries.split(',') : [],
      deliveryTime: params.deliveryTime ?? '',
      customDeliveryTime: params.customDeliveryTime ?? '',
      revisions: params.revisions ? revisionsOptions?.find(r => r.id == params.revisions) : '',
      fastDelivery: params.fastDelivery === 'true',
      additionalRevision: params.additionalRevision === 'true',
    };
  });

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: 8,
    total: 0,
    pages: 1,
  });
  const controllerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Debounce search input → update formData.search from Input
  const debounced = useDebounce(search)
  const skipDebouncedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (apiService.getAllFilterOptions) {
          const res = await apiService.getAllFilterOptions(); // expect { filterOptions: {...} }
          if (mounted && res?.filterOptions) setFilterOptions(res.filterOptions);
        }
      } catch (e) {
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchAllServices = useCallback(async () => {

    if (skipDebouncedRef.current) {
      skipDebouncedRef.current = false;
      return; // skip this fetch triggered by debounce
    }

    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      const q = buildQuery({ ...formData, search: debounced }, pagination);
      const res = await apiService.getServicesPublic(q, { signal: controllerRef.current.signal }); // <-- uses your /services/me
      // expect shape: { services: [], pagination: { page, limit, total, pages } }
      if (res?.services) setServices(res.services);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      // ignore aborts
      const isAbort = err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || err?.message?.toLowerCase?.().includes('canceled');
      if (!isAbort) {
        console.error('Error fetching services:', err);
        setServices([]);
        setPagination(p => ({ ...p, total: 0, pages: 1 }));
      }

    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, [debounced, formData, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAllServices();
  }, [fetchAllServices]);


  // sync formData with searchParams
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (formData.priceRange) params.set('priceRange', formData.priceRange); else params.delete('priceRange')
    if (formData.customBudget) params.set('customBudget', formData.customBudget); else params.delete('customBudget')
    if (formData.rating) params.set('rating', formData.rating?.id); else params.delete('rating')
    if (formData.sortBy) params.set('sortBy', formData.sortBy?.id); else params.delete('sortBy')
    if (formData.sellerLevel.length) params.set('sellerLevel', formData.sellerLevel.join(',')); else params.delete('sellerLevel')
    if (formData.sellerAvailability.length) params.set('sellerAvailability', formData.sellerAvailability.join(',')); else params.delete('sellerAvailability')
    if (formData.sellerSpeaks.length) params.set('sellerSpeaks', formData.sellerSpeaks.join(',')); else params.delete('sellerSpeaks')
    if (formData.sellerCountries.length) params.set('sellerCountries', formData.sellerCountries.join(',')); else params.delete('sellerCountries')
    if (formData.deliveryTime) params.set('deliveryTime', formData.deliveryTime); else params.delete('deliveryTime')
    if (formData.customDeliveryTime) params.set('customDeliveryTime', formData.customDeliveryTime); else params.delete('customDeliveryTime')
    if (formData.revisions) params.set('revisions', formData.revisions?.id); else params.delete('revisions')
    if (formData.fastDelivery) params.set('fastDelivery', 'true'); else params.delete('fastDelivery')
    if (formData.additionalRevision) params.set('additionalRevision', 'true'); else params.delete('additionalRevision')

    updateUrlParams(pathname, params);
  }, [formData]);

  //sync search with searchParms
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debounced) params.set('search', debounced); else params.delete('search');
    updateUrlParams(pathname, params);
  }, [debounced]);

  //sync search with searchParms
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (pagination.page) params.set('page', pagination.page); else params.delete('page');
    updateUrlParams(pathname, params);
  }, [pagination.page]);


  // Reset page to 1 whenever filters (except page) change
  function resetpage() {
    handlePageChange(1);
  }
  const handleSelectChange = (field, value) => {

    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
    resetpage();
  };

  const handleSellerDetailsChange = details => {
    setFormData(prev => {
      const updated = { ...prev, ...details };
      return updated;
    });
    resetpage();
  };

  const handleBudgetChange = (priceRange, customBudget = '') => {
    setFormData(prev => {
      const updated = {
        ...prev,
        priceRange,
        customBudget: priceRange === 'custom' ? customBudget : '',
      };
      return updated;
    });
    resetpage();
  };

  const handleDeliveryTimeChange = (deliveryTime, customDeliveryTime = '') => {
    setFormData(prev => {
      const updated = {
        ...prev,
        deliveryTime,
        customDeliveryTime: deliveryTime === 'custom' ? customDeliveryTime : '',
      };
      return updated;
    });
    resetpage();
  };

  const handlePageChange = newPage => {
    setPagination(prev => ({ ...prev, page: newPage }))
  };

  const resetFilters = () => {
    setFormData(defaultFilters);
    setSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));

    skipDebouncedRef.current = true;
  };


  return (
    <main className='container !mb-12'>
      {/* Optional: show categories swiper at top for quick jump; passing "all" */}
      <HeaderCategoriesSwiper category='all' />

      {/* ===== Filters ===== */}
      <div className='mb-8 mt-8 relative z-[30]'>
        <motion.div className='rounded-xl border border-slate-200 bg-white/70 p-4 shadow-custom hover:!shadow-[0_8px_24px_-6px_rgba(16,185,129,0.25),0_2px_6px_rgba(15,23,42,0.08)] transition-shadow duration-300 md:p-8' initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className='mb-4'>
            <div className='flex items-center gap-2 justify-between w-full'>
              <div className='flex items-center gap-2'>
                <SlidersHorizontal className='h-5 w-5 text-emerald-600' aria-hidden='true' />
                <h2 className='text-lg font-bold text-slate-800'>{t('filterTitle') || 'Filters'}</h2>
              </div>
              <span className='text-slate-500 text-base'>
                ({pagination.total}) {Number(pagination.total) === 1 ? 'result' : 'results'}
              </span>
            </div>
            <p className='mt-1 text-sm text-slate-500'>{t('filterSubtitle') || 'Refine your search with custom options.'}</p>
          </div>

          <div className='grid grid-cols-1 gap-3 items-center sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7'>
            <SellerDetailsDropdown filterOptions={filterOptions} onFilterChange={handleSellerDetailsChange} selectedValues={formData} />

            <SellerBudgetDropdown onBudgetChange={handleBudgetChange} selectedPriceRange={formData.priceRange} customBudget={formData.customBudget} />

            <DeliveryTimeDropdown onDeliveryTimeChange={handleDeliveryTimeChange} selectedDeliveryTime={formData.deliveryTime} customDeliveryTime={formData.customDeliveryTime} />

            <Select
              options={ratingsOptions}
              placeholder={t('rating')}
              cnPlaceholder='!text-gray-900'
              value={formData?.rating?.id}
              onChange={val => handleSelectChange('rating', val)}
            />

            <Select
              options={revisionsOptions}
              placeholder={t('revisions')}
              cnPlaceholder='!text-gray-900'
              value={formData?.revisions?.id}
              onChange={val => handleSelectChange('revisions', val)}
            />


            <Select
              options={sortByOptions}
              placeholder={t('sortBy')}
              cnPlaceholder='!text-gray-900'
              value={formData?.sortBy?.id}
              onChange={val => handleSelectChange('sortBy', val)}
            />

            <Input
              placeholder={t('searchPlaceholder')}
              iconLeft={'/icons/search.svg'}
              // actionIcon={'/icons/send-arrow.svg'}
              value={search}
              onAction={() => {
                /* optional: trigger fetch immediately */
              }}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>
      </div>

      {/* ==== Cards ==== */}
      <section className='cards-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {loading ? Array.from({ length: pagination.limit }).map((_, i) => <CardSkeleton key={i} />)
          : services.length > 0 ? services.map((service, idx) => <ServiceCard key={(service.id ?? idx) + '-svc'} service={service} />)
            : <NoResults mainText={t('noServices')} additionalText={t('noServicesDesc')} buttonText={t('resetFilters')} onClick={resetFilters} />}</section>

      {/* ==== Pagination ==== */}
      {!loading && services?.length > 0 &&

        <Pagination page={pagination?.page} totalPages={pagination?.pages || 0} setPage={handlePageChange} />
      }
    </main>
  );
}
