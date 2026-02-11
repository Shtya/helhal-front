'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Tabs from '@/components/common/Tabs';
import InputDate from '@/components/atoms/InputDate';
import InputSearch from '@/components/atoms/InputSearch';
import Table from '@/components/common/Table';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import { Wallet, CreditCard, DollarSign, RotateCcw, Hourglass, ArrowUpRight, Loader2, Building2, AlertTriangle, Building2Icon } from 'lucide-react';
import Button from '@/components/atoms/Button';
import api from '@/lib/axios';
import { useLocale, useTranslations } from 'next-intl';
import { isErrorAbort } from '@/utils/helper';
import { useValues } from '@/context/GlobalContext';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import OTPInput from 'react-otp-input';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSearchParams } from 'next/navigation';
import Currency from '@/components/common/Currency';
import { Modal } from '@/components/common/Modal';

const Skeleton = ({ className = '' }) => <div className={`shimmer rounded-md bg-slate-200/70 ${className}`} />;

export const BANKS = [
  { code: "AUB" },
  { code: "MIDB" },
  { code: "BDC" },
  { code: "HSBC" },
  { code: "CAE" },
  { code: "EGB" },
  { code: "UB" },
  { code: "QNB" },
  { code: "ARAB" },
  { code: "ENBD" },
  { code: "ABK" },
  { code: "NBK" },
  { code: "ABC" },
  { code: "FAB" },
  { code: "ADIB" },
  { code: "CIB" },
  { code: "HDB" },
  { code: "MISR" },
  { code: "AAIB" },
  { code: "EALB" },
  { code: "EDBE" },
  { code: "FAIB" },
  { code: "BLOM" },
  { code: "ADCB" },
  { code: "BOA" },
  { code: "SAIB" },
  { code: "NBE" },
  { code: "ABRK" },
  { code: "POST" },
  { code: "NSB" },
  { code: "IDB" },
  { code: "SCB" },
  { code: "MASH" },
  { code: "AIB" },
  { code: "GASC" },
  { code: "ARIB" },
  { code: "PDAC" },
  { code: "NBG" },
  { code: "CBE" },
  { code: "BBE" },
];

export const accountingAPI = {
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

  getDefaultBankAccount: async () => {
    const response = await api.get('/accounting/default-bank-account');
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


  withdrawFunds: async (amount) => {
    const response = await api.post('/accounting/withdraw', { amount });
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

};
export default function Page() {
  const t = useTranslations('MyBilling');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 2. Initial state from search params (with fallback)
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'billing-history';
  });

  // 1. When state changes, set search params based on it
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);

    // Update the URL without a full page refresh
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  const tabs = [
    { label: t('tabs.billingHistory'), value: 'billing-history' },
    { label: t('tabs.billingInformation'), value: 'billing-information' },
    { label: t('tabs.availableBalances'), value: 'available-balances' },
    { label: t('tabs.paymentMethods'), value: 'payment-methods' },
  ];

  return (
    <main className='container !mt-6'>
      <Tabs tabs={tabs} setActiveTab={setActiveTab} activeTab={activeTab} />

      <div className='py-6 md:py-10'>
        {/* 3. Use the 'key' prop on motion.div so framer-motion 
               re-triggers animations when the tab changes */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'billing-history' && <BillingHistory />}
          {activeTab === 'billing-information' && <BillingInformation />}
          {activeTab === 'available-balances' && <AvailableBalances setActiveTab={setActiveTab} />}
          {activeTab === 'payment-methods' && <PaymentMethods />}
        </motion.div>
      </div>
    </main>
  );
}

