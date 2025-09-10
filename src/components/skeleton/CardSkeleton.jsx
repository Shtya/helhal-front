import React from 'react';

const CardSkeleton = () => {
  return (
    <div className='rounded-lg overflow-hidden bg-white text-black border border-[#E5E7EB] shadow-inner' style={{ transition: '.3s' }} aria-busy='true' aria-live='polite'>
      <div className='relative'>
        <div className='w-[calc(100%-10px)] mx-[5px] mt-[5px] h-full overflow-hidden rounded-lg'>
          <div className='aspect-2/1 w-full rounded-lg border border-[#E5E7EB] bg-slate-200 shimmer ' />
        </div>
        <div className='absolute top-3 right-3 h-9 w-9 rounded-full bg-white/70 border border-slate-200 shadow-sm backdrop-blur animate-pulse' />
      </div>

      <div className='p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='h-[45px] w-[45px] rounded-full bg-slate-200 border border-slate-300 animate-pulse' />
          <div className='h-6 w-1/2 bg-slate-200 rounded animate-pulse' />
        </div>

        <div className='flex items-center justify-between gap-3'>
          <div className='h-5 w-24 bg-slate-200 rounded animate-pulse' />
          <div className='h-5 w-20 bg-slate-200 rounded animate-pulse' />
        </div>

        <div className='h-5 w-32 bg-slate-200 rounded animate-pulse' />

        <div className='h-5 w-28 bg-slate-200 rounded animate-pulse' />

        <div className='h-4 w-36 bg-slate-200 rounded animate-pulse' />

        <div className='h-10 w-full bg-slate-200 rounded-lg animate-pulse' />
      </div>
    </div>
  );
};

export default CardSkeleton;
