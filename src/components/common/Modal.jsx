import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

export function Modal({ title, children, onClose, className }) {
  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-[105] grid place-items-center bg-black/60 dark:bg-black/80 p-4 transition-colors duration-300'>
      {/* Container */}
      <div
        className={`w-full min-w-0 max-w-lg rounded-2xl bg-white dark:bg-dark-bg-card p-6 shadow-xl max-h-[98vh] flex flex-col border border-transparent dark:border-dark-border transition-all ${className}`}
      >
        {/* Header - flex-shrink-0 ensures it never squashes */}
        <div className='flex items-center justify-between flex-shrink-0'>
          <h4 className='text-lg font-bold text-[#292D32] dark:text-dark-text-primary'>
            {title}
          </h4>
          <button
            onClick={onClose}
            className='rounded-xl border border-[#EDEDED] dark:border-dark-border px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-bg-input transition-colors text-[#292D32] dark:text-dark-text-primary'
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - flex-1 and min-h-0 enables internal scrolling */}
        <div className='mt-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1 text-slate-600 dark:text-dark-text-secondary'>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}