"use client"
import { useState } from 'react';
import DataTableSearchBox from './DataTableSearchBox';
import TableEmptyState from '../Table/TableEmptyState';
import Img from '@/components/atoms/Img';
import { Eye } from 'lucide-react';
import PriceTag from '@/components/atoms/priceTag';

const Skeleton = ({ className = '' }) => <div className={`shimmer rounded-md bg-slate-200/70 ${className}`} />;


export default function DataTable({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  onView,
  onSearch,
  onPageChange,
  onLimitChange,
  page,
  limit,
  totalCount,
  search = '',
  actions = true,
}) {

  const displayRows = loading ? Array.from({ length: limit }).map((_, i) => ({ __skeleton: i })) : data;

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const showingFrom = loading || totalCount === 0 ? 0 : Math.min((page - 1) * limit + 1, totalCount);
  const showingTo = loading || totalCount === 0 ? 0 : Math.min(page * limit, totalCount);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Search and controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <DataTableSearchBox onSearch={onSearch} search={search} />

        <div className="flex items-center space-x-2">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={limit}
            onChange={(e) => onLimitChange(e.target.value)}
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {loading ? <Skeleton className='h-4 w-24' /> : column.title}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {loading ? <Skeleton className='h-4 w-16' /> : "Actions"}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className='px-4'>
                  <TableEmptyState title='Nothing to show here' subtitle='No rows match your current filters. You can clear filters or try a different search.' />
                </td>
              </tr>
            )}
            {displayRows.map((row, idx) => {
              const isSkeleton = loading || row.__skeleton !== undefined;
              return (
                <tr key={row.__skeleton ?? idx} className="hover:bg-gray-50 odd:bg-emerald-50/20">
                  {columns.map(column => {
                    if (isSkeleton) {
                      return (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.type === 'img' ? (
                            <div className="relative w-[42px] h-[42px]">
                              <Skeleton className="w-full h-full rounded-full" />
                            </div>
                          ) : column.key === 'status' ? (
                            <div className="flex justify-start">
                              <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                          ) : column.type === 'price' ? (
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-14" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                          ) : (
                            <Skeleton className="h-4 w-28" />
                          )}
                        </td>
                      );
                    }

                    // Render actual cell
                    return (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {column.render ? (
                          column.render(row[column.key], row)
                        ) : column.type === 'img' ? (
                          <div className="relative cursor-zoom-in w-[42px] h-[42px]">
                            <Img
                              src={row[column.key] || ''}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-full ring-1 ring-slate-200"
                            />
                          </div>
                        ) : column.key === 'status' ? (
                          <span className={getStatusClass(row[column.key], column)}>
                            {row[column.key]}
                          </span>
                        ) : column.type === 'price' ? (
                          <PriceTag price={row[column.key]} />
                        ) : column.type === 'date' ? (
                          row[column.key] ? new Date(row[column.key]).toLocaleDateString() : '—'
                        ) : (
                          row[column.key] ?? '—'
                        )}
                      </td>
                    );
                  })}

                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isSkeleton ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <>
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{showingFrom}</span> to{' '}
                <span className="font-medium">
                  {showingTo}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === p
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}