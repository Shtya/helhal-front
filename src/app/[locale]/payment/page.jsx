'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';
import { CreditCard, User, DollarSign, FileText, Loader2, AlertCircle, Check, Wallet, Wallet2, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import Link from 'next/link';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/context/AuthContext';
import { useValues } from '@/context/GlobalContext';
import { Controller, useForm } from 'react-hook-form';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';

export async function getOrder(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
}

// ----- UI helpers (display only) -----
const formatMoney = (amount, currency = 'SAR') => (typeof amount === 'number' ? new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount) : '—');

const initials = name =>
  (name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// ---- Skeleton Loader (UI only) ----
function PaymentSkeleton() {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-8 shadow-lg'>
      <div className='mb-6 h-6 w-2/3 animate-pulse rounded bg-slate-200' />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {[0, 1].map(i => (
          <div key={i} className='flex items-center gap-3'>
            <div className='h-10 w-10 animate-pulse rounded-full bg-slate-200' />
            <div className='space-y-2'>
              <div className='h-3 w-24 animate-pulse rounded bg-slate-200' />
              <div className='h-4 w-32 animate-pulse rounded bg-slate-200' />
            </div>
          </div>
        ))}
      </div>
      <div className='my-6 h-px w-full bg-slate-100' />
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='h-11 animate-pulse rounded-xl bg-slate-200' />
        <div className='h-11 animate-pulse rounded-xl bg-slate-200' />
      </div>
    </div>
  );
}


function createBillingValidationSchema(t) {
  return yup.object({
    firstName: yup
      .string()
      .trim()
      .required(t('validation.firstNameRequired'))
      .min(2, t('validation.nameMin'))
      .max(100, t('validation.nameMax', { max: 100 })),

    lastName: yup
      .string()
      .trim()
      .required(t('validation.lastNameRequired'))
      .min(2, t('validation.nameMin'))
      .max(100, t('validation.nameMax', { max: 100 })),

    email: yup
      .string()
      .email(t('validation.emailInvalid'))
      .required(t('validation.emailRequired')),

    phoneNumber: yup
      .string()
      .required(t('validation.phoneRequired'))
      .matches(/^[0-9+\-\s()]*$/, t('validation.phoneInvalid')),

    countryId: yup
      .string()
      .required(t('validation.countryRequired')),

    stateId: yup
      .string()
      .nullable()
      .optional(),
  });
}


