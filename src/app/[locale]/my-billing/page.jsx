'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { isErrorAbort } from '@/utils/helper';
import { useValues } from '@/context/GlobalContext';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import OTPInput from 'react-otp-input';
import { Link } from '@/i18n/navigation';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Skeleton = ({ className = '' }) => <div className={`shimmer rounded-md bg-slate-200/70 ${className}`} />;

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
    const { page = 1, limit = 10, search, startDate, endDate } = params;
    const response = await api.get('/accounting/billing-history', {
      params: { page, search, limit, startDate, endDate },
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 0, total: 0 });

  const columns = [
    { key: 'created_at', label: t('columns.date') },
    { key: 'description', label: t('columns.document') },
    { key: 'type', label: t('columns.type') },
    { key: 'orderId', label: t('columns.order') },
    { key: 'currencyId', label: t('columns.currency') },
    { key: 'amount', label: t('columns.total'), type: 'price' },
  ];
  const controllerRef = useRef(null);


  const limit = pagination.limit;
  const fetchBillingHistory = async (page = 1, limit, search = '', date = '') => {
    // Abort previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const response = await accountingAPI.getBillingHistory({
        page,
        search,
        startDate: date,
        endDate: date,
        limit,
      });
      setData(response.transactions);
      setPagination(prev => ({ ...prev, total: response.pagination?.pages }))
      setPagination(response.pagination);
    } catch (error) {
      if (!isErrorAbort(error)) {
        setData([]);
        console.error('Error fetching billing history:', error);
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const handleSearch = searchTerm => {
    fetchBillingHistory(1, limit, searchTerm);
  };

  const handleDateChange = date => {
    fetchBillingHistory(1, limit, '', date);
  };


  const handlePageChange = newPage => {
    setPagination(p => ({ ...p, page: newPage }))
    fetchBillingHistory(newPage, limit);
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

      <Table data={data} columns={columns} page={pagination.page} loading={loading} totalCount={pagination.total} onPageChange={handlePageChange} rowsPerPage={pagination.limit} />
    </div>
  );
};

const AvailableBalances = ({ userPhone, userCountryCode }) => {
  const t = useTranslations('MyBilling.availableBalances');
  const { user } = useAuth();
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified);

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

  if (loading) {
    return (
      <div className='mb-12'>
        <div className='mb-6'>
          <div className='h-7 w-64 bg-gray-200 rounded animate-pulse' />
        </div>
        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='rounded-2xl border border-gray-200 bg-white shadow-sm p-6'>
              <div className='flex justify-between items-start'>
                <div className='h-5 w-36 bg-gray-200 rounded animate-pulse' />
                <div className='w-9 h-9 bg-gray-200 rounded-full animate-pulse' />
              </div>
              <div className='mt-4'>
                <div className='h-9 w-28 bg-gray-200 rounded animate-pulse' />
              </div>
              <div className='mt-2 h-4 w-40 bg-gray-200 rounded animate-pulse' />
            </div>
          ))}
        </div>
      </div>
    );
  }

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

        {/* Phone Verification Card */}
        {/* <div className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between'>
          <PhoneVerification
            phone={user?.phone}
            countryCode={user?.countryCode?.dial_code}
          // onVerified={() => setPhoneVerified(true)}
          />
        </div> */}
      </div>
    </div>
  );
};


const BillingInformation = () => {
  const t = useTranslations('MyBilling.billingInformation');
  const { countries: countriesOptions, countryLoading, } = useValues();

  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    countryId: null,
    state: '',
    isSaudiResident: null,
    agreeToInvoiceEmails: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');


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
    if (!billingInfo.fullName || billingInfo.fullName.trim().length < 3) {
      setMessage(t('errors.fullNameTooShort'));
      return;
    }

    // validation: state min length 2
    if (!billingInfo.state || billingInfo.state.trim().length < 2) {
      setMessage(t('errors.stateTooShort'));
      return;
    }

    // You can also add country required
    if (!billingInfo.country) {
      setMessage(t('errors.countryRequired'));
      return;
    }

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

  if (loading || countryLoading) {
    return (
      <div className='max-w-[800px] w-full mx-auto mb-12'>
        <Skeleton className='h-8 w-64 mb-6' />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>

        <Skeleton className='h-6 w-40 mt-8' />
        <Skeleton className='h-4 w-72 mt-2 mb-6' />

        <Skeleton className='h-5 w-56 mt-4' />
        <Skeleton className='h-10 w-40 mt-6' />
      </div>
    );
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
        <Select showSearch cnSelect={'!border-[#108A00]'} label={t('country')} placeholder={t('selectCountry')} options={countriesOptions} isLoading={countryLoading} value={billingInfo.countryId} onChange={value => handleInputChange('country', value?.id)} />
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

  const { countries: countriesOptions, countryLoading, } = useValues();

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

  if (loading || countryLoading) {
    return (
      <div className='max-w-[1400px] w-full mx-auto mb-12'>
        <Skeleton className='h-8 w-64 mb-6' />

        <Skeleton className='h-6 w-52 mb-4' />
        <Skeleton className='h-20 w-full mb-4' />
        <Skeleton className='h-20 w-full mb-4' />

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
          <Skeleton className='h-12 w-48 lg:col-span-2 ml-auto' />
        </div>
      </div>
    );
  }


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
            {bankAccounts.map(account => {
              let country = account.country;

              if (typeof country === "string") {
                try {
                  // only parse if it's a non-empty string
                  country = country.trim() ? JSON.parse(country) : null;
                } catch (err) {
                  console.error("Failed to parse country JSON:", account.country, err);
                  country = null;
                }
              }

              return (
                <div key={account.id} className='border rounded-lg p-4 flex justify-between items-center'>
                  <div>
                    <p className='font-semibold'>{account.fullName}</p>
                    <p className='text-gray-600'>{t('iban')} {account.iban}</p>
                    <p className='text-gray-600'>
                      {country?.name} - {account.state}
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
              )
            })}
          </div>
        </div>
      )}

      {/* Add New Bank Account Form */}
      <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Input cnInput='!border-[#108A00]' label={t('fullName')} placeholder={t('fullNamePlaceholder')} value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('ibanLabel')} placeholder={t('ibanPlaceholder')} value={formData.iban} onChange={e => handleInputChange('iban', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('clientId')} placeholder={t('clientIdPlaceholder')} value={formData.clientId} onChange={e => handleInputChange('clientId', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('clientSecret')} placeholder={t('clientSecretPlaceholder')} type='password' value={formData.clientSecret} onChange={e => handleInputChange('clientSecret', e.target.value)} />
        <Select cnSelect='!border-[#108A00]' label={t('country')} placeholder={t('selectCountry')} showSearch isLoading={countryLoading} options={countriesOptions} value={formData.country} onChange={value => handleInputChange('country', value)} />
        <Input cnInput='!border-[#108A00]' label={t('state')} placeholder={t('statePlaceholder')} value={formData.state} onChange={e => handleInputChange('state', e.target.value)} />
        <Input cnInput='!border-[#108A00]' label={t('mobileNumber')} placeholder={t('mobileNumberPlaceholder')} value={formData.mobileNumber} onChange={e => handleInputChange('mobileNumber', e.target.value)} />

        <Button className='lg:col-span-2 ml-auto mt-auto !h-[45px] !py-1 max-w-[250px]' name={saving ? t('adding') : t('addBankAccount')} color='green' onClick={handleSave} disabled={saving} />
      </div>
    </div>
  );
};



