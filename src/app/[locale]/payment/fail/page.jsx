'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import api from '@/lib/axios';
import { XCircle, ShieldAlert, HandCoins, FileText, Banknote } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useAuth } from '@/context/AuthContext';
import Currency from '@/components/common/Currency';

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
    const tDetials = useTranslations('MyOrders.modals.orderDetails');
    const t = useTranslations('Payment.fail');
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const errorCode = searchParams.get('error');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth()
    const buyerView = role === 'buyer';


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
    const invoice = order.invoices?.[0];
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
                            <p><span className="font-medium">{t('invoice')}</span> {invoice.invoiceNumber}</p>
                        )}
                        {order && order.invoices?.[0] && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900">{tDetials('invoice')} #{invoice.invoiceNumber}</p>
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                                        {invoice.paymentStatus}
                                    </span>
                                </div>

                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        {buyerView ? (
                                            <>
                                                <div>
                                                    <p className="text-slate-500 text-xs">{tDetials('servicePrice')}</p>
                                                    <p className="font-medium text-slate-900 flex gap-1">
                                                        <Currency /> <span>{Number(invoice.subtotal).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">{tDetials('platformFee')}</p>
                                                    <p className="font-medium text-slate-900 flex gap-1">
                                                        <Currency /> <span>{(Number(invoice.totalAmount) - Number(invoice.subtotal)).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <div className="col-span-2 pt-3 border-t border-slate-100">
                                                    <p className="text-slate-500 text-xs">{tDetials('totalAmount')}</p>
                                                    <p className="text-xl font-bold text-slate-900 flex gap-1">
                                                        <Currency /> <span>{Number(invoice.totalAmount).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-slate-500 text-xs">{tDetials('subtotal')}</p>
                                                    <p className="font-medium text-slate-900 flex gap-1">
                                                        <Currency /> <span>{Number(invoice.subtotal).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">{tDetials('sellingCommission')} ({invoice.sellerServiceFee}%)</p>
                                                    <p className="font-medium text-rose-600 flex gap-1">
                                                        <Currency /> <span>-{(Number(invoice.subtotal) * (Number(invoice.sellerServiceFee) / 100)).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <div className="col-span-2 pt-3 border-t border-slate-100">
                                                    <p className="text-slate-500 text-xs">{tDetials('netEarnings')}</p>
                                                    <p className="text-xl font-bold text-main-700 flex gap-1">
                                                        <Currency /> <span>{(Number(invoice.subtotal) * (1 - Number(invoice.sellerServiceFee) / 100)).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 text-[11px] text-slate-500 px-1">
                                    {invoice.paymentMethod && (
                                        <p><span className="font-medium">{tDetials('paymentMethod')}:</span> {invoice.paymentMethod}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {invoice.payOnDelivery && order?.offlineContract && (
                            <div className="mt-4 relative overflow-hidden rounded-xl border-2 border-dashed border-main-200 bg-main-50/30 p-4">
                                <div className="absolute -right-2 -top-2 opacity-10">
                                    <HandCoins size={80} />
                                </div>

                                <div className="flex items-center gap-2 mb-3 text-main-800">
                                    <FileText className="h-4 w-4" />
                                    <h5 className="font-bold text-sm uppercase tracking-tight">{tDetials('deliveryContract')}</h5>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-main-100 p-3 shadow-sm">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-main-700 font-medium mb-1">{tDetials('amountToPayAtDoor')}</p>
                                            <div className="flex items-baseline gap-1 text-main-900">
                                                <span className="text-lg font-black"><Currency /></span>
                                                <span className="text-2xl font-black">
                                                    {Number(order.offlineContract.amountToPayAtDoor).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="inline-flex items-center gap-1 rounded-md bg-main-600 px-2 py-1 text-white shadow-sm">
                                                <Banknote size={14} />
                                                <span className="text-xs font-bold">{tDetials('cashOnDelivery')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-main-100 flex justify-between items-center text-[11px]">
                                        <div className="text-slate-500">
                                            <span className="font-semibold">{tDetials('seller')}:</span> {order.offlineContract.seller?.username}
                                        </div>
                                        <div className="text-slate-500">
                                            <span className="font-semibold">{tDetials('buyer')}:</span> {order.offlineContract.buyer?.username}
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-[10px] text-main-600/80 leading-relaxed italic">
                                    * {tDetials('podLegalNotice')}
                                </p>
                            </div>
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