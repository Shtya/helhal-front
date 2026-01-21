"use client"
import { useState, useEffect, useRef, useMemo } from 'react';
import DataTable from '@/components/dashboard/ui/DataTable';
import { getInvoices } from '@/utils/api';
import { isErrorAbort } from '@/utils/helper';
import OrderDetailsModal from '@/components/pages/my-orders/OrderDetailsModal';
import TruncatedText from '@/components/dashboard/TruncatedText';
import { useTranslations } from 'next-intl';
import Currency from '@/components/common/Currency';
import Tabs from '@/components/common/Tabs';
import { motion } from 'framer-motion';


const getInvoiceTabs = (t) => [
  { value: 'all', label: t('tabs.all') },
  { value: 'paid', label: t('tabs.paid') },
  { value: 'pending', label: t('tabs.pending') },
  { value: 'failed', label: t('tabs.failed') },
];

export default function InvoicesManagement() {
  const t = useTranslations('Dashboard.invoices');

  const invoiceTabs = getInvoiceTabs(t);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState({ status: 'all', page: 1, limit: 10 });
  const statusFilter = filters.status;
  const [total, setTotal] = useState(0);

  function onSearch(val) {
    setDebouncedSearch(val)
    setFilters(p => ({ ...p, page: 1 }))
  }

  function onTabChange(tab) {

    const v = typeof tab === 'string' ? tab : tab?.value;
    setFilters(p => ({ ...p, page: 1, status: v }))
  }

  function onLimitChange(val) {
    setFilters(p => ({ ...p, page: 1, limit: val }))
  }

  function onPageChange(val) {
    setFilters(p => ({ ...p, page: val }))
  }
  const controllerRef = useRef();
  useEffect(() => {
    const fetchInvoices = async () => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {

        setLoading(true);
        const q = {
          page: filters.page,
          limit: filters.limit,
          status: filters.status === 'all' ? '' : filters.status,
          search: debouncedSearch
        }
        // This would be implemented in api.js
        const data = await getInvoices(q, { signal: controller.signal });

        setInvoices(data?.records || []);
        setTotal(data?.total_records ?? 0);

      } catch (error) {
        if (!isErrorAbort(error)) {
          console.error('Error fetching invoices:', error);
        }
      } finally {
        if (controllerRef.current === controller)
          setLoading(false);
      }
    };

    fetchInvoices();
  }, [filters.status, filters.page, filters.limit, debouncedSearch]);


  const columns = useMemo(() => [
    { key: 'invoiceNumber', title: t('columns.invoiceNumber') },
    {
      key: 'order',
      title: t('columns.order'),
      render: (value) => <TruncatedText text={value?.title} />
    },
    {
      key: 'buyer',
      title: t('columns.buyer'),
      render: (value) => value.username
    },
    {
      key: 'subtotal',
      title: t('columns.subtotal'),
      render: v => <div className='flex gap-1 '>
        <Currency size={14} />
        {v}
      </div>,
    },
    {
      key: 'totalAmount',
      title: t('columns.totalAmount'),
      render: (value) => `$${value}`
    },
    {
      key: 'sellerServiceFee',
      title: t('columns.serviceFee'),
      render: (value) => `${value}%`
    },
    {
      key: 'platformPercent',
      title: t('columns.platformPercent'),

      render: v => <div className='flex gap-1 '>
        <Currency size={14} />
        {v}
      </div>,
    },
    {
      key: 'paymentStatus',
      title: t('columns.paymentStatus'),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value === 'paid' ? 'bg-main-100 text-main-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'issuedAt',
      title: t('columns.issuedDate'),
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'paymentMethod',
      title: t('columns.paymentMethod'),
      render: (value) => value || t('columns.na')
    },
  ], [t]);


  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const openView = async invoice => {
    setCurrent(invoice?.order);
    setModalOpen(true);

  };


  return (
    <div>
      <GlassCard className='mb-6'>
        <Tabs tabs={invoiceTabs} activeTab={statusFilter} setActiveTab={onTabChange} />
      </GlassCard>


      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        page={filters.page}
        limit={filters.limit}
        search={debouncedSearch}
        totalCount={total}
        onView={openView}
        onLimitChange={onLimitChange}
        onPageChange={onPageChange}
        onSearch={onSearch}
      />

      <OrderDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orderId={current?.id}
      />
    </div>
  );
}


function GlassCard({ children, className = '', gradient = 'from-sky-400 via-indigo-400 to-violet-500' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={` border border-slate-200 relative rounded-2xl bg-white/90 ring-1 ring-slate-200 p-5 sm:p-6 ${className}`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl [mask:linear-gradient(white,transparent)]`} style={{ border: '2px solid transparent' }} />
      <div className={`absolute -inset-px rounded-2xl ${gradient}`} />
      <div className='relative'>{children}</div>
    </motion.div>
  );
}