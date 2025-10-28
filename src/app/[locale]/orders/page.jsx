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
import api, { baseImg } from '@/lib/axios';
import { MessageCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/context/AuthContext';

// Animation
export const tabAnimation = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28, mass: 0.6 } },
  exit: { opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
};

// Status constants
const OrderStatus = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' }, // Pending + Accepted
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' }, // <—

  { label: 'Canceled', value: 'canceled' },
];

const TAB_STATUS_FILTER = {
  all: 'ALL',
  active: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
  'missing-details': [OrderStatus.MISSING_DETAILS],
  delivered: [OrderStatus.DELIVERED],
  completed: [OrderStatus.COMPLETED],
  disputed: [OrderStatus.DISPUTED], // <—

  canceled: [OrderStatus.CANCELLED],
};

const fmtMoney = v => {
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? String(v ?? '') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '');

function UserMini({ user }) {
  const letter = (user?.username?.[0] || '?').toUpperCase();
  const img = user?.profileImage || user?.avatarUrl;

  return (
    <div className='flex items-center gap-2 min-w-[220px]'>
      <div className='h-9 w-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold'>
        {img ? (
          // استخدم next/image لو حابب
          <img src={img} alt={user?.username || 'user'} className='h-full w-full object-cover' />
        ) : (
          letter
        )}
      </div>
      <div className='leading-tight'>
        <h1 className='font-medium text-sm truncate max-w-[160px]'>{user?.username || '—'}</h1>
        <p className='text-xs text-gray-500 truncate max-w-[160px]'>{user?.email || ''}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState({});

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
      { key: 'service', label: 'Service', className: '' },

      { key: 'seller', label: 'Owner' },
      { key: 'buyer', label: 'Client' },

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
        ],
      },
    ],
    [],
  );

  // Build query for a BIG page (client-side pagination in <Table />)
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (search?.trim()) {
      params.set('search', search.trim());
    } else {
      if (activeTab === 'missing-details') params.set('search', OrderStatus.MISSING_DETAILS);
      else if (activeTab === 'delivered') params.set('search', OrderStatus.DELIVERED);
      else if (activeTab === 'completed') params.set('search', OrderStatus.COMPLETED);
      else if (activeTab === 'canceled') params.set('search', OrderStatus.CANCELLED);
      // 'all' and 'active' -> broad fetch
    }

    params.set('page', '1');
    params.set('limit', '10');
    return params.toString();
  }, [activeTab, search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = buildQuery();
      const { data } = await api.get(`/orders?${qs}`);
      console.log(data);
      const list = data?.records;

      // Client filter for "Active"
      let filtered = list;
      if (activeTab === 'active') {
        filtered = list.filter(o => [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(o?.status));
      } else if (!search.trim() && activeTab !== 'all' && Array.isArray(TAB_STATUS_FILTER[activeTab])) {
        const expected = TAB_STATUS_FILTER[activeTab];
        filtered = list.filter(o => expected.includes(o?.status));
      }

      const rows = filtered.map(o => {
        return {
          _raw: o,
          id: o?.id,
          gig: o?.service?.gallery?.[0]?.url,
          service: `${o?.title?.length > 20 ? o?.title?.slice(0, 20) + '...' : o?.title}`,
          seller: o?.seller ? <UserMini user={o.seller} /> : '—',
          buyer: o?.buyer ? <UserMini user={o.buyer} /> : '—',
          orderDate: fmtDate(o?.created_at),
          total: fmtMoney(o?.totalAmount),
          status: o?.status || '',
        };
      });

      setOrders(rows);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, activeTab, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onSearch = val => {
    setSearch(val || '');
  };
  const onChangeTab = val => {
    setActiveTab(val);
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

  // Dispute modal state
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeRow, setDisputeRow] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  function openDisputeModal(row) {
    setDisputeRow(row);
    setDisputeReason('');
    setDisputeError('');
    setDisputeOpen(true);
  }
  function closeDisputeModal() {
    if (disputeSubmitting) return;
    setDisputeOpen(false);
    setDisputeRow(null);
    setDisputeReason('');
    setDisputeError('');
  }

  async function disputeOrder() {
    if (!disputeRow) return;
    const reason = (disputeReason || '').trim();
    if (!reason || reason.length < 8) {
      setDisputeError('Please describe the issue (at least 8 characters).');
      return;
    }

    setRowLoading(disputeRow.id, 'dispute');
    setDisputeSubmitting(true);
    try {
      const res = await api.post(`/disputes`, { orderId: disputeRow.id, reason });
      if (res && res.status >= 200 && res.status < 300) {
        patchOrderRow(disputeRow.id, r => ({
          ...r,
          status: OrderStatus.DISPUTED, // <—
          _raw: { ...r._raw, status: OrderStatus.DISPUTED, hasOpenDispute: true, disputeStatus: 'open' },
        }));
        closeDisputeModal();
      }
    } catch (e) {
      setDisputeError(e?.response?.data?.message || 'Failed to open dispute');
    } finally {
      setDisputeSubmitting(false);
      setRowLoading(disputeRow?.id || '', null);
    }
  }

  async function deliverOrder(row) {
    setRowLoading(row.id, 'deliver');
    try {
      const res = await api.post(`/orders/${row.id}/deliver`);
      if (res && res.status >= 200 && res.status < 300) {
        patchOrderRow(row.id, r => ({
          ...r,
          status: OrderStatus.DELIVERED,
          _raw: { ...r._raw, status: OrderStatus.DELIVERED, deliveredAt: new Date().toISOString() },
        }));
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to deliver order';
      alert(msg);
    } finally {
      setRowLoading(row.id, null);
    }
  }

  function renderActions(row) {
    const s = row.status;

    const isSeller = row?._raw?.service?.sellerId === user?.id;
    const isBuyer = row?._raw?.buyerId === user?.id;

    const hasOpenDispute = !!(row?._raw?.hasOpenDispute || row?._raw?.disputeStatus === 'open' || row?._raw?.disputeStatus === 'in_review');

    const canSellerDeliver = isSeller && s === OrderStatus.ACCEPTED && !hasOpenDispute;
    const canBuyerReceive = isBuyer && s === OrderStatus.DELIVERED && !hasOpenDispute;
    const canDispute = (isBuyer || isSeller) && [OrderStatus.ACCEPTED, OrderStatus.DELIVERED].includes(s) && !hasOpenDispute;

    const loadingAction = actionLoading[row.id]; // "deliver" | "receive" | "dispute" | "cancel" | null
    const isBusy = !!loadingAction;

    return (
      <div className='flex gap-2 w-fit'>
        <Button href={isBuyer ? `/chat?userId=${row?._raw?.sellerId}` : `/chat?userId=${row?._raw?.buyerId}`} icon={<MessageCircle size={18} />} className='!w-fit h-[35px]' disabled={isBusy} />

        {canSellerDeliver && <Button color='outline' name={loadingAction === 'deliver' ? 'Delivering…' : 'Deliver'} className='!w-fit !h-[35px]' onClick={() => deliverOrder(row)} disabled={loadingAction === 'deliver' || isBusy} loading={loadingAction === 'deliver'} />}

        {canBuyerReceive && <Button color='green' name={loadingAction === 'receive' ? 'Submitting…' : 'Received'} className='!w-fit !h-[35px]' onClick={() => completeOrder(row)} disabled={loadingAction === 'receive' || isBusy} loading={loadingAction === 'receive'} />}

        {canDispute && (
          <Button
            color='red'
            name={loadingAction === 'dispute' ? 'Opening…' : 'Dispute'}
            className='!w-fit !h-[35px]'
            onClick={() => openDisputeModal(row)} // <- open modal instead of prompt
            disabled={loadingAction === 'dispute' || isBusy}
            loading={loadingAction === 'dispute'}
          />
        )}
        {hasOpenDispute && <Button color='outline' name='In Dispute' className='!w-fit !h-[35px] pointer-events-none opacity-60' disabled />}
      </div>
    );
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

          <Table loading={loading} data={orders} columns={columns} actions={renderActions} />
        </motion.div>
      </AnimatePresence>

      {disputeOpen && (
        <Modal title='Open a Dispute' onClose={closeDisputeModal}>
          <div className='space-y-4'>
            <div className='rounded-md bg-gray-50 p-3 text-sm text-gray-700'>
              Order: <span className='font-medium'>{disputeRow?._raw?.title || disputeRow?._raw?.service?.title || disputeRow?.id}</span>
            </div>

            <label className='block'>
              <span className='text-sm font-medium text-gray-700'>Describe the issue</span>
              <textarea
                className='mt-1 w-full resize-y rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black/10'
                rows={5}
                value={disputeReason}
                onChange={e => {
                  setDisputeReason(e.target.value);
                  if (disputeError) setDisputeError('');
                }}
                placeholder="Explain what went wrong, what's missing, and what outcome you want…"
                maxLength={2000}
              />
              <div className='mt-1 text-xs text-gray-500'>{disputeReason.length}/2000</div>
            </label>

            {disputeError ? <div className='rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{disputeError}</div> : null}

            <div className='flex items-center justify-end gap-2'>
              <button onClick={closeDisputeModal} className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50' disabled={disputeSubmitting}>
                Cancel
              </button>
              <button onClick={disputeOrder} className={`rounded-lg px-4 py-2 text-white ${disputeSubmitting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`} disabled={disputeSubmitting}>
                {disputeSubmitting ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
