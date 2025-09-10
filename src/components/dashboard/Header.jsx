'use client';

import { useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { usePathname } from '@/i18n/navigation';
import { menuItems } from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const [computedMeta, setComputedMeta] = useState({ title: '', desc: '' });
  useEffect(() => {
    if (pathname) {
      const index = menuItems?.find(e => e.href == pathname);
      setComputedMeta(index);
    }
  }, []);

  return (
    <MotionConfig reducedMotion='user'>
      <header
        className='
          sticky top-0 z-40
          bg-transparent
          backdrop-blur-xl
          supports-[backdrop-filter]:bg-white/40
        '
        aria-label='Page header'>
        <div className='flex flex-col gap-1 px-4 sm:px-6 py-2'>
          <div className='flex items-center gap-3'>
            <HamburgerButton open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className='flex items-start flex-col  '>
              <motion.h1
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className='
                text-xl sm:text-xl font-semibold tracking-tight
                bg-clip-text text-transparent
                bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900
              '>
                {computedMeta.title}
              </motion.h1>
              <motion.p initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className='text-sm text-slate-600 '>
                {computedMeta.desc}
              </motion.p>
            </div>
          </div>
        </div>

        <div className='h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent' />
      </header>
    </MotionConfig>
  );
}

function HamburgerButton({ open, onToggle, className = '' }) {
  return (
    <motion.button type='button' onClick={onToggle} aria-label={open ? 'Close sidebar' : 'Open sidebar'} aria-expanded={open} className={`relative bg-slate-100 border border-slate-300 cursor-pointer inline-grid place-items-center h-10 w-10 rounded-xl text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 transition ${className}`} whileTap={{ scale: 0.96 }}>
      <motion.span
        className='absolute inset-0 rounded-xl bg-white/55'
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          boxShadow: '0 6px 24px rgba(16,24,40,0.06)',
          border: '1px solid rgba(15,23,42,0.08)',
        }}
      />

      <motion.svg width='22' height='22' viewBox='0 0 24 24' className='relative z-10' initial={false} animate={open ? 'open' : 'closed'} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        {open ? <X /> : <Menu />}
      </motion.svg>
    </motion.button>
  );
}
