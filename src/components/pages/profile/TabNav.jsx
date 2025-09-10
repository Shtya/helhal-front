'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TabNav({ tabs = [], active, subActive, onChange, onSubChange }) {
  const activeKey = useMemo(() => active, [active]);
  const activeTab = tabs.find(t => t.value === activeKey);

  return (
    <>
      <div className='overflow-x-auto  scroll !scrollbar-hide !w-fit !max-w-full mx-auto  flex items-center gap-2 rounded-full bg-slate-50/80 backdrop-blur-xl border border-slate-200 p-2 shadow-inner  '>
        {tabs.map((t, idx) => {
          const isActive = activeKey === (t.value ?? t.href);
          const content = (
            <>
              {t.icon && <img src={t.icon} alt='' className='w-4 h-4 opacity-80 group-hover:opacity-100 transition' />}
              <span className='relative text-nowrap z-10'>{t.label}</span>
              {typeof t.badge === 'number' && (
                <span
                  className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] transition
                    ${isActive ? 'bg-emerald-500/20 text-emerald-900' : 'bg-slate-200 text-slate-700'}
                  `}>
                  {t.badge}
                </span>
              )}
            </>
          );

          const baseClasses = `group relative cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2`;
 
          return (
            <button key={t.value || idx} type='button' onClick={() => onChange?.(t.value)} className={`${baseClasses} ${isActive ? 'text-white' : 'text-slate-600 hover:text-emerald-600'}`}>
              {isActive && <motion.span layoutId='active-pill' className='absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg' transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              {content}
            </button>
          );
        })}
      </div>

      {/* Sub Tabs */}
      <AnimatePresence mode='wait'>
        {activeTab?.subTabs && (
          <motion.div key={activeTab.value} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className={` ${active !== "billing" && "lg:hidden"} overflow-x-auto  scroll !scrollbar-hide !w-fit !max-w-full mx-auto flex items-center gap-1 rounded-full bg-slate-50/80 backdrop-blur-xl border border-slate-200 p-1 shadow-inner mt-4`}>
            {activeTab.subTabs.map(st => {
              const isSubActive = subActive === st.value;
              return (
                <button
                  key={st.value}
                  type='button'
                  onClick={() => onSubChange?.(st.value)}
                  className={` text-nowrap cursor-pointer duration-300 relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition-all
                    ${isSubActive ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow' : 'bg-white shadow-inner border border-slate-100 text-slate-700 hover:bg-slate-200 hover:text-emerald-600'}
                  `}>
                  {st.icon && st.icon}
                  {st.label}
                  {st.badge && <span className='inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] '>{st.badge}</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
