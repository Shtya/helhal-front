import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import {  Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import { useLocale, useTranslations } from 'next-intl';


const CLIENT_EXPERIENCES = {
  en: [
    {
      id: '1',
      image: '/images/clients/client1.jpg',
      quote: 'Finding the perfect photographer used to be a struggle—until we found Helhal. The results exceeded our expectations.',
      company: 'Lumière Co.',
      clientName: 'Sarah J.',
      title: 'Marketing Director at Lumière Co.',
    },
    {
      id: '2',
      image: '/images/clients/client2.jpg',
      quote: 'Helhal connected us with a talented photographer who captured our brand perfectly. Fast, friendly, and flawless service.',
      company: 'Nova Brands',
      clientName: 'Daniel R.',
      title: 'Creative Lead at Nova Brands',
    },
    {
      id: '3',
      image: '/images/clients/client3.jpg',
      quote: 'What impressed us most was how easy and smooth the entire process was. The photos turned out stunning, and we’ll be back.',
      company: 'Bloom Boutique',
      clientName: 'Fatima K.',
      title: 'Owner of Bloom Boutique',
    },
  ],
  ar: [
    {
      id: '1',
      image: '/images/clients/client1.jpg',
      quote: 'كنا نواجه صعوبة في إيجاد المصور المناسب، حتى اكتشفنا Helhal. كانت النتائج مذهلة وتفوقت على توقعاتنا.',
      company: 'Lumière Co.',
      clientName: 'سارة ج.',
      title: 'مديرة التسويق في Lumière Co.',
    },
    {
      id: '2',
      image: '/images/clients/client2.jpg',
      quote: 'Helhal سهّلت علينا الوصول إلى مصور محترف فهم رؤيتنا تمامًا ونفذها بدقة. الخدمة كانت سريعة وراقية.',
      company: 'Nova Brands',
      clientName: 'دانيال ر.',
      title: 'المدير الإبداعي في Nova Brands',
    },
    {
      id: '3',
      image: '/images/clients/client3.jpg',
      quote: 'ما أعجبني حقًا هو سهولة وسلاسة التجربة بالكامل. الصور كانت رائعة وسنعود بالتأكيد لاستخدام الخدمة مرة أخرى.',
      company: 'Bloom Boutique',
      clientName: 'فاطمة ك.',
      title: 'مالكة Bloom Boutique',
    },
  ],
};

export function ClientsExperiences() {
  const t = useTranslations('home');
  const locale = useLocale();

  const experiences = CLIENT_EXPERIENCES[locale === 'ar' ? 'ar' : 'en'];

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8'>
      <h2 className='text-2xl md:text-3xl font-semibold mb-8'>{t('clientsExperiencesTitle')}</h2>

      <Swiper
        modules={[Navigation]}
        navigation={true}
        className='clients-experiences-swiper'
        breakpoints={{
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          768: {
            slidesPerView: 2.2,
            spaceBetween: 20,
          },
          0: {
            slidesPerView: 1,
            spaceBetween: 12,
          },
        }}>
        {experiences.map(item => (
          <SwiperSlide key={item.id}>
            <div className='bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.08)] p-3 h-full flex flex-col gap-6'>
              <div className='relative w-full rounded-md overflow-hidden aspect-[16/10]'>
                <Image src={item.image} alt={item.clientName} fill sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw' className='object-cover' />
              </div>

              <blockquote className={`${locale === 'ar' ? 'text-lg leading-8' : 'text-md leading-6'} text-gray-900`}>
                "{item.quote}" <span className='text-sm inline-block text-gray-700 italic'>_ {item.company}</span>
              </blockquote>

              <div className='py-6 border-t border-gray-300'>
                <p className='text-lg font-semibold mb-1'>{item.clientName}</p>
                <p className='text-md text-gray-500'>{item.title}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
