'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl'; // Add this
import { Eye, Edit, RefreshCw, Clock, CheckCircle, XCircle, Truck, Package } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import { MetricBadge, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import UserMini from '@/components/dashboard/UserMini';
import toast from 'react-hot-toast';
import { isErrorAbort } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';
import OrderDetailsModal from '@/components/pages/my-orders/OrderDetailsModal';
import TruncatedText from '@/components/dashboard/TruncatedText';
import Currency from '@/components/common/Currency';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/constants/permissions';
import { has } from '@/utils/permissions';
import { OrderStatus } from '@/constants/order';


export default function AdminOrdersDashboard() {
  const t = useTranslations('Dashboard.orders'); // Add this
  const [activeTab, setActiveTab] = useState('all');
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  function resetPage() {
    setFilters(p => ({ ...p, page: 1 }))
  }
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = value => {
    setDebouncedSearch(value);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [mode, setMode] = useState('view');

  const tabs = [
    { value: 'all', label: t('tabs.all') },
    { value: 'Pending', label: t('tabs.pending') },
    { value: 'Accepted', label: t('tabs.accepted') },
    { value: 'Delivered', label: t('tabs.delivered') },
    { value: 'Completed', label: t('tabs.completed') },
    { value: 'Cancelled', label: t('tabs.cancelled') },
    { value: 'Rejected', label: t('tabs.rejected') },
    { value: 'Waiting', label: t('tabs.waited') },
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
        setApiError(e?.response?.data?.message || t('errors.fetchFailed'));
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder, t]);

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
      setMode('view');
      setCurrent(order);
      setModalOpen(true);
    } catch (e) {
      setApiError(e?.response?.data?.message || t('errors.loadFailed'));
    }
  };

  const updateOrderStatus = async (id, status) => {
    const toastId = toast.loading(t('messages.updatingStatus', { status }));

    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(t('messages.statusUpdated', { status }), {
        id: toastId,
      });
      await fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || t('errors.statusUpdateFailed'), {
        id: toastId,
      });
      console.error('Error updating order status:', e);
    }
  };

  // Columns
  const columns = [
    { key: 'title', label: t('columns.title'), render: (value) => <TruncatedText text={value?.title} maxLength={300} /> },
    {
      key: 'status',
      label: t('columns.status'),
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
      label: t('columns.amount'),
      render: v => <div className='flex gap-1 text-gray-500'>
        <Currency style={{ fill: "#6a7282" }} size={14} />
        {v.totalAmount}
      </div>,
    },
    {
      key: 'buyer',
      label: t('columns.buyer'),
      render: v => v.buyer?.username || 'N/A'
    },
    {
      key: 'seller',
      label: t('columns.seller'),
      render: v => v.seller?.username || 'N/A'
    },
    {
      key: 'packageType',
      label: t('columns.package'),
      render: v => <MetricBadge tone="neutral">{v.packageType}</MetricBadge>
    },
    { key: 'orderDate', label: t('columns.orderDate'), type: 'date' },
  ];

  const Actions = ({ row }) => {
    const currentStatus = row.status;

    const isAdmin = currentUser?.role === 'admin';
    const currentPermissions = currentUser?.permissions;
    const canChangeStatus = isAdmin || has(currentPermissions?.['orders'], Permissions.Orders.ChangeStatus)

    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
      [OrderStatus.ACCEPTED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.WAITING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],

    };

    const statusLabels = {
      [OrderStatus.PENDING]: t('statusLabels.pending'),
      [OrderStatus.ACCEPTED]: t('statusLabels.accept'),
      [OrderStatus.DELIVERED]: t('statusLabels.delivered'),
      [OrderStatus.COMPLETED]: t('statusLabels.complete'),
      [OrderStatus.CANCELLED]: t('statusLabels.cancel'),
      [OrderStatus.DISPUTED]: t('statusLabels.disputed'),
      [OrderStatus.REJECTED]: t('statusLabels.rejected'),
      [OrderStatus.WAITING]: t('statusLabels.waited'),

    };

    const allowed = validTransitions[currentStatus] || [];

    const options = [
      {
        id: currentStatus,
        name: statusLabels[currentStatus],
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
          title={t('actions.view')}
        >
          <Eye size={16} />
        </button>

        {/* {canChangeStatus && <Select
          value={currentStatus}
          onChange={opt => {
            if (opt.id === currentStatus) return;
            updateOrderStatus(row.id, opt.id)
          }}
          options={options}
          className="!w-40 !text-xs"
          variant="minimal"
        />} */}
      </div>
    );
  };

  return (
    <div>
      <div className='p-6'>
        <GlassCard gradient='from-green-400 via-emerald-400 to-teal-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className='flex flex-wrap items-center gap-3'>
              <SearchBox placeholder={t('searchPlaceholder')} onSearch={handleSearch} />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
                placeholder={t('sortPlaceholder')}
                value={sort}
                options={[
                  { id: 'newest', name: t('sortOptions.newest') },
                  { id: 'oldest', name: t('sortOptions.oldest') },
                  { id: 'price_high', name: t('sortOptions.priceHigh') },
                  { id: 'price_low', name: t('sortOptions.priceLow') },
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

        <OrderDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          orderId={current?.id}
        />
      </div>
    </div>
  );
}

function OrderView({ value, onClose, t }) {
  if (!value) return null;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.orderTitle')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.title}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.status')}</label>
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
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.buyer')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <UserMini user={value.buyer} href={`profile/${value.buyer.id}`} />
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.seller')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <UserMini user={value.seller} href={`profile/${value.seller.id}`} />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.totalAmount')}</label>
          <div className='p-2 bg-slate-50 rounded-md font-semibold'>${typeof value.totalAmount == "string" ? value?.totalAmount : value.totalAmount}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.packageType')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.packageType}</div>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.orderDate')}</label>
        <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.orderDate).toLocaleDateString()}</div>
      </div>

      {value.deliveredAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.deliveredAt')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.deliveredAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.completedAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.completedAt')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.completedAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.cancelledAt && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.cancelledAt')}</label>
          <div className='p-2 bg-slate-50 rounded-md'>{new Date(value.cancelledAt).toLocaleDateString()}</div>
        </div>
      )}

      {value.invoices && value.invoices.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>{t('view.invoice')}</label>
          <div className='p-3 bg-slate-50 rounded-md'>
            <div className='font-semibold'>{t('view.invoiceNumber')} #{value.invoices[0].invoiceNumber}</div>
            <div>{t('view.invoiceStatus')}: {value.invoices[0].paymentStatus}</div>
            <div>{t('view.invoiceTotal')}: ${value.invoices[0].totalAmount}</div>
          </div>
        </div>
      )}

      <div className='flex justify-end'>
        <Button color='white' name={t('view.close')} onClick={onClose} className='!w-fit' />
      </div>
    </div>
  );
}