import { useState } from 'react';
import BecomeFreelancer from './BecomeFreelancer';
import Button from '@/components/atoms/Button';
import CheckBox from '@/components/atoms/CheckBox';

const { default: Input } = require('@/components/atoms/Input');
const { default: Select } = require('@/components/atoms/Select');

export default function BudgetAndDelivery({ setCurrentStep, t, defaultData, onSubmit, dataAos }) {
  const [formData, setFormData] = useState(defaultData);

  const deliveryOptions = [
    { id: 'asap', name: t('step2.opt.asap') },
    { id: '1w', name: t('step2.opt.1w') },
    { id: '2w', name: t('step2.opt.2w') },
    { id: '1m', name: t('step2.opt.1m') },
    { id: 'date', name: t('step2.opt.date') },
  ];

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col' data-aos={dataAos}>
      <BecomeFreelancer />
      <div className='space-y-3 mb-8'>
        <Input cnLabel={'p'} className={'mt-6'} placeholder={t('step2.budgetPh')} label={t('step2.title')} type='number' value={formData.budget} onChange={val => setFormData({ ...formData, budget: val })} />
        <p className='text-sm text-gray-600'>{t('step2.range')}</p>

        <CheckBox label='My Budget Is Flexible' checked={formData.flexible} onChange={checked => setFormData({ ...formData, flexible: checked })} className=' mt-6' />
      </div>

      <div className='space-y-3 mb-6'>
        <Select cnLabel={'p'} label={t('step2.delivery')} placeholder={t('step2.deliveryPh')} options={deliveryOptions} value={formData.delivery} onChange={opt => setFormData({ ...formData, delivery: opt })} />

        {formData.delivery?.id === 'date' && (
          <div className='mt-3'>
            <input type='date' value={formData.specificDate} onChange={e => setFormData({ ...formData, specificDate: e.target.value })} className='h-[40px] w-full rounded-md border border-main-600 px-3 text-sm text-gray-700 focus:ring-2 focus:ring-main-600/20 outline-none' />
          </div>
        )}
        <p className='text-sm text-gray-600'>{t('step2.note')}</p>
      </div>

      <div className='flex items-center justify-between gap-4 mt-6 '>
        <Button className='!max-w-fit' name={t('common.back')} onClick={() => setCurrentStep(prev => prev - 1)} color='secondary' />
        <Button className='!max-w-fit' name={t('step1.submit')} onClick={() => setCurrentStep(prev => prev + 1)} color='green' />
      </div>
    </form>
  );
}
