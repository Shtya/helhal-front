// import { Link } from '@/i18n/navigation';
// import React from 'react';

// export default function Breadcrumbs({ items = [], className = '',  homeHref = '/' }) {
//   const lastIndex = items.length - 1;

//   return (
//     <div className={`my-[20px] ${className}`} aria-label='Breadcrumb'>
//       <ol className='flex items-center gap-2 w-fit rounded-md bg-slate-50 px-4 py-1 border border-slate-200/80 '>
//         {/* Home */}
//         <li className='flex items-center'>
//           <Link href={homeHref} className='inline-flex items-center -ml-1.5 p-1.5 rounded-lg hover:bg-slate-100  ' title='Home'>
//             <svg className='h-3 w-3 mt-1 ' width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
//               <path d='M11.8314 5.57573L10.6299 4.37572L6.42472 0.175674C6.31207 0.0631898 6.15929 0 6 0C5.84071 0 5.68793 0.0631898 5.57528 0.175674L1.37011 4.37572L0.168634 5.57573C0.059205 5.68889 -0.00134602 5.84046 2.27095e-05 5.99778C0.00139144 6.1551 0.0645704 6.30559 0.175952 6.41683C0.287334 6.52808 0.438006 6.59118 0.595518 6.59255C0.75303 6.59391 0.904778 6.53344 1.01808 6.42414L1.19409 6.24834V10.8C1.19409 11.1182 1.32068 11.4235 1.546 11.6485C1.77132 11.8736 2.07692 12 2.39557 12H4.19779C4.35711 12 4.50991 11.9368 4.62257 11.8243C4.73523 11.7117 4.79852 11.5591 4.79852 11.4V8.99997C4.79852 8.84084 4.86182 8.68822 4.97448 8.5757C5.08714 8.46318 5.23994 8.39996 5.39926 8.39996H6.60074C6.76006 8.39996 6.91286 8.46318 7.02552 8.5757C7.13818 8.68822 7.20148 8.84084 7.20148 8.99997V11.4C7.20148 11.5591 7.26477 11.7117 7.37743 11.8243C7.49009 11.9368 7.64289 12 7.80221 12H9.60443C9.92308 12 10.2287 11.8736 10.454 11.6485C10.6793 11.4235 10.8059 11.1182 10.8059 10.8V6.24834L10.9819 6.42414C11.0952 6.53344 11.247 6.59391 11.4045 6.59255C11.562 6.59118 11.7127 6.52808 11.824 6.41683C11.9354 6.30559 11.9986 6.1551 12 5.99778C12.0013 5.84046 11.9408 5.68889 11.8314 5.57573Z' fill='#374151' />{' '}
//             </svg>
//           </Link>
//         </li>

//         {items.map((it, i) => {
//           const isLast = i === lastIndex;
//           return (
//             <React.Fragment key={`${it.label}-${i}`}>
//               <li aria-hidden className='text-slate-400 mt-1 opacity-60 '>
//                 <img src='/icons/arrow-right.svg' className='h-3 w-3' />
//               </li>
//               <li className='min-w-0 text-lg'>
//                 {isLast || !it.href ? (
//                   <span className={`truncate text-[#009966] font-[500] opacity-80`} aria-current='page' title={it.label}>
//                     {it.label}
//                   </span>
//                 ) : (
//                   <Link href={it.href} className='truncate opacity-80 font-[500] hover:text-slate-900 ' title={it.label}>
//                     {it.label}
//                   </Link>
//                 )}
//               </li>
//             </React.Fragment>
//           );
//         })}
//       </ol>
//     </div>
//   );
// }

