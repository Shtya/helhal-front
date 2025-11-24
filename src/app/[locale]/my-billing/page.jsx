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
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';

const accountingAPI = {
  // Billing Information
  getBillingInformation: async () => {
    const response = await api.get('/accounting/billing-information');
    return response.data;
  },

  updateBillingInformation: async data => {
    const response = await api.put('/accounting/billing-information', data);
    return response.data;
  },

  // Bank Accounts
  getBankAccounts: async () => {
    const response = await api.get('/accounting/bank-accounts');
    return response.data;
  },

  createBankAccount: async data => {
    const response = await api.post('/accounting/bank-accounts', data);
    return response.data;
  },

  updateBankAccount: async (id, data) => {
    const response = await api.put(`/accounting/bank-accounts/${id}`, data);
    return response.data;
  },

  deleteBankAccount: async id => {
    const response = await api.delete(`/accounting/bank-accounts/${id}`);
    return response.data;
  },

  setDefaultBankAccount: async id => {
    const response = await api.put(`/accounting/bank-accounts/${id}/set-default`);
    return response.data;
  },

  // Existing methods...
  getBillingHistory: async (params = {}) => {
    const { page = 1, search, startDate, endDate } = params;
    const response = await api.get('/accounting/billing-history', {
      params: { page, search, startDate, endDate },
    });
    return response.data;
  },

  getAvailableBalances: async () => {
    const response = await api.get('/accounting/available-balances');
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/accounting/payment-methods');
    return response.data;
  },

  addPaymentMethod: async data => {
    const response = await api.post('/accounting/payment-methods', data);
    return response.data;
  },

  removePaymentMethod: async id => {
    const response = await api.delete(`/accounting/payment-methods/${id}`);
    return response.data;
  },

  withdrawFunds: async data => {
    const response = await api.post('/accounting/withdraw', data);
    return response.data;
  },
};

