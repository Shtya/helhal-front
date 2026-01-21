'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';


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
  initial: { y: 0, scale: 1, opacity: 0, yOffset: 8 },
  in: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  hover: { scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 18 } },
  tap: { scale: 0.98 },
};

const dotVariants = {
  hover: { scale: 1.06, transition: { type: 'spring', stiffness: 300, damping: 18 } },
};

export default function Pagination({
  page,
  totalPages,
  setPage,
  className = '',
  siblingCount = 1,
  boundaryCount = 1,
  loading = false,
  recordsCount = false,
  jumpBy = 5, // how many pages to jump when clicking ellipsis
}) {
  const navRef = useRef(null);
  const t = useTranslations('Pagination');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  // hooks always run
  const tokens = useMemo(
    () => buildPageTokens({ page, totalPages, siblingCount, boundaryCount }),
    [page, totalPages, siblingCount, boundaryCount]
  );

  const goTo = useCallback(
    (p) => {
      const next = Math.min(Math.max(1, p), totalPages);
      setPage(next);
    },
    [setPage, totalPages]
  );

  const onKey = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') goTo(page - 1);
      if (e.key === 'ArrowRight') goTo(page + 1);
    },
    [page, goTo]
  );

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [onKey]);

  // safe conditional render AFTER hooks
  if (totalPages <= 1) {
    return null;
  };
  if (!loading && (recordsCount ?? 0) === 0) return null;

  return (
    <div className={`flex justify-center mt-8 ${className}`}>
      <nav
        ref={navRef}
        className="flex items-center flex-wrap sm:flex-nowrap gap-1 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm px-2 py-1"
        aria-label="Pagination"
        role="navigation"
        tabIndex={0}
      >
        {/* Prev */}
        <motion.button
          variants={btnVariants}
          initial="initial"
          animate="in"
          whileHover="hover"
          whileTap="tap"
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page === 1 || loading}
          aria-label={t('previous')}
          className="cursor-pointer h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-main-500/50"
        >
          {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>

        {/* Pages */}
        {tokens.map((token, i) => {
          if (token === 'left-ellipsis' || token === 'right-ellipsis') {
            const jumpTarget =
              token === 'left-ellipsis'
                ? Math.max(1, page - jumpBy)
                : Math.min(totalPages, page + jumpBy);
            return (
              <motion.button
                key={`${token}-${i}`}
                variants={dotVariants}
                whileHover="hover"
                type="button"
                disabled={loading}
                onClick={() => goTo(jumpTarget)}
                aria-label={
                  token === 'left-ellipsis'
                    ? t('jumpBack', { count: jumpBy })
                    : t('jumpForward', { count: jumpBy })
                }
                className="cursor-pointer h-9 min-w-9 px-2 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-main-500"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            );
          }

          const isActive = token === page;
          return (
            <motion.button
              key={token}
              variants={btnVariants}
              initial="initial"
              animate="in"
              whileHover="hover"
              whileTap="tap"
              type="button"
              onClick={() => goTo(token)}
              disabled={loading}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'cursor-pointer h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-medium focus:outline-none focus:ring-2',
                isActive
                  ? 'bg-main-500 text-white shadow-sm focus:ring-main-500'
                  : 'text-slate-700 hover:bg-slate-100 focus:ring-main-500',
              ].join(' ')}
            >
              {token}
            </motion.button>
          );
        })}

        {/* Next */}
        <motion.button
          variants={btnVariants}
          initial="initial"
          animate="in"
          whileHover="hover"
          whileTap="tap"
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages || loading}
          aria-label={t('next')}
          className="cursor-pointer h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-main-500/50"
        >
          {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </motion.button>
      </nav>
    </div>
  );
}