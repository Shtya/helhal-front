import { useEffect, useRef, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
export const SelectInput = ({
  label,
  options = [],
  value,
  onChange,
  error,
  disabled = false,
  ...props
}) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  const handleSelect = val => {
    if (!disabled && val !== value) {
      onChange?.(val);
    }
  };

  return (
    <div className='w-full mb-5'>
      <div className='p-4 border border-slate-200 rounded-xl shadow-inner'>
        {label && <label className='block text-sm text-gray-600 mb-2'>{label}</label>}

        <LayoutGroup id={`select-tabs-${Math.random()}`}>
          <div className='flex items-center space-x-2'>
            {options.map(option => {
              const isActive = value === option.value;
              const isHovered = hoveredTab === option.value;

              return (
                <motion.button
                  key={option.value}
                  type='button'
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHoveredTab(option.value)}
                  onMouseLeave={() => setHoveredTab(null)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative rounded-2xl px-6 py-2 transition-colors duration-200
                    ${isActive ? 'bg-main-500 text-white' : 'bg-slate-100 text-gray-700'}
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${isHovered && !disabled ? 'bg-main-600 ' : ''}`}
                  disabled={disabled}
                >
                  {isActive && (
                    <motion.span
                      layoutId='active-pill'
                      className='absolute inset-0 rounded-xl bg-gradient-to-r from-main-500 to-main-400 shadow-lg'
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className='relative z-10'>{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>

        {error && (
          <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
            ⚠ {error}
          </p>
        )}
      </div>
    </div>
  );
};
