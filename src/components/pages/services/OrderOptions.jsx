'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Calendar, Repeat, Timer, FileText, ChevronRight } from 'lucide-react';
import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import PriceTag from '@/components/atoms/priceTag';

export default function OrderOptions({ isSidebarOpen, setIsSidebarOpen, serviceData, selectedPackage, orderFrequency, setOrderFrequency }) {
  const [notes, setNotes] = useState('');
  const drawerRef = useRef(null);
  const firstFocusRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Body scroll lock + Esc to close + autofocus
  useEffect(() => {
    if (isSidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      firstFocusRef.current?.focus();
      const onKey = e => {
        if (e.key === 'Escape') setIsSidebarOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isSidebarOpen, setIsSidebarOpen]);

  const frequencyPresets = ['Single Order', 'Weekly', 'Monthly', 'Quarterly'];

  const summaryItems = useMemo(
    () => [
      {
        icon: <FileText className='h-4 w-4' />,
        label: `${selectedPackage?.name ?? ''} Package`,
      },
      {
        icon: <Timer className='h-4 w-4' />,
        label: `${selectedPackage?.deliveryTime ?? '-'} Day Delivery`,
      },
      {
        icon: <Repeat className='h-4 w-4' />,
        label: `${selectedPackage?.revisions ?? '-'} Revisions`,
      },
    ],
    [selectedPackage],
  );

  return (
    <div className='relative z-[90]'>
      {/* Overlay */}
      {isSidebarOpen && <div className='fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm transition-opacity' onClick={toggleSidebar} aria-hidden='true' />}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='order-options-title'
        className={`fixed right-0 top-0 z-[100] h-dvh w-[360px] sm:w-[420px] bg-white border-l shadow-2xl transition-transform duration-300 ease-out will-change-transform
      ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Decorative edge glow */}
        <div className='pointer-events-none absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-200/50 via-transparent to-emerald-200/50' />

        {/* Header */}
        <div className='sticky top-0 z-10 bg-white px-6 pt-6 pb-4'>
          <div className='flex items-start justify-between gap-3'>
            <h2 id='order-options-title' className='text-2xl font-bold text-slate-900'>
              Order Options
            </h2>
            <button ref={firstFocusRef} onClick={toggleSidebar} aria-label='Close order options' className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50'>
              <X className='h-5 w-5' />
            </button>
          </div>
          <Divider className='my-4' />
          {/* Header summary */}
          <div className='mb-2'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='text-lg font-semibold text-slate-900 line-clamp-1'>{serviceData?.title}</h3>
              <PriceTag price={selectedPackage?.price ?? 0} className='!text-lg font-bold' />
            </div>
            {selectedPackage?.description && <p className='mt-1 text-sm text-slate-600 line-clamp-2'>{selectedPackage.description}</p>}
          </div>
        </div>

        {/* Content */}
        <div className='px-6 pb-36 pt-2 space-y-6 overflow-y-auto h-[calc(100dvh-140px)]'>
 

          {/* Notes */}
          <div>
            <label className='mb-2 flex items-center gap-2 text-sm font-medium text-slate-900'>
              <FileText className='h-4 w-4 text-slate-500' />
              Special instructions (optional)
            </label>
            <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder='Anything the seller should know…' className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
            <div className='mt-1 text-right text-xs text-slate-500'>{notes.length} chars</div>
          </div>

          {/* Summary card */}
          <div className='rounded-xl border border-emerald-200 bg-emerald-50/50 p-4'>
            <div className='text-slate-800'>
              <PriceTag price={selectedPackage?.price ?? 0} />
              <div className='mt-1 text-sm font-semibold text-slate-700'>{orderFrequency || 'Single Order'}</div>
              <div className='mt-4 space-y-2 text-slate-700'>
                {summaryItems.map((it, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200'>{it.icon}</span>
                    <span className='text-sm font-medium'>{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='mt-4 text-sm text-slate-600'>You can always modify these options later in your order management.</div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className='absolute bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Total</span>
            <PriceTag price={selectedPackage?.price ?? 0} className='!text-xl font-bold' />
          </div>

          <Button name='Continue to Requirements' className='w-full' onClick={toggleSidebar} iconRight={<ChevronRight className='ml-1 h-4 w-4' />} />
        </div>
      </aside>
    </div>
  );
}
