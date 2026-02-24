'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Pagination from '../atoms/Pagination';
import { Eye, FilterX, RefreshCw, SearchX, X } from 'lucide-react';
import PriceTag from '../atoms/priceTag';
import { motion } from 'framer-motion';
import Img from '../atoms/Img';
import TabsPagination from './TabsPagination';

/** Tiny skeleton block */
const Skeleton = ({ className = '' }) => (
  <div
    className={`
      shimmer
      rounded-md
      bg-slate-200/70
      transition-colors
      duration-300
      ${className}
    `}
  />
);

/* ---------------------------- Empty State ---------------------------- */

function EmptyState({ title, subtitle, onResetFilters, onReload }) {
  const t = useTranslations('Table.emptyState');
  const defaultTitle = title || t('title');
  const defaultSubtitle = subtitle || t('subtitle');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-center justify-center py-10"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-main-100/40 dark:bg-main-600/20 blur-md" />
        <div className="relative h-14 w-14 rounded-2xl bg-main-50 dark:bg-dark-bg-input ring-1 ring-main-100 dark:ring-dark-border flex items-center justify-center">
          <SearchX className="h-7 w-7 text-main-600 dark:text-dark-text-primary" />
        </div>
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-dark-text-primary">
        {defaultTitle}
      </h3>

      <p className="mt-1 text-sm text-slate-500 dark:text-dark-text-secondary text-center max-w-md">
        {defaultSubtitle}
      </p>

      {(onResetFilters || onReload) && (
        <div className="mt-4 flex items-center gap-2">
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-card px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-dark-text-primary hover:bg-slate-50 dark:hover:bg-dark-bg-input transition-colors"
            >
              <FilterX className="h-4 w-4" />
              {t('clearFilters')}
            </button>
          )}

          {onReload && (
            <button
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-md bg-main-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-main-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t('reload')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

const Table = ({ data, columns, actions, loading = false, page = 1, rowsPerPage = 5, totalCount = 0, onPageChange }) => {
  const t = useTranslations('Table');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handlePageChange = page => {
    if (!loading) onPageChange?.(page);
  };

  const currentRows = data;

  const getStatusClass = (status, column) => {
    const statusMapping = column?.status?.find(item => item[0] === status);

    return statusMapping ? statusMapping[1] : 'text-gray-600';
  };

  const handleImageClick = imageSrc => {
    if (!loading) {
      setIsImageLoading(true)
      setSelectedImage(imageSrc)
    };
  };

  const closeImagePreview = () => setSelectedImage(null);

  // When loading, show placeholder rows that match the table shape
  const displayRows = loading ? Array.from({ length: rowsPerPage }).map((_, i) => ({ __skeleton: i })) : currentRows;

  const showingFrom = (page - 1) * rowsPerPage + 1;
  const showingTo = Math.min(page * rowsPerPage, totalCount);

  return (
    <div
      className="bg-white dark:bg-dark-bg-card rounded-lg shadow-inner border border-slate-200 dark:border-dark-border transition-colors duration-300"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="overflow-x-auto rounded-lg pb-12">
        <table className="w-full table-auto border-collapse">
          {/* ===================== THEAD ===================== */}
          <thead className="bg-slate-50 dark:bg-dark-bg-input border-b border-slate-200 dark:border-dark-border transition-colors duration-300">
            <tr>
              {columns.map((column) => {
                const thClass =
                  (column.headerClassName ?? column.className ?? '') +
                  ' px-4 py-5 rtl:text-right ltr:text-left text-base text-nowrap font-semibold text-gray-700 dark:text-dark-text-secondary';

                return (
                  <th key={column.key} className={thClass}>
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}

              {actions && (
                <th className="px-4 py-5 rtl:text-right ltr:text-left text-base text-nowrap font-semibold text-gray-700 dark:text-dark-text-secondary">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : (
                    t('action')
                  )}
                </th>
              )}
            </tr>
          </thead>

          {/* ===================== TBODY ===================== */}
          <tbody>
            {displayRows.map((row, idx) => (
              <tr
                key={row.__skeleton ?? idx}
                className="
                odd:bg-main-600/5 
                dark:odd:bg-main-600/10
                hover:bg-gray-50 
                dark:hover:bg-dark-bg-input
                transition-colors duration-200
              "
              >
                {columns.map((column) => {
                  const isSkeleton =
                    loading || row.__skeleton !== undefined;

                  const baseTd =
                    'text-nowrap px-4 py-4 text-sm text-gray-800 dark:text-dark-text-primary transition-colors duration-300';

                  const extraTd =
                    (typeof column.cellClassName === 'function'
                      ? column.cellClassName(row)
                      : column.cellClassName) ||
                    column.className ||
                    '';

                  const tdClass = `${baseTd} ${extraTd}`;

                  const renderDefaultCell = () => {
                    if (isSkeleton) {
                      return column.type === 'img' ? (
                        <div className="relative w-[80px] h-12">
                          <Skeleton className="w-full h-full rounded-md" />
                        </div>
                      ) : column.key === 'status' ? (
                        <div className="flex justify-center">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ) : column.type === 'price' ? (
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-4 w-14" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-32 mx-auto" />
                      );
                    }

                    if (column.type === 'img') {
                      return (
                        <div className="relative cursor-pointer w-[80px] h-12 mr-auto">
                          <Img
                            onClick={() =>
                              handleImageClick(row[column.key])
                            }
                            src={row[column.key]}
                            alt="Image"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <Eye
                            className="absolute top-[-8px] right-[-8px] p-[2px] rounded-md bg-white dark:bg-dark-bg-card shadow"
                            onClick={() =>
                              handleImageClick(row[column.key])
                            }
                          />
                        </div>
                      );
                    }

                    if (column.key === 'status') {
                      return (
                        <span
                          className={getStatusClass(
                            row[column.key],
                            column
                          )}
                        >
                          {row[column.key]}
                        </span>
                      );
                    }

                    if (column.type === 'price') {
                      return (
                        <PriceTag price={row[column.key]} />
                      );
                    }

                    return row[column.key];
                  };

                  return (
                    <td key={column.key} className={tdClass}>
                      {!isSkeleton &&
                        typeof column.render === 'function'
                        ? column.render(row)
                        : renderDefaultCell()}
                    </td>
                  );
                })}

                {actions && (
                  <td className="px-4 py-4 text-sm">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    ) : (
                      actions(row)
                    )}
                  </td>
                )}
              </tr>
            ))}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={
                    columns.length + (actions ? 1 : 0)
                  }
                  className="px-4"
                >
                  <EmptyState
                    title={t('nothingToShow.title')}
                    subtitle={t(
                      'nothingToShow.subtitle'
                    )}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== FOOTER ===================== */}
      <div className="mt-8 py-4 px-4 border-t border-slate-200 dark:border-dark-border transition-colors duration-300">
        <div className="md:hidden">
          <TabsPagination
            loading={loading}
            recordsCount={data.length}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="max-md:flex-1"
          />
        </div>

        <div className="hidden md:flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-dark-text-secondary transition-colors duration-300">
            {loading ? (
              <Skeleton className="h-4 w-56" />
            ) : (
              <>
                {t('showing', {
                  from: showingFrom,
                  to: showingTo,
                  total: totalCount,
                })}
              </>
            )}
          </span>

          <div
            className={
              loading
                ? 'opacity-60 pointer-events-none'
                : ''
            }
          >
            <Pagination
              recordsCount={data.length}
              className="!mt-0"
              page={page}
              totalPages={totalPages}
              setPage={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* ===================== IMAGE PREVIEW ===================== */}
      {selectedImage && !loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative rounded-xl">
            <button
              onClick={closeImagePreview}
              className="w-9 h-9 inline-flex items-center justify-center absolute -top-3 -right-3 text-white bg-slate-900 rounded-full shadow hover:opacity-90"
            >
              {!isImageLoading ? (
                <X />
              ) : (
                <span className="relative flex h-6 w-6">
                  <span className="absolute h-full w-full rounded-full border-4 border-white/30 border-t-white animate-spin"></span>
                  <span className="absolute h-full w-full rounded-full border-4 border-transparent border-r-white animate-spin-slow"></span>
                </span>
              )}
            </button>

            <Img
              src={selectedImage}
              alt="Preview"
              className={`
              ${!isImageLoading
                  ? 'bg-white dark:bg-dark-bg-card ring-1 ring-slate-200 dark:ring-dark-border'
                  : ''
                }
              p-4 max-w-[80vw] max-h-[80vh] rounded-md w-full
            `}
              onLoad={() =>
                setIsImageLoading(false)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;


