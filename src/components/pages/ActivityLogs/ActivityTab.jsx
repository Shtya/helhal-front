import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import Button from '@/components/atoms/Button';
import PriceTag from '@/components/atoms/priceTag';
import React from 'react';
const DocumentIcon = ({ className }) => (
  <svg
    width="62"
    height="62"
    viewBox="0 0 62 62"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ color: 'var(--color-main-600)' }}
  >
    {/* Background Circle - Uses variable with 0.2 opacity */}
    <rect width="62" height="62" rx="31" fill="currentColor" fillOpacity="0.2" />

    {/* Document Paths */}
    <path d="M45 24.4375V41.5C45 46.75 41.8675 48.5 38 48.5H24C20.1325 48.5 17 46.75 17 41.5V24.4375C17 18.75 20.1325 17.4375 24 17.4375C24 18.5225 24.4375 19.5025 25.155 20.22C25.8725 20.9375 26.8525 21.375 27.9375 21.375H34.0625C36.2325 21.375 38 19.6075 38 17.4375C41.8675 17.4375 45 18.75 45 24.4375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 17.4375C38 19.6075 36.2325 21.375 34.0625 21.375H27.9375C26.8525 21.375 25.8725 20.9375 25.155 20.22C24.4375 19.5025 24 18.5225 24 17.4375C24 15.2675 25.7675 13.5 27.9375 13.5H34.0625C35.1475 13.5 36.1275 13.9375 36.845 14.655C37.5625 15.3725 38 16.3525 38 17.4375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 32.75H31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 39.75H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ActivityTab = () => {
  const timeline = [
    {
      date: '26 Mar',
      items: [{ text: 'Your order has been placed.' }],
    },
    {
      date: '27 Mar',
      items: [
        { text: 'Seller started working on your order.' },
        { text: 'You received a new message.' },
      ],
    },
    {
      date: '28 Mar',
      items: [{ text: 'Order details were updated.' }],
    },
  ];

  return (
    <div className='flex max-lg:flex-col items-start gap-8'>
      <div className='bg-gray-50/30 border border-slate-200 rounded-xl shadow-inner p-6 w-full'>
        <h1 className='text-3xl max-md:text-xl font-semibold mb-1'>Invoices</h1>
        <p className='text-lg font-[500] mb-4'>Your order has been placed.</p>
        <Divider />
        {timeline.map((group, idx) => (
          <div key={group.date}>
            <p className='text-xl mb-2 font-semibold'>{group.date}</p>

            <div className='flex flex-col gap-3'>
              {group.items.map((item, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <item.icon className="w-full h-full" />
                  <p className='text-lg opacity-80'>{item.text}</p>
                </div>
              ))}
            </div>

            {idx < timeline.length - 1 && <Divider />}
          </div>
        ))}
      </div>

      <div className=' max-lg:order-[-1]  w-full max-w-full lg:max-w-[450px] bg-gray-50/30 border border-slate-200 rounded-xl shadow-inner p-6'>
        <h2 className='text-xl font-semibold'>Basic</h2>
        <Divider className={"!my-4 !mb-6 "} />

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

export default ActivityTab;
