import React, { useCallback, useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';

export default function Tabs({ tabs, activeTab, setActiveTab, className = '', id = 'ui-tabs-pill' }) {
  const [hoveredTab, setHoveredTab] = useState(null);

  // Where the pill should be right now (hover preview or active)
  const pillTarget = useMemo(() => hoveredTab ?? activeTab, [hoveredTab, activeTab]);

  const onChange = useCallback(val => setActiveTab?.(val), [setActiveTab]);

  return (
    <LayoutGroup id={id}>
      <div
        role='tablist'
        aria-orientation='horizontal'
        className={`inline-flex p-1 max-w-full overflow-x-auto overflow-y-hidden rounded-xl bg-slate-100/80 ring-1 ring-black/5 shadow-sm ${className}`}
        onMouseLeave={() => setHoveredTab(null)} // snap back when leaving the whole group
      >
        {tabs.map(t => {
          const isActive = activeTab === t.value;
          const isPreviewed = pillTarget === t.value; // hovered OR active

          return (
            <motion.button
              key={t.value}
              type='button'
              role='tab'
              aria-selected={isActive}
              onClick={() => onChange(t.value)}
              onMouseEnter={() => setHoveredTab(t.value)}
              onMouseLeave={() => setHoveredTab(null)}
              onFocus={() => setHoveredTab(t.value)} // keyboard preview
              onBlur={() => setHoveredTab(null)} // return to active on blur
              className='relative cursor-pointer select-none rounded-xl px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-main-500/60'
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              {isPreviewed && <motion.span layoutId='tabs-pill' className='absolute inset-0 pointer-events-none rounded-xl bg-second shadow-lg' transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className={`relative z-10 flex items-center gap-1.5 text-nowrap ${isPreviewed ? 'text-white drop-shadow-sm' : 'text-slate-700'}`}>
                {t.icon ? <t.icon className='inline-block w-4 h-4 -mt-0.5' /> : null}
                {t.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
