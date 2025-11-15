'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Eye, Edit, RefreshCw, Clock, CheckCircle, XCircle, Truck, Package } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { MetricBadge, Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Img from '@/components/atoms/Img';
import UserMini from '@/components/dashboard/UserMini';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { isErrorAbort } from '@/utils/helper';

const OrderStatus = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  MISSING_DETAILS: 'Missing Details',
  DISPUTED: 'Disputed',
}


export default function AdminOrdersDashboard() {
  const [activeTab, setActiveTab] = useState('all');



  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  function resetPage() {
    setFilters(p => ({ ...p, page: 1 }))
  }
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce({ value: searchQuery, onDebounce: () => resetPage() });

  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('view');
  const [current, setCurrent] = useState(null);

  const tabs = [
    { value: 'all', label: 'All Orders' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];
  const controllerRef = useRef();
  const fetchOrders = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      setLoading(true);
      setApiError(null);

      // Build query
      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: activeTab === 'all' ? '' : activeTab,
        search: debouncedSearch?.trim()
      };

      const res = await api.get('/orders/admin', { params: q, signal: controller.signal });

      const data = res.data || {};
      setRows(Array.isArray(data.records) ? data.records : []);
      setTotalCount(Number(data.total_records || 0));
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error('Error fetching orders:', e);
        setApiError(e?.response?.data?.message || 'Failed to fetch orders.');
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = tab => {
    const v = typeof tab === 'string' ? tab : tab?.value;
    setActiveTab(v);
    resetPage()
  };

  const applySortPreset = opt => {
    const id = opt?.id ?? opt?.target?.value ?? opt;
    if (id === 'newest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'oldest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'ASC', page: 1 })) }
    else if (id === 'price_high') { setSort(id); setFilters(p => ({ ...p, sortBy: 'totalAmount', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'price_low') { setSort(id); setFilters(p => ({ ...p, sortBy: 'totalAmount', sortOrder: 'ASC', page: 1 })) }
    else return;
  };

  const openView = async order => {
    try {
      // setApiError(null);
      // const res = await api.get(`/orders/${id}`);
      setMode('view');
      setCurrent(order);
      setModalOpen(true);
    } catch (e) {
      setApiError(e?.response?.data?.message || 'Failed to load order.');
    }
  };
  const updateOrderStatus = async (id, status) => {
    const toastId = toast.loading(`Updating order status to ${status}...`);

    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order status updated to ${status}`, {
        id: toastId,
      });
      await fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error updating order status.', {
        id: toastId,
      });
      console.error('Error updating order status:', e);
    }
  };


  // Columns
  const columns = [
    { key: 'title', label: 'Order Title' },
    {
      key: 'status',
      label: 'Status',
      render: v => {
        const statusColors = {
          'Pending': 'warning',
          'Accepted': 'info',
          'Delivered': 'success',
          'Completed': 'success',
          'Cancelled': 'danger'
        };
        const statusIcons = {
          'Pending': <Clock size={14} className="mr-1" />,
          'Accepted': <RefreshCw size={14} className="mr-1" />,
          'Delivered': <Truck size={14} className="mr-1" />,
          'Completed': <CheckCircle size={14} className="mr-1" />,
          'Cancelled': <XCircle size={14} className="mr-1" />
        };
        return (
          <MetricBadge tone={statusColors[v.status] || 'neutral'}>
            {statusIcons[v.status]} {v.status}
          </MetricBadge>
        );
      },
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: v => `$${v.totalAmount}`
    },
    {
      key: 'buyer',
      label: 'Buyer',
      render: v => v.buyer?.username || 'N/A'
    },
    {
      key: 'seller',
      label: 'Seller',
      render: v => v.seller?.username || 'N/A'
    },
    {
      key: 'packageType',
      label: 'Package',
      render: v => <MetricBadge tone="neutral">{v.packageType}</MetricBadge>
    },
    { key: 'orderDate', label: 'Order Date', type: 'date' },
  ];

  const Actions = ({ row }) => {
    const currentStatus = row.status;

    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    };

    const statusLabels = {
      [OrderStatus.PENDING]: 'Set Pending',
      [OrderStatus.ACCEPTED]: 'Accept',
      [OrderStatus.DELIVERED]: 'Mark Delivered',
      [OrderStatus.COMPLETED]: 'Complete',
      [OrderStatus.CANCELLED]: 'Cancel',
      [OrderStatus.DISPUTED]: 'Disputed',
    };

    const allowed = validTransitions[currentStatus] || [];

    const options = [
      {
        id: currentStatus,
        name: `${statusLabels[currentStatus]}`,
        disabled: true,
      },
      ...allowed.map(id => ({
        id,
        name: statusLabels[id],
      })),
    ];

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openView(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          title="View"
        >
          <Eye size={16} />
        </button>

        <Select
          value={currentStatus}
          onChange={opt => {
            if (opt.id === currentStatus) return;
            updateOrderStatus(row.id, opt.id)
          }}
          options={options}
          className="!w-40 !text-xs"
          variant="minimal"
        />
      </div>
    );
  };


  return (
    <DashboardLayout className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <div className='p-6'>
        <GlassCard gradient='from-green-400 via-emerald-400 to-teal-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className='flex flex-wrap items-center gap-3'>
              <Input iconLeft={<Search size={16} />} className='!w-fit' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search orders…' />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
                placeholder='Order by'
                value={sort}
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'price_high', name: 'Price: High to Low' },
                  { id: 'price_low', name: 'Price: Low to High' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table
            data={rows}
            columns={columns}
            Actions={Actions}
            loading={loading}
            rowsPerPage={filters.limit}
            page={filters.page}
            totalCount={totalCount}
            onPageChange={p => setFilters(prev => ({ ...prev, page: p }))}
          />
        </div>

        <Modal open={modalOpen} title='Order Details' onClose={() => setModalOpen(false)} size='lg' hideFooter>
          <OrderView value={current} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function OrderView({ value, onClose }) {
  if (!value) return null;


  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Order Title</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.title}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Status</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <MetricBadge tone={
              value.status === 'Completed' ? 'success' :
                value.status === 'Cancelled' ? 'danger' :
                  value.status === 'Pending' ? 'warning' : 'info'
            }>
              {value.status}
            </MetricBadge>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Buyer</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <UserMini user={value.buyer} href={`profile/${value.buyer.id}`} />
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Seller</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <UserMini user={value.seller} href={`profile/${value.seller.id}`} />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Total Amount</label>
          <div className='p-2 bg-slate-50 rounded-md font-semibold'>${typeof value.totalAmount == "string" ? value?.totalAmount : value.totalAmount}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Package Type</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.packageType}</div>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Order Date</label>
        <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.orderDate).toLocaleDateString()}</div>
      </div>

      {value.deliveredAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Delivered At</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.deliveredAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.completedAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Completed At</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.completedAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.cancelledAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Cancelled At</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.cancelledAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.invoices && value.invoices.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Invoice</label>
          <div className='p-3 bg-slate-50 rounded-md'>
            <div className='font-semibold'>Invoice #{value.invoices[0].invoiceNumber}</div>
            <div>Status: {value.invoices[0].paymentStatus}</div>
            <div>Total: ${value.invoices[0].totalAmount}</div>
          </div>
        </div>
      )}

      <div className='flex justify-end'>
        <Button color='white' name='Close' onClick={onClose} className='!w-fit'>Close</Button>
      </div>
    </div>
  );
}