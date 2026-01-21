

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
  brand = 'var(--color-main-600)', // accent
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
        <span aria-current='page' title={item.label} className='group inline-flex items-center gap-2 max-w-[220px] md:max-w-[280px] truncate rounded-xl px-2 py-1 text-sm font-semibold text-main-700' style={{ color: brand }}>
          {item.icon && <span className='opacity-80'>{item.icon}</span>}
          <span className='truncate'>{item.label}</span>
          <span className='pointer-events-none absolute h-0.5 w-[calc(100%-16px)] translate-y-4 rounded-full' style={{ backgroundColor: `${brand}66` }} />
        </span>
      </Crumb>
    );
  }

  return (
    <Crumb>
      <Link href={item.href} className='group relative inline-flex items-center gap-2 max-w-[220px] md:max-w-[280px] truncate rounded-xl px-2 py-1 text-sm font-medium text-slate-700 hover:text-main-700 hover:bg-slate-50' title={item.label}>
        {item.icon && <span className='opacity-80'>{item.icon}</span>}
        <span className='truncate'>{item.label}</span>
        <span className='absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-transparent transition group-hover:bg-main-200' />
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
