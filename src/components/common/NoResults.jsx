import React from 'react';
import { Link } from '@/i18n/navigation';

const NoResults = ({ mainText, additionalText, buttonText, buttonLink, onClick }) => {
  return (
    <div className='text-center col-span-10 flex flex-col justify-center items-center py-12 transition-colors duration-300'>
      {/* Icon */}
      <div className='text-6xl text-gray-400 mb-6 w-[200px] h-[200px]'>
        <img
          src='/icons/empty.jpg'
          alt='No Data'
          className='mx-auto w-[200px] transform transition duration-500 hover:scale-105 dark:opacity-80 dark:brightness-90'
        />
      </div>

      <p className='text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-dark-text-primary mb-2'>
        {mainText || 'Oops! No results found.'}
      </p>

      <p className='text-base sm:text-lg text-gray-600 dark:text-dark-text-secondary mb-8 max-w-[550px] w-full mx-auto px-4'>
        {additionalText || 'It looks like there is nothing here yet. Try adjusting your filters or start by creating something new.'}
      </p>

      {buttonLink && (
        <Link
          href={buttonLink}
          className='px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-dark-bg-card border border-transparent dark:border-dark-border text-white dark:text-dark-text-primary text-base cursor-pointer font-medium hover:bg-slate-700 dark:hover:bg-dark-bg-input transition-all shadow-sm'
        >
          {buttonText || 'Get Started'}
        </Link>
      )}

      {onClick && (
        <button
          onClick={onClick}
          className='px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-dark-bg-card border border-transparent dark:border-dark-border text-white dark:text-dark-text-primary text-base cursor-pointer font-medium hover:bg-slate-700 dark:hover:bg-dark-bg-input transition-all shadow-sm'
        >
          {buttonText || 'Get Started'}
        </button>
      )}
    </div>
  );
};

export default NoResults;
