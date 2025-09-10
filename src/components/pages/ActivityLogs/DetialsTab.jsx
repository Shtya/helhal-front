import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import Button from '@/components/atoms/Button';
import PriceTag from '@/components/atoms/priceTag';
import React from 'react';

const DetialsTab = () => {
  const invoice = {
    titleDate: '26 Mar 2025',
    items: [{ title: 'Title', qty: 1, duration: '1 Days', price: 10 }],
    summary: [
      { label: 'Sub Total', amount: 10 },
      { label: 'Service Fee', amount: 10 },
      { label: 'Total', amount: 20 },
    ],
  };

  const { titleDate, meta, items, summary, currency } = invoice;
  const formatPrice = n => Number(n);
  return (
    <div className='flex max-lg:flex-col items-start text-black gap-8'>
      <div className='bg-gray-50/30 border border-slate-200 rounded-xl shadow-inner p-6 w-full'>
        <h1 className='text-3xl max-md:text-xl font-semibold mb-1'>Invoices</h1>
        <div className='mb-4 flex items-center flex-wrap justify-between gap-2 '>
          <p className='text-xl '>app.Ordered to kaviya priya Delivery date 27 Mar 2025</p>
          <span>
            <b className='text-xl '>Total Price:</b> <PriceTag price={10.5} />
          </span>
        </div>
        <Divider />
        <div className='mb-4 flex items-center flex-wrap justify-between gap-2 '>
          <p className='text-xl '>app.Ordered to #JGZ9810742LSXO</p>
          <span className='text-[var(--main)] text-xl underline '>View billing history </span>
        </div>

        <section className={`bg-white rounded-xl border border-slate-200 shadow-inner mt-6 mb-12 overflow-hidden `}>
          {/* Title */}
          {titleDate && (
            <div className='px-6   border-b border-slate-200'>
              <h2 className='text-xl md:text-2xl font-extrabold py-6'>Your order {titleDate}</h2>
            </div>
          )}

          {/* Table */}
          <div className=' px-6  pb-8'>
            <div className='w-full overflow-x-auto rounded-2xl'>
              <table className='min-w-[720px] w-full'>
                <thead>
                  <tr className='border-b border-slate-200'>
                    <th className='text-left py-4 px-4  text-lg md:text-xl font-bold text-slate-900'>Item</th>
                    <th className='text-left py-4 px-4  text-lg md:text-xl font-bold text-slate-900'>Qty</th>
                    <th className='text-left py-4 px-4  text-lg md:text-xl font-bold text-slate-900'>Duration</th>
                    <th className='text-right py-4 px-4  text-lg md:text-xl font-bold text-slate-900'>Price</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((row, i) => (
                    <tr key={`item-${i}`} className='border-b border-slate-200'>
                      <td className='py-4 px-4  text-lg md:text-xl text-slate-900'>{row.title}</td>
                      <td className='py-4 px-4  text-lg md:text-xl text-slate-900'>{row.qty}</td>
                      <td className='py-4 px-4  text-lg md:text-xl text-slate-900'>{row.duration}</td>
                      <td className='py-4 px-4  text-right text-lg md:text-xl font-medium text-slate-900'>
                        {' '}
                        <PriceTag price={formatPrice(row.amount)} />
                      </td>
                    </tr>
                  ))}

                  {/* SUMMARY ROWS */}
                  {summary.map((s, i) => (
                    <tr key={`sum-${s.label}-${i}`} className={'bg-[#108A000D]'}>
                      <td className={`py-4 px-4 text-xl font-semibold text-slate-900`}>{s.label}</td>
                      <td />
                      <td />
                      <td className={`py-4 px-4 text-right text-2xl font-extrabold text-slate-900`}>
                        {' '}
                        <PriceTag price={formatPrice(s.amount)} />{' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className='text-sm  '>If something appears to be missing or incorrect, please contact our Customer Support Specialist.</p>
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

export default DetialsTab;
