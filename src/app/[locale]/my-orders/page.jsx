/* 
  here i need i he the owner of this service show in the action button deliver if (service.sellerId == user.id )
  if not show received
*/

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/atoms/InputSearch';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Button from '@/components/atoms/Button';
import api from '@/lib/axios';
import { AlertTriangle, CheckCircle, CreditCard, FileText, FileWarning, MessageCircle, MessageSquare, Package, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from '@/i18n/navigation';
import toast from 'react-hot-toast';
import UserMini from '@/components/dashboard/UserMini';
import { DisputeModal } from '@/components/pages/my-orders/DisputeForm';
import { OrderStatus } from '@/constants/order';
import ActionsMenu from '@/components/common/ActionsMenu';
import DeliverModel from '@/components/pages/my-orders/DeliverModel';
import ReviewSubmissionModel from '@/components/pages/my-orders/ReviewSubmissionModel';
import ChangeRequestReviewModel from '@/components/pages/my-orders/ChangeRequestReviewModel';

// Animation
export const tabAnimation = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28, mass: 0.6 } },
  exit: { opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
};


const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' }, // Pending + Accepted
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Canceled', value: 'canceled' },
];


const fmtMoney = v => {
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? String(v ?? '') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '');


export default function Page() {
  const [activeTab, setActiveTab] = useState('all');

  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { user, role } = useAuth();
  const isSeller = role === 'seller';
  const isBuyer = role === 'buyer';
  const [actionLoading, setActionLoading] = useState({});


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
      { key: 'gig', label: 'Service img', type: 'img' },
      {
        key: 'service',
        label: 'Service / Job',
        className: '',
        render: row => {
          const order = row._raw;
          const fromJob = !!order.jobId;
          const title = order?.title || 'Untitled';
          const slug = order?.service?.slug;
          const badge = fromJob ? 'Job' : 'Service';
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
        label: isBuyer ? 'Freelancer' : 'Client'
      },

      // { key: 'orderNumber', label: 'Order number' },
      { key: 'orderDate', label: 'Order date' },
      { key: 'total', label: 'Total', type: 'price' },
      {
        key: 'status',
        label: 'Status',
        status: [
          [OrderStatus.ACCEPTED, 'text-green-600'],
          [OrderStatus.PENDING, 'text-yellow-600'],
          [OrderStatus.DELIVERED, 'text-blue-600'],
          [OrderStatus.COMPLETED, 'text-emerald-700'],
          [OrderStatus.CANCELLED, 'text-rose-600'],
          [OrderStatus.MISSING_DETAILS, 'text-orange-600'],
          [OrderStatus.DISPUTED, 'text-purple-700'], // <—
          [OrderStatus.CHANGES_REQUESTED, 'text-pink-600'],
        ],
      },
    ],
    [isBuyer],
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
    // 'all' -> broad fetch

    params.set('page', pagination.page);
    params.set('limit', pagination.limit);

    return params.toString();
  }, [activeTab, search, pagination.page, pagination.limit]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = buildQuery();
      const { data } = await api.get(`/orders?${qs}`);
      const list = data?.records;

      const rows = list.map(o => {
        return {
          _raw: o,
          id: o?.id,
          gig: o?.service?.gallery?.[0]?.url,
          service: `${o?.title?.length > 20 ? o?.title?.slice(0, 20) + '...' : o?.title}`,
          seller: o?.seller ? <UserMini user={o.seller} href={`profile/${o.seller.id}`} /> : '—',
          buyer: o?.buyer ? <UserMini user={o.buyer} href={`profile/${o.buyer.id}`} /> : '—',
          orderDate: fmtDate(o?.created_at),
          total: fmtMoney(o?.totalAmount),
          status: o?.status || '',
        };
      });

      setPagination(prev => ({ ...prev, page: data.current_page, limit: data.per_page, total: data.total_records }))

      setOrders(rows);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

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
  }


  function handleCloseModal() {
    setSelectedRow(null);
    setOpenModal(null);
  }



  const handleCancel = async (row) => {
    const confirmed = window.confirm('Are you sure you want to cancel this order?');

    if (!confirmed) return;
    try {
      setRowLoading(row.id, 'cancel');
      await api.post(`/orders/${row.id}/cancel`);

      toast('Payment canceled', { icon: '⚠️' });
      patchOrderRow(row.id, r => ({
        ...r,
        status: OrderStatus.CANCELLED, // <—
        _raw: { ...r._raw, status: OrderStatus.CANCELLED },
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel order');
    } finally {
      setRowLoading(row);
    }
  };

  function renderActions(row) {
    const s = row.status;

    const hasOpenDispute = !!(s === 'Disputed' || s === 'in_review');

    const canSellerDeliver = isSeller && s === (OrderStatus.ACCEPTED || OrderStatus.CHANGES_REQUESTED) && !hasOpenDispute;
    const canBuyerReceive = isBuyer && s === OrderStatus.DELIVERED && !hasOpenDispute;
    const canDispute = (isBuyer || isSeller) && [OrderStatus.ACCEPTED, OrderStatus.DELIVERED, OrderStatus.CHANGES_REQUESTED].includes(s) && !hasOpenDispute;

    const isCompleted = s === OrderStatus.COMPLETED;
    const isChangesRequested = s === OrderStatus.CHANGES_REQUESTED;
    const loadingAction = actionLoading[row.id]; // "deliver" | "receive" | "dispute" | "cancel" | null
    const isBusy = !!loadingAction;

    const options = [
      {
        icon: <MessageCircle className="h-4 w-4" />,
        label: 'Chat',
        href: isBuyer
          ? `/chat?userId=${row?._raw?.sellerId}`
          : `/chat?userId=${row?._raw?.buyerId}`,
        disabled: isBusy,
      },
      {
        icon: <FileText className="h-4 w-4" />,
        label: "Review Submission",
        onClick: () => handleOpenModal(row, "submission"),
        disabled: isBusy,
        hide: !isCompleted,
      },
      {
        icon: <MessageSquare className="h-4 w-4" />,
        label: "View Change Request",
        onClick: () => handleOpenModal(row, "changes-requested"),
        disabled: isBusy,
        hide: !isChangesRequested,
      },
      {
        icon: <Package className="h-4 w-4" />,
        label: loadingAction === 'deliver' ? 'Delivering…' : 'Deliver',
        // onClick: () => deliverOrder(row),
        onClick: () => handleOpenModal(row, "deliver"),
        disabled: isBusy || loadingAction === 'deliver',
        hide: !canSellerDeliver,
      },
      {
        icon: <CheckCircle className="h-4 w-4" />,
        label: loadingAction === 'receive' ? 'Submitting…' : 'Receive',
        // onClick: () => completeOrder(row),
        onClick: () => handleOpenModal(row, 'receive'),
        disabled: isBusy || loadingAction === 'receive',
        hide: !canBuyerReceive,
      },
      {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: loadingAction === 'dispute' ? 'Opening…' : 'Open Dispute',
        onClick: () => handleOpenModal(row, 'dispute'),
        disabled: isBusy || loadingAction === 'dispute',
        hide: !canDispute,
        danger: true,
      },
      {
        icon: <FileWarning className="h-4 w-4" />,
        label: 'View Dispute',
        href: `/my-disputes?dispute=${row?._raw?.disputeId}`,
        hide: !hasOpenDispute,
      },
      {
        icon: <CreditCard className="h-4 w-4" />,
        label: 'Pay',
        href: `/payment?orderId=${row.id}`,
        disabled: isBusy,
        hide: !(isBuyer && s === OrderStatus.PENDING),
      },
      {
        icon: <XCircle className="h-4 w-4" />,
        label: loadingAction === 'cancel' ? 'Cancelling…' : 'Cancel Order',
        onClick: () => handleCancel(row),
        disabled: isBusy || loadingAction === 'cancel',
        hide: !(isBuyer && [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(s)),
        danger: true,
      },
    ];

    return <ActionsMenu options={options} align="right" />;
  }

  return (
    <div className='container'>
      <div className='mt-8 mb-4 flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-3xl font-bold text-center mb-4 '>Manage Orders</h1>
        <InputSearch iconLeft={'/icons/search.svg'} placeholder='Search by order number or status' onSearch={onSearch} />
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
      <ReviewSubmissionModel open={openModal === 'receive' || openModal === 'submission'} readOnly={openModal === 'submission'} onClose={handleCloseModal} selectedRow={selectedRow} patchOrderRow={patchOrderRow} setRowLoading={setRowLoading} />
      <ChangeRequestReviewModel open={openModal === 'changes-requested'} onClose={handleCloseModal} selectedRow={selectedRow} />
    </div>
  );
}
