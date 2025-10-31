// Pagination.js - A reusable pagination component
import React, { useEffect } from 'react';
import Select from '../atoms/Select';

const TabsPagination = ({ currentPage, totalPages, onPageChange, onItemsPerPageChange, itemsPerPage, className }) => {


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage])
  return (
    totalPages > 1 && ( // Only show pagination if there is more than one page
      <div className={`flex flex-col xs:flex-row items-center xs:justify-between w-full gap-4 mt-6` + (className ? ` ${className}` : '')}>
        {/* Prev / Next */}
        <div className={`flex items-center space-x-1 xs:space-x-2  ${onItemsPerPageChange ? 'justify-center xs:justify-start' : 'flex-1 justify-between'}`}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 cursor-pointer gradient text-white rounded-l-md disabled:!opacity-30"
          >
            Prev
          </button>
          <span className="px-4 py-2">{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 cursor-pointer gradient text-white rounded-r-md disabled:opacity-30"
          >
            Next
          </button>
        </div>

        {/* Items per page selector */}
        {onItemsPerPageChange && <Select
          options={[
            { id: 5, name: '5' },
            { id: 10, name: '10' },
            { id: 20, name: '20' },
            { id: 50, name: '50' },
          ]}
          value={itemsPerPage}
          onChange={selectedOption => onItemsPerPageChange(Number(selectedOption.name))}
          placeholder="Select items per page"
          cnLabel="text-sm text-gray-600"
          cnSelect="text-sm text-gray-700"
          className="!w-fit xs:ml-auto"
        />}
      </div>

    )
  );
};

export default TabsPagination;
