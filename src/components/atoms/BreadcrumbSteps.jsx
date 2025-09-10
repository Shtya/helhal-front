// components/stepper/StepProgress.jsx
'use client';

import React from 'react';
import { Check, Pencil } from 'lucide-react';

/**
 * Usage:
 * <StepProgress
 *   steps={['Overview','Pricing','Gallery','Process','Description','Review']}
 *   current={1}                      // zero-based index
 *   onChange={(i)=>setStep(i)}       // optional (click to jump)
 *   brand="#108A00"                  // optional, defaults to #108A00
 * />
 */
export default function BreadcrumbSteps({ steps = [], current = 0, onChange, brand = '#108A00' }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className="w-full">
      {/* Track */}
      <div className="relative">
        <div className="flex items-center">
          {steps.map((label, i) => {
            const isDone = i < current;
            const isCurrent = i === current;
            const isUpcoming = i > current;

            return (
              <React.Fragment key={`${label}-${i}`}>
                {/* Dot */}
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={label}
                  onClick={() => onChange?.(i)}
                  className="relative z-10 grid h-8 w-8 place-items-center rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: isCurrent ? brand : isDone ? 'transparent' : '#d1d5db', // slate-300
                    background: isDone ? brand : '#ffffff',
                    boxShadow: isCurrent ? `0 0 0 4px ${brand}22 inset` : 'none',
                    color: isDone ? '#ffffff' : '#111827', // slate-900
                  }}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Pencil className="h-4 w-4" style={{ color: brand }} />
                  ) : (
                    <span className="text-[12px] leading-none text-slate-600">{i + 1}</span>
                  )}
                </button>

                {/* Connector (skip after last) */}
                {i < steps.length - 1 && (
                  <div className="relative flex-1 px-2">
                    {/* base */}
                    <div className="h-[2px] w-full rounded bg-slate-200" />
                    {/* progress */}
                    <div
                      className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] rounded transition-all"
                      style={{
                        width: 'calc(100% - 16px)',
                        background: i < current ? brand : 'transparent',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${steps.length * 2 - 1}, minmax(0,1fr))` }}>
        {steps.map((label, i) => {
          const isCurrent = i === current;
          return (
            <div key={`label-${label}-${i}`} className="col-span-2 text-center">
              <span
                className={`block text-sm ${isCurrent ? 'font-semibold' : 'font-normal'} ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}
                style={isCurrent ? { color: '#0f172a' } : undefined}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
