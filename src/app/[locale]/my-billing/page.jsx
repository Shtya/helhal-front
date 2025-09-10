'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Tabs from '@/components/common/Tabs';
import InputDate from '@/components/atoms/InputDate';
import InputSearch from '@/components/atoms/InputSearch';
import Table from '@/components/common/Table';
import { AnimatedCheckbox } from '@/components/atoms/CheckboxAnimation';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import { Wallet, CreditCard, DollarSign, Icon, ShieldCheck } from 'lucide-react';
import Button from '@/components/atoms/Button';

export default function Page() {
  const [activeTab, setActiveTab] = useState('billing-history');

  const tabs = [
    {
      label: 'Billing History',
      value: 'billing-history',
      // icon: <History className='w-4 h-4' />,
    },
    {
      label: 'Billing Information',
      value: 'billing-information',
      // icon: <CreditCard className='w-4 h-4' />,
    },
    {
      label: 'Available Balances',
      value: 'available-balances',
      // icon: <Wallet className='w-4 h-4' />,
    },
    {
      label: 'Payment Methods',
      value: 'payment-methods',
      // icon: <CircleDollarSign className='w-4 h-4' />,
    },
  ];

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  return (
    <main className='container !mt-6'>
      <Tabs tabs={tabs} setActiveTab={handleTabChange} activeTab={activeTab} />

      <div className='py-6 md:py-10'>
        <motion.div data-aos='fade-up' data-aos-delay='100'>
          {activeTab === 'billing-history' && <BillingHistory />}
          {activeTab === 'billing-information' && <BillingInformation />}
          {activeTab === 'available-balances' && <AvailableBalances />}
          {activeTab === 'payment-methods' && <PaymentMethods />}
        </motion.div>
      </div>
    </main>
  );
}

const BillingHistory = () => {
  const columns = [
    { key: 'Date', label: 'Date' },
    { key: 'Document', label: 'Document' },
    { key: 'Service', label: 'Service' },
    { key: 'Order', label: 'Order' },
    { key: 'Currency', label: 'Currency' },
    { key: 'Total', label: 'Total', type: 'price' },
  ];

  const data = [
    {
      Date: '01 Apr 2025',
      Document: 'Invoice #INV-1001',
      Service: 'SEO Optimization',
      Order: 'SEO1234567890',
      Currency: 'USD',
      Total: '150',
    },
    {
      Date: '02 Apr 2025',
      Document: 'Invoice #INV-1002',
      Service: 'Content Writing',
      Order: 'CW2345678901',
      Currency: 'USD',
      Total: '50',
    },
    {
      Date: '03 Apr 2025',
      Document: 'Invoice #INV-1003',
      Service: 'Graphic Design',
      Order: 'GD9876543210',
      Currency: 'EUR',
      Total: '200',
    },
    {
      Date: '04 Apr 2025',
      Document: 'Invoice #INV-1004',
      Service: 'Web Development',
      Order: 'WD8765432109',
      Currency: 'USD',
      Total: '450',
    },
    {
      Date: '05 Apr 2025',
      Document: 'Invoice #INV-1005',
      Service: 'Video Editing',
      Order: 'VE7654321098',
      Currency: 'GBP',
      Total: '300',
    },
    {
      Date: '01 Apr 2025',
      Document: 'Invoice #INV-1001',
      Service: 'SEO Optimization',
      Order: 'SEO1234567890',
      Currency: 'USD',
      Total: '150',
    },
    {
      Date: '02 Apr 2025',
      Document: 'Invoice #INV-1002',
      Service: 'Content Writing',
      Order: 'CW2345678901',
      Currency: 'USD',
      Total: '50',
    },
    {
      Date: '03 Apr 2025',
      Document: 'Invoice #INV-1003',
      Service: 'Graphic Design',
      Order: 'GD9876543210',
      Currency: 'EUR',
      Total: '200',
    },
    {
      Date: '04 Apr 2025',
      Document: 'Invoice #INV-1004',
      Service: 'Web Development',
      Order: 'WD8765432109',
      Currency: 'USD',
      Total: '450',
    },
    {
      Date: '05 Apr 2025',
      Document: 'Invoice #INV-1005',
      Service: 'Video Editing',
      Order: 'VE7654321098',
      Currency: 'GBP',
      Total: '300',
    },
    {
      Date: '01 Apr 2025',
      Document: 'Invoice #INV-1001',
      Service: 'SEO Optimization',
      Order: 'SEO1234567890',
      Currency: 'USD',
      Total: '150',
    },
    {
      Date: '02 Apr 2025',
      Document: 'Invoice #INV-1002',
      Service: 'Content Writing',
      Order: 'CW2345678901',
      Currency: 'USD',
      Total: '50',
    },
    {
      Date: '03 Apr 2025',
      Document: 'Invoice #INV-1003',
      Service: 'Graphic Design',
      Order: 'GD9876543210',
      Currency: 'EUR',
      Total: '200',
    },
    {
      Date: '04 Apr 2025',
      Document: 'Invoice #INV-1004',
      Service: 'Web Development',
      Order: 'WD8765432109',
      Currency: 'USD',
      Total: '450',
    },
    {
      Date: '05 Apr 2025',
      Document: 'Invoice #INV-1005',
      Service: 'Video Editing',
      Order: 'VE7654321098',
      Currency: 'GBP',
      Total: '300',
    },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6 '>
        <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Billing History</h1>
        <div className='flex max-sm:flex-col justify-end max-md:w-full max-md:justify-center items-center flex-1 gap-2'>
          <InputDate className={'max-w-[250px] w-full'} placeholder='Search by date' onChange={d => console.log('Picked:', d)} />
          <InputSearch className={'!max-w-[250px] w-full'} iconLeft={'/icons/search.svg'} placeholder='Search by order number' onSearch={e => console.log(e)} />
        </div>
      </div>
      <Table data={data} columns={columns} />
    </div>
  );
};

