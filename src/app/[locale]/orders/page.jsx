'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InputSearch from '@/components/atoms/InputSearch';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Button from '@/components/atoms/Button';
import api, { baseImg } from '@/lib/axios';
import { MessageCircle } from 'lucide-react';
import { getUserInfo } from '@/hooks/useUser';

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
  MISSING_DETAILS: 'Missing Details',
};

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' }, // Pending + Accepted
  { label: 'Missing Details', value: 'missing-details' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Canceled', value: 'canceled' },
];

const TAB_STATUS_FILTER = {
  all: 'ALL',
  active: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
  'missing-details': [OrderStatus.MISSING_DETAILS],
  delivered: [OrderStatus.DELIVERED],
  completed: [OrderStatus.COMPLETED],
  canceled: [OrderStatus.CANCELLED],
};

const fmtMoney = v => {
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? String(v ?? '') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '');

export default function Page() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const user = getUserInfo();

  const columns = useMemo(
    () => [
      { key: 'gig', label: 'Service img', type: 'img' },
      { key: 'service', label: 'Service' },
      { key: 'orderNumber', label: 'Order number' },
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
      const list = data?.records ?? data?.data ?? data?.orders ?? data ?? [];

      // Client filter for "Active"
      let filtered = list;
      if (activeTab === 'active') {
        filtered = list.filter(o => [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(o?.status));
      } else if (!search.trim() && activeTab !== 'all' && Array.isArray(TAB_STATUS_FILTER[activeTab])) {
        const expected = TAB_STATUS_FILTER[activeTab];
        filtered = list.filter(o => expected.includes(o?.status));
      }

      const rows = filtered.map(o => {
        const code = o?.orderNumber || o?.code || o?.id;
        return {
          _raw: o,
          id: o?.id,
          gig: o?.service?.gallery?.[0]?.url,
          service: o?.title,
          orderNumber: code?.slice(0, 8) + '...',
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

  // Actions
  const refresh = async () => {
    await fetchOrders();
  };
  const cancelOrder = async row => {
    const reason = typeof window !== 'undefined' ? window.prompt('Reason (optional):', 'Change of plans') : 'Change of plans';
    try {
      await api.post(`/orders/${row.id}/cancel`, { reason: reason || 'Change of plans' });
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };
  const deliverOrder = async row => {
    try {
      await api.post(`/orders/${row.id}/deliver`);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };
  const completeOrder = async row => {
    try {
      await api.post(`/orders/${row.id}/complete`);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const renderActions = row => {
    const s = row.status;
    const canBuyerCancel = [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(s);
    const canBuyerComplete = s === OrderStatus.DELIVERED;
    const canSellerDeliver = s === OrderStatus.ACCEPTED;

    return (
      <div className='flex  gap-2  w-fit'>
        {<Button href={user?.role == 'buyer' ? `/chat?userId=${row?._raw?.sellerId}` : `/chat?userId=${row?._raw?.buyerId}`}  icon={<MessageCircle size={18} />} className='!w-fit h-[35px] ' />}
        {canBuyerCancel && <Button color='red' name='Cancel' className='!w-fit' onClick={() => cancelOrder(row)} />}
        {canBuyerComplete && <Button color='green' name='Complete' className='!w-fit' onClick={() => completeOrder(row)} />}
        {canSellerDeliver && <Button color='blue' name='Deliver' className='!w-fit' onClick={() => deliverOrder(row)} />}
      </div>
    );
  };

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
    </div>
  );
}
