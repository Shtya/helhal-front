'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ServiceCard from '@/components/pages/services/ServiceCard';
import { CardSlider } from '@/components/pages/services/CardSlider';
import { apiService } from '@/services/GigServices';
import CardSkeleton from '@/components/skeleton/CardSkeleton';
import NoResults from '@/components/common/NoResults';
import Button from '@/components/atoms/Button';
import { ChevronsRight } from 'lucide-react';

export default function ServicesHomePage() {
  const t = useTranslations('Services');
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        setLoading(true);
        const response = await apiService.getTopServices({
          limit: 8, // Get top 8 services
        });
        setTopServices(response.services || []);
      } catch (err) {
        console.error('Error fetching top services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopServices();
  }, []);

  if (loading) {
    return (
      <main className='container !pb-8'>
        {/* <HeaderCategoriesSwiper /> */}
        <CardSlider title={t('page.browseCategories')} />
        <h1 className='text-3xl max-md:text-xl font-[900] mt-12 mb-4'>{t('page.featured')}</h1>
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className='container !pb-8'>
      <CardSlider title={t('page.browseCategories')} />

      <div className='flex items-center justify-between mt-12 mb-4'>
        <h1 className='text-3xl max-md:text-xl font-[900] '>{t('page.featured')}</h1>

        <Button href={'/services/all'} className='!w-[35px] !px-2   !h-[35px] !rounded-lg !text-base ' icon={<ChevronsRight size={22} />} />
      </div>

      {topServices.length === 0 ? (
        <NoResults mainText={t('page.empty.title')} additionalText={t('page.empty.description')} />
      ) : (
        <section className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {topServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </section>
      )}
    </main>
  );
}
