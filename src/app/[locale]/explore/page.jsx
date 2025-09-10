'use client';
import ServiceSlider from '@/components/common/ServiceSlider';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import DiscoverySection from '@/components/pages/explore/DiscoverySection';
import Hero from '@/components/pages/explore/Hero';
import React, { useEffect, useMemo, useState } from 'react';
import { services } from '../../../../db';
import { swiperSettingsExplore } from '@/config/Swiper';
import Button from '@/components/atoms/Button';

const page = () => {
  return (
    <div className=' container'>
      <HeaderCategoriesSwiper />
      <Hero />
      <DiscoverySection />

      <ServiceSlider services={services} title='Gigs you may like' className='!mt-22' swiperConfig={swiperSettingsExplore} />

      <section
        className='relative mt-12 mb-12 h-[400px] md:h-[500px] lg:h-[550px] w-full rounded-3xl overflow-hidden flex items-center justify-center text-center'
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop')", // replace with your image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        {/* Overlay */}
        <div className='absolute inset-0 bg-[#00000080] ' />

        {/* Content */}
        <div className='relative z-10 px-6 max-w-3xl mx-auto text-white'>
          <h1 className='text-3xl md:text-5xl font-extrabold mb-4'>Freelance services</h1>
          <p className='text-xl opacity-90 md:text-4xl mb-8'>are just a click away!</p>
          <Button name={'See more'} href={'/services'} color='green' className='!max-w-[300px] w-full ' />
          {/* <a href='#services' className='inline-block px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-lg shadow-lg transition'>
            See more
          </a> */}
        </div>
      </section>
    </div>
  );
};

export default page;
