import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

export function Modal({ title, children, onClose, className }) {
  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-[105] grid place-items-center bg-black/40 p-4'>
      <div className={`w-full min-w-0 max-w-lg rounded-2xl bg-white p-6 shadow-lg ${className}`}
      >
        <div className='flex items-center justify-between'>
          <h4 className='text-lg font-semibold text-[#292D32]'>{title}</h4>
          <button onClick={onClose} className='rounded-lg border border-[#EDEDED] px-3 py-2 cursor-pointer hover:scale-[1.05] duration-100 text-[#292D32]'>
            <X />
          </button>
        </div>
        <div className='mt-4'>{children}</div>
      </div>
    </div>,
    document.body
  );
}
