/* 
  here i need i he the owner of this service show in the action button deliver if (service.sellerId == user.id )
  if not show received
*/

'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import InputSearch from '@/components/atoms/InputSearch';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import api from '@/lib/axios';
import { AlertTriangle, CheckCircle, CreditCard, FileText, FileWarning, MessageCircle, MessageSquare, Package, XCircle, Eye, Star, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import toast from 'react-hot-toast';
import UserMini from '@/components/dashboard/UserMini';
import { DisputeModal } from '@/components/pages/my-orders/DisputeForm';
import { OrderStatus } from '@/constants/order';
import ActionsMenu from '@/components/common/ActionsMenu';
import DeliverModel from '@/components/pages/my-orders/DeliverModel';
import ReviewSubmissionModel from '@/components/pages/my-orders/ReviewSubmissionModel';
import ChangeRequestReviewModel from '@/components/pages/my-orders/ChangeRequestReviewModel';
import OrderDetailsModal from '@/components/pages/my-orders/OrderDetailsModal';
import { isErrorAbort } from '@/utils/helper';
import { useSearchParams } from 'next/navigation';
import ReviewDetailsModal from '@/components/pages/my-orders/ReviewDetailsModal';
import GiveReviewModal from '@/components/pages/my-orders/GiveReviewModal';
import CongratulationsModal from '@/components/pages/my-orders/Congratulationsmodal';


// Animation
export const tabAnimation = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28, mass: 0.6 } },
  exit: { opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
};


// TABS will be created inside component with translations


const fmtMoney = v => {
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? String(v ?? '') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '');


