// File: CategoryPage.jsx
'use client';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import ServiceCard from '@/components/pages/services/ServiceCard';
import React, { use, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Pagination from '@/components/atoms/Pagination';
import { apiService } from '@/services/GigServices';
import NotFound from '@/components/molecules/NotFound';
import CardSkeleton from '@/components/skeleton/CardSkeleton';
import NoResults from '@/components/common/NoResults';
import SellerDetailsDropdown from '@/components/common/Filters/SellerDetailsDropdown';
import SellerBudgetDropdown from '@/components/common/Filters/SellerBudgetDropdown';
import DeliveryTimeDropdown from '@/components/common/Filters/DeliveryTimeDropdown';
import Breadcrumbs2 from '@/components/atoms/BreadcrumbSteps';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
export default function CategoryPage({ params }) {
  const t = useTranslations('CategoryPage');
  const { category } = use(params);

  const [categoryData, setCategoryData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState();

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    pages: 1,
  });

  const defaultFilters = {
    search: '',
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

  const [formData, setFormData] = useState(defaultFilters);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(formData.search);
    }, 1000); // 1000ms debounce

    return () => clearTimeout(timer);
  }, [formData.search]);

  // Fetch category and services
  const fetchCategoryServices = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...(formData.search && { search: formData.search }),
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
        ...(formData.revisions && { revisions: formData.revisions }),
        ...(formData.fastDelivery && { fastDelivery: formData.fastDelivery }),
        ...(formData.additionalRevision && { additionalRevision: formData.additionalRevision }),
      };

      const response = await apiService.getCategoryServicesFilter(category, queryParams);
      apiService.getServicesFilterOptions(category).then(res => {
        setFilterOptions(res.filterOptions);
      });

      if (response && response.category) {
        setCategoryData(response.category);
      }

      if (response && response.services) {
        setServices(response.services);
      }

      if (response && response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching category services:', error);
    } finally {
      setLoading(false);
    }
  }, [category, pagination.page, formData]);

  useEffect(() => {
    fetchCategoryServices();
  }, [fetchCategoryServices]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [formData]);

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSellerDetailsChange = details => {
    setFormData(prev => ({ ...prev, ...details }));
  };

  const handleBudgetChange = (priceRange, customBudget = '') => {
    setFormData(prev => ({
      ...prev,
      priceRange,
      customBudget: priceRange === 'custom' ? customBudget : '',
    }));
  };

  const handleDeliveryTimeChange = (deliveryTime, customDeliveryTime = '') => {
    setFormData(prev => ({
      ...prev,
      deliveryTime,
      customDeliveryTime: deliveryTime === 'custom' ? customDeliveryTime : '',
    }));
  };

  const handlePageChange = newPage => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFormData(defaultFilters);
  };

  if (!categoryData && !loading) return <NotFound />;

  return (
    <main className='container !mb-12'>
      <HeaderCategoriesSwiper category={category} />
      {/* <Breadcrumbs2 items={[{ label: t('services'), href: '/services' }, { label: categoryData?.name || '' }]} /> */}

      {/* ===== Filters ===== */}
      <div className='mb-8 mt-8 relative z-[30] '>
        <motion.div className=' rounded-xl border border-slate-200 bg-white/70   p-4 shadow-custom  hover:!shadow-[0_8px_24px_-6px_rgba(16,185,129,0.25),0_2px_6px_rgba(15,23,42,0.08)]  transition-shadow duration-300 md:p-8' initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className='mb-4'>
            <div className='flex items-center gap-2  w-full '>
              <div className='flex items-center gap-2 justify-between w-full '>
                <div className='flex items-center gap-2' >
                  <SlidersHorizontal className='h-5 w-5 text-emerald-600' aria-hidden='true' />
                  <h2 className='text-lg font-bold text-slate-800'>{t('filterTitle') || 'Filters'}</h2>
                </div>
                <span className='text-slate-500 text-base '>
                   ({pagination.total}) { pagination?.total?.length >= 2 ? "results" :"result" }
                </span>
              </div>
            </div>
            <p className='mt-1 text-sm text-slate-500'>{t('filterSubtitle') || 'Refine your search with custom options.'}</p>
          </div>

          <div className=' grid grid-cols-1 gap-3 items-center  sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6  '>
            <SellerDetailsDropdown filterOptions={filterOptions} onFilterChange={handleSellerDetailsChange} selectedValues={formData} />

            <SellerBudgetDropdown onBudgetChange={handleBudgetChange} selectedPriceRange={formData.priceRange} customBudget={formData.customBudget} />

            <DeliveryTimeDropdown onDeliveryTimeChange={handleDeliveryTimeChange} selectedDeliveryTime={formData.deliveryTime} customDeliveryTime={formData.customDeliveryTime} />

            <Select
              options={[
                { id: 'rating-5', name: '⭐⭐⭐⭐⭐ 5' },
                { id: 'rating-4', name: '⭐⭐⭐⭐ 4+' },
                { id: 'rating-3', name: '⭐⭐⭐ 3+' },
                { id: 'rating-2', name: '⭐⭐ 2+' },
                { id: 'rating-1', name: '⭐ 1+' },
              ]}
              placeholder={t('rating')}
              cnPlaceholder='!text-gray-900'
              value={formData.rating}
              onChange={val => handleSelectChange('rating', val)}
            />

            <Select
              options={[
                { id: 's0', name: t('sort.all') },
                { id: 's1', name: t('sort.priceLowHigh') },
                { id: 's2', name: t('sort.priceHighLow') },
                { id: 's3', name: t('sort.rating') },
                { id: 's4', name: t('sort.newest') },
              ]}
              placeholder={t('sortBy')}
              cnPlaceholder='!text-gray-900'
              value={formData.sortBy}
              onChange={val => handleSelectChange('sortBy', val)}
            />

            <Input placeholder={t('searchPlaceholder')} iconLeft={'/icons/search.svg'} actionIcon={'/icons/send-arrow.svg'} value={formData.search} onAction={() => console.log('Searching...')} onChange={val => handleSelectChange('search', val.target.value)} />
          </div>
        </motion.div>
      </div>
      <section className=' cards-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>{loading ? Array.from({ length: pagination.limit }).map((_, i) => <CardSkeleton key={i} />) : services.length > 0 ? services.map((service, id) => <ServiceCard key={service.id + id} service={service} />) : <NoResults mainText={t('noServices')} additionalText={t('noServicesDesc')} buttonText={t('resetFilters')} onClick={resetFilters} />}</section>

      {/* ===== Pagination ===== */}
      {!loading && services?.length > 0 && <Pagination page={pagination.page} totalPages={pagination.pages} setPage={handlePageChange} />}
    </main>
  );
}
