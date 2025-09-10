'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';

export default function Breadcrumbs({ items = [], activeIndex = 1, onStepClick, className = '', accentClass = 'text-emerald-600', homeHref = '/' }) {
  const [revealedCount, setRevealedCount] = useState(Math.max(1, activeIndex + 1));

  useEffect(() => {
    setRevealedCount(prev => Math.max(prev, activeIndex + 1));
  }, [activeIndex]);

  const lastVisibleIndex = Math.min(revealedCount, items.length) - 1;
  const visibleItems = items.slice(0, revealedCount);

  return (
    <div className={`my-[20px] ${className}`} aria-label='Breadcrumb'>
      <ol className='flex items-center gap-2 w-fit rounded-2xl bg-slate-50 px-4 py-2 border border-slate-100'>
        <li className='flex items-center'>
          <Link
            href={'/share-job-description'}
            className='inline-flex items-center -ml-1.5 p-1.5 rounded-lg hover:bg-slate-100'
            title='Home'
            onClick={e => {
              e.preventDefault();
              onStepClick?.(1);
            }}>
            <svg width="30" height="30" className='ltr:mr-3 rtl:ml-3' viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_91_17526)"><path d="M57.3816 23.6815L54.7066 21.0031C54.1406 20.44 53.8308 19.6892 53.8308 18.8937V15.1039C53.8308 10.176 49.8213 6.1658 44.8943 6.1658H41.1052C40.3217 6.1658 39.5532 5.84701 38.9991 5.29285L36.3211 2.61439C32.8359 -0.871465 27.1701 -0.871465 23.6848 2.61439L21.0009 5.29285C20.4468 5.84701 19.6783 6.1658 18.8948 6.1658H15.1058C10.1787 6.1658 6.1692 10.176 6.1692 15.1039V18.8937C6.1692 19.6892 5.8594 20.44 5.2964 21.0031L2.61841 23.6785C0.929402 25.3678 0 27.6143 0 30.0007C0 32.3872 0.93238 34.6337 2.61841 36.32L5.29342 38.9984C5.8594 39.5615 6.1692 40.3123 6.1692 41.1078V44.8976C6.1692 49.8255 10.1787 53.8357 15.1058 53.8357H18.8948C19.6783 53.8357 20.4468 54.1545 21.0009 54.7086L23.6789 57.3901C25.4215 59.13 27.7093 60 29.997 60C32.2848 60 34.5725 59.13 36.3152 57.3871L38.9932 54.7086C39.5532 54.1545 40.3217 53.8357 41.1052 53.8357H44.8943C49.8213 53.8357 53.8308 49.8255 53.8308 44.8976V41.1078C53.8308 40.3123 54.1406 39.5615 54.7066 38.9984L57.3816 36.323C59.0676 34.6337 60 32.3902 60 30.0007C60 27.6113 59.0706 25.3678 57.3816 23.6815ZM43.5687 26.5208L25.6956 38.4383C25.1921 38.775 24.6142 38.9388 24.0423 38.9388C23.2738 38.9388 22.5112 38.6409 21.9363 38.0659L15.9786 32.1072C14.8138 30.9422 14.8138 29.0593 15.9786 27.8943C17.1433 26.7294 19.0259 26.7294 20.1906 27.8943L24.4206 32.125L40.2621 21.5632C41.6354 20.6485 43.4823 21.0179 44.3938 22.3885C45.3083 23.759 44.9389 25.6092 43.5687 26.5208Z" fill="#108A00"/></g><defs><clipPath id="clip0_91_17526"><rect width="60" height="60" fill="white"/></clipPath></defs></svg>
            Share Job Description
          </Link>
        </li>

        {visibleItems.map((it, i) => {
          const isLastVisible = i === lastVisibleIndex;
          const isActive = i === activeIndex;

          return (
            <React.Fragment key={`${it.label}-${i}`}>
              <li aria-hidden className='text-slate-400'>
                <img src='/icons/arrow-right.svg' className='h-4 w-4' />
              </li>

              <li className='min-w-0 text-lg'>
                {it.href ? (
                  <Link
                    href={it.href}
                    className={`truncate font-[500] ${isActive ? `${accentClass} opacity-100` : 'opacity-80 hover:text-slate-900'}`}
                    title={it.label}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={e => {
                      e.preventDefault();
                      onStepClick?.(i);
                    }}>
                    {it.label}
                  </Link>
                ) : (
                  <button type='button' title={it.label} aria-current={isActive ? 'page' : undefined} onClick={() => onStepClick?.(i)} className={`truncate font-[500] transition ${isActive ? `${accentClass} opacity-100` : 'text-slate-700 opacity-80 hover:opacity-100'}`}>
                    {it.label}
                  </button>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
