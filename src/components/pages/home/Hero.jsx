import { ArrowRight, Search } from "lucide-react";

const { useTranslations, useLocale } = require("next-intl");
const { default: Image } = require("next/image");

function SearchBar({ className, large }) {
  const t = useTranslations('layout');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <div className={`relative flex items-center w-full ${className || ''}`}>
      <Search className={`absolute start-3 text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
      <input type='text' placeholder={t('searchPlaceholder')} className={`w-full ${large ? 'py-4 ps-12 pe-14' : 'py-2 ps-10 pe-12'} bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-gray-700 placeholder-gray-400`} />
      <button type='submit' className={`absolute ${large ? 'end-4 p-1.5 rounded-sm' : 'end-2 p-1 rounded-md'} top-1/2 -translate-y-1/2 bg-accent text-white p-1 rounded-md hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 cursor-pointer`} >
        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}

export function Hero() {
  const t = useTranslations('home');

  return (
    <section className='relative h-[65vh] md:h-[70vh] w-full overflow-hidden'>
      <Image src='/images/hero-background.jpg' alt='Helhal Hero Background' fill priority className='object-cover object-center' />

      <div className='absolute inset-0 bg-black/50 z-10' />

      <div className='relative z-20 flex items-center justify-center h-full px-4'>
        <div className='text-center max-w-2xl text-white space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold leading-tight'>{t('heroTitle')}</h1>

          <p className='text-gray-200 text-lg'>{t('heroSubtitle')}</p>

          <SearchBar large />

          <p className='text-sm hidden md:block md:text-2xl'>{t('heroTagline')}</p>
        </div>
      </div>
    </section>
  );
}
