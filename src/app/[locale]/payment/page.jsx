'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';
import { CreditCard, User, DollarSign, FileText, Loader2, AlertCircle } from 'lucide-react';

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
export default function PaymentPage() {
  const t = useTranslations('Payment.page');
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const payable = order?.status === 'Pending';
  const cancellable = ['Accepted', 'Pending'].includes(order?.status);
  const isFromJob = !!order?.jobId;

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    };

    (async () => {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error(t('toast.failedToLoad'));
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, t]);

  const handleSuccess = async () => {
    if (!payable) return;

    try {
      setPaying(true);
      await api.post(`/orders/${orderId}/mark-paid`);

      toast.success(t('toast.paymentSuccessful'));
      router.push(`/payment/success?orderId=${orderId}`);
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
      console.error(err);
      toast.error(t('toast.failedToCancel'));
    } finally {
      setCanceling(false);
    }
  };

  const invoice = order?.invoices?.[0];
  const currency = invoice?.currencyId || 'SAR';

  return (
    <div className='container !py-12'>
      <h1 className='mb-2 text-center text-3xl font-extrabold tracking-tight'>
        <span className='bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent'>{t('title')}</span>
      </h1>
      <p className='mb-8 text-center text-sm text-slate-500'>{t('subtitle')}</p>

      {loading ? (
        <PaymentSkeleton />
      ) : order ? (
        <div className='rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8'>
          {/* Header */}
          <div className='mb-6 flex items-start justify-between gap-3'>
            <h2 className='text-xl font-semibold text-slate-900'>{order.title}</h2>
            <div className='flex items-center gap-2'>
              {!isFromJob && order.packageType ? <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700'>{order.packageType}</span> : null}
              {order.status ? <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800'>{order.status}</span> : null}
            </div>
          </div>

          {/* Buyer & Seller */}
          <div className='mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
            <div className='flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-custom'>
              <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700'>{initials(order.buyer?.username)}</div>
              <div className='min-w-0'>
                <div className='text-xs uppercase tracking-wide text-slate-500'>{t('buyer')}</div>
                <div className='truncate font-medium text-slate-900'>{order.buyer?.username || '—'}</div>
              </div>
            </div>

            <div className='flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-custom'>
              <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700'>{initials(order.seller?.username)}</div>
              <div className='min-w-0'>
                <div className='text-xs uppercase tracking-wide text-slate-500'>{t('seller')}</div>
                <div className='truncate font-medium text-slate-900'>{order.seller?.username || '—'}</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='my-4 h-px w-full bg-slate-100' />

          {/* Invoice Breakdown */}
          {invoice ? (
            <div className='mb-6 rounded-xl bg-slate-50 p-4'>
              <p className='mb-3 flex items-center gap-2 font-medium text-slate-800'>
                <FileText className='h-4 w-4' />
                {t('invoice', { number: invoice.invoiceNumber })}
              </p>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
                  <span>{t('subtotal')}</span>
                  <span className="font-medium">{formatMoney(Number(invoice.subtotal), currency)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
                  <span>{t('serviceFee')}</span>
                  <span className="font-medium">{formatMoney(Number(invoice.serviceFee), currency)}</span>
                </div>
                {/* <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
                  <span>{t('platformPercent')}</span>
                  <span className="font-medium">{invoice.platformPercent} SAR</span>
                </div> */}
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
                  <span>{t('issuedAt')}</span>
                  <span className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom">
                  <span>{t('status')}</span>
                  <span
                    className={`font-medium capitalize ${invoice.paymentStatus === 'pending'
                      ? 'text-amber-600'
                      : invoice.paymentStatus === 'paid'
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                      }`}
                  >
                    {invoice.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-custom lg:col-span-3">
                  <span className="font-semibold text-slate-900">{t('total')}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(Number(invoice.totalAmount), currency)}</span>
                </div>
              </div>

            </div>
          ) : null}

          {/* Amount */}
          <div className='mb-6 text-center'>
            <div className='mx-auto inline-flex items-baseline gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50 px-5 py-3'>
              <DollarSign className='h-5 w-5' />
              <span className='text-2xl font-bold text-emerald-800'>{formatMoney(Number(invoice.totalAmount), currency)}</span>
            </div>
            <p className='mt-2 text-xs text-slate-500'>{t('includesTaxes')}</p>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-4 '>
            <Button name={paying ? t('processing') : t('payNow')} disabled={!payable} color='green' onClick={handleSuccess} loading={paying} className=' !w-fit !px-6 h-11 rounded-xl text-base shadow-custom transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400' aria-label='Confirm payment'>
              {paying ? <Loader2 className='mr-2 inline h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 inline h-4 w-4' />}
            </Button>

            <Button name={t('cancel')} color='red' disabled={!cancellable} onClick={handleCancel} className='!w-fit !px-6 h-11 rounded-xl text-base' loading={canceling} aria-label='Cancel and go back'>
              <AlertCircle className='mr-2 inline h-4 w-4' />
            </Button>
          </div>
        </div>
      ) : (
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center'>
          <AlertCircle className='mx-auto mb-3 h-10 w-10 text-slate-500' />
          <p className='text-slate-600'>{t('noOrderFound')}</p>
        </div>
      )}
    </div>
  );
}