export default function Page() {
  const t = useTranslations('MyBilling');
  const [activeTab, setActiveTab] = useState('billing-history');

  const tabs = [
    {
      label: t('tabs.billingHistory'),
      value: 'billing-history',
      // icon: <History className='w-4 h-4' />,
    },
    {
      label: t('tabs.billingInformation'),
      value: 'billing-information',
      // icon: <CreditCard className='w-4 h-4' />,
    },
    {
      label: t('tabs.availableBalances'),
      value: 'available-balances',
      // icon: <Wallet className='w-4 h-4' />,
    },
    {
      label: t('tabs.paymentMethods'),
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
  const t = useTranslations('MyBilling.billingHistory');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  const columns = [
    { key: 'created_at', label: t('columns.date') },
    { key: 'description', label: t('columns.document') },
    { key: 'type', label: t('columns.type') },
    { key: 'orderId', label: t('columns.order') },
    { key: 'currencyId', label: t('columns.currency') },
    { key: 'amount', label: t('columns.total'), type: 'price' },
  ];

  const fetchBillingHistory = async (page = 1, search = '', date = '') => {
    setLoading(true);
    try {
      const response = await accountingAPI.getBillingHistory({
        page,
        search,
        startDate: date,
        endDate: date,
      });
      setData(response.transactions);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const handleSearch = searchTerm => {
    fetchBillingHistory(1, searchTerm);
  };

  const handleDateChange = date => {
    fetchBillingHistory(1, '', date);
  };

  return (
    <div>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
        <div className='flex max-sm:flex-col justify-end max-md:w-full max-md:justify-center items-center flex-1 gap-2'>
          <InputDate className={'max-w-[250px] w-full'} placeholder={t('searchByDate')} onChange={handleDateChange} />
          <InputSearch className={'!max-w-[250px] w-full'} iconLeft={'/icons/search.svg'} placeholder={t('searchByOrder')} onSearch={handleSearch} />
        </div>
      </div>

      {loading ? <div className='text-center py-8'>{t('loading')}</div> : <Table data={data} columns={columns} />}
    </div>
  );
};

const AvailableBalances = () => {
  const t = useTranslations('MyBilling.availableBalances');
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    try {
      const response = await accountingAPI.getAvailableBalances();
      setBalances(response);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const cardsData = [
    {
      title: t('earningsToDate.title'),
      amount: balances?.earningsToDate || '0.00',
      currency: '﷼',
      description: t('earningsToDate.description'),
      icon: Wallet,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
    {
      title: t('availableBalance.title'),
      amount: balances?.availableBalance || '0.00',
      currency: '﷼',
      description: t('availableBalance.description'),
      icon: CreditCard,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
    {
      title: t('credits.title'),
      amount: balances?.credits || '0.00',
      currency: '﷼',
      description: t('credits.description'),
      icon: DollarSign,
      iconBg: 'bg-[#cfe8cc] text-[#108a00]',
    },
  ];

  if (loading) return <div className='text-center py-8'>{t('loading')}</div>;

  return (
    <div className='mb-12'>
      <div className='mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
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
          <div className='flex justify-between items-start'>
            <p className='text-3xl font-semibold'>{t('phoneVerification.title')}</p>
            <span className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#cfe8cc] text-[#108a00]`}>
              <ShieldCheck className='w-5 h-5' />
            </span>
          </div>
          <p className='mt-1 mb-4 text-lg text-gray-500'>{t('phoneVerification.description')}</p>
          <Button name={t('phoneVerification.button')} color='green' />
        </div>
      </div>
    </div>
  );
};

const BillingInformation = () => {
  const t = useTranslations('MyBilling.billingInformation');
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    country: '',
    state: '',
    isSaudiResident: null,
    agreeToInvoiceEmails: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const response = await accountingAPI.getBillingInformation();
      setBillingInfo(response);
    } catch (error) {
      console.error('Error fetching billing information:', error);
      setMessage(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await accountingAPI.updateBillingInformation(billingInfo);
      setMessage(t('success'));
    } catch (error) {
      console.error('Error updating billing information:', error);
      setMessage(t('errors.updating'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <div className='text-center py-8'>{t('loading')}</div>;
  }

  return (
    <div className='max-w-[800px] w-full mx-auto mb-12'>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
      </div>

      {message && <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

      <div className='max-w-[800px] w-full grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Input cnInput={'!border-[#108A00]'} label={t('fullName')} placeholder={t('fullNamePlaceholder')} value={billingInfo.fullName} onChange={e => handleInputChange('fullName', e.target.value)} />
        <Input cnInput={'!border-[#108A00]'} label={t('state')} placeholder={t('statePlaceholder')} value={billingInfo.state} onChange={e => handleInputChange('state', e.target.value)} />
        <Select cnSelect={'!border-[#108A00]'} label={t('country')} placeholder={t('selectCountry')} options={countryOptions} value={billingInfo.country} onChange={value => handleInputChange('country', value)} />
        <Select
          cnSelect={'!border-[#108A00]'}
          label={t('saudiResident')}
          placeholder={t('select')}
          options={[
            { id: 'yes', name: t('yes') },
            { id: 'no', name: t('no') },
          ]}
          value={billingInfo.isSaudiResident}
          onChange={value => handleInputChange('isSaudiResident', value === 'yes')}
        />
      </div>

      <h1 className='h2 mt-6'>{t('invoices')}</h1>
      <p className='p mb-6'>{t('invoicesDesc')}</p>

      <div className='flex items-center gap-3'>
        <AnimatedCheckbox checked={billingInfo.agreeToInvoiceEmails} onChange={checked => handleInputChange('agreeToInvoiceEmails', checked)} />
        <span className='text-sm text-gray-700'>{t('inboxMessages')}</span>
      </div>

      <div className='max-w-[250px] mt-6'>
        <Button name={saving ? t('saving') : t('saveChanges')} color='green' onClick={handleSave} disabled={saving} />
      </div>
    </div>
  );
};

const PaymentMethods = () => {
  const t = useTranslations('MyBilling.paymentMethods');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    iban: '',
    clientId: '',
    clientSecret: '',
    country: '',
    state: '',
    mobileNumber: '',
  });

  const countryOptions = [
    { id: 1, name: 'Saudi Arabia' },
    { id: 2, name: 'United Arab Emirates' },
    { id: 3, name: 'Kuwait' },
    { id: 4, name: 'Qatar' },
    { id: 5, name: 'Bahrain' },
    { id: 6, name: 'Oman' },
    { id: 7, name: 'Egypt' },
  ];

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountingAPI.getBankAccounts();
      setBankAccounts(response);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setMessage(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await accountingAPI.createBankAccount(formData);
      setMessage(t('success.added'));
      setFormData({
        fullName: '',
        iban: '',
        clientId: '',
        clientSecret: '',
        country: '',
        state: '',
        mobileNumber: '',
      });
      fetchBankAccounts(); // Refresh the list
    } catch (error) {
      console.error('Error adding bank account:', error);
      setMessage(t('errors.adding'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteAccount = async id => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await accountingAPI.deleteBankAccount(id);
        setMessage(t('success.deleted'));
        fetchBankAccounts(); // Refresh the list
      } catch (error) {
        console.error('Error deleting bank account:', error);
        setMessage(t('errors.deleting'));
      }
    }
  };

  const handleSetDefault = async id => {
    try {
      await accountingAPI.setDefaultBankAccount(id);
      setMessage(t('success.defaultUpdated'));
      fetchBankAccounts(); // Refresh the list
    } catch (error) {
      console.error('Error setting default bank account:', error);
      setMessage(t('errors.settingDefault'));
    }
  };

  return (
    <div className='max-w-[1400px] w-full mx-auto mb-12'>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
      </div>

      {message && <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

      {/* Existing Bank Accounts */}
      {bankAccounts.length > 0 && (
        <div className='mb-8'>
          <h2 className='text-xl font-semibold mb-4'>{t('yourBankAccounts')}</h2>
          <div className='grid gap-4'>
            {bankAccounts.map(account => (
              <div key={account.id} className='border rounded-lg p-4 flex justify-between items-center'>
                <div>
                  <p className='font-semibold'>{account.fullName}</p>
                  <p className='text-gray-600'>{t('iban')} {account.iban}</p>
                  <p className='text-gray-600'>
                    {account.country} - {account.state}
                  </p>
                  {account.isDefault && <span className='inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1'>{t('default')}</span>}
                </div>
                <div className='flex gap-2'>
                  {!account.isDefault && (
                    <>
                      <button onClick={() => handleSetDefault(account.id)} className='text-blue-600 hover:text-blue-800 text-sm'>
                        {t('setDefault')}
                      </button>
                      <button onClick={() => handleDeleteAccount(account.id)} className='text-red-600 hover:text-red-800 text-sm'>
                        {t('delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Bank Account Form */}
      <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Input cnInput='!border-[#108A00]' label={t('fullName')} placeholder={t('fullNamePlaceholder')} value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('ibanLabel')} placeholder={t('ibanPlaceholder')} value={formData.iban} onChange={e => handleInputChange('iban', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('clientId')} placeholder={t('clientIdPlaceholder')} value={formData.clientId} onChange={e => handleInputChange('clientId', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('clientSecret')} placeholder={t('clientSecretPlaceholder')} type='password' value={formData.clientSecret} onChange={e => handleInputChange('clientSecret', e.target.value)} />
        <Select cnSelect='!border-[#108A00]' label={t('country')} placeholder={t('selectCountry')} options={countryOptions} value={formData.country} onChange={value => handleInputChange('country', value)} />
        <Input cnInput='!border-[#108A00]' label={t('state')} placeholder={t('statePlaceholder')} value={formData.state} onChange={e => handleInputChange('state', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('mobileNumber')} placeholder={t('mobileNumberPlaceholder')} value={formData.mobileNumber} onChange={e => handleInputChange('mobileNumber', e.target.value)} />

        <Button className='lg:col-span-2 ml-auto mt-auto !h-[45px] !py-1 max-w-[250px]' name={saving ? t('adding') : t('addBankAccount')} color='green' onClick={handleSave} disabled={saving} />
      </div>
    </div>
  );
};
// const BillingHistory = () => {
//   const columns = [
//     { key: 'Date', label: 'Date' },
//     { key: 'Document', label: 'Document' },
//     { key: 'Service', label: 'Service' },
//     { key: 'Order', label: 'Order' },
//     { key: 'Currency', label: 'Currency' },
//     { key: 'Total', label: 'Total', type: 'price' },
//   ];

//   const data = [
//     {
//       Date: '01 Apr 2025',
//       Document: 'Invoice #INV-1001',
//       Service: 'SEO Optimization',
//       Order: 'SEO1234567890',
//       Currency: 'USD',
//       Total: '150',
//     },
//     {
//       Date: '02 Apr 2025',
//       Document: 'Invoice #INV-1002',
//       Service: 'Content Writing',
//       Order: 'CW2345678901',
//       Currency: 'USD',
//       Total: '50',
//     },
//     {
//       Date: '03 Apr 2025',
//       Document: 'Invoice #INV-1003',
//       Service: 'Graphic Design',
//       Order: 'GD9876543210',
//       Currency: 'EUR',
//       Total: '200',
//     },
//     {
//       Date: '04 Apr 2025',
//       Document: 'Invoice #INV-1004',
//       Service: 'Web Development',
//       Order: 'WD8765432109',
//       Currency: 'USD',
//       Total: '450',
//     },
//     {
//       Date: '05 Apr 2025',
//       Document: 'Invoice #INV-1005',
//       Service: 'Video Editing',
//       Order: 'VE7654321098',
//       Currency: 'GBP',
//       Total: '300',
//     },
//     {
//       Date: '01 Apr 2025',
//       Document: 'Invoice #INV-1001',
//       Service: 'SEO Optimization',
//       Order: 'SEO1234567890',
//       Currency: 'USD',
//       Total: '150',
//     },
//     {
//       Date: '02 Apr 2025',
//       Document: 'Invoice #INV-1002',
//       Service: 'Content Writing',
//       Order: 'CW2345678901',
//       Currency: 'USD',
//       Total: '50',
//     },
//     {
//       Date: '03 Apr 2025',
//       Document: 'Invoice #INV-1003',
//       Service: 'Graphic Design',
//       Order: 'GD9876543210',
//       Currency: 'EUR',
//       Total: '200',
//     },
//     {
//       Date: '04 Apr 2025',
//       Document: 'Invoice #INV-1004',
//       Service: 'Web Development',
//       Order: 'WD8765432109',
//       Currency: 'USD',
//       Total: '450',
//     },
//     {
//       Date: '05 Apr 2025',
//       Document: 'Invoice #INV-1005',
//       Service: 'Video Editing',
//       Order: 'VE7654321098',
//       Currency: 'GBP',
//       Total: '300',
//     },
//     {
//       Date: '01 Apr 2025',
//       Document: 'Invoice #INV-1001',
//       Service: 'SEO Optimization',
//       Order: 'SEO1234567890',
//       Currency: 'USD',
//       Total: '150',
//     },
//     {
//       Date: '02 Apr 2025',
//       Document: 'Invoice #INV-1002',
//       Service: 'Content Writing',
//       Order: 'CW2345678901',
//       Currency: 'USD',
//       Total: '50',
//     },
//     {
//       Date: '03 Apr 2025',
//       Document: 'Invoice #INV-1003',
//       Service: 'Graphic Design',
//       Order: 'GD9876543210',
//       Currency: 'EUR',
//       Total: '200',
//     },
//     {
//       Date: '04 Apr 2025',
//       Document: 'Invoice #INV-1004',
//       Service: 'Web Development',
//       Order: 'WD8765432109',
//       Currency: 'USD',
//       Total: '450',
//     },
//     {
//       Date: '05 Apr 2025',
//       Document: 'Invoice #INV-1005',
//       Service: 'Video Editing',
//       Order: 'VE7654321098',
//       Currency: 'GBP',
//       Total: '300',
//     },
//   ];

//   return (
//     <div>
//       {/* Tabs */}
//       <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6 '>
//         <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Billing History</h1>
//         <div className='flex max-sm:flex-col justify-end max-md:w-full max-md:justify-center items-center flex-1 gap-2'>
//           <InputDate className={'max-w-[250px] w-full'} placeholder='Search by date' onChange={d => console.log('Picked:', d)} />
//           <InputSearch className={'!max-w-[250px] w-full'} iconLeft={'/icons/search.svg'} placeholder='Search by order number' onSearch={e => console.log(e)} />
//         </div>
//       </div>
//       <Table data={data} columns={columns} />
//     </div>
//   );
// };

// const BillingInformation = () => {
//   const [agree, setAgree] = useState(false);

//   const countryOptions = [
//     { id: 1, name: 'United States' },
//     { id: 2, name: 'United Kingdom' },
//     { id: 3, name: 'Canada' },
//     { id: 4, name: 'Germany' },
//     { id: 5, name: 'France' },
//     { id: 6, name: 'Italy' },
//     { id: 7, name: 'Spain' },
//     { id: 8, name: 'Australia' },
//     { id: 9, name: 'Brazil' },
//     { id: 10, name: 'India' },
//     { id: 11, name: 'China' },
//     { id: 12, name: 'Japan' },
//     { id: 13, name: 'South Korea' },
//     { id: 14, name: 'Mexico' },
//     { id: 15, name: 'Saudi Arabia' },
//     { id: 16, name: 'United Arab Emirates' },
//     { id: 17, name: 'South Africa' },
//     { id: 18, name: 'Egypt' },
//   ];

//   return (
//     <div className='max-w-[800px] w-full mx-auto mb-12 '>
//       <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6 '>
//         <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Billing Information</h1>
//       </div>

//       <div className=' max-w-[800px] w-full grid grid-cols-1 md:grid-cols-2 gap-6'>
//         <Input cnInput={'!border-[#108A00]'} label='Full name' placeholder='John Doe' />
//         <Input cnInput={'  !border-[#108A00]'} label='State ' placeholder='Gadah' />
//         <Select cnSelect={'!border-[#108A00]'} label='Country' placeholder='Select Currency' options={countryOptions} />
//         <Input cnInput={'!border-[#108A00]'} label='Are you a citizen / resident of Saudi Arabia' placeholder='Yes' />
//       </div>

//       <h1 className='h2 mt-6 '>Invoices</h1>
//       <p className='p mb-6'>You will find your invoices under the billing history tab</p>
//       {/* Checkbox */}
//       <div className='flex items-center gap-3'>
//         <AnimatedCheckbox checked={agree} onChange={setAgree} />
//         <span className='text-sm text-gray-700'>Inbox Messages</span>
//       </div>

//       {/* Save Button */}
//       <div className='max-w-[250px] mt-6 '>
//         <Button name='Save Changes' color='green' />
//       </div>
//     </div>
//   );
// };

// const AvailableBalances = () => {
//   const cardsData = [
//     {
//       title: 'Earnings to date',
//       amount: '0.00',
//       currency: '﷼',
//       description: 'Available for withdraw or purchases.',
//       icon: Wallet,
//       iconBg: 'bg-[#cfe8cc] text-[#108a00]',
//     },
//     {
//       title: 'UpPhoto Balance',
//       amount: '120.50',
//       currency: '﷼',
//       description: 'Use for purchases.',
//       icon: CreditCard,
//       iconBg: 'bg-[#cfe8cc] text-[#108a00]',
//     },
//     {
//       title: 'UpPhoto Credits',
//       amount: '50.00',
//       currency: '﷼',
//       description: 'Earn Upphoto Credits.',
//       icon: DollarSign,
//       iconBg: 'bg-[#cfe8cc] text-[#108a00]',
//     },
//   ];

//   return (
//     <div className=' mb-12 '>
//       <div className=' mb-6 '>
//         <h1 className='text-2xl max-md:text-xl font-bold  text-gray-800 tracking-wide'>Available balances</h1>
//       </div>

//       <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
//         {cardsData.map((card, idx) => {
//           const Icon = card.icon;
//           return (
//             <div key={idx} className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between'>
//               <div className='flex justify-between items-start'>
//                 <p className='text-lg text-gray-600 font-medium'>{card.title}</p>
//                 <span className={`w-9 h-9 flex items-center justify-center rounded-full ${card.iconBg}`}>
//                   <Icon className='w-5 h-5' />
//                 </span>
//               </div>

//               <div className='mt-4'>
//                 <p className='text-4xl font-extrabold text-gray-900'>
//                   {card.amount} <span className='text-xl font-semibold'>{card.currency}</span>
//                 </p>
//               </div>
//               <p className='mt-2 text-base font-[600]'>{card.description}</p>
//             </div>
//           );
//         })}

//         <div className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between'>
//           {/* Header */}
//           <div className='flex justify-between items-start'>
//             <p className='text-3xl font-semibold '>Phone Verification</p>
//             <span className={`w-9 h-9 flex items-center justify-center rounded-full bg-[#cfe8cc] text-[#108a00]`}>
//               <ShieldCheck className='w-5 h-5' />
//             </span>
//           </div>
//           <p className='mt-1 mb-4 text-lg text-gray-500'>Refer people you know and everyone benefits!</p>

//           <Button name='Save Changes' color='green' />
//         </div>
//       </div>
//     </div>
//   );
// };

// const PaymentMethods = () => {
//   const [agree, setAgree] = useState(false);

//   const countryOptions = [
//     { id: 1, name: 'Saudi Arabia' },
//     { id: 2, name: 'United Arab Emirates' },
//     { id: 3, name: 'Kuwait' },
//     { id: 4, name: 'Qatar' },
//     { id: 5, name: 'Bahrain' },
//     { id: 6, name: 'Oman' },
//     { id: 7, name: 'Egypt' },
//   ];

//   return (
//     <div className=' max-w-[1400px] w-full mx-auto mb-12'>
//       {/* Header */}
//       <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
//         <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>Bank Account Information</h1>
//       </div>

//       {/* Grid Inputs */}
//       <div className=' w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//         <Input cnInput='!border-[#108A00]' label='Full name' placeholder='Bader Alkhamees' />
//         <Input cnInput='!border-[#108A00]' label='International Bank Account Number' placeholder='Enter IBAN' />
//         <Input cnInput='!border-[#108A00]' label='Client Id' placeholder='Enter client ID' />
//         <Input cnInput='!border-[#108A00]' label='Client secret' placeholder='Enter client secret' type='password' />
//         <Select cnSelect='!border-[#108A00]' label='Country' placeholder='Select Country' options={countryOptions} />
//         <Input cnInput={'  !border-[#108A00]'} label='State ' placeholder='Gadah' />

//         <Input cnInput='!border-[#108A00]' label='Mobile number' placeholder='+966555521471' />
//         <Button className='lg:col-span-2 ml-auto mt-auto !h-[45px] !py-1 max-w-[250px]' name='Save Changes' color='green' />
//       </div>
//     </div>
//   );
// };