const PhoneVerification = ({ phone, countryCode, onVerified }) => {
  const t = useTranslations('MyBilling.availableBalances');
  const [otpSent, setOtpSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loadingUser, setCurrentUser } = useAuth();

  // Countdown timer for resend
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);


  // ✅ If phone already verified
  if (!loadingUser && user?.isPhoneVerified) {
    return (
      <div className='flex flex-col gap-4 justify-between h-full'>

        <div className="flex items-center gap-2 text-blue-600">
          <FaCheckCircle className="text-blue-600 w-5 h-5" />
          <span>{t('phoneVerification.alreadyVerified')}</span>
        </div>
        <Input
          label={t('phoneVerification.phoneLabel')}
          value={`\u200E${countryCode} ${phone}`}
          disabled
          cnInput="cursor-not-allowed"
        />
      </div>
    );
  }

  // ✅ If phone/country code not set
  if (
    !loadingUser &&
    (!user?.phone || !user?.countryCode?.dial_code || !user?.countryCode?.code)
  ) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <FaExclamationTriangle className="text-red-600 w-5 h-5" />
        <span>
          {t('phoneVerification.missingPhoneData')}{' '}
          <Link href="/profile" className="text-blue-600 hover:underline">
            {t('phoneVerification.goToProfile')}
          </Link>
        </span>
      </div>
    );
  }


  // Send OTP
  const sendOtp = async () => {
    try {
      setLoading(true);
      await api.post('/auth/send-phone-verification-otp');
      toast.success(t('phoneVerification.otpSentSuccess'));
      setOtpSent(true);
      setSeconds(30); // disable resend for 30 seconds
    } catch (err) {
      toast.error(err?.response?.data?.message || t('phoneVerification.failedToSend'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async e => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error(t('phoneVerification.invalidOtpLength'));
    try {
      setLoading(true);
      const res = await api.post('/auth/verify-phone-otp', { otpCode: otp });
      setCurrentUser(prev => ({
        ...prev,
        isPhoneVerified: true
      }));

      toast.success(t('phoneVerification.verifiedSuccess'));
      onVerified?.(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('phoneVerification.invalidOtp'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (seconds > 0) return;
    try {
      setResending(true);
      await api.post('/auth/send-phone-verification-otp');
      toast.success(t('phoneVerification.otpResentSuccess'));
      setSeconds(30);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('phoneVerification.failedToResend'));
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between">
      {!otpSent ? (
        <>
          <p className="mt-1 mb-4 text-lg text-gray-500">{t('phoneVerification.description')}</p>
          <div className="mt-auto">
            <Button
              onClick={sendOtp}
              disabled={loading}
              name={loading ? t('phoneVerification.sending') : t('phoneVerification.sendOtp')}
            />
          </div>
        </>
      ) : (
        <div>
          <Input
            label={t('phoneVerification.phoneLabel')}
            value={`\u200E${countryCode} ${phone}`}
            disabled
            cnInput="cursor-not-allowed"
          />
          <form onSubmit={verifyOtp} className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('phoneVerification.enterOtpLabel')}
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span className="mx-1">-</span>}
              renderInput={props => (
                <input
                  {...props}
                  className="!w-10 h-10 border rounded-lg text-center text-xl"
                />
              )}
              containerStyle="flex justify-center flex-wrap gap-y-2"
            />
            <Button
              type="submit"
              name={t('phoneVerification.verify')}
              className="mt-4"
              isLoading={loading}
            />
          </form>

          <p className="text-center text-gray-600 mt-4">
            {t('phoneVerification.didNotReceive')}{' '}
            <button
              type="button"
              disabled={seconds > 0 || resending}
              onClick={resendOtp}
              className={`text-blue-600 hover:underline disabled:opacity-50 ${seconds > 0 ? 'cursor-not-allowed' : ''
                }`}
            >
              {seconds > 0
                ? t('phoneVerification.resendIn', { seconds })
                : t('phoneVerification.resendOtp')}
            </button>
          </p>
        </div>
      )}
    </motion.div>
  );
};