export default function Page() {
  const t = useTranslations('MyOrders.page');
  const [activeTab, setActiveTab] = useState('all');

  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { role } = useAuth();
  const isSeller = role === 'seller';
  const isBuyer = role === 'buyer';
  const [actionLoading, setActionLoading] = useState({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFromParams = searchParams.get('orderId');
  const modeFromParams = searchParams.get('mode');

  const TABS = [
    { label: t('tabs.all'), value: 'all' },
    { label: t('tabs.active'), value: 'active' },
    { label: t('tabs.rejected'), value: 'rejected' },
    { label: t('tabs.waited'), value: 'waiting' },
    { label: t('tabs.delivered'), value: 'delivered' },
    { label: t('tabs.changeRequested'), value: 'change_requested' },
    { label: t('tabs.completed'), value: 'completed' },
    { label: t('tabs.disputed'), value: 'disputed' },
    { label: t('tabs.canceled'), value: 'canceled' },
  ];


  function onPageChange(page) {
    setPagination(prev => ({ ...prev, page: page }))
  }

  function resetPage() {
    onPageChange(1)
  }
  function setRowLoading(id, actionOrNull) {
    setActionLoading(prev => ({ ...prev, [id]: actionOrNull }));
  }

  // Patch a row locally without refetching
  function patchOrderRow(id, updater) {
    setOrders(prev => prev.map(r => (r.id === id ? updater(r) : r)));
  }

  const columns = useMemo(
    () => [
      { key: 'gig', label: t('columns.serviceImg'), type: 'img' },
      {
        key: 'service',
        label: t('columns.serviceJob'),
        className: '',
        render: row => {
          const order = row._raw;
          const fromJob = !!order.jobId;
          const title = order?.title || 'Untitled';
          const slug = order?.service?.slug;
          const badge = fromJob ? t('badges.job') : t('badges.service');
          const href = fromJob ? `/my-jobs?job=${order.jobId}` : `/services/category/${slug}`;

          return (
            <div className="flex flex-col items-start gap-1">
              <Link
                href={href}
                className="text-sm font-medium text-slate-800 hover:underline max-w-[220px] truncate"
                title={title}
              >
                {title}
              </Link>
              <span className={`inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200`}>
                {badge}
              </span>
            </div>
          );
        }
      },

      {
        key: isBuyer ? 'seller' : 'buyer',
        label: isBuyer ? t('columns.freelancer') : t('columns.client')
      },

      // { key: 'orderNumber', label: 'Order number' },
      { key: 'orderDate', label: t('columns.orderDate') },
      ...(isBuyer
        ? [
          { key: 'total', label: t('columns.total'), type: 'price' }
        ]
        : [
          // { key: 'subtotal', label: t('columns.orderAmount'), type: 'price' },
          { key: 'sellerNetPay', label: t('columns.sellerNetPay'), type: 'price' }
        ]
      ),
      {
        key: 'status',
        label: t('columns.status'),
        status: [
          [OrderStatus.ACCEPTED, 'text-main-600'],
          [OrderStatus.PENDING, 'text-yellow-600'],
          [OrderStatus.DELIVERED, 'text-blue-600'],
          [OrderStatus.COMPLETED, 'text-main-700'],
          [OrderStatus.CANCELLED, 'text-rose-600'],
          [OrderStatus.MISSING_DETAILS, 'text-orange-600'],
          [OrderStatus.DISPUTED, 'text-purple-700'], // <—
          [OrderStatus.CHANGES_REQUESTED, 'text-pink-600'],
          [OrderStatus.REJECTED, 'text-rose-600'],
        ],
      },
    ],
    [isBuyer, t],
  );

  // Build query for a BIG page (client-side pagination in <Table />)
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (search?.trim()) {
      params.set('search', search.trim());
    }

    if (activeTab === 'active') params.set('status', OrderStatus.ACTIVE);
    else if (activeTab === 'delivered') params.set('status', OrderStatus.DELIVERED);
    else if (activeTab === 'completed') params.set('status', OrderStatus.COMPLETED);
    else if (activeTab === 'canceled') params.set('status', OrderStatus.CANCELLED);
    else if (activeTab === 'disputed') params.set('status', OrderStatus.DISPUTED);
    else if (activeTab === 'change_requested') params.set('status', OrderStatus.CHANGES_REQUESTED);
    else if (activeTab === 'rejected') params.set('status', OrderStatus.REJECTED);
    else if (activeTab === 'waiting') params.set('status', OrderStatus.WAITING);
    // 'all' -> broad fetch

    params.set('page', pagination.page);
    params.set('limit', pagination.limit);

    return params.toString();
  }, [activeTab, search, pagination.page, pagination.limit]);


  const controllerRef = useRef();

  const fetchOrders = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setErr('');

    try {
      const qs = buildQuery();
      const { data } = await api.get(`/orders?${qs}`, {
        signal: controller.signal
      });
      const list = data?.records;

      const rows = list.map(o => {
        const invoice = o.invoices?.[0]

        const subtotal = Number(invoice?.subtotal || 0);
        const feePercent = Number(invoice?.sellerServiceFee || 0);
        const feeAmount = subtotal * (feePercent / 100);

        return {
          _raw: o,
          id: o?.id,
          gig: o?.service?.gallery?.[0]?.url,
          service: `${o?.title?.length > 20 ? o?.title?.slice(0, 20) + '...' : o?.title}`,
          seller: o?.seller ? <UserMini user={o.seller} href={`profile/${o.seller.id}`} /> : '—',
          buyer: o?.buyer ? <UserMini user={o.buyer} href={`profile/${o.buyer.id}`} /> : '—',
          orderDate: fmtDate(o?.created_at),
          total: fmtMoney(invoice?.totalAmount),
          subtotal: fmtMoney(subtotal),
          sellerNetPay: fmtMoney(subtotal - feeAmount),
          status: o?.status || '',
        };
      });

      setPagination(prev => ({ ...prev, total: data.total_records }))

      setOrders(rows);
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error(e);
        setErr(e?.response?.data?.message || t('errors.failedToLoad'));
        setOrders([]);
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [buildQuery, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onSearch = val => {
    setSearch(val || '');
    resetPage()
  };
  const onChangeTab = val => {
    setActiveTab(val);
    resetPage()
  };

  async function completeOrder(row) {
    setRowLoading(row.id, 'receive');
    try {
      const res = await api.post(`/orders/${row.id}/complete`);
      if (res && res.status >= 200 && res.status < 300) {
        // status → Completed (escrow released server-side)
        patchOrderRow(row.id, r => ({
          ...r,
          status: OrderStatus.COMPLETED,
          _raw: { ...r._raw, status: OrderStatus.COMPLETED },
        }));
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to complete order';
      alert(msg); // or toast
    } finally {
      setRowLoading(row.id, null);
    }
  }
  const [selectedRow, setSelectedRow] = useState(null);

  //
  const [openModal, setOpenModal] = useState(false);

  function handleOpenModal(row, model) {
    setSelectedRow(row);
    setOpenModal(model);

    // If opening order details, update search params
    if (model === 'details' && row?.id) {
      router.push(`/my-orders?orderId=${row.id}`, { scroll: false });
    }
    if (model === 'view-feedback' && row?.id) {
      router.push(`/my-orders?orderId=${row.id}&mode=view-feedback`, { scroll: false });
    }
    if (model === 'give-feedback' && row?.id) {
      router.push(`/my-orders?orderId=${row.id}&mode=give-feedback`, { scroll: false });
    }
  }


  function handleCloseModal() {
    setSelectedRow(null);
    setOpenModal(null);

    // Remove orderId from search params when closing details modal
    if (orderIdFromParams) {
      router.push('/my-orders', { scroll: false });
    }
  }

  // Monitor search params for orderId changes
  useEffect(() => {
    if (orderIdFromParams) {
      // Find the order in the current list
      const orderInList = orders.find(o => o.id === orderIdFromParams);
      if (orderInList) {
        setSelectedRow(orderInList);
        setOpenModal(modeFromParams || 'details');
      } else {
        // Order not in current list, fetch it
        setSelectedRow({ id: orderIdFromParams });
        setOpenModal(modeFromParams || 'details');
      }
    } else if (openModal === 'details' || openModal === "view-feedback" || openModal === "give-feedback") {
      // If orderId removed from params but modal is still open, close it
      setSelectedRow(null);
      setOpenModal(null);
    }
  }, [orderIdFromParams, modeFromParams, orders]);



  const handleCancel = async (row) => {
    const confirmed = window.confirm(t('cancelConfirm'));

    if (!confirmed) return;
    try {
      setRowLoading(row.id, 'cancel');
      await api.post(`/orders/${row.id}/cancel`);

      toast(t('paymentCanceled'), { icon: '⚠️' });
      patchOrderRow(row.id, r => ({
        ...r,
        status: OrderStatus.CANCELLED, // <—
        _raw: { ...r._raw, status: OrderStatus.CANCELLED },
      }));
    } catch (err) {
      console.error(err);
      toast.error(t('errors.failedToCancel'));
    } finally {
      setRowLoading(row.id);
    }
  };

  const handleReject = async (row) => {
    const confirmed = window.confirm(t('rejectConfirm'));

    if (!confirmed) return;
    try {
      setRowLoading(row.id, 'reject');
      // Assuming the endpoint is /orders/:id/reject
      await api.post(`/orders/${row.id}/reject`);

      toast(t('orderRejected'), { icon: '🚫' });

      patchOrderRow(row.id, r => ({
        ...r,
        status: OrderStatus.REJECTED,
        _raw: { ...r._raw, status: OrderStatus.REJECTED },
      }));
    } catch (err) {
      console.error(err);
      toast.error(t('errors.failedToReject'));
    } finally {
      setRowLoading(row.id);
    }
  };

  const handleAccept = async (row) => {
    try {
      setRowLoading(row.id, 'accept');
      await api.post(`/orders/${row.id}/accept`);

      toast.success(t('orderAccepted'), { icon: '✅' });

      patchOrderRow(row.id, r => ({
        ...r,
        status: OrderStatus.ACCEPTED,
        _raw: { ...r._raw, status: OrderStatus.ACCEPTED },
      }));
    } catch (err) {
      console.error(err);
      toast.error(t('errors.failedToAccept'));
    } finally {
      setRowLoading(row.id);
    }
  };

  const renderActions = useCallback((row) => {
    const s = row.status;
    const order = row._raw;
    const hasOpenDispute = !!(s === 'Disputed' || s === 'in_review');

    const canSellerDeliver = isSeller && [OrderStatus.ACCEPTED, OrderStatus.CHANGES_REQUESTED].includes(s) && !hasOpenDispute;
    const canBuyerReceive = isBuyer && s === OrderStatus.DELIVERED && !hasOpenDispute;
    const canDispute = (isBuyer || isSeller) && [OrderStatus.ACCEPTED, OrderStatus.DELIVERED, OrderStatus.CHANGES_REQUESTED].includes(s) && !hasOpenDispute;

    const canSeeReview = s === OrderStatus.DELIVERED || s === OrderStatus.COMPLETED;
    const isChangesRequested = s === OrderStatus.CHANGES_REQUESTED;
    const loadingAction = actionLoading[row.id]; // "deliver" | "receive" | "dispute" | "cancel" | null
    const isBusy = !!loadingAction;

    // Logic for 14-day window 
    const completedDate = order.completedAt ? new Date(order.completedAt) : null;
    const now = new Date();
    const diffDays = completedDate ? (now - completedDate) / (1000 * 60 * 60 * 24) : 0;
    const isExpired = diffDays > 14;
    const hasRate = !!order?.rating;
    // Check if current user has already rated (from your backend logic)
    const userHasRated = isBuyer ? !!order?.rating?.buyer_rated_at : !!order?.rating?.seller_rated_at;
    const isPublic = order.rating?.isPublic;

    const options = [
      {
        icon: <Eye className="h-4 w-4" />,
        label: t('actions.viewDetails'),
        onClick: () => handleOpenModal(row, 'details'),
        disabled: isBusy,
      },
      {
        icon: <MessageCircle className="h-4 w-4" />,
        label: t('actions.chat'),
        href: isBuyer
          ? `/chat?userId=${row?._raw?.sellerId}`
          : `/chat?userId=${row?._raw?.buyerId}`,
        disabled: isBusy,
      },
      {
        icon: <FileText className="h-4 w-4" />,
        label: t('actions.reviewSubmission'),
        onClick: () => handleOpenModal(row, "submission"),
        disabled: isBusy,
        hide: !canSeeReview,
      },
      {
        icon: <MessageSquare className="h-4 w-4" />,
        label: t('actions.viewChangeRequest'),
        onClick: () => handleOpenModal(row, "changes-requested"),
        disabled: isBusy,
        hide: !isChangesRequested,
      },
      {
        icon: <Package className="h-4 w-4" />,
        label: loadingAction === 'deliver' ? t('actions.delivering') : t('actions.deliver'),
        // onClick: () => deliverOrder(row),
        onClick: () => handleOpenModal(row, "deliver"),
        disabled: isBusy || loadingAction === 'deliver',
        hide: !canSellerDeliver,
      },
      {
        icon: <CheckCircle className="h-4 w-4" />,
        label: loadingAction === 'receive' ? t('actions.submitting') : t('actions.receive'),
        // onClick: () => completeOrder(row),
        onClick: () => handleOpenModal(row, 'receive'),
        disabled: isBusy || loadingAction === 'receive',
        hide: !canBuyerReceive,
      },
      {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: loadingAction === 'dispute' ? t('actions.opening') : t('actions.openDispute'),
        onClick: () => handleOpenModal(row, 'dispute'),
        disabled: isBusy || loadingAction === 'dispute',
        hide: !canDispute,
        danger: true,
      },
      {
        icon: <FileWarning className="h-4 w-4" />,
        label: t('actions.viewDispute'),
        href: `/my-disputes?dispute=${row?._raw?.disputeId}`,
        hide: !hasOpenDispute || !row?._raw?.disputeId,
      },
      {
        icon: <CreditCard className="h-4 w-4" />,
        label: t('actions.pay'),
        href: `/payment?orderId=${row.id}`,
        disabled: isBusy,
        hide: !(isBuyer && s === OrderStatus.PENDING),
      },
      {
        icon: <XCircle className="h-4 w-4" />,
        label: loadingAction === 'cancel' ? t('actions.cancelling') : t('actions.cancelOrder'),
        onClick: () => handleCancel(row),
        disabled: isBusy || loadingAction === 'cancel',
        hide: !(isBuyer && [OrderStatus.PENDING, OrderStatus.WAITING].includes(s)),
        danger: true,
      },
      {
        icon: <XCircle className="h-4 w-4" />,
        label: loadingAction === 'reject' ? t('actions.rejecting') : t('actions.rejectOrder'),
        onClick: () => handleReject(row),
        disabled: isBusy || loadingAction === 'reject',
        hide: !(isSeller && [OrderStatus.PENDING, OrderStatus.WAITING].includes(s)),
        danger: true,
      },
      {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: loadingAction === 'accept' ? t('actions.accepting') : t('actions.acceptOrder'),
        onClick: () => handleAccept(row),
        disabled: isBusy || loadingAction === 'accept',
        hide: !(isSeller && [OrderStatus.WAITING].includes(s)),
      },
      {
        icon: <Star className="h-4 w-4" />,
        label: t('actions.viewFeedback'),
        onClick: () => handleOpenModal(row, 'view-feedback'),
        hide: !(s === OrderStatus.COMPLETED && hasRate),
      },

      // Rule: If Completed and NOT Public and NOT 14 days passed, show Give/Edit [cite: 23, 29]
      {
        icon: <MessageSquare className="h-4 w-4" />,
        label: userHasRated ? t('actions.editFeedback') : t('actions.giveFeedback'),
        onClick: () => handleOpenModal(row, 'give-feedback'),
        hide: !(s === OrderStatus.COMPLETED && !isPublic && !isExpired),
      },
    ];

    return <ActionsMenu options={options} align="right" />;
  }, [actionLoading, isBuyer, isSeller, t]);

  return (
    <div className='container'>
      <div className='mt-8 mb-4 flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-3xl font-bold text-center mb-4 '>{t('title')}</h1>
        <InputSearch iconLeft={'/icons/search.svg'} placeholder={t('searchPlaceholder')} onSearch={onSearch} />
      </div>

      <Tabs className='mb-8' setActiveTab={onChangeTab} activeTab={activeTab} tabs={TABS} />

      <AnimatePresence mode='wait'>
        <motion.div key={activeTab + search}>
          {err && <div className='mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700'>{err}</div>}
          <Table loading={loading} data={orders} columns={columns} actions={renderActions} page={pagination.page} rowsPerPage={pagination.limit} totalCount={pagination.total} onPageChange={onPageChange} />
        </motion.div>
      </AnimatePresence>
      <DisputeModal open={openModal === 'dispute'} onClose={handleCloseModal} selectedRow={selectedRow} patchOrderRow={patchOrderRow} setRowLoading={setRowLoading} />
      <DeliverModel open={openModal === 'deliver'} onClose={handleCloseModal} selectedRow={selectedRow} patchOrderRow={patchOrderRow} setRowLoading={setRowLoading} />
      <ReviewSubmissionModel open={openModal === 'receive' || openModal === 'submission'} showCongratulations={() => handleOpenModal(selectedRow, 'congratulation')} readOnly={openModal === 'submission'} onClose={handleCloseModal} selectedRow={selectedRow} patchOrderRow={patchOrderRow} setRowLoading={setRowLoading} />
      <CongratulationsModal
        open={openModal === 'congratulation'}
        onClose={() => {
          handleOpenModal(selectedRow, 'give-feedback')
        }}
        selectedRow={selectedRow}
      />
      <ChangeRequestReviewModel open={openModal === 'changes-requested'} onClose={handleCloseModal} selectedRow={selectedRow} />
      <OrderDetailsModal
        open={openModal === 'details'}
        onClose={handleCloseModal}
        orderId={orderIdFromParams || selectedRow?.id}
      />

      <ReviewDetailsModal
        open={openModal === 'view-feedback'}
        onClose={handleCloseModal}
        orderId={selectedRow?.id}
      />

      <GiveReviewModal
        open={openModal === 'give-feedback'}
        onClose={handleCloseModal}
        fetchOrders={fetchOrders}
        orderId={selectedRow?.id}
      />
    </div>
  );
}