const getStatusStyles = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200'; // Success green
    case 'pending':
      return 'bg-orange-50 text-orange-700 border-orange-200'; // Warning orange
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200'; // Danger red
    case 'refunded':
      return 'bg-blue-50 text-blue-700 border-blue-200'; // Info blue
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const BillingHistory = () => {
  const t = useTranslations('MyBilling.billingHistory');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 0, total: 0 });

  const columns = [
    { key: 'created_at', label: t('columns.date') },
    { key: 'description', label: t('columns.document') },
    { key: 'type', label: t('columns.type') },
    {
      key: 'status',
      label: t('columns.status'),
      render: (row) => {
        const status = row.status;
        const localizedLabel = t(`statuses.${status}`) || status;
        const styleClasses = getStatusStyles(status);

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClasses}`}>
            {localizedLabel}
          </span>
        );
      }
    },
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


const AvailableBalances = ({ setActiveTab }) => {
  const t = useTranslations('MyBilling.availableBalances');
  const { user } = useAuth();
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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

  const handleWithdraw = async (amount) => {
    if (!amount || amount < 112) {
      return toast.error(t('errors.minAmount') || 'Minimum withdrawal is 112 SAR');
    }

    setWithdrawLoading(true);
    try {
      await accountingAPI.withdrawFunds(amount);
      toast.success(t('messages.withdrawSuccess') || 'Withdrawal initiated successfully!');

      // Refetch balances to show updated Available vs Reserved amounts
      await fetchBalances();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Withdrawal failed';
      toast.error(errorMsg);
    } finally {
      setWithdrawLoading(false);
    }
  };
  // Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(0);

  const openWithdrawModal = (amount) => {
    setSelectedWithdrawAmount(amount);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawSuccess = async () => {
    // Refetch balances to show updated Available vs Reserved amounts
    await fetchBalances();
  };
  const allCards = [
    {
      id: 'available',
      title: t('availableBalance.title'),
      amount: balances?.availableBalance || 0,
      description: t('availableBalance.description'),
      icon: CreditCard,
      iconBg: 'bg-[var(--color-main-100)] text-[var(--color-main-600)]',
      show: true,
      hasAction: true, // Specific flag for the withdraw button
    },
    {
      id: 'reserved', // Fixed duplicate ID
      title: t('reservedBalance.title'),
      amount: balances?.reservedBalance || 0,
      description: t('reservedBalance.description'),
      icon: Hourglass,
      iconBg: 'bg-amber-100 text-amber-600',
      show: true,
    },
    {
      id: 'earnings',
      title: t('earningsToDate.title'),
      amount: balances?.earningsToDate || 0,
      description: t('earningsToDate.description'),
      icon: Wallet,
      iconBg: 'bg-emerald-100 text-emerald-600',
      show: user?.role === 'seller',
    },
    {
      id: 'promo',
      title: t('promoCredits.title'),
      amount: balances?.promoCredits || 0,
      description: t('promoCredits.description'),
      icon: DollarSign,
      iconBg: 'bg-blue-100 text-blue-600',
      show: true,
    },
    {
      id: 'cancelled',
      title: t('cancelledOrdersCredit.title'),
      amount: balances?.cancelledOrdersCredit || 0,
      description: t('cancelledOrdersCredit.description'),
      icon: RotateCcw,
      iconBg: 'bg-red-100 text-red-600',
      show: user?.role === 'buyer',
    },
  ];

  if (loading) {
    return (
      <div className='mb-12'>
        {/* Title Skeleton */}
        <div className='mb-6'>
          <div className='h-8 w-48 bg-gray-200 rounded-lg animate-pulse' />
        </div>

        {/* Cards Grid Skeleton */}
        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'
            >
              <div className='flex justify-between items-start mb-4'>
                <div className='space-y-3 flex-grow'>
                  {/* Title text line */}
                  <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
                  {/* Amount text line */}
                  <div className='h-10 w-32 bg-gray-200 rounded-lg animate-pulse' />
                </div>
                {/* Icon circle */}
                <div className='w-10 h-10 bg-gray-200 rounded-xl animate-pulse' />
              </div>

              {/* Description line */}
              <div className='h-4 w-full bg-gray-100 rounded animate-pulse mt-2' />

              {/* Optional: If the card has an action button, add a skeleton for it */}
              {i === 1 && (
                <div className='mt-5 h-11 w-full bg-gray-200 rounded-xl animate-pulse' />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <>

      <div className='mb-12'>
        <div className='mb-6'>
          <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
        </div>

        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {allCards.map((card) => {
            const Icon = card.icon;
            if (!card.show) return null;

            return (
              <div
                key={card.id}
                className='rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col'
              >
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <p className='text-sm text-gray-500 font-semibold uppercase tracking-wider'>{card.title}</p>
                    <div className='flex gap-2 items-center text-3xl font-extrabold text-gray-900 mt-1'>
                      <span>{Number(card.amount).toFixed(2)}</span>
                      <span className='text-lg font-medium text-gray-400'>SAR</span>
                    </div>
                  </div>
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className='w-5 h-5' />
                  </span>
                </div>

                <p className='text-sm text-gray-500 flex-grow'>{card.description}</p>

                {/* Withdraw Button Integration */}
                {card.hasAction && (
                  <button
                    onClick={() => openWithdrawModal(card.amount)}
                    disabled={card.amount < 112}
                    className='mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--color-main-600)] hover:bg-[var(--color-main-700)] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ArrowUpRight className='w-4 h-4' />
                    {t('withdrawButton') || 'Withdraw Funds'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        maxAmount={selectedWithdrawAmount}
        onSuccess={handleWithdrawSuccess}
        onMoveToPaymentMethods={() => setActiveTab("payment-methods")}
      />
    </>
  );
};


function createBillingValidationSchema(t) {
  return yup.object({
    firstName: yup
      .string()
      .trim()
      .required(t('validation.firstNameRequired'))
      .min(2, t('validation.nameMin'))
      .max(100, t('validation.nameMax', { max: 100 })), // Set to 100

    lastName: yup
      .string()
      .trim()
      .required(t('validation.lastNameRequired'))
      .min(2, t('validation.nameMin'))
      .max(100, t('validation.nameMax', { max: 100 })),

    // email: yup
    //   .string()
    //   .email(t('validation.emailInvalid'))
    //   .required(t('validation.emailRequired')),

    // phoneNumber: yup
    //   .string()
    //   .required(t('validation.phoneRequired'))
    //   .matches(/^[0-9+\-\s()]*$/, t('validation.phoneInvalid')), // Basic phone regex

    countryId: yup
      .string()
      .required(t('validation.countryRequired')),

    stateId: yup
      .string()
      .nullable()
      // You can make this required if every country has states
      .optional(),

    isSaudiResident: yup
      .boolean()
      .nullable()
      .required(t('validation.residencyRequired')),

    agreeToInvoiceEmails: yup
      .boolean()
  });
}

const BillingInformation = () => {
  const t = useTranslations('MyBilling.billingInformation');
  const { user } = useAuth();
  const { countries: countriesOptions, countryLoading } = useValues();
  const [statesOptions, setStatesOptions] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const locale = useLocale();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [message, setMessage] = useState('');

  // 1. Setup React Hook Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createBillingValidationSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      // email: '',
      // phoneNumber: '',
      countryId: '',
      stateId: '',
      isSaudiResident: null, // or false
      agreeToInvoiceEmails: false,
    },
    mode: 'onChange',
  });

  const [fetchedBillingInfo, setFetchedBillingInfo] = useState(null);
  // 2. Fetch Initial Data
  useEffect(() => {
    const fetchBillingInfo = async () => {
      setIsLoadingData(true);
      try {
        const data = await accountingAPI.getBillingInformation();
        // Reset form with fetched data
        setFetchedBillingInfo(data);
        reset({
          firstName: data.firstName || user?.username || '',
          lastName: data.lastName || '',
          // email: data.email || user?.email || '',
          // phoneNumber: data.phoneNumber || user?.phone || '',
          countryId: data.country?.id || data.countryId || user?.countryId || '',
          stateId: data.state?.id || data.stateId || '',
          isSaudiResident: data.isSaudiResident,
          agreeToInvoiceEmails: data.agreeToInvoiceEmails || false,
        });
      } catch (error) {
        console.error('Error fetching billing info:', error);
        setMessage({ type: 'error', text: t('errors.loading') });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchBillingInfo();
  }, [reset, t]);


  useEffect(() => {
    if (user && !fetchedBillingInfo) {
      reset({
        firstName: user?.username || '',
        // email: user?.email || '',
        // phoneNumber: user?.phone || '',
        countryId: user?.countryId || '',
      })
    }
  }, [user, fetchedBillingInfo, reset]);


  const selectedCountryId = watch('countryId');
  const scopeKey = useMemo(() => `state:${selectedCountryId || 'root'}`, [selectedCountryId]);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    // If no country is selected, clear states and stop
    if (!selectedCountryId) {
      setStatesOptions([]);
      return;
    }

    const fetchStates = async () => {
      // Check Cache first
      if (cacheRef.current.has(scopeKey)) {
        setStatesOptions(cacheRef.current.get(scopeKey));
        return;
      }

      setStatesLoading(true);
      try {
        // Your dynamic URL logic
        const res = await api.get(`/states/by-country/${selectedCountryId}`);

        // Handle array or wrapped records
        const records = Array.isArray(res?.data) ? res.data : (res?.data?.records || []);

        // Set state and update cache
        setStatesOptions(records);
        cacheRef.current.set(scopeKey, records);
      } catch (e) {
        console.error('Error fetching states:', e);
        setStatesOptions([]);

      } finally {
        setStatesLoading(false);
      }
    };

    fetchStates();
  }, [selectedCountryId, scopeKey, t]);
  // 4. Handle Submit
  const onSubmit = async (data) => {
    setMessage('');
    try {
      await accountingAPI.updateBillingInformation(data);
      setMessage({ type: 'success', text: t('success') });
    } catch (error) {
      console.error('Error updating billing information:', error);
      setMessage({ type: 'error', text: t('errors.updating') });
    }
  };

  // 1. Memoized Country Options
  const localizedCountries = useMemo(() => {
    if (!countriesOptions) return [];
    return countriesOptions.map(country => ({
      id: country.id,
      // Use name_ar if locale is 'ar', otherwise use name
      name: (locale === 'ar' ? country.name_ar : country.name) || country.name
    }));
  }, [countriesOptions, locale]);

  // 2. Memoized State Options
  const localizedStates = useMemo(() => {
    if (!statesOptions) return [];
    return statesOptions.map(state => ({
      id: state.id,
      name: (locale === 'ar' ? state.name_ar : state.name) || state.name
    }));
  }, [statesOptions, locale]);

  // Loading Skeleton
  if (isLoadingData || countryLoading) {
    return (
      <div className='max-w-[800px] w-full mx-auto mb-12'>
        <Skeleton className='h-8 w-64 mb-6' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-[800px] w-full mx-auto mb-12'>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>
          {t('title')}
        </h1>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700' // Adjusted colors for success
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Form Start */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='max-w-[800px] w-full grid grid-cols-1 md:grid-cols-2 gap-6'>

          {/* First Name */}
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput={'!border-[var(--color-main-600)]'}
                label={t('firstName')}
                placeholder={t('firstNamePlaceholder')}
                error={errors.firstName?.message} // Pass error to Input if supported
              />
            )}
          />

          {/* Last Name */}
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput={'!border-[var(--color-main-600)]'}
                label={t('lastName')}
                placeholder={t('lastNamePlaceholder')}
                error={errors.lastName?.message}
              />
            )}
          />

          {/* Email */}
          {/* <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput={'!border-[var(--color-main-600)]'}
                label={t('email')}
                placeholder={t('emailPlaceholder')}
                error={errors.email?.message}
              />
            )}
          /> */}

          {/* Phone Number */}
          {/* <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput={'!border-[var(--color-main-600)]'}
                label={t('phoneNumber')}
                placeholder={t('phonePlaceholder')}
                error={errors.phoneNumber?.message}
              />
            )} 
          />*/}

          {/* Country Select */}
          <Controller
            name="countryId"
            control={control}
            render={({ field }) => (
              <Select
                showSearch
                cnSelect={'!border-[var(--color-main-600)]'}
                label={t('country')}
                placeholder={t('selectCountry')}
                options={localizedCountries}
                isLoading={countryLoading}
                value={field.value}
                onChange={(opt) => {
                  field.onChange(opt?.id);
                  setValue('stateId', null); // Reset state when country changes
                }}
                error={errors.countryId?.message}
              />
            )}
          />

          {/* State Select */}
          <Controller
            name="stateId"
            control={control}
            render={({ field }) => (
              <Select
                showSearch
                cnSelect={'!border-[var(--color-main-600)]'}
                label={t('state')}
                placeholder={t('selectState')}
                options={localizedStates} // You need to populate this
                isLoading={statesLoading}
                disabled={!selectedCountryId}
                value={field.value}
                onChange={(opt) => field.onChange(opt?.id)}
                error={errors.stateId?.message}
              />
            )}
          />

          {/* Saudi Resident (Yes/No) */}
          <Controller
            name="isSaudiResident"
            control={control}
            render={({ field }) => (
              <Select
                cnSelect={'!border-[var(--color-main-600)]'}
                label={t('saudiResident')}
                placeholder={t('select')}
                options={[
                  { id: true, name: t('yes') },
                  { id: false, name: t('no') },
                ]}
                value={field.value}
                onChange={(opt) => field.onChange(opt?.id)}
                error={errors.isSaudiResident?.message}
              />
            )}
          />
        </div>

        {/* <h1 className='h2 mt-6'>{t('invoices')}</h1>
        <p className='p mb-6'>{t('invoicesDesc')}</p>

        <div className='flex items-center gap-3'>
          <Controller
            name="agreeToInvoiceEmails"
            control={control}
            render={({ field }) => (
              <AnimatedCheckbox
                checked={field.value}
                onChange={(checked) => field.onChange(checked)}
              />
            )}
          />
          <span className='text-sm text-gray-700'>{t('inboxMessages')}</span>
        </div> */}
        {errors.agreeToInvoiceEmails && <p className="text-red-500 text-sm">{errors.agreeToInvoiceEmails.message}</p>}

        <div className='max-w-[250px] mt-6'>
          <Button
            name={isSubmitting ? t('saving') : t('saveChanges')}
            color='green'
            type="submit" // Trigger form submission
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
};


function createPayoutSchema(t) {
  return yup.object({
    fullName: yup
      .string()
      .trim()
      .required(t('validation.fullNameRequired'))
      .min(3, t('validation.nameMin', { min: 3 }))
      .max(100, t('validation.nameMax', { max: 200 })),

    iban: yup
      .string()
      .trim()
      .required(t('validation.ibanRequired'))
      .min(16, t('validation.ibanMin', { min: 16 }))
      .max(32, t('validation.ibanMax', { max: 32 }))
      .matches(/^[0-9A-Z]{16,32}$/, t('validation.ibanInvalid')),

    bankCode: yup
      .string()
      .required(t('validation.bankRequired')),
  });
}

const PaymentMethods = () => {
  const t = useTranslations('MyBilling.paymentMethods');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // NEW: State to track which account is being edited
  const [editingAccount, setEditingAccount] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createPayoutSchema(t)),
    defaultValues: {
      fullName: '',
      iban: '',
      bankCode: '',
    },
  });

  const locale = useLocale();

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

  // NEW: Function to populate form for editing
  const handleEditClick = (account) => {
    setEditingAccount(account);
    reset({
      fullName: account.fullName,
      iban: account.iban,
      bankCode: account.bankCode,
    });
  };

  // NEW: Function to cancel editing
  const handleCancelEdit = () => {
    setEditingAccount(null);
    reset({
      fullName: '',
      iban: '',
      bankCode: '',
    });
  };

  const handleSave = async (data) => {
    setSaving(true);
    setMessage('');
    try {
      if (editingAccount) {
        // Update Logic
        await accountingAPI.updateBankAccount(editingAccount.id, data);
        setMessage(t('success.updated') || 'Account updated successfully');
      } else {
        // Create Logic
        await accountingAPI.createBankAccount(data);
        setMessage(t('success.added'));
      }

      setEditingAccount(null);
      reset({
        fullName: '',
        iban: '',
        bankCode: '',
      });
      fetchBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      setMessage(editingAccount ? t('errors.updating') : t('errors.adding'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async id => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await accountingAPI.deleteBankAccount(id);
        setMessage(t('success.deleted'));
        if (editingAccount?.id === id) handleCancelEdit();
        fetchBankAccounts();
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
      fetchBankAccounts();
    } catch (error) {
      console.error('Error setting default bank account:', error);
      setMessage(t('errors.settingDefault'));
    }
  };

  const bankOptions = useMemo(() => {
    return BANKS.map(bank => ({
      id: bank.code,
      name: t(`bank_codes.banks.${bank.code}`)
    })).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [t, locale]);

  if (loading) {
    return (
      <div className='max-w-[1400px] w-full mx-auto mb-12'>
        <Skeleton className='h-8 w-64 mb-6' />
        <Skeleton className='h-6 w-52 mb-4' />
        <Skeleton className='h-20 w-full mb-4' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-[1400px] w-full mx-auto mb-12'>
      <div className='flex max-md:flex-col w-full items-center justify-between gap-2 flex-wrap mb-6'>
        <h1 className='text-2xl max-md:text-xl font-bold text-gray-800 tracking-wide'>{t('title')}</h1>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') || message.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-main-100 text-main-700'}`}>
          {message}
        </div>
      )}
      {bankAccounts.length > 0 && (
        <div className='mb-8'>
          <h2 className='text-xl font-semibold mb-4'>{t('yourBankAccounts')}</h2>
          <div className='grid gap-4'>
            {bankAccounts.map(account => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${editingAccount?.id === account.id ? 'border-main-600 bg-main-50' : ''
                  }`}
              >
                {/* Info */}
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold '>{account.fullName}</p>
                  <p className='text-gray-600 text-sm break-words'>{t('iban')} {account.iban}</p>
                  {account.isDefault && (
                    <span className='inline-block bg-main-100 text-main-800 text-xs px-2 py-1 rounded mt-1'>
                      {t('default')}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className='flex items-center gap-3 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0'>
                  <button
                    onClick={() => handleEditClick(account)}
                    className='text-main-600 hover:text-main-800 text-sm font-medium'
                  >
                    {t('edit') || 'Edit'}
                  </button>
                  {!account.isDefault && (
                    <>
                      <span className='text-gray-300 text-xs'>|</span>
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className='text-blue-600 hover:text-blue-800 text-sm'
                      >
                        {t('setDefault')}
                      </button>
                      <span className='text-gray-300 text-xs'>|</span>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className='text-red-600 hover:text-red-800 text-sm'
                      >
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

      <div className='bg-gray-50 p-6 rounded-2xl border border-gray-100'>
        <h3 className='text-lg font-bold mb-4'>
          {editingAccount ? t('editAccountTitle') || 'Edit Bank Account' : t('addAccountTitle') || 'Add New Account'}
        </h3>
        <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput='!border-[var(--color-main-600)]'
                label={t('fullName')}
                placeholder={t('fullNamePlaceholder')}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            name="iban"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                cnInput='!border-[var(--color-main-600)]'
                label={t('ibanLabel')}
                placeholder={t('ibanPlaceholder')}
                error={errors.iban?.message}
              />
            )}
          />

          <Controller
            name="bankCode"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                cnSelect='!border-[var(--color-main-600)]'
                label={t('bank_codes.bank_name')}
                placeholder={t('bank_codes.select_bank')}
                options={bankOptions}
                value={field.value}
                onChange={val => field.onChange(val?.id)}
                error={errors.bankCode?.message}
              />
            )}
          />

          <div className='lg:col-span-3 flex justify-end gap-3 mt-4'>
            {editingAccount && (
              <Button
                name={t('cancel') || 'Cancel'}
                className='!h-[45px] max-w-[150px]'
                color='gray'
                onClick={handleCancelEdit}
              />
            )}
            <Button
              className='!h-[45px] !py-1 max-w-[250px]'
              name={saving ? (editingAccount ? t('updating') : t('adding')) : (editingAccount ? t('updateAccount') : t('addBankAccount'))}
              color='green'
              onClick={handleSubmit(handleSave)}
              disabled={saving}
            />
          </div>
        </div>
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



export const WithdrawModal = ({ isOpen, onClose, maxAmount, onSuccess, onMoveToPaymentMethods }) => {
  const formatValue = (val) => Number(Number(val).toFixed(2));
  const tBank = useTranslations('MyBilling.paymentMethods');
  const t = useTranslations('MyBilling.withdrawModal');
  const [amount, setAmount] = useState(formatValue(maxAmount) || 0);
  const [bankAccount, setBankAccount] = useState(null);
  const [loadingBank, setLoadingBank] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when modal opens
  // Sync state when modal opens or maxAmount changes
  useEffect(() => {
    if (isOpen) {
      setAmount(formatValue(maxAmount));
      fetchDefaultBank();
    }
  }, [isOpen, maxAmount]);

  const fetchDefaultBank = async () => {
    setLoadingBank(true);
    setError(null);
    try {
      const data = await accountingAPI.getDefaultBankAccount();
      setBankAccount(data);
    } catch (err) {
      console.error(err);
      // If 404, it means no default bank (handled in UI)
      setBankAccount(null);
    } finally {
      setLoadingBank(false);
    }
  };

  const handleWithdraw = async () => {
    // Validation
    if (amount < 112) {
      toast.error(t('minAmountError'));
      return;
    }
    if (amount > maxAmount) {
      toast.error(t('maxAmountError'));
      return;
    }

    setSubmitting(true);
    try {
      await accountingAPI.withdrawFunds(amount);
      toast.success(t('successMessage'));
      onSuccess(); // Refresh parent data
      onClose();   // Close modal
    } catch (err) {
      const msg = err.response?.data?.message || 'Withdrawal failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return;
  return (
    <Modal title={t('title')} isOpen={isOpen} onClose={onClose} className="!max-w-xl">
      <div className="p-6">
        {loadingBank ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-10 w-1/3 bg-slate-100 rounded-xl" />
          </div>
        ) : !bankAccount ? (
          // Case: No Default Bank Account
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('noBankTitle')}</h3>
              <p className="text-gray-500 mt-1 max-w-xs mx-auto">{t('noBankMessage')}</p>
            </div>
            <Button
              variant="outline"
              onClick={onMoveToPaymentMethods}
              name={t('addBankLink')}
              className='!w-fit'
            />
          </div>
        ) : (
          // Case: Has Bank Account - Show Form
          <div className="space-y-6">

            {/* Bank Details Card */}

            <div className='bg-slate-50 border border-slate-200 rounded-xl p-4'>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3'>
                {t('bankLabel')}
              </label>
              <div className='flex items-start gap-3'>
                <div className='p-2 bg-white rounded-lg border border-gray-100 shadow-sm flex-shrink-0'>
                  <Building2Icon className='w-6 h-6 text-gray-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  {/* Localized Bank Name */}
                  <p className='font-bold text-gray-900 truncate'>
                    {bankAccount.bankCode && tBank(`bank_codes.banks.${bankAccount.bankCode}`)}
                  </p>

                  {/* Account Holder */}
                  <p className='text-sm font-medium text-gray-700 mt-0.5 truncate'>
                    {bankAccount.fullName}
                  </p>

                  {/* IBAN */}
                  <div className='mt-2 flex items-center gap-2 min-w-0'>
                    <span className='flex-shrink-0 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase'>
                      {tBank('ibanLabel')}
                    </span>
                    <p className='text-sm text-gray-500 font-mono tracking-tighter truncate'>
                      {bankAccount.iban}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              {/* Label & Available Badge Header */}
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  {t('amountLabel')}
                </label>
                <span className="text-xs font-medium text-[var(--color-main-600)] bg-[var(--color-main-50)] px-2 py-0.5 rounded-full">
                  {t('available', { amount: Number(maxAmount).toFixed(2) })}
                </span>
              </div>

              {/* Input Container with Relative Positioning for "SAR" */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-gray-500 sm:text-sm">SAR</span>
                </div>

                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  min="112"
                  max={maxAmount}
                  // Add 'pl-12' to make room for the SAR prefix
                  className="pl-12 !text-lg font-semibold"
                // If you are using React Hook Form, replace value/onChange with: {...register('amount')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleWithdraw}
                disabled={amount < 112 || amount > maxAmount}
                name={t('confirm')}
                loading={submitting}
                className="flex-1"
              />
              <Button
                color='gray'
                onClick={onClose}
                className="flex-1"
                name={t('cancel')}
                disabled={submitting}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};