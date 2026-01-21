'use client';

import { useValues } from '@/context/GlobalContext';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function ProgressBar({
  step = 1,
  onStepChange,
  steps = [
    { label: 'Overview', title: 'Create Your Gig', description: "Let's start by choosing a category for your service" },
    { label: 'Pricing', title: 'Packages & Pricing', description: 'Set up your service packages and pricing options' },
    { label: 'Description & FAQ', title: 'Frequently Asked Questions.', description: 'Provide the answer frequently asked questions.' },
    { label: 'Requirements', title: 'Buyer Requirements', description: 'Specify what information you need from buyers to get started' },
    { label: 'Gallery', title: 'Gallery & Media', description: 'Showcase your previous work to attract new buyers.' },
    { label: 'Publish', title: 'Publish', description: 'Finalize and publish your project.' },
  ],
}) {
  const { settings } = useValues()
  const t = useTranslations('CreateGig.step1');
  const total = steps.length;
  const clampedStep = Math.min(Math.max(step, 1), total);
  const progressPct = useMemo(() => ((clampedStep - 1) / (total - 1 || 1)) * 100, [clampedStep, total]);

  return (
    <div className='w-full '>
      {/* Mobile mini-header */}
      <div className='mb-4 flex items-center justify-between sm:hidden'>
        <span className='text-sm font-medium text-slate-700'>
          Step {clampedStep} of {total}
        </span>
        <span className='text-xs text-slate-500'>{Math.round(progressPct)}%</span>
      </div>

      {/* Progress track */}
      <div className='max-sm:hidden  relative mb-6 overflow-x-auto' aria-label='Progress steps' role='group'>
        <div className='min-w-[680px] sm:min-w-0'>
          {/* Track line */}
          <div className='relative h-2 w-full rounded-full bg-slate-200'>
            <div className='absolute start-0 top-0 h-2 rounded-full bg-main-500 transition-[width] duration-500 ease-out' style={{ width: `${progressPct}%` }} aria-hidden />
          </div>

          {/* Steps */}
          <ol className='mt-3 grid grid-cols-6 gap-2 sm:flex sm:flex-wrap sm:gap-3'>
            {steps.map((s, i) => {
              const idx = i + 1;
              const isDone = idx < clampedStep;
              const isActive = idx === clampedStep;

              const baseDot = 'grid h-8 w-8 place-items-center rounded-full border transition-all duration-3 0';
              const doneDot = 'bg-main-500 border-main-500 text-white';
              const activeDot = 'bg-main-600 border-main-600 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]';
              const idleDot = 'bg-white border-slate-300 text-slate-500';

              const handleClick = () => {
                if (onStepChange) onStepChange(idx);
              };

              return (
                <li key={idx} className='flex min-w-0 flex-1 items-center gap-3'>
                  <button type='button' onClick={onStepChange ? handleClick : undefined} aria-current={isActive ? 'step' : undefined} aria-label={`Go to step ${idx}: ${s.label}`} className={` ${onStepChange ? "cursor-pointer" : "!cursor-default"} group flex max-lg:flex-col items-center gap-1 w-fit`}>
                    <span className={[baseDot, isDone ? doneDot : isActive ? activeDot : idleDot, onStepChange ? 'cursor-pointer' : 'cursor-default', 'flex-none'].join(' ')}>{isDone ? <CheckIcon className='h-4 w-4' /> : <span className='text-sm font-semibold'>{idx}</span>}</span>

                    <div className=' truncate !w-fit block  overflow-hidden'>
                      <div className={['block truncate max-lg:!w-[70px] text-sm font-semibold !w-fit  ', isActive ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-500'].join(' ')} title={s.label}>
                        {s.label}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Active step heading */}
      <div className='mb-6  '>
        <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>{steps[clampedStep - 1]?.title}</h1>
        <p className='mt-1 text-slate-600'>{steps[clampedStep - 1]?.description}</p>
        {settings?.sellerServiceFee && (
          <div role="status" className="mt-3 rounded-lg bg-white border border-slate-200 p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 10-2 0v4a1 1 0 001 1h1a1 1 0 100-2h-1V6zM9 14a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm leading-tight text-slate-700">
                <span className="block font-medium text-slate-900">{t('noteServiceFee', { fee: settings.sellerServiceFee })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' aria-hidden='true' {...props}>
      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 0 1 0 1.414l-7.2 7.2a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414l2.293 2.293 6.493-6.493a1 1 0 0 1 1.414 0z' clipRule='evenodd' />
    </svg>
  );
}
