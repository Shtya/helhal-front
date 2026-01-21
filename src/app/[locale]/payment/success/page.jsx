'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';

async function getOrder(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
}

export default function PaymentSuccessPage() {
  const t = useTranslations('Payment.success');
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!orderId) {
      if (loading)
        setLoading(false);
      return
    };

    (async () => {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error(t('failedToLoad'));
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, t]);

  if (loading) {
    return (
      <div className='py-16'>

        <div className="container max-w-lg text-center">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-2/3 mx-auto rounded bg-slate-200" />
            <div className="h-4 w-1/2 mx-auto rounded bg-slate-200" />
            <div className="h-24 w-full rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='py-16'>
        <div className="container max-w-lg text-center">
          <h1 className="mb-4 text-2xl font-bold text-rose-600">{t('orderNotFound')}</h1>
          <p className="mb-6 text-slate-600">{t('orderNotFoundDesc')}</p>
          <Link href="/my-orders" className="text-main-700 underline">
            {t('goToOrders')}
          </Link>
        </div >
      </div>
    );
  }

  return (
    <div className='py-16'>
      <div className="container max-w-2xl text-center">
        {/* Success banner */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-main-100 flex items-center justify-center">
          <span className="text-4xl">🎉</span>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-main-600">{t('title')}</h1>
        <p className="mb-10 text-slate-700">{t('description')}</p>

        {/* Order summary */}
        <div className="rounded-2xl border bg-white shadow-sm p-6 text-start space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">{t('orderSummary')}</h2>
          <p><span className="font-medium">{t('orderId')}</span> {order.id}</p>
          <p><span className="font-medium">{t('titleLabel')}</span> {order.title}</p>
          <p><span className="font-medium">{t('amount')}</span> {order.totalAmount} {order.invoices?.[0]?.currencyId || 'SAR'}</p>
          <p><span className="font-medium">{t('status')}</span> <span className="text-main-600">{order.status}</span></p>
          <p><span className="font-medium">{t('buyer')}</span> {order.buyer?.username}</p>
          <p><span className="font-medium">{t('seller')}</span> {order.seller?.username}</p>
          <p><span className="font-medium">{t('invoice')}</span> {order.invoices?.[0]?.invoiceNumber}</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col  sm:flex-row justify-center gap-4">
          <Link href="/my-orders">
            <Button name={t('goToMyOrders')} color="green" />
          </Link>
          <Link href="/">
            <Button name={t('backToHome')} color="secondary" />
          </Link>
        </div>
      </div>
    </div>
  );
}
