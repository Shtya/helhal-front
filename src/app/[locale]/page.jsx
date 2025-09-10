'use client';

import Header from '@/components/molecules/Header';
import { CategorySwiper } from '../..//components/pages/home/CategorySwiper';
import { ClientsExperiences } from '../..//components/pages/home/ClientsExperiences';
import { Hero } from '../..//components/pages/home/Hero';
import { PopularServicesSwiper } from '../..//components/pages/home/PopularServicesSwiper';
import { VideoSlider } from '../..//components/pages/home/VideoSlider';
import { WhyChoose } from '../..//components/pages/home/WhyChoose';
import React from 'react';
import { Footer } from '@/components/molecules/Footer';

const page = () => {
  return (
    <div className=''>
      <Hero />
      <CategorySwiper />
      <PopularServicesSwiper />
      <WhyChoose />
      <ClientsExperiences />
      <VideoSlider />
    </div>
  );
};

export default page;