// components/navigation/Breadcrumbs.jsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Home, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Breadcrumbs({
  items = [], // [{ href?: string, label: string, icon?: ReactNode }]
  className = '',
  homeHref = '/',
  maxVisible = 4, // collapse when more than this (keeps first + last 2)
  brand = '#108A00', // accent
}) {
  const lastIndex = items.length - 1;
  const needsCollapse = items.length > maxVisible;
  const middleStart = 1;
  const middleEnd = Math.max(lastIndex - 2, 1);
  const middle = needsCollapse ? items.slice(middleStart, middleEnd + 1) : [];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // close on outside click / ESC
  useEffect(() => {
    const onDoc = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = e => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <nav aria-label='Breadcrumb' className={`my-5 ${className}`}>
      <ol
        className='
          flex items-center gap-1 md:gap-2 w-full max-w-full
          rounded-2xl border border-slate-200 bg-white/80 backdrop-blur
          shadow-sm px-2.5 py-1.5 overflow-x-auto no-scrollbar
        '>
        {/* Home */}
        <Crumb>
          <Link href={homeHref} className='inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50' title='Home'>
            <Home className='h-4 w-4' />
            <span className='sr-only md:not-sr-only md:leading-none'>Home</span>
          </Link>
        </Crumb>

        {renderSep()}

        {/* When short, render all. When long, render first, ellipsis, last two */}
        {!needsCollapse ? (
          items.map((it, i) => (
            <React.Fragment key={`${it.label}-${i}`}>
              <CrumbItem item={it} isLast={i === lastIndex} brand={brand} />
              {i !== lastIndex && renderSep()}
            </React.Fragment>
          ))
        ) : (
          <>
            {/* First visible */}
            {items[0] && (
              <>
                <CrumbItem item={items[0]} isLast={false} brand={brand} />
                {renderSep()}
              </>
            )}

            {/* Collapsed middle */}
            <li className='relative' ref={menuRef}>
              <button onClick={() => setMenuOpen(s => !s)} aria-haspopup='menu' aria-expanded={menuOpen} className='inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200' title='More'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Open middle crumbs</span>
              </button>

              {/* Dropdown */}
              <div
                className={`
                  absolute left-0 mt-2 w-[260px] rounded-2xl border border-slate-200 bg-white
                  shadow-xl ring-1 ring-black/5 transition origin-top
                  ${menuOpen ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}
                `}>
                <ul className='max-h-[60vh] overflow-auto py-1'>
                  {middle.map((it, i) => (
                    <li key={`${it.label}-${i}`}>
                      {it.href ? (
                        <Link href={it.href} className='flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50' onClick={() => setMenuOpen(false)} title={it.label}>
                          {it.icon ? <span className='shrink-0 opacity-80'>{it.icon}</span> : <span className='shrink-0 h-2 w-2 rounded-full bg-slate-300' />}
                          <span className='truncate'>{it.label}</span>
                        </Link>
                      ) : (
                        <span className='flex items-center gap-2 px-3 py-2 text-sm text-slate-500'>
                          {it.icon ? <span className='shrink-0 opacity-60'>{it.icon}</span> : <span className='shrink-0 h-2 w-2 rounded-full bg-slate-200' />}
                          <span className='truncate'>{it.label}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>

            {renderSep()}

            {/* Last two always visible */}
            {items.slice(-2).map((it, i) => {
              const isLast = i === 1;
              return (
                <React.Fragment key={`${it.label}-tail-${i}`}>
                  <CrumbItem item={it} isLast={isLast} brand={brand} />
                  {!isLast && renderSep()}
                </React.Fragment>
              );
            })}
          </>
        )}
      </ol>
    </nav>
  );
}

/* ---------------- sub-components ---------------- */

function Crumb({ children }) {
  return <li className='flex items-center'>{children}</li>;
}

function CrumbItem({ item, isLast, brand }) {
  // current page style: pill with subtle gradient accent underline
  if (isLast || !item.href) {
    return (
      <Crumb>
        <span aria-current='page' title={item.label} className='group inline-flex items-center gap-2 max-w-[220px] md:max-w-[280px] truncate rounded-xl px-2 py-1 text-sm font-semibold text-emerald-700' style={{ color: brand }}>
          {item.icon && <span className='opacity-80'>{item.icon}</span>}
          <span className='truncate'>{item.label}</span>
          <span className='pointer-events-none absolute h-0.5 w-[calc(100%-16px)] translate-y-4 rounded-full' style={{ backgroundColor: `${brand}66` }} />
        </span>
      </Crumb>
    );
  }

  return (
    <Crumb>
      <Link href={item.href} className='group relative inline-flex items-center gap-2 max-w-[220px] md:max-w-[280px] truncate rounded-xl px-2 py-1 text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-50' title={item.label}>
        {item.icon && <span className='opacity-80'>{item.icon}</span>}
        <span className='truncate'>{item.label}</span>
        <span className='absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-transparent transition group-hover:bg-emerald-200' />
      </Link>
    </Crumb>
  );
}

function renderSep() {
  return (
    <li aria-hidden className='text-slate-300 px-0.5'>
      <ChevronRight className='h-4 w-4' />
    </li>
  );
}

/* Hide scrollbar (tailwind helper) */
