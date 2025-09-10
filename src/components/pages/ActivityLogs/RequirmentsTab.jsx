import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import Button from '@/components/atoms/Button';
import PriceTag from '@/components/atoms/priceTag';
import React from 'react';

const RequirementsTab = () => {
  return (
    <div className='flex max-lg:flex-col items-start gap-8'>
      <div className='bg-gray-50/30 border border-slate-200 rounded-xl shadow-inner p-6 w-full'>
        <h1 className='text-3xl max-md:text-xl font-semibold mb-1'>1. Source code (Optional)</h1>
        <p className='text-lg mb-4'> (No answer) </p>
        <Divider />
        <h1 className='text-xl max-md:text-lg font-bold mb-1'> Attachments</h1>
        <p className='text-base mb-4'> The information I provided is accurate and clear. Any changes at this point require the seller’s approval and may cost extra.  </p>
      </div>

      <div className=' max-lg:order-[-1]  w-full max-w-full lg:max-w-[450px] bg-gray-50/30 border border-slate-200 rounded-xl shadow-inner p-6'>
        <h2 className='text-xl font-semibold'>Basic</h2>
        <Divider className={'!my-4 !mb-6 '} />

        <div className='flex justify-between items-center mb-4 '>
          <div className='flex w-full items-center gap-2'>
            <img src='/images/placeholder-avatar.png' className=' flex-none w-[50px] h-[50px] rounded-full border border-[var(--main)] ' />
            <h1 className=' text-2xl w-full font-[600] whitespace-nowrap truncate '>kaviya priya</h1>
          </div>
          <Button name={'Accepted'} color='green' className=' !w-fit flex-none scale-[.8] pointer-events-none !p-1 ' />
        </div>

        <div className='flex justify-between items-start'>
          <h3 className='text-lg font-semibold'>Ordered from</h3>
          <div>
            <h1>kaviya priya</h1>
            <p>@kaviya143</p>
          </div>
        </div>

        <div className='mt-4 space-y-1  '>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <span className='text-lg font-semibold'> Delivery date</span>
            <span className='text-base font-[400] opacity-80 '>27 Mar 2025</span>
          </div>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <span className='text-lg font-semibold'> Total price</span>
            <span className='text-base font-[400] opacity-80 '>
              {' '}
              <PriceTag price={10.5} />{' '}
            </span>
          </div>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <span className='text-lg font-semibold'> Order number</span>
            <span className='text-base font-[400] opacity-80 '>#JGZ9810742LSXO</span>
          </div>
        </div>

        <Button name={'Contact'} color='green' className='mt-2  ' />
      </div>
    </div>
  );
};

export default RequirementsTab;
