// ===== components/atoms/Pagination.jsx =====
'use client';
import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

function makeRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPageTokens({ page, totalPages, siblingCount = 1, boundaryCount = 1 }) {
  if (totalPages <= 1) return [1];

  // 1) Collect pages we always want to show:
  const pages = new Set();

  // left boundary
  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) pages.add(i);

  // siblings around current page
  const left = Math.max(1, page - siblingCount);
  const right = Math.min(totalPages, page + siblingCount);
  for (let i = left; i <= right; i++) pages.add(i);

  // right boundary
  for (let i = Math.max(totalPages - boundaryCount + 1, 1); i <= totalPages; i++) pages.add(i);

  // 2) Sort the pages we chose
  const sorted = Array.from(pages).sort((a, b) => a - b);

  // 3) Build tokens with smart gaps:
  // - if gap === 2, insert the missing page (e.g., show 1 2 3 instead of 1 … 3)
  // - if gap  >  2, use ellipsis
  const tokens = [];
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];

    if (i === 0) {
      tokens.push(curr);
      continue;
    }

    if (curr - prev === 1) {
      tokens.push(curr);
    } else if (curr - prev === 2) {
      tokens.push(prev + 1, curr); // fill single hole (fixes the “2 after 1” case)
    } else {
      tokens.push('right-ellipsis', curr); // generic gap
    }
  }

  // Normalize: turn the first gap token into 'left-ellipsis'
  if (tokens.includes('right-ellipsis')) {
    const idx = tokens.indexOf('right-ellipsis');
    tokens[idx] = 'left-ellipsis';
  }

  return tokens;
}

const btnVariants = {
  in: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  hover: { scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 18 } },
  tap: { scale: 0.98 },
};

const dotVariants = { hover: { scale: 1.06, transition: { type: 'spring', stiffness: 300, damping: 18 } } };

export default function Pagination({ page, totalPages, setPage, className = '', siblingCount = 1, boundaryCount = 1, jumpBy = 5 }) {
  // IMPORTANT: keep hooks order stable (no early returns before hooks!)
  const navRef = useRef(null);
  const tokens = useMemo(() => buildPageTokens({ page, totalPages, siblingCount, boundaryCount }), [page, totalPages, siblingCount, boundaryCount]);

  const goTo = useCallback(
    p => {
      const next = Math.min(Math.max(1, p), totalPages);
      setPage(next);
    },
    [setPage, totalPages],
  );

  const onKey = useCallback(
    e => {
      if (e.key === 'ArrowLeft') goTo(page - 1);
      if (e.key === 'ArrowRight') goTo(page + 1);
    },
    [page, goTo],
  );

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (totalPages <= 1) return null; // after hooks — safe

  return (
    <div className={`flex justify-center mt-8 ${className}`}>
      <nav ref={navRef} className='flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm px-2 py-1' aria-label='Pagination' role='navigation' tabIndex={0}>
        {/* Prev */}
        <motion.button variants={btnVariants} animate='in' whileHover='hover' whileTap='tap' type='button' onClick={() => goTo(page - 1)} disabled={page === 1} aria-label='Previous page' className='h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'>
          <ChevronLeft className='h-4 w-4' />
        </motion.button>

        {/* Pages */}
        {tokens.map((t, i) => {
          if (t === 'left-ellipsis' || t === 'right-ellipsis') {
            const jumpTarget = t === 'left-ellipsis' ? Math.max(1, page - jumpBy) : Math.min(totalPages, page + jumpBy);
            return (
              <motion.button key={`${t}-${i}`} variants={dotVariants} whileHover='hover' type='button' onClick={() => goTo(jumpTarget)} aria-label={`Jump to page ${jumpTarget}`} className='h-9 min-w-9 px-2 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500' title={`Jump ${t === 'left-ellipsis' ? `back ${jumpBy}` : `forward ${jumpBy}`} pages`}>
                <MoreHorizontal className='w-4 h-4' />
              </motion.button>
            );
          }

          const isActive = t === page;
          return (
            <motion.button key={t} variants={btnVariants} animate='in' whileHover='hover' whileTap='tap' type='button' onClick={() => goTo(t)} aria-current={isActive ? 'page' : undefined} className={['h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-medium focus:outline-none focus:ring-2', isActive ? 'bg-emerald-500 text-white shadow-sm focus:ring-emerald-500' : 'text-slate-700 hover:bg-slate-100 focus:ring-emerald-500'].join(' ')}>
              {t}
            </motion.button>
          );
        })}

        {/* Next */}
        <motion.button variants={btnVariants} animate='in' whileHover='hover' whileTap='tap' type='button' onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label='Next page' className='h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50'>
          <ChevronRight className='h-4 w-4' />
        </motion.button>
      </nav>
    </div>
  );
}
