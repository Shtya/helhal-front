'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

const DESKTOP_BREAKPOINT = 1024; // tailwind lg

export default function DashboardLayout({ children, title, className }) {
  const [isMobile, setIsMobile] = useState(false);
  // On desktop: open = expanded (wide) vs collapsed (mini)
  // On mobile:  open = drawer visible
  const [open, setOpen] = useState(true);

  const computeIsMobile = useCallback(() => window.innerWidth < DESKTOP_BREAKPOINT, []);

  useLayoutEffect(() => {
    const mobile = computeIsMobile();
    setIsMobile(mobile);
    setOpen(mobile ? false : true);
    // prevent phantom horizontal scrollbars from previous renders
    document.documentElement.classList.add('overflow-x-hidden');
    document.body.classList.add('overflow-x-hidden');
    return () => {
      document.documentElement.classList.remove('overflow-x-hidden');
      document.body.classList.remove('overflow-x-hidden');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = computeIsMobile();
      setIsMobile(prev => {
        if (prev !== mobile) setOpen(mobile ? false : true);
        return mobile;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [computeIsMobile]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = () => setOpen(v => !v);

  return (
    <MotionConfig reducedMotion='user'>
      {/* Frame never exceeds viewport; kill horizontal scroll globally */}
      <div className='flex h-dvh w-screen overflow-x-hidden bg-slate-50'>
        {/* Sidebar */}
        {isMobile ? (
          <AnimatePresence initial={false}>
            {open && (
              <>
                {/* Backdrop */}
                <motion.div key='backdrop' className='fixed inset-0 z-40 bg-black/30 lg:hidden' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
                {/* Drawer */}
                <motion.aside key='drawer' initial={{ x: -320, opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} className='fixed left-0 top-0 z-50 h-full w-full max-w-[280px] bg-white border-r border-slate-200 shadow-xl'>
                  <Sidebar open={true} isMobile setOpen={setOpen} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        ) : (
          // Desktop: keep mounted and just animate width (no unmount = smooth close)
          <motion.aside layout initial={false} animate={{ width: open ? 260 : 76 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className='hidden lg:block h-full bg-white border-r border-slate-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]'>
            <Sidebar open={open} setOpen={setOpen} />
          </motion.aside>
        )}

        {/* Main column (must be shrinkable to avoid x-overflow) */}
        <div className='flex min-w-0 min-h-dvh flex-1 flex-col'>
          {/* Header constrained to a container that fits viewport width */}
          <motion.header layout className='sticky top-0 z-30 w-full border-b border-slate-200 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
            <div className='container  max-w-screen-xl '>
              <Header title={title} sidebarOpen={open} setSidebarOpen={setOpen} isMobile={isMobile} onHamburgerClick={toggle} />
            </div>
          </motion.header>

          <motion.main layout className={`flex-1 overflow-y-auto overflow-x-hidden ${className}`}>
            <div className='container  max-w-screen-xl !py-6 min-w-0'>
              {children}
            </div>
          </motion.main>
        </div>
      </div>
    </MotionConfig>
  );
}
