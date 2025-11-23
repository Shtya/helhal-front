import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import api from '@/lib/axios';
import UserMini from '@/components/dashboard/UserMini';
import { formatDate, formatDateTime } from '@/utils/date';
import { OrderStatus } from '@/constants/order';
import { Package, DollarSign, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import OrderDeliveryTimer from './OrderDeliveryTimer';
import { resolveUrl } from '@/utils/helper';

export default function OrderDetailsModal({ open, onClose, orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        setError(err?.response?.data?.message || 'Failed to load order details');
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
      [OrderStatus.ACCEPTED]: 'text-green-600 bg-green-50',
      [OrderStatus.DELIVERED]: 'text-blue-600 bg-blue-50',
      [OrderStatus.COMPLETED]: 'text-emerald-700 bg-emerald-50',
      [OrderStatus.CANCELLED]: 'text-rose-600 bg-rose-50',
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
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-600" />;
    }
  };


  return (
    <Modal title="Order Details" onClose={onClose} className="!max-w-4xl max-h-[90vh] overflow-y-auto">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-1/2 bg-slate-200 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-32 w-full bg-slate-200 rounded" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start flex-wrap sm:flex-nowrap justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{order.title}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                {order.jobId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                    From Job
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
              <p className="text-sm text-slate-500">Order ID</p>
              <p className="text-xs font-mono text-slate-700">{order.id}</p>
            </div>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer/Seller */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Buyer</p>
                {order.buyer ? <UserMini user={order.buyer} href={`/profile/${order.buyer.id}`} /> : <p className="text-sm text-slate-500">—</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Seller</p>
                {order.seller ? <UserMini user={order.seller} href={`/profile/${order.seller.id}`} /> : <p className="text-sm text-slate-500">—</p>}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Total Amount</p>
                  <p className="text-lg font-semibold text-slate-900">${Number(order.totalAmount).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Package Type</p>
                  <p className="text-sm text-slate-900 capitalize">{order.packageType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Quantity</p>
                  <p className="text-sm text-slate-900">{order.quantity}</p>
                </div>
              </div>
            </div>
          </div>


          <OrderDeliveryTimer order={order} />

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Order Date</p>
              <p className="text-sm text-slate-600">{formatDateTime(order.orderDate)}</p>
            </div>
            {order.dueDate && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Due Date</p>
                <p className="text-sm text-slate-600">{formatDateTime(order.dueDate)}</p>
              </div>
            )}
            {order.deliveredAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Delivered At</p>
                <p className="text-sm text-slate-600">{formatDateTime(order.deliveredAt)}</p>
              </div>
            )}
            {order.completedAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Completed At</p>
                <p className="text-sm text-slate-600">{formatDateTime(order.completedAt)}</p>
              </div>
            )}
            {order.cancelledAt && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Cancelled At</p>
                <p className="text-sm text-slate-600">{formatDateTime(order.cancelledAt)}</p>
              </div>
            )}
          </div>

          {/* Service/Job Info */}
          {order.service && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">Service Information</h4>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">Service Title</p>
                <p className="text-sm text-slate-900">{order.service.title}</p>
                {order.service.brief && (
                  <>
                    <p className="text-sm font-medium text-slate-700 mt-3">Description</p>
                    <p className="text-sm text-slate-600">{order.service.brief}</p>
                  </>
                )}
                {order.service.packages && order.service.packages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">Selected Package</p>
                    {order.service.packages
                      .find(pkg => pkg.type === order.packageType) && (
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-sm font-semibold text-slate-900">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.service.packages.find(pkg => pkg.type === order.packageType).features?.map((feature, idx) => (
                              <span key={idx} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
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
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h4>
              <div className="space-y-3">
                {order.requirementsAnswers.map((req, idx) => {

                  return (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3">
                      {/* Question */}
                      {req?.question ? (
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {req.question}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 mb-1">—</p>
                        // or use "No question" instead of —
                      )}

                      {/* Main Answer */}
                      {req?.requirementType === 'file' ? (
                        req.answer ? (
                          <a
                            href={resolveUrl(req.answer)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 underline hover:text-emerald-700"
                          >
                            {req.filename || 'Download file'}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )
                      ) : (
                        <p className="text-sm text-slate-600">{req.answer || '—'}</p>
                      )}

                      {/* ✅ Show Other Answer if it exists */}
                      {req.otherAnswer && (
                        <p className="mt-1 text-sm text-slate-500 italic">
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
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">
                Special instructions
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {order.notes}
              </p>
            </div>
          )}



          {/* Invoices */}
          {order.invoices && order.invoices.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">Invoice</h4>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                {order.invoices.map((invoice, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-900">Invoice #{invoice.invoiceNumber}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${invoice.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-600">Subtotal</p>
                        <p className="font-medium text-slate-900">${Number(invoice.subtotal).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Service Fee</p>
                        <p className="font-medium text-slate-900">${Number(invoice.serviceFee).toFixed(2)}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200">
                        <p className="text-slate-600">Total Amount</p>
                        <p className="text-lg font-semibold text-slate-900">${Number(invoice.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                    {invoice.paymentMethod && (
                      <p className="text-xs text-slate-500 mt-2">Payment Method: {invoice.paymentMethod}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

