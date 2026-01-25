'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';
import { CreditCard, User, DollarSign, FileText, Loader2, AlertCircle, Check, Wallet, Wallet2 } from 'lucide-react';
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

// ---- Page ----
// export default function PaymentPage() {
//   const t = useTranslations('Payment.page');
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const orderId = searchParams.get('orderId');
//   const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
//   const [acceptedTerms, setAcceptedTerms] = useState(false);


//   const [order, setOrder] = useState(null);
//   const payable = order?.status === 'Pending';
//   const cancellable = ['Accepted', 'Pending'].includes(order?.status);
//   const isFromJob = !!order?.jobId;

//   const [loading, setLoading] = useState(true);
//   const [paying, setPaying] = useState(false);
//   const [canceling, setCanceling] = useState(false);

//   useEffect(() => {
//     if (!orderId) {
//       setLoading(false);
//       return;
//     };

//     (async () => {
//       try {
//         const data = await getOrder(orderId);
//         setOrder(data);
//       } catch (err) {
//         console.error(err);
//         toast.error(t('toast.failedToLoad'));
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [orderId, t]);

//   const handleSuccess = async () => {
//     if (!payable) return;

//     try {
//       setPaying(true);
//       await api.post(`/orders/${orderId}/mark-paid`);

//       toast.success(t('toast.paymentSuccessful'));
//       router.push(`/payment/success?orderId=${orderId}`);
//     } catch (err) {
//       console.error(err);
//       toast.error(t('toast.failedToMarkPaid'));
//     } finally {
//       setPaying(false);
//     }
//   };

//   const handleCancel = async () => {
//     if (!cancellable) return;

//     try {
//       setCanceling(true);
//       await api.post(`/orders/${orderId}/cancel`);

//       toast(t('toast.paymentCanceled'), { icon: '⚠️' });
//       router.push('/my-jobs');
//     } catch (err) {
//       console.error(err);
//       toast.error(t('toast.failedToCancel'));
//     } finally {
//       setCanceling(false);
//     }
//   };

//   const invoice = order?.invoices?.[0];
//   const currency = invoice?.currencyId || 'SAR';

//   return (
//     <div className='container !py-12'>
//       <h1 className='mb-2 text-center text-3xl font-extrabold tracking-tight'>
//         <span className='bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent'>{t('title')}</span>
//       </h1>
//       <p className='mb-8 text-center text-sm text-slate-500'>{t('subtitle')}</p>

//       {loading ? (
//         <PaymentSkeleton />
//       ) : order ? (
//         <div className='rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8'>
//           {/* Header */}
//           <div className='mb-6 flex items-start justify-between gap-3'>
//             <h2 className='text-xl font-semibold text-slate-900'>{order.title}</h2>
//             <div className='flex items-center gap-2'>
//               {!isFromJob && order.packageType ? <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700'>{order.packageType}</span> : null}
//               {order.status ? <span className='rounded-full bg-main-100 px-3 py-1 text-xs font-medium text-main-800'>{order.status}</span> : null}
//             </div>
//           </div>

//           {/* Buyer & Seller */}
//           <div className='mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
//             <div className='flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-custom'>
//               <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700'>{initials(order.buyer?.username)}</div>
//               <div className='min-w-0'>
//                 <div className='text-xs uppercase tracking-wide text-slate-500'>{t('buyer')}</div>
//                 <div className='truncate font-medium text-slate-900'>{order.buyer?.username || '—'}</div>
//               </div>
//             </div>

//             <div className='flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-custom'>
//               <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700'>{initials(order.seller?.username)}</div>
//               <div className='min-w-0'>
//                 <div className='text-xs uppercase tracking-wide text-slate-500'>{t('seller')}</div>
//                 <div className='truncate font-medium text-slate-900'>{order.seller?.username || '—'}</div>
//               </div>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className='my-4 h-px w-full bg-slate-100' />

//           {/* Invoice Breakdown */}
//           {invoice ? (
//             <div className='mb-6 rounded-xl bg-slate-50 p-4'>
//               <p className='mb-3 flex items-center gap-2 font-medium text-slate-800'>
//                 <FileText className='h-4 w-4' />
//                 {t('invoice', { number: invoice.invoiceNumber })}
//               </p>

//               {/* Details */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-700">
//                 <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
//                   <span>{t('subtotal')}</span>
//                   <span className="font-medium">{formatMoney(Number(invoice.subtotal), currency)}</span>
//                 </div>
//                 <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
//                   <span>{t('serviceFee')}</span>
//                   <span className="font-medium">{formatMoney(Number(invoice.platformPercent), currency)}</span>
//                 </div>
//                 {/* <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
//                   <span>{t('platformPercent')}</span>
//                   <span className="font-medium">{invoice.platformPercent} SAR</span>
//                 </div> */}
//                 <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
//                   <span>{t('issuedAt')}</span>
//                   <span className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</span>
//                 </div>
//                 <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
//                   <span>{t('status')}</span>
//                   <span
//                     className={`font-medium capitalize ${invoice.paymentStatus === 'pending'
//                       ? 'text-amber-600'
//                       : invoice.paymentStatus === 'paid'
//                         ? 'text-main-600'
//                         : 'text-slate-600'
//                       }`}
//                   >
//                     {invoice.paymentStatus}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom lg:col-span-3">
//                   <span className="font-semibold text-slate-900">{t('total')}</span>
//                   <span className="font-semibold text-slate-900">{formatMoney(Number(invoice.totalAmount), currency)}</span>
//                 </div>
//               </div>

