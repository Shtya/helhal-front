import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

export function Modal({ title, children, onClose, className }) {
  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-[105] grid place-items-center bg-black/40 p-4'>
      {/* 1. Added 'flex flex-col' to the container */}
      <div
        className={`w-full min-w-0 max-w-lg rounded-2xl bg-white p-6 shadow-lg max-h-[98vh] flex flex-col ${className}`}
      >
        {/* 2. Added 'flex-shrink-0' to ensure the header never gets squashed */}
        <div className='flex items-center justify-between flex-shrink-0'>
          <h4 className='text-lg font-semibold text-[#292D32]'>{title}</h4>
          <button
            onClick={onClose}
            className='rounded-lg border border-[#EDEDED] px-3 py-2 cursor-pointer hover:scale-[1.05] duration-100 text-[#292D32]'
          >
            <X />
          </button>
        </div>

        {/* 3. Added 'flex-1' and 'min-h-0' to tell the content to fill the remaining height and scroll */}
        <div className='mt-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1'>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}