// Pagination.js - A reusable pagination component
import React, { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Select from '../atoms/Select';

const TabsPagination = ({
  loading,
  recordsCount,
  currentPage,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPage,
  className,
  options = [
    { id: 5, name: '5' },
    { id: 10, name: '10' },
    { id: 20, name: '20' },
    { id: 50, name: '50' },
  ],
}) => {
  const t = useTranslations('TabsPagination');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  if (!loading && (recordsCount ?? 0) === 0) return null;

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col xs:flex-row items-center xs:justify-between w-full gap-4 mt-6 transition-colors duration-300 ${loading ? 'opacity-60 pointer-events-none' : ''
        }${className ? ` ${className}` : ''}`}
    >
      {/* Prev / Next */}
      <div
        className={`flex items-center space-x-1 xs:space-x-2 ${onItemsPerPageChange
            ? 'justify-center xs:justify-start'
            : 'flex-1 justify-between'
          }`}
      >
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-4 py-2 cursor-pointer
            gradient
            dark:bg-dark-bg-input dark:bg-none
            border border-transparent dark:border-dark-border
            text-white dark:text-dark-text-primary
            dark:hover:bg-dark-bg-card
            ${isRTL ? 'rounded-r-md' : 'rounded-l-md'}
            disabled:opacity-30
            transition-colors duration-300`}
        >
          {t('prev')}
        </button>

        {/* Page Info */}
        <span className="px-4 py-2 text-slate-900 dark:text-dark-text-primary transition-colors duration-300">
          {t('page', { current: currentPage, total: totalPages })}
        </span>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-4 py-2 cursor-pointer
            gradient
            dark:bg-dark-bg-input dark:bg-none
            border border-transparent dark:border-dark-border
            text-white dark:text-dark-text-primary
            dark:hover:bg-dark-bg-card
            ${isRTL ? 'rounded-l-md' : 'rounded-r-md'}
            disabled:opacity-30
            transition-colors duration-300`}
        >
          {t('next')}
        </button>
      </div>

      {/* Items per page selector */}
      {onItemsPerPageChange && (
        <Select
          options={options}
          value={itemsPerPage}
          onChange={(selectedOption) =>
            onItemsPerPageChange(Number(selectedOption.name))
          }
          placeholder={t('selectItemsPerPage')}
          cnLabel="text-sm text-gray-600 dark:text-dark-text-secondary transition-colors duration-300"
          cnSelect="text-sm text-gray-700 dark:text-dark-text-primary transition-colors duration-300"
          className="!w-fit xs:ms-auto"
        />
      )}
    </div>
  );
};

export default TabsPagination;
