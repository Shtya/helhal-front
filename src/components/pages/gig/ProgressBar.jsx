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
        <span className='text-sm font-medium text-slate-700 dark:text-dark-text-primary'>
          Step {clampedStep} of {total}
        </span>
        <span className='text-xs text-slate-500 dark:text-dark-text-secondary'>{Math.round(progressPct)}%</span>
      </div>

      {/* Progress track */}
      <div className='max-sm:hidden relative mb-10' aria-label='Progress steps' role='group'>
        <div className='min-w-[680px] sm:min-w-0'>
          {/* Track line */}
          <div className='relative h-2 w-full rounded-full bg-slate-200 dark:bg-dark-bg-input'>
            <div
              className='absolute start-0 top-0 h-2 rounded-full bg-main-500 transition-[width] duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
          </div>

          {/* Steps indicators */}
          <ol className='mt-4 flex flex-wrap sm:gap-3 justify-between'>
            {steps.map((s, i) => {
              const idx = i + 1;
              const isDone = idx < clampedStep;
              const isActive = idx === clampedStep;

              const baseDot = 'grid h-8 w-8 place-items-center rounded-full border transition-all duration-300';
              const doneDot = 'bg-main-500 border-main-500 text-white';
              const activeDot = 'bg-main-600 border-main-600 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.25)]';
              const idleDot = 'bg-white dark:bg-dark-bg-input border-slate-300 dark:border-dark-border text-slate-500 dark:text-dark-text-secondary';

              const handleClick = () => {
                if (onStepChange) onStepChange(idx);
              };

              return (
                <li key={idx} className='flex-1'>
                  <button
                    type='button'
                    onClick={onStepChange ? handleClick : undefined}
                    className={`${onStepChange ? "cursor-pointer" : "cursor-default"} group flex flex-col items-center gap-2 w-full`}
                  >
                    <span className={[baseDot, isDone ? doneDot : isActive ? activeDot : idleDot, 'flex-none'].join(' ')}>
                      {isDone ? <CheckIcon className='h-4 w-4' /> : <span className='text-sm font-semibold'>{idx}</span>}
                    </span>

                    <span
                      className={['text-xs font-semibold truncate px-1 transition-colors',
                        isActive ? 'text-slate-900 dark:text-dark-text-primary' :
                          isDone ? 'text-slate-700 dark:text-dark-text-secondary' :
                            'text-slate-400 dark:text-dark-text-secondary/50'
                      ].join(' ')}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Active step heading */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-dark-text-primary sm:text-4xl tracking-tight'>
          {steps[clampedStep - 1]?.title}
        </h1>
        <p className='mt-2 text-slate-600 dark:text-dark-text-secondary text-lg leading-relaxed'>
          {steps[clampedStep - 1]?.description}
        </p>

        {settings?.sellerServiceFee && (
          <div role="status" className="mt-5 rounded-xl bg-slate-50 dark:bg-dark-bg-input/50 border border-slate-200 dark:border-dark-border p-4 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-main-600 dark:text-main-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 10-2 0v4a1 1 0 001 1h1a1 1 0 100-2h-1V6zM9 14a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm leading-snug text-slate-700 dark:text-dark-text-secondary">
                <span className="block font-medium text-slate-900 dark:text-dark-text-primary">
                  {t('noteServiceFee', { fee: settings.sellerServiceFee })}
                </span>
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
