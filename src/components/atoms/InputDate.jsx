'use client';

import { useState, useRef, useEffect } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { CalendarDays } from 'lucide-react';
import Image from 'next/image';

export default function InputDate({ cnLabel, cnInput, className, label, placeholder = 'Select date', onChange }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      flatpickr(inputRef.current, {
        dateFormat: 'd M Y',
        onChange: selectedDates => {
          const date = selectedDates[0];
          if (date) {
            const formatted = date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            setValue(formatted);
            onChange?.(date);
          }
        },
      });
    }
  }, []);

  <div
    className={` ${cnInput} relative flex items-center rounded-md h-[40px] px-2 py-2 text-sm gap-1 
  transition-colors duration-300 border 
  ${value
        ? 'border-main-600'
        : 'border-gray-300 dark:border-dark-border'
      } 
  bg-white dark:bg-dark-bg-input
  focus-within:border-main-600 focus-within:ring-2 focus-within:ring-main-600/20`}
  >
    <span className='flex-none text-slate-400 dark:text-dark-text-secondary'>
      <Image src={'/icons/calendar.svg'} alt='icon' width={20} height={20} className="dark:invert-[0.2]" />
    </span>

    <input
      ref={inputRef}
      type='text'
      placeholder={placeholder}
      value={value}
      readOnly
      className='w-full bg-transparent outline-none text-slate-700 dark:text-dark-text-primary placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary cursor-pointer transition-colors duration-300'
    />
  </div>
}
