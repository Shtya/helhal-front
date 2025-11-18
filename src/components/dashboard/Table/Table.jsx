// ===== components/common/Table.jsx =====
'use client';
import { useMemo, useState } from 'react';
import Pagination from './Pagination';
import { Eye, X } from 'lucide-react';
import PriceTag from '@/components/atoms/priceTag';

import Img from '@/components/atoms/Img';
import TableEmptyState from './TableEmptyState';

const Skeleton = ({ className = '' }) => <div className={`shimmer rounded-md bg-slate-200/70 ${className}`} />;



export default function Table({
  data,
  columns,
  Actions,
  loading = false,
  rowsPerPage = 10,
  page, // NEW (optional): server current page
  totalCount, // NEW (optional): server total rows
  onPageChange, // NEW (optional): server page setter
}) {
  const [currentPage, setCurrentPage] = useState(1); // client mode fallback
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const serverMode = typeof totalCount === 'number' && typeof page === 'number' && typeof onPageChange === 'function';

  const handlePageChange = p => {
    if (loading) return;
    if (serverMode) onPageChange(p);
    else setCurrentPage(p);
  };

  const effectivePage = serverMode ? page : currentPage;
  const startIndex = (effectivePage - 1) * rowsPerPage;
  const currentRows = useMemo(() => {
    // server mode: API already returned just this page
    return serverMode ? data : data.slice(startIndex, startIndex + rowsPerPage);
  }, [serverMode, data, startIndex, rowsPerPage]);

  const getStatusClass = (status, column) => {
    const statusMapping = column?.status?.find(item => item[0] === status);
    return statusMapping ? statusMapping[1] : 'text-slate-600';
  };

  const handleImageClick = imageSrc => {
    if (!loading) {
      setIsImageLoading(true)
      setSelectedImage(imageSrc)
    };
  };

  const closeImagePreview = () => setSelectedImage(null);

  const displayRows = loading ? Array.from({ length: rowsPerPage }).map((_, i) => ({ __skeleton: i })) : currentRows;

  const fullCount = serverMode ? totalCount ?? 0 : data.length;

  const totalPages = Math.max(1, Math.ceil(fullCount / rowsPerPage));
  const showingFrom = loading || fullCount === 0 ? 0 : Math.min((effectivePage - 1) * rowsPerPage + 1, fullCount);
  const showingTo = loading || fullCount === 0 ? 0 : Math.min(effectivePage * rowsPerPage, fullCount);


  return (
    <div className='  rounded-xl shadow-inner ring-1 ring-slate-200' aria-busy={loading} aria-live='polite'>
      <div className='overflow-x-auto overflow-y-hidden rounded-xl pb-12'>
        <table className='w-full table-auto border-collapse'>
          <thead className='bg-slate-50/80 backdrop-blur sticky top-0 z-10 border-b border-slate-200'>
            <tr>
              {columns.map(column => (
                <th key={column.key} className='px-4 py-4 rtl:text-right ltr:text-left text-sm text-nowrap font-semibold text-slate-700'>
                  {loading ? <Skeleton className='h-4 w-24' /> : column.label}
                </th>
              ))}
              {Actions && <th className='px-4 py-4 rtl:text-right ltr:text-left text-sm text-nowrap font-semibold text-slate-700'>{loading ? <Skeleton className='h-4 w-16' /> : 'Action'}</th>}
            </tr>
          </thead>

          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={row.__skeleton ?? idx} className='odd:bg-emerald-50/20 hover:bg-slate-50'>
                {columns.map(column => {
                  const isSkeleton = loading || row.__skeleton !== undefined;
                  if (isSkeleton) {
                    return (
                      <td key={column.key} className='text-nowrap px-4 py-4 text-sm text-slate-800'>
                        {column.type === 'img' ? (
                          <div className='relative w-[42px] h-[42px]'>
                            <Skeleton className='w-full h-full rounded-full' />
                          </div>
                        ) : column.key === 'status' ? (
                          <div className='flex justify-start'>
                            <Skeleton className='h-6 w-24 rounded-full' />
                          </div>
                        ) : column.type === 'price' ? (
                          <div className='flex items-center gap-2'>
                            <Skeleton className='h-4 w-14' />
                            <Skeleton className='h-4 w-8' />
                          </div>
                        ) : (
                          <Skeleton className='h-4 w-28' />
                        )}
                      </td>
                    );
                  }

                  // Render actual cell
                  return (
                    <td key={column.key} className='text-nowrap px-4 py-4 text-sm text-slate-800 align-middle'>
                      {column.render ? (
                        column.render(row)
                      ) : column.type === 'img' ? (
                        <div className='relative cursor-zoom-in w-[42px] h-[42px]'>
                          <Img onClick={() => handleImageClick(row[column.key])} src={row[column.key] || ''} alt='Avatar' className='w-full h-full object-cover rounded-full ring-1 ring-slate-200' />
                          <Eye className='absolute -top-1 -right-1 p-[2px] rounded-md bg-white/90 ring-1 ring-slate-200' onClick={() => handleImageClick(row[column.key])} size={16} />
                        </div>
                      ) : column.key === 'status' ? (
                        <span className={getStatusClass(row[column.key], column)}>{row[column.key]}</span>
                      ) : column.type === 'price' ? (
                        <PriceTag price={row[column.key]} />
                      ) : column.type === 'date' ? (
                        row[column.key] ? (
                          new Date(row[column.key]).toLocaleDateString()
                        ) : (
                          '—'
                        )
                      ) : (
                        row[column.key] ?? '—'
                      )}
                    </td>
                  );
                })}

                {Actions && <td className='px-4 py-4 text-sm'>{loading ? <Skeleton className='h-8 w-20' /> : <Actions row={row} />}</td>}
              </tr>
            ))}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (Actions ? 1 : 0)} className='px-4'>
                  <TableEmptyState title='Nothing to show here' subtitle='No rows match your current filters. You can clear filters or try a different search.' />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between items-center mt-8 py-4 px-4 border-t border-t-slate-200'>
        <span className='text-sm text-slate-600'>
          {loading ? (
            <Skeleton className='h-4 w-56' />
          ) : (
            <>
              Showing {showingFrom}-{showingTo} of {fullCount}
            </>
          )}
        </span>

        <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
          <Pagination className='!mt-0' page={effectivePage} totalPages={totalPages} setPage={handlePageChange} />
        </div>
      </div>

      {selectedImage && !loading && (
        <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-50'>
          <div className={`relative  rounded-xl `}>
            <button onClick={closeImagePreview} className='w-9 h-9 inline-flex items-center justify-center z-[52] absolute -top-3 -right-3 text-white bg-slate-900 rounded-full shadow hover:opacity-90'>
              {!isImageLoading ? <X /> :
                <span className="relative flex h-6 w-6">
                  <span className="absolute h-full w-full rounded-full border-4 border-white/30 border-t-white animate-spin"></span>
                  <span className="absolute h-full w-full rounded-full border-4 border-transparent border-r-white animate-spin-slow"></span>
                </span>}
            </button>
            <Img src={selectedImage} alt='Preview' className={`${!isImageLoading && 'bg-white ring-1 ring-slate-200'}   p-4 max-w-[80vw] max-h-[80vh] rounded-md  `} onLoad={() => setIsImageLoading(false)} />

          </div>
        </div>
      )}
    </div>
  );
}
