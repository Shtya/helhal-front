'use client';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ title, size = 'md', onClose, children, show = true }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl p-6 
                        max-h-[90vh] overflow-auto`} // 👈 here
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}>
            {/* Header */}
            <div className='flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2'>
              {title && <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>}
              <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Body (form goes here) */}
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
