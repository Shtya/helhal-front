'use client';
import { Link } from '@/i18n/navigation';
import React from 'react';

export default function Button({ name, disabled, icon, srcImg, onClick, href, className = '', color = 'green', type = "button", loading = false }) {
  const colorClasses = {
    secondary: 'bg-slate-100 dark:bg-dark-bg-input border border-slate-200 dark:border-dark-border !text-slate-700 dark:!text-dark-text-primary hover:bg-slate-200  dark:hover:bg-dark-bg-input',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 focus-visible:ring-blue-400/50',
    blue: 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 focus-visible:ring-blue-400/50',
    green: 'bg-main-600 text-white hover:bg-main-700 dark:hover:bg-main-500 focus-visible:ring-main-400/50',
    success: 'bg-main-600 text-white hover:bg-main-700 dark:hover:bg-main-500 focus-visible:ring-main-400/50',
    red: 'bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-500 focus-visible:ring-rose-400/50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-500 focus-visible:ring-rose-400/50',
    yellow: 'bg-amber-500 text-white hover:bg-amber-600 dark:hover:bg-amber-400 focus-visible:ring-amber-400/50',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 dark:hover:bg-amber-400 focus-visible:ring-amber-400/50',
    black: 'bg-black dark:bg-dark-bg-card text-white hover:bg-black/90 dark:hover:bg-dark-bg-input focus-visible:ring-black/40',
    gray: 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 dark:hover:bg-gray-600 focus-visible:ring-gray-400/40',
    neutral: 'bg-gray-100 dark:bg-dark-bg-input text-gray-900 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-bg-input focus-visible:ring-gray-300',

    // outlines / subtle
    outline: 'bg-transparent text-gray-800 dark:text-dark-text-primary border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-input focus-visible:ring-gray-300',
    ghost: 'bg-transparent text-gray-800 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-input focus-visible:ring-gray-200',
    subtle: 'bg-gray-100 dark:bg-dark-bg-input text-gray-900 dark:text-dark-text-primary hover:bg-gray-200  dark:hover:bg-dark-bg-input focus-visible:ring-gray-300',
  };

  // Base class: removed !py-[5px] to allow for more flexible height, used leading-none for alignment
  const baseClass = `cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-lg text-lg max-md:text-base px-4 py-2.5 transition-all duration-300 active:scale-95`;

  const finalClass = `${baseClass} ${colorClasses[color]} ${disabled ? '!opacity-40 !cursor-not-allowed !pointer-events-none' : ''} ${className}`;

  // Skeleton-aware loading spinner
  const loadingContent = (
    <div className='w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin'></div>
  );

  const content = loading ? (
    loadingContent
  ) : (
    <>
      {srcImg && <img src={srcImg} alt='icon' className='h-5 w-5 object-contain dark:brightness-90' />}
      {name && <span className='text-nowrap font-medium'>{name}</span>}
      {icon && <span className='shrink-0'>{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={finalClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} onClick={onClick} className={finalClass}>
      {content}
    </button>
  );
}