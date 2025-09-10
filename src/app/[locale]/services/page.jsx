'use client';
import { useEffect, useState } from 'react';
import ServiceCard from '@/components/pages/services/ServiceCard';
import { CardSlider } from '@/components/pages/services/CardSlider';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import { apiService } from '@/services/GigServices';
import CardSkeleton from '@/components/skeleton/CardSkeleton';
import NoResults from '@/components/common/NoResults';

export default function ServicesHomePage() {
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
        <HeaderCategoriesSwiper />
        <CardSlider title='Browse Categories' />
        <h1 className='text-3xl max-md:text-xl font-[900] mt-12 mb-4'>Featured</h1>
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
      <HeaderCategoriesSwiper />
      <CardSlider title='Browse Categories' />

      <h1 className='text-3xl max-md:text-xl font-[900] mt-12 mb-4'>Featured</h1>

      {topServices.length === 0 ? (
        <NoResults mainText='No featured services available at the moment.' additionalText='Please check back later or explore other categories.' />
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
