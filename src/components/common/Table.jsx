'use client';
import { useMemo, useState } from 'react';
import Pagination from '../atoms/Pagination';
import { Eye, FilterX, RefreshCw, SearchX, X } from 'lucide-react';
import PriceTag from '../atoms/priceTag';
import {motion} from "framer-motion"
import Img from '../atoms/Img';


/** Tiny skeleton block */
const Skeleton = ({ className = '' }) => <div className={`shimmer rounded-md bg-slate-200/70 ${className}`} />;

function EmptyState({ title = 'No results found', subtitle = 'Try adjusting filters, clearing search, or changing the date range.', onResetFilters, onReload }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className='flex flex-col items-center justify-center py-10' aria-live='polite'>
      <div className='relative'>
        <div className='absolute -inset-3 rounded-full bg-emerald-100/40 blur-md' />
        <div className='relative h-14 w-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center'>
          <SearchX className='h-7 w-7 text-emerald-600' />
        </div>
      </div>

      <h3 className='mt-4 text-base font-semibold text-slate-800'>{title}</h3>
      <p className='mt-1 text-sm text-slate-500 text-center max-w-md'>{subtitle}</p>

      {(onResetFilters || onReload) && (
        <div className='mt-4 flex items-center gap-2'>
          {onResetFilters && (
            <button onClick={onResetFilters} className='inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'>
              <FilterX className='h-4 w-4' />
              Clear filters
            </button>
          )}
          {onReload && (
            <button onClick={onReload} className='inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700'>
              <RefreshCw className='h-4 w-4' />
              Reload
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

const Table = ({ data, columns, actions, loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const rowsPerPage = 5;

  const handlePageChange = page => {
    if (!loading) setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = useMemo(() => data.slice(startIndex, startIndex + rowsPerPage), [data, startIndex]);

  const getStatusClass = (status, column) => {
    const statusMapping = column?.status?.find(item => item[0] === status);
    return statusMapping ? statusMapping[1] : 'text-gray-600';
  };

  const handleImageClick = imageSrc => {
    if (!loading) setSelectedImage(imageSrc);
  };

  const closeImagePreview = () => setSelectedImage(null);

  // When loading, show placeholder rows that match the table shape
  const displayRows = loading ? Array.from({ length: rowsPerPage }).map((_, i) => ({ __skeleton: i })) : currentRows;

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const showingFrom = loading ? 0 : Math.min(startIndex + 1, data.length);
  const showingTo = loading ? 0 : Math.min(startIndex + rowsPerPage, data.length);

  return (
    <div className='bg-white rounded-lg shadow-inner border border-slate-200' aria-busy={loading} aria-live='polite'>
      <div className='overflow-x-auto rounded-lg pb-12'>
        <table className='w-full table-auto border-collapse'>
          <thead className='bg-slate-50 border-b border-b-slate-200'>
            <tr>
              {columns.map(column => (
                <th key={column.key} className='px-4 py-5 rtl:text-right ltr:text-left text-base text-nowrap font-semibold '>
                  {loading ? (
                    <div className='flex items-center justify-center'>
                      <Skeleton className='h-4 w-24' />
                    </div>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {actions && (
                <th className='px-4 py-5 rtl:text-right ltr:text-left  text-base text-nowrap font-semibold '>
                  {loading ? (
                    <div className='flex items-center justify-center'>
                      <Skeleton className='h-4 w-16' />
                    </div>
                  ) : (
                    'Action'
                  )}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={row.__skeleton ?? idx} className={`  odd:bg-[#108A000D] odd:hover:bg-[#108A00]/10 hover:bg-gray-50`}>
                {columns.map(column => {
                  const isSkeleton = loading || row.__skeleton !== undefined;

                  return (
                    <td key={column.key} className='text-nowrap px-4 py-4 text-sm text-gray-800'>
                      {isSkeleton ? (
                        // Skeletons per type for better realism
                        column.type === 'img' ? (
                          <div className='relative w-[80px] h-12 '>
                            <Skeleton className='w-full h-full rounded-md' />
                          </div>
                        ) : column.key === 'status' ? (
                          <div className='flex justify-center'>
                            <Skeleton className='h-6 w-20 rounded-full' />
                          </div>
                        ) : column.type === 'price' ? (
                          <div className='flex items-center justify-center gap-2'>
                            <Skeleton className='h-4 w-14' />
                            <Skeleton className='h-4 w-8' />
                          </div>
                        ) : (
                          <Skeleton className='h-4 w-32 mx-auto' />
                        )
                      ) : column.type === 'img' ? (
                        <div className='relative cursor-pointer w-[80px] h-12 mr-auto'>
													
                          <Img onClick={() => handleImageClick(row[column.key])} src={row[column.key]} alt='Image' className='w-full h-full object-cover rounded-md' />
                          <Eye className='absolute top-[-8px] right-[-8px] p-[2px] rounded-md bg-white' onClick={() => handleImageClick(row[column.key])} />
                        </div>
                      ) : column.key === 'status' ? (
                        <span className={getStatusClass(row[column.key], column)}>{row[column.key]}</span>
                      ) : column.type === 'price' ? (
                        <PriceTag price={row[column.key]} />
                      ) : (
                        row[column.key]
                      )}
                    </td>
                  );
                })}

                {actions && (
                  <td className='px-4 py-4 text-sm'>
                    {loading ? (
                      <div className='flex items-center justify-center gap-2'>
                        <Skeleton className='h-8 w-20' />
                        <Skeleton className='h-8 w-8 rounded-full' />
                      </div>
                    ) : (
                      actions && actions(row)
                    )}
                  </td>
                )}
              </tr>
            ))}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4">
                  <EmptyState
                    title="Nothing to show here"
                    subtitle="No rows match your current filters. You can clear filters or try a different search."
                   />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between items-center mt-8 py-4 px-4 border-t border-t-slate-200'>
        <span className='text-sm text-gray-500'>
          {loading ? (
            <Skeleton className='h-4 w-56' />
          ) : (
            <>
              Showing {showingFrom}-{showingTo} of {data.length}
            </>
          )}
        </span>

        {/* Pagination */}
        <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
          <Pagination className='!mt-0' page={currentPage} totalPages={totalPages} setPage={handlePageChange} />
        </div>
      </div>

      {selectedImage && !loading && (
        <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-50'>
          <div className='relative bg-white p-4 rounded-md'>
            <button onClick={closeImagePreview} className='w-[45px] h-[45px] flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-[1.05] duration-300 absolute top-2 right-2 text-white bg-black rounded-full p-2'>
              <X />
            </button>
             <Img src={selectedImage} alt='Preview' className='max-w-[90vw] max-h-[90vh]' />
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