export default function PaymentPage() {
  const tb = useTranslations('MyBilling.billingInformation');
  const t = useTranslations('Payment.page');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { countries: countriesOptions, countryLoading } = useValues();

  const orderId = searchParams.get('orderId');

  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Terms Modal State
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [statesOptions, setStatesOptions] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const cacheRef = useRef(new Map());

  const payable = order?.status === 'Pending';
  const cancellable = ['Accepted', 'Pending'].includes(order?.status);

  // Setup Billing Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createBillingValidationSchema(tb)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      countryId: '',
      stateId: '',
    },
    mode: 'onChange',
  });

  const selectedCountryId = watch('countryId');

  const [fetchedBillingInfo, setFetchedBillingInfo] = useState(null);

  // Fetch Data (Order & Billing Info)
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        const [orderData, billingData] = await Promise.all([
          api.get(`/orders/${orderId}`).then(res => res.data),
          api.get('/accounting/billing-information').then(res => res.data).catch(() => ({}))
        ]);

        setOrder(orderData);
        setFetchedBillingInfo(billingData);
        // Pre-fill form
        reset({
          firstName: billingData.firstName || user?.username || '',
          lastName: billingData.lastName || '',
          email: user?.email || '',
          phoneNumber: user?.phone || '',
          countryId: billingData.countryId || user?.countryId || '',
          stateId: billingData.stateId || '',
        });
      } catch (err) {
        console.error(err);
        toast.error(t('toast.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, user, reset, t]);

  useEffect(() => {
    if (user && !fetchedBillingInfo) {
      reset({
        firstName: user?.username || '',
        email: user?.email || '',
        phoneNumber: user?.phone || '',
        countryId: user?.countryId || '',
      })
    }
  }, [user, fetchedBillingInfo, reset]);

  // Fetch States when country changes
  useEffect(() => {
    if (!selectedCountryId) {
      setStatesOptions([]);
      return;
    }
    const fetchStates = async () => {
      const scopeKey = `state:${selectedCountryId}`;
      if (cacheRef.current.has(scopeKey)) {
        setStatesOptions(cacheRef.current.get(scopeKey));
        return;
      }
      setStatesLoading(true);
      try {
        const res = await api.get(`/states/by-country/${selectedCountryId}`);
        const records = Array.isArray(res?.data) ? res.data : (res?.data?.records || []);
        setStatesOptions(records);
        cacheRef.current.set(scopeKey, records);
      } catch (e) {
        setStatesOptions([]);
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, [selectedCountryId]);

  // Submit Payment
  const onConfirmPayment = async (billingData) => {
    try {
      setPaying(true);
      const payload = {
        ...billingData,
      };

      const { data } = await api.post(`/orders/${orderId}/pay`, payload);

      toast.success(t('redirecting'));
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/payment/success?orderId=${orderId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('toast.failedToMarkPaid'));
    } finally {
      setPaying(false);
      setIsTermsModalOpen(false);
      setAcceptedTerms(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellable) return;
    try {
      setCanceling(true);
      await api.post(`/orders/${orderId}/cancel`);
      toast(t('toast.paymentCanceled'), { icon: '⚠️' });
      router.push('/my-jobs');
    } catch (err) {
      toast.error(t('toast.failedToCancel'));
    } finally {
      setCanceling(false);
    }
  };

  // Handle Pay Button Click - Opens Terms Modal
  const handlePayButtonClick = () => {
    handleSubmit(() => {
      setIsTermsModalOpen(true);
    })();
  };

  // Handle Terms Agreement and Payment
  const handleAgreeAndPay = () => {
    if (acceptedTerms) {
      handleSubmit(onConfirmPayment)();
    } else {
      toast.error(t('toast.mustAcceptTerms'));
    }
  };

  // Localized Memo
  const localizedCountries = useMemo(() =>
    countriesOptions?.map(c => ({ id: c.id, name: locale === 'ar' ? c.name_ar : c.name })) || [],
    [countriesOptions, locale]);

  const localizedStates = useMemo(() =>
    statesOptions?.map(s => ({ id: s.id, name: locale === 'ar' ? s.name_ar : s.name })) || [],
    [statesOptions, locale]);

  const invoice = order?.invoices?.[0];
  const currency = invoice?.currencyId || 'SAR';
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading]);

  if (loading) return <div className="container !py-12"><PaymentSkeleton /></div>;

  return (
    <div className='container !py-12'>
      <h1 className='mb-2 text-center text-3xl font-extrabold tracking-tight'>
        <span className='bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent'>{t('payNow')}</span>
      </h1>
      <p className='mb-8 text-center text-sm text-slate-500'>{t('subtitle')}</p>

      {order ? (
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

            {/* Left Column - Invoice Summary */}
            <div className='lg:col-span-1'>
              <div className='sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg'>
                <h2 className='text-lg font-bold text-slate-900 mb-4'>{t('orderSummary')}</h2>

                <div className='mb-4 pb-4 border-b border-slate-200'>
                  <h3 className='font-semibold text-slate-800 mb-2'>{order.title}</h3>
                </div>

                {/* Invoice Details */}
                {invoice && (
                  <div className='rounded-xl bg-slate-50 p-4 border border-slate-200'>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
                      <FileText className='h-4 w-4 text-main-600' />
                      <span className='text-sm font-bold text-slate-800'>{t('invoice', { number: invoice.invoiceNumber })}</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('subtotal')}</span>
                        <span className="font-medium text-slate-700">{formatMoney(Number(invoice.subtotal), currency)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('serviceFee')}</span>
                        <span className="font-medium text-slate-700">{formatMoney(Number(invoice.platformPercent), currency)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                        <span className="text-slate-500">{t('status')}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${invoice.paymentStatus === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : invoice.paymentStatus === 'paid'
                              ? 'bg-main-100 text-main-700'
                              : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {t(`paymentStatus.${invoice.paymentStatus}`)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-slate-200">
                      <span className="font-bold text-slate-900">{t('total')}</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-main-600">
                          {formatMoney(Number(invoice.totalAmount), currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                          {t('includesTaxes')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Billing Form */}
            <div className='lg:col-span-2'>
              <div className='rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg'>
                <h2 className="text-xl font-bold mb-6 text-slate-900">{t('billingInformation')}</h2>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder={tb('firstNamePlaceholder')} label={tb('firstName')} error={errors.firstName?.message} />
                      )}
                    />
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder={tb('lastNamePlaceholder')} label={tb('lastName')} error={errors.lastName?.message} />
                      )}
                    />

                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          cnInput={'!border-[var(--color-main-600)]'}
                          label={tb('email')}
                          placeholder={tb('emailPlaceholder')}
                          error={errors.email?.message}
                        />
                      )}
                    />

                    <Controller
                      name="phoneNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          cnInput={'!border-[var(--color-main-600)]'}
                          label={tb('phoneNumber')}
                          placeholder={tb('phonePlaceholder')}
                          error={errors.phoneNumber?.message}
                        />
                      )}
                    />

                    <Controller
                      name="countryId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label={tb('country')}
                          options={localizedCountries}
                          isLoading={countryLoading}
                          value={field.value}
                          onChange={(opt) => {
                            field.onChange(opt?.id);
                            setValue('stateId', null);
                          }}
                          error={errors.countryId?.message}
                        />
                      )}
                    />
                    <Controller
                      name="stateId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label={tb('state')}
                          options={localizedStates}
                          isLoading={statesLoading}
                          disabled={!selectedCountryId}
                          value={field.value}
                          onChange={(opt) => field.onChange(opt?.id)}
                          error={errors.stateId?.message}
                        />
                      )}
                    />
                  </div>

                  <div className='flex items-center justify-end gap-4 pt-4 border-t border-slate-200'>
                    <Button
                      name={t('payNow')}
                      onClick={handlePayButtonClick}
                      color="green"
                      disabled={!payable}
                      className='!w-fit !px-8 h-12 rounded-xl text-base'
                    >
                      <CreditCard className='mr-2 inline h-4 w-4' />
                    </Button>
                    <Button
                      name={t('cancel')}
                      color='red'
                      disabled={!cancellable}
                      onClick={handleCancel}
                      loading={canceling}
                      className='!w-fit !px-6 h-12 rounded-xl text-base'
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center'>
          <AlertCircle className='mx-auto mb-3 h-10 w-10 text-slate-500' />
          <p className='text-slate-600'>{t('noOrderFound')}</p>
        </div>
      )}

      {/* Terms Modal */}
      {isTermsModalOpen && (
        <Modal
          title={t('termsTitle')}
          onClose={() => {
            setIsTermsModalOpen(false);
            setAcceptedTerms(false);
          }}
        >
          <div className="space-y-2">
            <p className="text-gray-700 leading-relaxed">{t('termsMessage')}</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 text-main-600 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                {t('acceptTerms')} <Link href='/terms' target="_blank" className='text-main-600 underline'>{t("terms")}</Link>
              </label>
            </div>
            {/* Contact Seller */}

            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 ">
              <Link
                href={`/chat?userId=${order?.sellerId || ''}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-main-600">
                  <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>{t('contactSeller')}</span>
                </div>

                <span className="text-xs text-gray-500 group-hover:text-main-600 transition">
                  {t('askBeforePaying')}
                </span>
              </Link>
            </div>


            <div className="flex gap-3 mt-4">
              <Button
                name={paying ? t('processing') : t('agreeAndPay')}
                onClick={handleAgreeAndPay}
                disabled={!acceptedTerms}
                loading={paying}
                color="green"
                className="flex-1"
              >
                <CreditCard className='mr-2 inline h-4 w-4' />
              </Button>
              <Button
                name={t('cancel')}
                onClick={() => {
                  setIsTermsModalOpen(false);
                  setAcceptedTerms(false);
                }}
                color="secondary"
                disabled={paying}
                className="flex-1"
              />


            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}