const BillingInformation = () => {
  const [agree, setAgree] = useState(false);

  const countryOptions = [
    { id: 1, name: 'United States' },
    { id: 2, name: 'United Kingdom' },
    { id: 3, name: 'Canada' },
    { id: 4, name: 'Germany' },
    { id: 5, name: 'France' },
    { id: 6, name: 'Italy' },
    { id: 7, name: 'Spain' },
    { id: 8, name: 'Australia' },
    { id: 9, name: 'Brazil' },
    { id: 10, name: 'India' },
    { id: 11, name: 'China' },
    { id: 12, name: 'Japan' },
    { id: 13, name: 'South Korea' },
    { id: 14, name: 'Mexico' },
    { id: 15, name: 'Saudi Arabia' },
    { id: 16, name: 'United Arab Emirates' },
    { id: 17, name: 'South Africa' },
    { id: 18, name: 'Egypt' },
  ];

  return (
    <div className='max-w-[800px] w-full mx-auto mb-12 '>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6 '>
        <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Billing Information</h1>
      </div>

      <div className=' max-w-[800px] w-full grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Input cnInput={'!border-[#108A00]'} label='Full name' placeholder='John Doe' />
        <Input cnInput={'  !border-[#108A00]'} label='State ' placeholder='Gadah' />
        <Select cnSelect={'!border-[#108A00]'} label='Country' placeholder='Select Currency' options={countryOptions} />
        <Input cnInput={'!border-[#108A00]'} label='Are you a citizen / resident of Saudi Arabia' placeholder='Yes' />
      </div>

      <h1 className='h2 mt-6 '>Invoices</h1>
      <p className='p mb-6'>You will find your invoices under the billing history tab</p>
      {/* Checkbox */}
      <div className='flex items-center gap-3'>
        <AnimatedCheckbox checked={agree} onChange={setAgree} />
        <span className='text-sm text-gray-700'>Inbox Messages</span>
      </div>

      {/* Save Button */}
      <div className='max-w-[250px] mt-6 '>
        <Button name='Save Changes' color='green' />
      </div>
    </div>
  );
};

const AvailableBalances = () => {
  const cardsData = [
    {
      title: 'Earnings to date',
      amount: '0.00',
      currency: '﷼',
      description: 'Available for withdraw or purchases.',
      icon: Wallet,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
    {
      title: 'UpPhoto Balance',
      amount: '120.50',
      currency: '﷼',
      description: 'Use for purchases.',
      icon: CreditCard,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
    {
      title: 'UpPhoto Credits',
      amount: '50.00',
      currency: '﷼',
      description: 'Earn Upphoto Credits.',
      icon: DollarSign,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
  ];

  return (
    <div className=' mb-12 '>
      <div className=' mb-6 '>
        <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Available balances</h1>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {cardsData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between'>
              <div className='flex justify-between items-start'>
                <p className='text-lg text-gray-600 font-medium'>{card.title}</p>
                <span className={`w-9 h-9 flex items-center justify-center rounded-full ${card.iconBg}`}>
                  <Icon className='w-5 h-5' />
                </span>
              </div>

              <div className='mt-4'>
                <p className='text-4xl font-extrabold text-gray-900'>
                  {card.amount} <span className='text-xl font-semibold'>{card.currency}</span>
                </p>
              </div>
              <p className='mt-2 text-base font-[600]'>{card.description}</p>
            </div>
          );
        })}

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between'>
          {/* Header */}
          <div className='flex justify-between items-start'>
            <p className='text-3xl font-semibold '>Phone Verification</p>
            <span className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#cfe8cc] text-[#108a00]`}>
              <ShieldCheck className='w-5 h-5' />
            </span>
          </div>
          <p className='mt-1 mb-4 text-lg text-gray-500'>Refer people you know and everyone benefits!</p>

          <Button name='Save Changes' color='green' />
        </div>
      </div>
    </div>
  );
};

const PaymentMethods = () => {
  const [agree, setAgree] = useState(false);

  const countryOptions = [
    { id: 1, name: 'Saudi Arabia' },
    { id: 2, name: 'United Arab Emirates' },
    { id: 3, name: 'Kuwait' },
    { id: 4, name: 'Qatar' },
    { id: 5, name: 'Bahrain' },
    { id: 6, name: 'Oman' },
    { id: 7, name: 'Egypt' },
  ];

  return (
    <div className=' max-w-[1400px] w-full mx-auto mb-12'>
      {/* Header */}
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>Bank Account Information</h1>
      </div>

      {/* Grid Inputs */}
      <div className=' w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Input cnInput='!border-[#108A00]' label='Full name' placeholder='Bader Alkhamees' />
        <Input cnInput='!border-[#108A00]' label='International Bank Account Number' placeholder='Enter IBAN' />
        <Input cnInput='!border-[#108A00]' label='Client Id' placeholder='Enter client ID' />
        <Input cnInput='!border-[#108A00]' label='Client secret' placeholder='Enter client secret' type='password' />
        <Select cnSelect='!border-[#108A00]' label='Country' placeholder='Select Country' options={countryOptions} />
        <Input cnInput={'  !border-[#108A00]'} label='State ' placeholder='Gadah' />

        <Input cnInput='!border-[#108A00]' label='Mobile number' placeholder='+966555521471' />
        <Button className='lg:col-span-2 ml-auto mt-auto !h-[45px] !py-1 max-w-[250px]' name='Save Changes' color='green' />
      </div>
    </div>
  );
};
