'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import api from '@/lib/axios';
import { XCircle, ShieldAlert } from 'lucide-react';
import Button from '@/components/atoms/Button';

const ALLOWED_PAYMENT_ERRORS = new Set([
    'secure_verification_failed',
    'authentication_problem',
    'pending_authentication',
    'payment_declined',
    'insufficient_funds',
    'expired_card',
    'invalid_card',
    'transaction_timeout',
    'network_error',
    'fraud_suspected',
    'processor_declined',
    'default',
]);

export const normalizePaymentError = (error) => {
    if (!error) return 'default';

    const key = String(error).toLowerCase();

    if (ALLOWED_PAYMENT_ERRORS.has(key)) {
        return key;
    }

    // Unknown / tampered / outdated code
    return 'default';
};



async function getOrder(orderId) {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
}

export default function PaymentFailPage() {
    const t = useTranslations('Payment.fail');
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const errorCode = searchParams.get('error');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await getOrder(orderId);
                setOrder(data);
            } catch (err) {
                console.error(err);
                // Don't show error toast if order doesn't exist
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId]);

    const errorKey = useMemo(
        () => normalizePaymentError(errorCode),
        [errorCode]
    );


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


    // Determine error message based on error code
    ;

    // Determine icon based on error type
    const ErrorIcon = errorCode === 'secure_verification_failed' ? ShieldAlert : XCircle;

    return (
        <div className='py-16'>
            <div className="container max-w-2xl text-center">
                {/* Failure banner */}
                <div className={`mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center ${errorCode === 'secure_verification_failed'
                    ? 'bg-amber-100'
                    : 'bg-rose-100'
                    }`}>
                    <ErrorIcon className={`w-12 h-12 ${errorCode === 'secure_verification_failed'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                        }`} />
                </div>

                <h1 className={`mb-3 text-3xl font-bold ${errorCode === 'secure_verification_failed'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                    }`}>
                    {t('title')}
                </h1>

                {/* Error Message */}
                <div className={`mb-8 mx-auto max-w-lg rounded-xl border-2 p-4 ${errorCode === 'secure_verification_failed'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-rose-50 border-rose-200'
                    }`}>
                    <p className={`font-medium ${errorCode === 'secure_verification_failed'
                        ? 'text-amber-800'
                        : 'text-rose-800'
                        }`}>
                        {t(`errors.${errorKey}`)}
                    </p>
                </div>

                <p className="mb-10 text-slate-700">{t('description')}</p>

                {/* Order summary - only show if order exists */}
                {order && (
                    <div className="rounded-2xl border bg-white shadow-sm p-6 text-start space-y-4 mb-8">
                        <h2 className="text-xl font-semibold text-slate-900">{t('orderSummary')}</h2>
                        <p><span className="font-medium">{t('orderId')}</span> {order.id}</p>
                        <p><span className="font-medium">{t('titleLabel')}</span> {order.title}</p>
                        <p><span className="font-medium">{t('amount')}</span> {order.totalAmount} {order.invoices?.[0]?.currencyId || 'SAR'}</p>
                        <p><span className="font-medium">{t('status')}</span> <span className="text-amber-600">{order.status}</span></p>
                        {order.buyer?.username && (
                            <p><span className="font-medium">{t('buyer')}</span> {order.buyer.username}</p>
                        )}
                        {order.seller?.username && (
                            <p><span className="font-medium">{t('seller')}</span> {order.seller.username}</p>
                        )}
                        {order.invoices?.[0]?.invoiceNumber && (
                            <p><span className="font-medium">{t('invoice')}</span> {order.invoices[0].invoiceNumber}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    {orderId && (
                        <Link href={`/payment?orderId=${orderId}`}>
                            <Button name={t('tryAgain')} color="green" />
                        </Link>
                    )}
                    <Link href="/my-orders">
                        <Button name={t('goToMyOrders')} color="secondary" />
                    </Link>
                    {!orderId && (<Link href="/">
                        <Button name={t('backToHome')} color="secondary" />
                    </Link>)}
                </div>
            </div>
        </div>
    );
}