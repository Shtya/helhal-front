import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import api from '@/lib/axios';
import UserMini from '@/components/dashboard/UserMini';
import { formatDate, formatDateTime } from '@/utils/date';
import { OrderStatus } from '@/constants/order';
import { Package, DollarSign, FileText, Clock, CheckCircle, XCircle, Truck, HandCoins, Banknote } from 'lucide-react';
import OrderDeliveryTimer from './OrderDeliveryTimer';
import { resolveUrl } from '@/utils/helper';
import { useTranslations } from 'next-intl';
import Currency from '@/components/common/Currency';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from '@/i18n/navigation';


export default function OrderDetailsModal({ open, onClose, orderId }) {
  const t = useTranslations('MyOrders.modals.orderDetails');
  const pathname = usePathname()
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuth()
  const buyerView = role === 'buyer' || pathname.startsWith("/dashboard");



  useEffect(() => {
    if (!orderId || !open) {
      setOrder(null);
      setError(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err?.response?.data?.message || t('error'));
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [open, orderId]);


  if (!open) return null;

  const getStatusColor = (status) => {
    const colors = {
      [OrderStatus.PENDING]: 'text-yellow-600 bg-yellow-50',
      [OrderStatus.ACCEPTED]: 'text-main-600 bg-main-50',
      [OrderStatus.DELIVERED]: 'text-blue-600 bg-blue-50',
      [OrderStatus.COMPLETED]: 'text-main-700 bg-main-50',
      [OrderStatus.CANCELLED]: 'text-rose-600 bg-rose-50',
      [OrderStatus.REJECTED]: 'text-rose-600 bg-rose-50',
      [OrderStatus.DISPUTED]: 'text-purple-700 bg-purple-50',
      [OrderStatus.CHANGES_REQUESTED]: 'text-pink-600 bg-pink-50',
    };
    return colors[status] || 'text-slate-600 bg-slate-50';
  };

  const getTimelineIcon = (type) => {
    switch (type) {
      case 'delivered':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-main-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-600" />;
    }
  };

  const invoice = order?.invoices?.[0]

  const sellerNetPay = invoice ? Number(invoice?.subtotal) - (Number(invoice?.subtotal) * (Number(invoice?.sellerServiceFee) / 100)) : 0;
  const subtotal = Number(order?.totalAmount - invoice?.platformPercent);
  return (
    <Modal title={t('title')} onClose={onClose} className="!max-w-4xl max-h-[90vh] overflow-y-auto">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-1/2 bg-slate-200 rounded dark:bg-dark-border" />
          <div className="h-4 w-3/4 bg-slate-200 rounded dark:bg-dark-border" />
          <div className="h-32 w-full bg-slate-200 rounded dark:bg-dark-border" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : order ? (
        <div className="space-y-6 bg-white dark:bg-dark-bg-card rounded-xl p-4">
          {/* Header Section */}
          <div className="flex items-start flex-wrap sm:flex-nowrap justify-between gap-4 pb-4 border-b border-slate-200 dark:border-dark-border">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">{order.title}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                {order.jobId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                    {t('fromJob')}
                  </span>
                )}
                {/* {order.proposalId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                    From Proposal
                  </span>
                )} */}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-slate-500 dark:text-dark-text-secondary">{t('orderId')}</p>
              <p className="text-xs font-mono text-slate-700 dark:text-dark-text-primary">{order.id}</p>
            </div>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer/Seller */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 dark:text-dark-text-primary">{t('buyer')}</p>
                {order.buyer ? <UserMini user={order.buyer} href={`/profile/${order.buyer.id}`} /> : <p className="text-sm text-slate-500">—</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 dark:text-dark-text-primary">{t('seller')}</p>
                {order.seller ? <UserMini user={order.seller} href={`/profile/${order.seller.id}`} /> : <p className="text-sm text-slate-500 dark:text-dark-text-secondary">—</p>}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500 dark:text-dark-text-secondary dark:invert" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-dark-text-primary">{buyerView ? t('totalPaid') : t('orderPrice')}</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary flex gap-1"><Currency />
                    {buyerView
                      ? Number(order?.totalAmount).toFixed(2)  // Buyer sees full cost
                      : Number(subtotal).toFixed(2)     // Seller sees gig price
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500 dark:text-dark-text-secondary dark:invert" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-dark-text-primary">{t('packageType')}</p>
                  <p className="text-sm text-slate-900 dark:text-dark-text-primary capitalize">{order.packageType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500 dark:text-dark-text-secondary dark:invert" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-dark-text-primary">{t('quantity')}</p>
                  <p className="text-sm text-slate-900 dark:text-dark-text-primary">{order.quantity}</p>
                </div>
              </div>
            </div>
          </div>


          <OrderDeliveryTimer order={order} />

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">{t('orderDate')}</p>
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{formatDateTime(order.orderDate)}</p>
            </div>
            {order.dueDate && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">{t('dueDate')}</p>
                <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{formatDateTime(order.dueDate)}</p>
              </div>
            )}
            {order.deliveredAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">{t('deliveredAt')}</p>
                <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{formatDateTime(order.deliveredAt)}</p>
              </div>
            )}
            {order.completedAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">{t('completedAt')}</p>
                <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{formatDateTime(order.completedAt)}</p>
              </div>
            )}
            {order.cancelledAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">{t('cancelledAt')}</p>
                <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{formatDateTime(order.cancelledAt)}</p>
              </div>
            )}
          </div>

          {/* Service/Job Info */}
          {order.service && (
            <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">{t('serviceInformation')}</h4>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 dark:bg-dark-bg-input">
                <p className="text-sm font-medium text-slate-700 dark:text-dark-text-primary">{t('serviceTitle')}</p>
                <p className="text-sm text-slate-900 dark:text-dark-text-primary">{order.service.title}</p>
                {order.service.brief && (
                  <>
                    <p className="text-sm font-medium text-slate-700 mt-3 dark:text-dark-text-primary">{t('description')}</p>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{order.service.brief}</p>
                  </>
                )}
                {order.service.packages && order.service.packages.length > 0 && (
                  <div className="mt-3">
                      <p className="text-sm font-medium text-slate-700 mb-2 dark:text-dark-text-primary">{t('selectedPackage')}</p>
                    {order.service.packages
                      .find(pkg => pkg.type === order.packageType) && (
                        <div className="bg-white rounded-lg p-3 border border-slate-200 dark:bg-dark-bg-card dark:border-dark-border">
                          <p className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-dark-text-secondary mt-1">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).features?.map((feature, idx) => (
                              <span key={idx} className="text-xs bg-main-50 text-main-700 px-2 py-1 rounded dark:bg-main-900/20 dark:text-main-400">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requirements Answers */}
          {order.requirementsAnswers && order.requirementsAnswers.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">{t('requirements')}</h4>
              <div className="space-y-3">
                {order.requirementsAnswers.map((req, idx) => {

                  return (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 dark:bg-dark-bg-input">
                      {/* Question */}
                      {req?.question ? (
                        <p className="text-sm font-medium text-slate-700 mb-1 dark:text-dark-text-primary">
                          {req.question}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 mb-1 dark:text-dark-text-secondary">—</p>
                        // or use "No question" instead of —
                      )}

                      {/* Main Answer */}
                      {req?.requirementType === 'file' ? (
                        req.answer ? (
                          <a
                            href={resolveUrl(req.answer)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-main-600 underline hover:text-main-700 dark:text-main-400"
                          >
                            {req.filename || 'Download file'}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-dark-text-secondary">—</span>
                        )
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{req.answer || '—'}</p>
                      )}

                      {/* ✅ Show Other Answer if it exists */}
                      {req.otherAnswer && (
                        <p className="mt-1 text-sm text-slate-500 italic dark:text-dark-text-secondary">
                          Other: {req.otherAnswer}
                        </p>
                      )}
                    </div>

                  );
                })}

              </div>
            </div>
          )}

          {order.notes && (
            <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">
                {t('specialInstructions')}
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-line dark:text-dark-text-secondary">
                {order.notes}
              </p>
            </div>
          )}



          {/* Invoices */}
          {invoice && (
            <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">{t('invoice')}</h4>
              {invoice.payOnDelivery && (
                <span className="w-fit flex items-center gap-1.5 px-3 py-1 rounded-lg bg-main-50 border border-main-200 text-main-700 text-xs font-bold uppercase tracking-wider dark:bg-main-900/20 dark:border-main-500/40 dark:text-main-400">
                  <Truck className="h-3.5 w-3.5 dark:invert" />
                  {t('payOnDelivery')}
                </span>
              )}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 dark:bg-dark-bg-input">
                <div className="bg-white rounded-lg p-3 border border-slate-200 dark:bg-dark-bg-card dark:border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary">{t('invoice')} #{invoice.invoiceNumber}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${invoice.paymentStatus === 'paid'
                      ? 'bg-main-100 text-main-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {invoice.paymentStatus}
                    </span>
                  </div>
                  {/* 2. Detailed Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {buyerView ? (
                      // Buyer View: Service Price + Buyer Fee
                      <>
                        <div>
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('servicePrice')}</p>
                          <p className="font-medium text-slate-900 dark:text-dark-text-primary flex gap-1">
                            <span><Currency /></span>
                            <span> {Number(invoice.subtotal).toFixed(2)}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('platformFee')}</p>
                          <p className="font-medium text-slate-900 dark:text-dark-text-primary flex gap-1">
                            <span><Currency /> </span>
                            <span>{(Number(invoice.totalAmount) - Number(invoice.subtotal)).toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-dark-border">
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('totalAmount')}</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary flex gap-1">
                            <span><Currency /></span>
                            <span> {Number(invoice.totalAmount).toFixed(2)}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      // Seller View: Service Price - Selling Commission
                      <>
                        <div>
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('subtotal')}</p>
                          <p className="font-medium text-slate-900 dark:text-dark-text-primary flex gap-1">
                            <span><Currency /></span>
                            <span>{Number(invoice.subtotal).toFixed(2)}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('sellingCommission')} ({invoice.sellerServiceFee}%)</p>
                          <p className="font-medium text-rose-600 flex gap-1">
                            <span><Currency /> </span>
                            <span>- {(Number(invoice.subtotal) * (Number(invoice.sellerServiceFee) / 100)).toFixed(2)}</span>
                          </p>
                        </div>
                        {sellerNetPay ? (<div className="col-span-2 pt-2 border-t border-slate-200 dark:border-dark-border">
                          <p className="text-slate-600 dark:text-dark-text-secondary">{t('netEarnings')}</p>
                          <p className="text-lg font-semibold text-main-700 flex gap-1">
                            <span><Currency /> </span>
                            <span>{sellerNetPay.toFixed(2)}</span>

                          </p>
                        </div>) : null}
                      </>
                    )}
                    {invoice.paymentMethod && (
                      <p className="text-xs text-slate-500 dark:text-dark-text-secondary mt-2">{t('paymentMethod')} {invoice.paymentMethod}</p>
                    )}
                  </div>
                  {invoice.payOnDelivery && order?.offlineContract && (
                    <div className="mt-4 relative overflow-hidden rounded-xl border-2 border-dashed border-main-200 bg-main-50/30 p-4">
                      <div className="absolute -right-2 -top-2 opacity-10">
                        <HandCoins size={80} />
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-main-800">
                        <FileText className="h-4 w-4" />
                        <h5 className="font-bold text-sm uppercase tracking-tight">{t('deliveryContract')}</h5>
                      </div>

                      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-main-100 p-3 shadow-sm">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-main-700 font-medium mb-1">{t('amountToPayAtDoor')}</p>
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
                              <span className="text-xs font-bold">{t('cashOnDelivery')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-main-100 flex justify-between items-center text-[11px]">
                          <div className="text-slate-500">
                            <span className="font-semibold">{t('seller')}:</span> {order.offlineContract.seller?.username}
                          </div>
                          <div className="text-slate-500">
                            <span className="font-semibold">{t('buyer')}:</span> {order.offlineContract.buyer?.username}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] text-main-600/80 leading-relaxed italic">
                        * {t('podLegalNotice')}
                      </p>
                    </div>
                  )}
                </div>


              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