//             </div>
//           ) : null}

//           {/* Amount */}
//           <div className='mb-6 text-center'>
//             <div className='mx-auto inline-flex items-baseline gap-2 rounded-2xl border border-main-200/60 bg-main-50 px-5 py-3'>
//               <span className='text-2xl font-bold text-main-800'>{formatMoney(Number(invoice.totalAmount), currency)}</span>
//             </div>
//             <p className='mt-2 text-xs text-slate-500'>{t('includesTaxes')}</p>
//           </div>

//           {/* Actions */}
//           <div className='flex items-center justify-end gap-4 '>
//             <Button
//               name={paying ? t('processing') : t('payNow')}
//               disabled={!payable}
//               color='green'
//               onClick={() => setIsTermsModalOpen(true)}
//               loading={paying}
//               className='!w-fit !px-6 h-11 rounded-xl text-base shadow-custom transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-400'
//               aria-label='Confirm payment'
//             >
//               {paying ? <Loader2 className='mr-2 inline h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 inline h-4 w-4' />}
//             </Button>

//             <Button name={t('cancel')} color='red' disabled={!cancellable} onClick={handleCancel} className='!w-fit !px-6 h-11 rounded-xl text-base' loading={canceling} aria-label='Cancel and go back'>
//               <AlertCircle className='mr-2 inline h-4 w-4' />
//             </Button>
//           </div>
//         </div>
//       ) : (
//         <div className='rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center'>
//           <AlertCircle className='mx-auto mb-3 h-10 w-10 text-slate-500' />
//           <p className='text-slate-600'>{t('noOrderFound')}</p>
//         </div>
//       )}
//       {isTermsModalOpen && (
//         <Modal
//           title={t('termsTitle')} // you can localize this key
//           open={isTermsModalOpen}
//           onClose={() => setIsTermsModalOpen(false)}
//         >
//           <div className="space-y-4">
//             <p className="text-gray-700 leading-relaxed">
//               {t('termsMessage')}
//             </p>

//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="acceptTerms"
//                 checked={acceptedTerms}
//                 onChange={(e) => setAcceptedTerms(e.target.checked)}
//                 className="h-4 w-4 text-main-600 border-gray-300 rounded"
//               />
//               <label htmlFor="acceptTerms" className="text-sm text-gray-700 flex gap-1">
//                 {t('acceptTerms')}
//                 <Link href='/terms' target="_blank" className='text-main-600 underline hover:text-main-800'>
//                   {t("terms")}
//                 </Link>
//               </label>
//             </div>

//             <div className="flex gap-3 mt-4">
//               <Button
//                 name={t('confirmPayment')}
//                 onClick={() => {
//                   if (acceptedTerms) {
//                     setIsTermsModalOpen(false);
//                     handleSuccess();
//                   } else {
//                     toast.error(t('toast.mustAcceptTerms'));
//                   }
//                 }}
//                 disabled={!acceptedTerms || paying}
//                 loading={paying}
//                 color="green"
//                 className="flex-1"
//               />
//               <Button
//                 name={t('cancel')}
//                 onClick={() => setIsTermsModalOpen(false)}
//                 color="secondary"
//                 className="flex-1"
//               />
//             </div>
//           </div>
//         </Modal>
//       )}

