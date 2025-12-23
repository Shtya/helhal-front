'use client';
import React, { useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  gradient = 'from-fuchsia-500 via-rose-500 to-orange-400',
  trend = null, // { label:"+12%", tone:"up"|"down" }
  spark = [], // small array of numbers for mini sparkline
}) {
  return (
    <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} className='relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm'>
      {/* Ribbon gradient */}
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />
      <div className='p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>{title}</p>
            <div className='mt-1 flex items-end gap-2'>
              <AnimatedCounter value={value} className='text-3xl font-extrabold text-slate-900' />
              {trend && <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${trend.tone === 'down' ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>{trend.label}</span>}
            </div>
          </div>
          <div className='shrink-0 grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-white to-slate-50 ring-1 ring-slate-200 shadow-inner'>{Icon ? <Icon className='h-5 w-5 text-slate-700' /> : null}</div>
        </div>

        {hint ? <p className='mt-1 text-xs text-slate-500'>{hint}</p> : null}

        {/* Sparkline */}
        {spark && spark.length > 1 ? (
          <svg viewBox='0 0 100 28' className='mt-4 h-8 w-full'>
            {/* baseline */}
            <polyline points={'0,27 100,27'} fill='none' stroke='currentColor' className='text-slate-200' strokeWidth='1' />
            {/* path */}
            {(() => {
              const min = Math.min(...spark);
              const max = Math.max(...spark);
              const range = max - min || 1;
              const pts = spark.map((v, i) => {
                const x = (i / (spark.length - 1)) * 100;
                const y = 27 - ((v - min) / range) * 24; // padding top
                return `${x},${y}`;
              });
              return <polyline points={pts.join(' ')} fill='none' stroke='currentColor' className='text-emerald-500' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round' />;
            })()}
          </svg>
        ) : null}
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ value, className = '' }) {
  // Accept numbers, strings, or formatted values. If number, animate.
  const [display, setDisplay] = React.useState(0);
  const numeric = typeof value === 'number' ? value : null;
  React.useEffect(() => {
    if (numeric === null) return setDisplay(value);
    let raf;
    let start;
    const d = 650; // ms
    const from = 0;
    const to = numeric;
    const step = t => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / d);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [numeric, value]);
  return <span className={className}>{display}</span>;
}

export function GlassCard({ children, className = '', gradient = 'from-sky-400 via-indigo-400 to-violet-500' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={` border border-slate-200 relative rounded-2xl bg-white/90 ring-1 ring-slate-200 p-5 sm:p-6 ${className}`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl [mask:linear-gradient(white,transparent)]`} style={{ border: '2px solid transparent' }} />
      <div className={`absolute -inset-px rounded-2xl ${gradient}`} />
      <div className='relative'>{children}</div>
    </motion.div>
  );
}

export function MetricBadge({ tone = 'info', children }) {
  const map = {
    info: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100',
    success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
    danger: 'bg-red-50 text-red-800 ring-1 ring-red-100',
    neutral: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function KPIGrid({ children }) {
  return <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5'>{children}</div>;
}

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[98vw] md:max-w-[90vw]',
};

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ className, open, title, subtitle, icon: Icon, onClose, size = 'md', footer, children, closeOnBackdrop = true, hideHeader = false, hideFooter = false, accent = 'emerald', initialFocusRef }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Scroll lock + focus trap + ESC
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const prevActive = document.activeElement;

    const focusFirst = () => {
      const el = panelRef.current;
      if (!el) return;
      const target = initialFocusRef?.current || el.querySelector(FOCUSABLE) || closeBtnRef.current || el;
      target?.focus();
    };

    const handleKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        i => i.offsetParent !== null || i === document.activeElement, // visible or currently focused
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // delay to ensure mounted
    const id = requestAnimationFrame(focusFirst);
    document.addEventListener('keydown', handleKey);

    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
      prevActive?.focus?.();
    };
  }, [open]);

  const accentGrad = {
    emerald: 'from-emerald-400/50 via-teal-400/40 to-sky-400/40',
    violet: 'from-violet-400/50 via-fuchsia-400/40 to-rose-400/40',
    sky: 'from-sky-400/50 via-indigo-400/40 to-violet-400/40',
    amber: 'from-amber-400/50 via-orange-400/40 to-rose-400/40',
    rose: 'from-rose-400/50 via-pink-400/40 to-fuchsia-400/40',
  }[accent];

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-[100] ${className}`}>
          {/* Backdrop */}
          <motion.div className='absolute inset-0 bg-slate-900/60 backdrop-blur-sm' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => closeOnBackdrop && onClose()} />
          {/* Panel */}
          <motion.div role='dialog' aria-modal='true' aria-labelledby={title ? 'modal-title' : undefined} className='pointer-events-none absolute inset-0 grid place-items-center p-4' initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
            <div ref={panelRef} className={`pointer-events-auto w-full ${SIZE_CLASS[size]} max-h-[90vh] overflow-x-hidden overflow-y-auto rounded-2xl`} onClick={e => e.stopPropagation()}>
              {/* Glow border */}
              <div className={`relative rounded-2xl`}>
                <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accentGrad} opacity-60 blur`} aria-hidden='true' />
                {/* Surface */}
                <div className='relative rounded-2xl bg-white/95 ring-1 ring-slate-200 shadow-2xl'>
                  {/* Header */}
                  {!hideHeader && (
                    <div className='sticky top-0 z-10 flex items-start gap-3 px-5 py-4 border-b border-b-slate-200 bg-white/80 backdrop-blur'>
                      {Icon && (
                        <div className='  mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-white to-slate-50 ring-1 ring-slate-200 shadow-inner'>
                          <Icon className='h-4 w-4 text-slate-700' />
                        </div>
                      )}
                      <div className='flex-1'>
                        {title ? (
                          <h2 id='modal-title' className='text-lg font-semibold text-slate-900'>
                            {title}
                          </h2>
                        ) : null}
                        {subtitle ? <p className='mt-0.5 text-sm text-slate-600'>{subtitle}</p> : null}
                      </div>
                      <button ref={closeBtnRef} onClick={onClose} className='cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500' aria-label='Close'>
                        <X className='h-5 w-5' />
                      </button>
                    </div>
                  )}

                  {/* Body (scrollable) */}
                  <div className='px-5 py-5 overflow-y-auto'>{children}</div>

                  {/* Footer */}
                  {!hideFooter && <div className='sticky bottom-0 z-10 flex items-center justify-end gap-3 px-5 py-4 border-t bg-white/80 backdrop-blur'>{footer}</div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
