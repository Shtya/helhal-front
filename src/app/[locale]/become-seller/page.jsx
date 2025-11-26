'use client';
import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/atoms/Button';
import FAQSection from '@/components/common/Faqs';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import { Modal } from '@/components/common/Modal';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useValues } from '@/context/GlobalContext';

const page = () => {
  const { settings, loadingSettings } = useValues();
  const faqs = settings?.faqs;
  const t = useTranslations('BecomeSeller');
  const stats = [
    { value: '4 Sec', label: t('stats.gigBought') },
    { value: '50M+', label: t('stats.transactions') },
    { value: '$5 - $10,000', label: t('stats.priceRange') },
  ];

  const categories = [
    {
      title: 'Commercial Photography',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Portrait Photography',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Event Photography',
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Product Photography',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  const steps = [
    {
      title: t('steps.createGig.title'),
      subtitle: t('steps.createGig.subtitle'),
      icon: '/icons/gig.svg',
    },
    {
      title: t('steps.deliverWork.title'),
      subtitle: t('steps.deliverWork.subtitle'),
      icon: '/icons/box-tick.svg',
    },
    {
      title: t('steps.getPaid.title'),
      subtitle: t('steps.getPaid.subtitle'),
      icon: '/icons/timer.svg',
    },
  ];

  const testimonials = [
    {
      quote: 'Get paid on time, every time. Payment is available for withdrawal as soon as it clears.',
      title: 'Adam Mashaal, CEO of Mashfeed',
      author: 'Sara Rose',
      role: 'Art Director',
    },
    {
      quote: 'Get paid on time, every time. Payment is available for withdrawal as soon as it clears.',
      title: 'Adam Mashaal, CEO of Mashfeed',
      author: 'Sara Rose',
      role: 'Art Director',
    },
    {
      quote: 'Get paid on time, every time. Payment is available for withdrawal as soon as it clears.',
      title: 'Adam Mashaal, CEO of Mashfeed',
      author: 'Sara Rose',
      role: 'Art Director',
    },
  ];

  // const faqs = [
  //   { question: t('faqs.whatCanISell.question'), answer: t('faqs.whatCanISell.answer') },
  //   { question: t('faqs.howMuchMoney.question'), answer: t('faqs.howMuchMoney.answer') },
  //   { question: t('faqs.howMuchTime.question'), answer: t('faqs.howMuchTime.answer') },
  //   { question: t('faqs.howDoIGetPaid.question'), answer: t('faqs.howDoIGetPaid.answer') },
  //   { question: t('faqs.howMuchDoesItCost.question'), answer: t('faqs.howMuchDoesItCost.answer') },
  //   { question: t('faqs.howDoIPrice.question'), answer: t('faqs.howDoIPrice.answer') },
  // ];

  return (
    <div className='container'>
      {/* Hero Section */}
      <HeaderCategoriesSwiper />
      <section
        className='relative divider h-[400px] md:h-[500px] lg:h-[550px] w-full rounded-3xl overflow-hidden flex items-center justify-center text-center'
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-aos='fade-up'
        data-aos-duration='1000'>
        <div className='absolute inset-0 bg-[#00000080]' />

        <div className='relative z-10 px-6 max-w-3xl mx-auto text-white' data-aos='zoom-in' data-aos-delay='200'>
          <h1 className='text-3xl md:text-5xl font-extrabold mb-4'>{t('hero.title')}</h1>
          <p className='text-xl opacity-90 md:text-4xl mb-8'>{t('hero.subtitle')}</p>
          <Button
            name={t('hero.button')}
            href='/auth?tab=register&type=seller'
            color='green'
            className={'!max-w-[300px] w-full'}
          />
        </div>
      </section>

      {/* Stats */}
      <section className='w-full max-w-[1200px] mx-auto divider px-4' data-aos='fade-up' data-aos-duration='1000'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {stats.map((stat, index) => (
            <div key={index} className='bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center justify-center text-center hover:shadow-lg transition' data-aos='zoom-in' data-aos-delay={index * 200}>
              <div className='w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-xl font-bold shadow-inner mb-4'>{index + 1}</div>
              <span className='text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight'>{stat.value}</span>
              <span className='mt-2 text-base md:text-lg text-gray-600'>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className='container divider' data-aos='fade-up' data-aos-duration='1000'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} title={cat.title} image={cat.image} index={idx} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className='w-full divider' data-aos='fade-up' data-aos-duration='1000'>
        <h2 className='text-center text-3xl font-bold text-white mb-12' data-aos='zoom-in' data-aos-delay='200'>
          {t('howItWorks.title')}
        </h2>
        <div className='flex flex-wrap items-center justify-center gap-10'>
          {steps.map((step, idx) => (
            <div key={idx} className='flex flex-col items-center text-center max-w-sm' data-aos='fade-up' data-aos-delay={idx * 200}>
              <img src={step.icon} alt={step.title} className='w-[60px] mb-4' />
              <h3 className='text-3xl max-md:text-2xl font-semibold'>{step.title}</h3>
              <p className='text-balance max-md:text-base text-lg opacity-90 mt-2'>{step.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className='relative flex items-center divider' data-aos='fade-up' data-aos-duration='1000'>
        <div className='pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_50%_-10%,rgba(255,255,255,.25),rgba(0,0,0,0)_70%)]' />

        <div className='grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((t, i) => (
            <article key={i} className='relative rounded-2xl bg-white border border-slate-100' style={{ boxShadow: '0px 0px 36px 0px #00000026' }} data-aos='zoom-in-up' data-aos-delay={i * 200}>
              <div className='p-8'>
                <QuoteMark className='w-8 h-8 text-emerald-600' />
                <h3 className='mt-4 text-2xl font-semibold tracking-tight text-black'>{t.title}</h3>
                <p className='mt-3 text-lg leading-8 text-slate-700'>{t.quote}</p>
                <div className='mt-8 flex items-center justify-end gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-400 ring-2 ring-white overflow-hidden flex items-center justify-center text-white text-sm font-medium'>SR</div>
                  <div className='text-right'>
                    <div className='text-base font-semibold text-black'>{t.author}</div>
                    <div className='text-sm text-slate-500'>{t.role}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className='divider' data-aos='fade-up' data-aos-duration='1000'>
        <FAQSection faqs={faqs} loading={loadingSettings} />
      </section>
    </div>
  );
};

export default page;

function BecomeSellerButton({ className = '' }) {
  const { role } = useAuth();


  return (
    <>
      <Button
        name={t('hero.button')}
        href='/auth?tab=register'
        color='green'
        className={className}
      />


    </>
  );
}

// Category Card
function CategoryCard({ title, image, index }) {
  return (
    <div className='relative rounded-2xl overflow-hidden shadow-lg group' data-aos='zoom-in-up' data-aos-delay={index * 200}>
      <img src={image} alt={title} className='w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105' />
      <div className='absolute inset-0 bg-gradient-to-t from-green-600/80 via-green-600/40 to-transparent opacity-90' />
      <div className='absolute bottom-4 left-4 text-white font-semibold text-lg'>{title}</div>
    </div>
  );
}

// Quote SVG
function QuoteMark({ className = '' }) {
  return (
    <svg viewBox='0 0 48 48' className={className} aria-hidden='true' fill='currentColor'>
      <path d='M13.6666 22.1688V18.1643C13.6666 17.6209 14.107 17.1809 14.65 17.1809C16.5877 17.1809 17.6418 15.1936 17.7881 11.2708H14.65C14.1071 11.2708 13.6666 10.8301 13.6666 10.2874V1.83171C13.6666 1.28857 14.107 0.848481 14.65 0.848481H23.0165C23.5594 0.848481 24 1.28905 24 1.83171V10.2874C24 12.1678 23.8102 13.8932 23.4375 15.4171C23.0547 16.9793 22.4671 18.3451 21.6914 19.4769C20.8936 20.64 19.8947 21.5527 18.7243 22.1883C17.5451 22.828 16.1743 23.1526 14.6496 23.1526C14.1071 23.1522 13.6666 22.7117 13.6666 22.1688ZM0.98323 17.1805C0.440291 17.1805 0 17.6209 0 18.1635V22.1688C0 22.7117 0.440291 23.1519 0.98323 23.1519C2.5072 23.1519 3.87867 22.8272 5.05716 22.1876C6.22816 21.552 7.22685 20.6401 8.02459 19.4762C8.80081 18.3444 9.38837 16.9785 9.77118 15.4156C10.144 13.8917 10.3334 12.1661 10.3334 10.2866V1.83089C10.3334 1.28774 9.89273 0.847656 9.35 0.847656H0.98323C0.440291 0.847656 0 1.28815 0 1.83089V10.2866C0 10.8297 0.440291 11.2701 0.98323 11.2701H4.07723C3.93271 15.1932 2.89379 17.1805 0.98323 17.1805Z' fill='#108A00' />
    </svg>
  );
}
