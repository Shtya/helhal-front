// File: Filters/AdvancedJobsDropdown.jsx
'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';

export default function AdvancedJobsDropdown({
  value = {
    sortBy: 'newest', // 'newest' | 'budgetAsc' | 'budgetDesc'
    max7days: false,
    withAttachments: false,
    hourly: false,
  },
  onApply, // (next) => void
  className = '',
}) {
  const BRAND = '#108A00';
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const menuStyle = useDropdownPosition(open, rootRef);

  // local copy so user can cancel
  const [selected, setSelected] = useState(value);
  useEffect(() => setSelected(value), [JSON.stringify()]); // sync when parent changes

  // outside click + ESC
  useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if ((rootRef.current && !rootRef.current.contains(e.target)) && (menuRef.current && !menuRef.current.contains(e.target))
      ) setOpen(false);
    };
    const onKey = e => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasChanges = useMemo(() => {
    return selected.sortBy !== value.sortBy || selected.max7days !== value.max7days || selected.withAttachments !== value.withAttachments || selected.hourly !== value.hourly;
  }, [selected, value]);

  const totalSelected = (selected.max7days ? 1 : 0) + (selected.withAttachments ? 1 : 0) + (selected.hourly ? 1 : 0);

  // UI bits (kept very close to your SellerDetailsDropdown style)
  const OptionRow = ({ active, label, onClick }) => (
    <button
      type='button'
      onClick={onClick}
      className={`w-full px-2 py-1 mx-1 rounded-md flex items-center justify-between text-left transition
        cursor-pointer ${active ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-800'}`}>
      <span className='flex items-center gap-2'>
        <span
          className={`w-5 h-5 rounded-md border flex items-center justify-center
            ${active ? 'border-transparent bg-white/20' : 'border-[#108A0013] bg-[#108A0033]'}`}>
          {active && <Check className='w-3 h-3 text-white' />}
        </span>
        <span className={`truncate text-sm ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
      </span>
    </button>
  );

  const Section = ({ title, subtitle, children }) => (
    <div className='px-4'>
      <div className='flex items-baseline justify-between mb-2'>
        <h4 className='text-base font-bold text-slate-800'>{title}</h4>
        {subtitle && <span className='text-[10px] text-slate-400'>{subtitle}</span>}
      </div>
      <div className='grid grid-cols-2 gap-1'>{children}</div>
      <div className='my-2 border-t border-slate-200' />
    </div>
  );

  return (
    <>
      {open && <div className='fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[1px] animate-fadeIn' onClick={() => setOpen(false)} />}

      <div ref={rootRef} className={`relative inline-block text-left ${open && 'z-[110]'} ${className}`}>
        {/* Trigger */}
        <button
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className={`h-[40px] px-4 rounded-md border w-full bg-white flex items-center justify-between text-sm shadow-inner transition ${open ? 'ring-2' : ''}`}
          style={{
            borderColor: open ? BRAND : '#cbd5e1',
            boxShadow: open ? `0 0 0 3px ${BRAND}66 inset` : undefined,
          }}>
          <span className='truncate'>{totalSelected > 0 ? `${totalSelected} filter${totalSelected > 1 ? 's' : ''} applied` : 'Advanced'}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: open ? BRAND : '#94a3b8' }} />
        </button>
      </div>
      {/* Panel */}
      <div
        ref={menuRef}
        style={menuStyle}
        className={`absolute right-0 mt-2 w-[380px] rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,.08)] transition origin-top z-[70]
          ${open ? 'scale-100 opacity-100 z-[110]' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <div className='py-4 max-h-[70vh] overflow-auto'>
          {/* Sort by */}
          <Section title='Sort by'>
            <OptionRow label='Newest' active={selected.sortBy === 'newest'} onClick={() => setSelected(s => ({ ...s, sortBy: 'newest' }))} />
            <OptionRow label='Budget ↑' active={selected.sortBy === 'budgetAsc'} onClick={() => setSelected(s => ({ ...s, sortBy: 'budgetAsc' }))} />
            <OptionRow label='Budget ↓' active={selected.sortBy === 'budgetDesc'} onClick={() => setSelected(s => ({ ...s, sortBy: 'budgetDesc' }))} />
          </Section>

          {/* Quick toggles */}
          <Section title='Quick toggles' subtitle='Client-side filters'>
            <OptionRow label='≤ 7 days' active={!!selected.max7days} onClick={() => setSelected(s => ({ ...s, max7days: !s.max7days }))} />
            <OptionRow label='With attachments' active={!!selected.withAttachments} onClick={() => setSelected(s => ({ ...s, withAttachments: !s.withAttachments }))} />
            <OptionRow label='Hourly' active={!!selected.hourly} onClick={() => setSelected(s => ({ ...s, hourly: !s.hourly }))} />
          </Section>

          {/* Footer */}
          <div className='px-4 -mb-2 flex items-center justify-between gap-2'>
            <Button name='Clear All' color='outline' className='!w-fit !h-[35px]' onClick={() => setSelected({ sortBy: 'newest', max7days: false, withAttachments: false, hourly: false })} />
            {hasChanges && (
              <Button
                name='Apply'
                color='default'
                className='!w-fit !h-[35px]'
                onClick={() => {
                  onApply?.(selected);
                  setOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </div>


      {/* tiny fade-in animation (same as your pattern) */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 120ms ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
