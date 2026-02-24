// File: Filters/SellerBudgetDropdown.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Eraser } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/atoms/Button';

export default function SellerBudgetDropdown({
  filterOptions = {},
  onBudgetChange,
  selectedPriceRange,
  customBudget,
  currencySymbol = '$',
}) {
  const t = useTranslations('Services.filters.budget');
  const BRAND = 'var(--color-main-700)';
  const rootRef = useRef(null);

  const fmtNumber = n => {
    if (n === '' || n === null || n === undefined) return '';
    const num = Number(n);
    if (Number.isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  };

  const labelForRange = id => {
    switch (id) {
      case 'u1000':
        return t('under', { amount: `${currencySymbol}1,000` });
      case 'm1000_3600':
        return t('between', { min: `${currencySymbol}1,000`, max: `${currencySymbol}3,600` });
      case 'h3600+':
        return t('above', { amount: `${currencySymbol}3,600` });
      default:
        return id;
    }
  };

  const tiers = useMemo(() => {
    const pr = filterOptions.priceRanges || {
      u1000: 0,
      m1000_3600: 0,
      'h3600+': 0,
    };
    return Object.entries(pr)
      .map(([id, count]) => ({
        id,
        label: labelForRange(id),
        count: Number(count) || 0,
      }))
      .concat([{ id: 'custom', label: t('customBudget'), count: null }]);
  }, [filterOptions, currencySymbol]);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(selectedPriceRange || null);
  const [customValue, setCustomValue] = useState(customBudget || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedId(selectedPriceRange || null);
    setCustomValue(customBudget || '');
    setHasChanges(false);
  }, [selectedPriceRange, customBudget, open]);

  useEffect(() => {
    if (!open || !selectedId) return;
    const changed = selectedId !== selectedPriceRange || (selectedId === 'custom' && String(customValue || '') !== String(customBudget || ''));
    setHasChanges(changed);
  }, [selectedId, customValue, selectedPriceRange, customBudget, open]);

  useEffect(() => {
    const onDoc = e => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter') applyChanges();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, selectedId, customValue]);

  const activeLabel = () => {
    if (selectedId === 'custom' && customValue) return t('budgetWithAmount', { amount: `${currencySymbol}${fmtNumber(customValue)}` });
    const tier = tiers.find(t => t.id === selectedId);
    return tier ? tier.label : t('budget');
  };

  const clearAll = () => {
    setSelectedId(null);
    setCustomValue('');
    setHasChanges(true);
  };

  const onPick = id => {
    setSelectedId(id);
    setHasChanges(true);
  };

  const onCustomInput = e => {
    const v = e.target.value.replace(/[^\d]/g, '');
    setCustomValue(v);
    setHasChanges(true);
  };

  const applyChanges = () => {
    if (selectedId === 'custom') {
      if (!customValue || Number(customValue) <= 0 || Number.isNaN(Number(customValue))) {
        onBudgetChange?.(null, '');
      } else {
        onBudgetChange?.('custom', customValue);
      }
    } else {
      onBudgetChange?.(selectedId, '');
    }
    setOpen(false);
  };

  const RadioRow = ({ id, label }) => {
    const active = selectedId === id;
    return (
      <button
        type='button'
        onClick={() => onPick(id)}
        className={`w-full px-1 py-2.5 rounded-md flex items-center justify-between text-left transition
          cursor-pointer ${active ? 'gradient text-white' : 'hover:bg-main-100 dark:hover:bg-dark-bg-input text-slate-800 dark:text-dark-text-primary'}`}>
        <span className='flex items-center gap-2'>
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center
              ${active ? 'border-transparent bg-white/20' : 'border-[#007a5520] bg-[#007a5513] dark:border-dark-border dark:bg-dark-bg-base'}`}>
            {active && <Check className='w-3 h-3 text-white' />}
          </span>
          <span className={`text-sm text-nowrap truncate ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
        </span>
      </button>
    );
  };

  return (
    <>
      {open && <div className='fixed inset-0 z-[60] bg-slate-900/40 dark:bg-black/60 backdrop-blur-[1px] animate-fadeIn' onClick={() => setOpen(false)} />}

      <div ref={rootRef} className={`relative inline-block text-left ${open && 'z-[70]'}`}>
        <button
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className={`h-[40px] px-4 rounded-md border w-full bg-white dark:bg-dark-bg-input dark:hover:bg-dark-bg-card flex items-center justify-between text-sm shadow-inner transition
            ${open ? 'ring-2 border-main-700/60' : 'border-slate-300 dark:border-dark-border'} dark:text-dark-text-primary`}
        >
          <span className='truncate'>{activeLabel()}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: open ? BRAND : '#94a3b8' }} />
        </button>

        <div
          className={`border border-main-700/40 absolute left-0 mt-2 w-full rounded-lg bg-white dark:bg-dark-bg-card shadow-[0_6px_24px_rgba(0,0,0,.08)] dark:shadow-none
            transition origin-top z-[70] dark:border-dark-border
            ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
          <div className='py-4'>
            <div className='px-4'>
              <h4 className='text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-2 text-start'>{t('budget')}</h4>
            </div>

            <div className='px-2 space-y-2'>
              {tiers.map(t => (
                <RadioRow key={t.id} id={t.id} label={t.label} count={t.count} />
              ))}

              <div
                className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out
                  ${selectedId === 'custom' ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className='h-[44px] rounded-md flex items-center px-4 text-sm dark:bg-dark-bg-input' style={{ border: `2px solid ${BRAND}` }}>
                  <span className='text-slate-400 dark:text-dark-text-secondary mr-2'>{currencySymbol}</span>
                  <input type='text' inputMode='numeric' value={customValue} onChange={onCustomInput} className='w-full outline-none text-slate-900 dark:text-dark-text-primary placeholder:text-slate-400 bg-transparent' placeholder={t('enterMaxAmount')} />
                </div>

                <div className='mt-2 text-[11px] text-slate-400 dark:text-dark-text-secondary'>{customValue ? t('youEntered', { amount: `${currencySymbol}${fmtNumber(customValue)}` }) : t('typeNumberOnly')}</div>

                <div className='mt-3 border-t border-slate-200 dark:border-dark-border' />
              </div>
            </div>

            <div className='px-4 mt-2 -mb-2 flex items-center justify-end gap-2'>
              <Button icon={<Eraser size={16} />} color='outline' className='!w-fit !h-[35px] dark:border-dark-border dark:text-dark-text-secondary' onClick={clearAll} />
              {hasChanges && <Button icon={<Check size={16} />} color='outline' className='!w-fit !h-[35px] dark:border-dark-border dark:text-dark-text-secondary' onClick={applyChanges} />}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 120ms ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}