//     </div>
//   );
// }


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

    email: yup
      .string()
      .email(t('validation.emailInvalid'))
      .required(t('validation.emailRequired')),

    phoneNumber: yup
      .string()
      .required(t('validation.phoneRequired'))
      .matches(/^[0-9+\-\s()]*$/, t('validation.phoneInvalid')), // Basic phone regex

    countryId: yup
      .string()
      .required(t('validation.countryRequired')),

    stateId: yup
      .string()
      .nullable()
      // You can make this required if every country has states
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

  // Workflow States
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showBillingStep, setShowBillingStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'wallet'

  const [statesOptions, setStatesOptions] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const cacheRef = useRef(new Map());

  const payable = order?.status === 'Pending';
  const cancellable = ['Accepted', 'Pending'].includes(order?.status);

  // 1. Setup Billing Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createBillingValidationSchema(tb)), // Should validate firstName, lastName, countryId, stateId
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
  // 2. Fetch Data (Order & Billing Info)
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

  // 3. Fetch States when country changes
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

  // 4. Submit Payment
  const onConfirmPayment = async (billingData) => {
    try {
      setPaying(true);
      const payload = {
        paymentMethod,
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

  // Localized Memo
  const localizedCountries = useMemo(() =>
    countriesOptions?.map(c => ({ id: c.id, name: locale === 'ar' ? c.name_ar : c.name })) || [],
    [countriesOptions, locale]);

  const localizedStates = useMemo(() =>
    statesOptions?.map(s => ({ id: s.id, name: locale === 'ar' ? s.name_ar : s.name })) || [],
    [statesOptions, locale]);

  const invoice = order?.invoices?.[0];
  const currency = invoice?.currencyId || 'SAR';

  if (loading) return <div className="container !py-12"><PaymentSkeleton /></div>;

  return (
    <div className='container !py-12'>
      <h1 className='mb-2 text-center text-3xl font-extrabold tracking-tight'>
        <span className='bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent'>{t('payNow')}</span>
      </h1>
      <p className='mb-8 text-center text-sm text-slate-500'>{t('subtitle')}</p>

      {order ? (
        <div className='max-w-4xl mx-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8'>

          {/* 1. Order Details Summary */}
          {!showBillingStep && (
            <>
              <div className='mb-6 flex items-start justify-between gap-3 font-semibold'>
                <h2 className='text-xl text-slate-900'>{order.title}</h2>
                {/* <span className='rounded-full bg-main-100 px-3 py-1 text-xs text-main-800'>{order.status}</span> */}
              </div>

              {/* Invoice Table */}
              {invoice && (
                <div className='mb-6 rounded-2xl bg-slate-50 p-5 border border-slate-200 shadow-sm'>
                  {/* Header with Icon */}
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
                    <div className='flex items-center gap-2 font-bold text-slate-800'>
                      <FileText className='h-5 w-5 text-main-600' />
                      <span>{t('invoice', { number: invoice.invoiceNumber })}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                      {new Date(invoice.issuedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Detailed Breakdown Grid */}
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('subtotal')}</span>
                      <span className="font-medium text-slate-700">{formatMoney(Number(invoice.subtotal), currency)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('serviceFee')}</span>
                      <span className="font-medium text-slate-700">{formatMoney(Number(invoice.platformPercent), currency)}</span>
                    </div>

                    {/* Status Row */}
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

                  {/* Total Highlight */}
                  <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-slate-200">
                    <span className="font-bold text-slate-900">{t('total')}</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-main-600">
                        {formatMoney(Number(invoice.totalAmount), currency)}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">
                        {t('includesTaxes')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-end gap-4'>
                <Button
                  name={t('continue')}
                  disabled={!payable}
                  color='green'
                  onClick={() => setIsTermsModalOpen(true)}
                  className='!w-fit !px-8 h-12 rounded-xl text-base'
                >
                  <CreditCard className='mr-2 inline h-4 w-4' />
                </Button>
                <Button name={t('cancel')} color='red' disabled={!cancellable} onClick={handleCancel} loading={canceling} className='!w-fit !px-6 h-12 rounded-xl text-base' />
              </div>
            </>
          )}

          {/* 2. Billing & Payment Method Step */}
          {showBillingStep && (
            <form onSubmit={handleSubmit(onConfirmPayment)} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold mb-4">{t('paymentAndBilling')}</h3>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'card', label: t('card'), icon: CreditCard },
                  { id: 'wallet', label: t('wallet'), icon: Wallet2 }
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === method.id
                      ? 'border-main-600 bg-main-50/50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-main-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-main-900' : 'text-slate-600'}`}>
                        {method.label}
                      </span>
                    </div>
                    {paymentMethod === method.id && (
                      <div className="absolute top-2 right-2 bg-main-600 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Billing Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

                {/* Email */}
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

                {/* Phone Number */}
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

              <div className='flex items-center justify-end gap-4'>
                <Button
                  name={paying ? t('processing') : t('confirmAndPay')}
                  type="submit"
                  color="green"
                  loading={paying}
                  className='!w-fit !px-8 h-12 rounded-xl'
                />
                <Button
                  name={t('back')}
                  onClick={() => setShowBillingStep(false)}
                  color="secondary"
                  className='!w-fit !px-8 h-12 rounded-xl'
                />
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center'>
          <AlertCircle className='mx-auto mb-3 h-10 w-10 text-slate-500' />
          <p className='text-slate-600'>{t('noOrderFound')}</p>
        </div>
      )}

      {/* Terms Modal */}
      {isTermsModalOpen && (<Modal
        title={t('termsTitle')}

        onClose={() => setIsTermsModalOpen(false)}
      >
        <div className="space-y-4">
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
          <div className="flex gap-3 mt-4">
            <Button
              name={t('continue')}
              onClick={() => {
                if (acceptedTerms) {
                  setIsTermsModalOpen(false);
                  setShowBillingStep(true);
                } else {
                  toast.error(t('toast.mustAcceptTerms'));
                }
              }}
              disabled={!acceptedTerms}
              color="green"
              className="flex-1"
            />
          </div>
        </div>
      </Modal>)}
    </div>
  );
}

const PaymentMethodCard = ({ type, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${active ? 'border-main-500 bg-main-50' : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
  >
    {type === 'card' ? <CreditCard className={`h-8 w-8 ${active ? 'text-main-600' : 'text-slate-400'}`} />
      : <Wallet className={`h-8 w-8 ${active ? 'text-main-600' : 'text-slate-400'}`} />}
    <span className={`font-semibold ${active ? 'text-main-700' : 'text-slate-600'}`}>{label}</span>
  </button>
);